<?php
declare(strict_types=1);

/**
 * Data import/export and user analytics routes.
 *
 * @var \Aztech\Router $router
 * @var \Aztech\Db $db
 */

$exportableTables = [
    'users', 'branches', 'plans', 'leads', 'memberships', 'bookings',
    'invoices', 'visitors', 'coupons', 'coupon_usages', 'user_deals',
    'payments', 'testimonials', 'blog', 'audit_logs',
];

// ─── GET /api/dashboard/export/{table}.csv ──────
// Export a single table as CSV.

$router->get('/api/dashboard/export/{table}', function (array $params) use ($db, $router, $exportableTables) {
    $user = requireAuth($db, $router);
    if (!$user) return null;
    if (!requireRole($router, $user, ['super_admin'])) return null;

    $table = $params['table'];

    // Strip .csv suffix if present
    $table = preg_replace('/\.csv$/', '', $table);

    if (!in_array($table, $exportableTables, true)) {
        return $router->json(['error' => "Table '{$table}' is not exportable"], 400);
    }

    $rows = $db->all($table);

    // For audit_logs, use raw query since it lacks standard decoding
    if ($table === 'audit_logs') {
        $rows = $db->pdo()->query("SELECT * FROM audit_logs ORDER BY id DESC")->fetchAll();
    }

    if (empty($rows)) {
        header('Content-Type: text/csv; charset=utf-8');
        header("Content-Disposition: attachment; filename=\"{$table}.csv\"");
        echo "No data\n";
        return null;
    }

    // Strip passwordHash from users export
    if ($table === 'users') {
        $rows = array_map(function ($r) {
            unset($r['passwordHash']);
            return $r;
        }, $rows);
    }

    header('Content-Type: text/csv; charset=utf-8');
    header("Content-Disposition: attachment; filename=\"{$table}.csv\"");

    $out = fopen('php://output', 'w');
    // Header row
    fputcsv($out, array_keys($rows[0]));
    foreach ($rows as $row) {
        // Flatten arrays/objects to JSON strings for CSV
        $flat = array_map(function ($v) {
            return is_array($v) ? json_encode($v) : $v;
        }, $row);
        fputcsv($out, $flat);
    }
    fclose($out);
    return null;
});

// ─── GET /api/dashboard/export-all ──────────────
// Export entire database as JSON backup.

$router->get('/api/dashboard/export-all', function () use ($db, $router, $exportableTables) {
    $user = requireAuth($db, $router);
    if (!$user) return null;
    if (!requireRole($router, $user, ['super_admin'])) return null;

    $backup = [
        'exportedAt' => gmdate('c'),
        'exportedBy' => $user['name'],
        'tables' => [],
    ];

    foreach ($exportableTables as $table) {
        if ($table === 'audit_logs') {
            $backup['tables'][$table] = $db->pdo()->query("SELECT * FROM audit_logs ORDER BY id DESC LIMIT 5000")->fetchAll();
        } else {
            $rows = $db->all($table);
            // Strip passwordHash from users
            if ($table === 'users') {
                $rows = array_map(function ($r) {
                    unset($r['passwordHash']);
                    return $r;
                }, $rows);
            }
            $backup['tables'][$table] = $rows;
        }
    }

    // Also include site_settings
    $settings = $db->pdo()->query("SELECT * FROM site_settings")->fetchAll();
    $backup['tables']['site_settings'] = $settings;

    header('Content-Type: application/json; charset=utf-8');
    header('Content-Disposition: attachment; filename="aztech-backup-' . date('Y-m-d') . '.json"');
    echo json_encode($backup, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
    return null;
});

// ─── POST /api/dashboard/import ─────────────────
// Import data from JSON backup. Merges (upserts) into existing data.

$router->post('/api/dashboard/import', function () use ($db, $router, $exportableTables) {
    $user = requireAuth($db, $router);
    if (!$user) return null;
    if (!requireRole($router, $user, ['super_admin'])) return null;

    $raw = file_get_contents('php://input');
    $data = json_decode($raw, true);
    if (!$data || empty($data['tables'])) {
        return $router->json(['error' => 'Invalid backup format. Expected JSON with "tables" key.'], 400);
    }

    $imported = [];
    $db->pdo()->beginTransaction();

    try {
        foreach ($data['tables'] as $table => $rows) {
            if (!in_array($table, [...$exportableTables, 'site_settings'], true)) {
                continue;
            }
            if (!is_array($rows) || empty($rows)) continue;

            // Skip audit_logs and password_reset_tokens on import
            if (in_array($table, ['audit_logs', 'password_reset_tokens'], true)) {
                continue;
            }

            $count = 0;
            foreach ($rows as $row) {
                if (!is_array($row)) continue;

                if ($table === 'site_settings') {
                    // Upsert site settings
                    if (isset($row['key'], $row['value'])) {
                        $val = is_string($row['value']) ? $row['value'] : json_encode($row['value']);
                        $db->pdo()->prepare("INSERT INTO site_settings (key,value,updatedAt) VALUES (?,?,?) ON CONFLICT(key) DO UPDATE SET value=excluded.value, updatedAt=excluded.updatedAt")
                            ->execute([$row['key'], $val, gmdate('c')]);
                        $count++;
                    }
                    continue;
                }

                // Skip rows without an id
                if (empty($row['id'])) continue;

                // For users, set a default password if not present
                if ($table === 'users' && empty($row['passwordHash'])) {
                    $row['passwordHash'] = $db->hashPassword('changeme123');
                }

                $db->insert($table, $row); // Uses INSERT OR REPLACE
                $count++;
            }
            $imported[$table] = $count;
        }

        $db->pdo()->commit();
        $db->audit($user['id'], 'import', 'database', null, 'Imported data: ' . json_encode($imported));
    } catch (\Exception $e) {
        $db->pdo()->rollBack();
        return $router->json(['error' => 'Import failed: ' . $e->getMessage()], 500);
    }

    $router->json(['ok' => true, 'imported' => $imported]);
    return null;
});

// ─── GET /api/dashboard/analytics/user-activity ──
// User access patterns from audit logs.

$router->get('/api/dashboard/analytics/user-activity', function () use ($db, $router) {
    $user = requireAuth($db, $router);
    if (!$user) return null;
    if (!requireRole($router, $user, ['super_admin', 'branch_manager'])) return null;

    // Get all audit logs from last 30 days
    $since = gmdate('c', time() - 30 * 86400);
    $stmt = $db->pdo()->prepare("SELECT * FROM audit_logs WHERE createdAt >= ? ORDER BY id DESC");
    $stmt->execute([$since]);
    $logs = $stmt->fetchAll();

    // Build user map
    $users = $db->all('users');
    $userMap = [];
    foreach ($users as $u) {
        $userMap[$u['id']] = ['name' => $u['name'], 'role' => $u['role'], 'email' => $u['email']];
    }

    // Per-user activity summary
    $userActivity = [];
    foreach ($logs as $log) {
        $uid = $log['userId'];
        if (!isset($userActivity[$uid])) {
            $info = $userMap[$uid] ?? ['name' => $uid, 'role' => 'unknown', 'email' => ''];
            $userActivity[$uid] = [
                'userId' => $uid,
                'name' => $info['name'],
                'role' => $info['role'],
                'email' => $info['email'],
                'totalActions' => 0,
                'lastActive' => $log['createdAt'],
                'actions' => [],
            ];
        }
        $userActivity[$uid]['totalActions']++;
        $action = $log['action'];
        $userActivity[$uid]['actions'][$action] = ($userActivity[$uid]['actions'][$action] ?? 0) + 1;
    }

    // Sort by most active
    usort($userActivity, fn($a, $b) => $b['totalActions'] - $a['totalActions']);

    // Daily activity (last 30 days)
    $daily = [];
    foreach ($logs as $log) {
        $day = substr($log['createdAt'], 0, 10);
        $daily[$day] = ($daily[$day] ?? 0) + 1;
    }
    ksort($daily);
    $dailyChart = array_map(fn($d, $c) => ['date' => $d, 'actions' => $c], array_keys($daily), array_values($daily));

    // Hourly pattern (aggregated)
    $hourly = array_fill(0, 24, 0);
    foreach ($logs as $log) {
        $h = (int) substr($log['createdAt'], 11, 2);
        $hourly[$h]++;
    }
    $hourlyChart = array_map(fn($h, $c) => ['hour' => sprintf('%02d:00', $h), 'actions' => $c], array_keys($hourly), array_values($hourly));

    // Action breakdown
    $actionBreakdown = [];
    foreach ($logs as $log) {
        $a = $log['action'];
        $actionBreakdown[$a] = ($actionBreakdown[$a] ?? 0) + 1;
    }
    arsort($actionBreakdown);

    // Recent activity (last 50)
    $recent = array_slice($logs, 0, 50);
    foreach ($recent as &$r) {
        $r['userName'] = $userMap[$r['userId']]['name'] ?? $r['userId'];
    }
    unset($r);

    $router->json([
        'period' => '30d',
        'totalActions' => count($logs),
        'activeUsers' => count($userActivity),
        'userActivity' => array_values($userActivity),
        'dailyChart' => $dailyChart,
        'hourlyChart' => $hourlyChart,
        'actionBreakdown' => $actionBreakdown,
        'recentActivity' => $recent,
    ]);
    return null;
});
