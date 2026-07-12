<?php
declare(strict_types=1);

/** @var \Aztech\Router $router */
/** @var \Aztech\Db $db */

// Helper: require auth and return user, or send 401
function requireAuth(\Aztech\Db $db, \Aztech\Router $router): ?array {
    if (empty($_SESSION['userId'])) {
        $router->json(['error' => 'Not authenticated'], 401);
        return null;
    }
    $user = $db->find('users', $_SESSION['userId']);
    if (!$user) {
        $router->json(['error' => 'User not found'], 401);
        return null;
    }
    return $user;
}

// Helper: require specific roles
function requireRole(\Aztech\Router $router, array $user, array $roles): bool {
    if (!in_array($user['role'], $roles, true)) {
        $router->json(['error' => 'Forbidden'], 403);
        return false;
    }
    return true;
}

// ─── Current user's data ────────────────────────

$router->get('/api/dashboard/me/memberships', function () use ($db, $router) {
    $user = requireAuth($db, $router);
    if (!$user) return null;
    $router->json($db->where('memberships', 'userId', $user['id']));
    return null;
});

$router->get('/api/dashboard/me/invoices', function () use ($db, $router) {
    $user = requireAuth($db, $router);
    if (!$user) return null;
    $router->json($db->where('invoices', 'userId', $user['id']));
    return null;
});

$router->get('/api/dashboard/me/bookings', function () use ($db, $router) {
    $user = requireAuth($db, $router);
    if (!$user) return null;
    $router->json($db->where('bookings', 'userId', $user['id']));
    return null;
});

// ─── Leads ──────────────────────────────────────

$router->get('/api/dashboard/leads', function () use ($db, $router) {
    $user = requireAuth($db, $router);
    if (!$user) return null;

    $leads = $db->all('leads');
    if ($user['role'] === 'sales_exec') {
        $leads = array_values(array_filter($leads, fn ($l) => ($l['ownerId'] ?? null) === $user['id']));
    }
    $router->json($leads);
    return null;
});

$router->get('/api/dashboard/leads/{id}', function (array $params) use ($db, $router) {
    $user = requireAuth($db, $router);
    if (!$user) return null;

    $lead = $db->find('leads', $params['id']);
    if (!$lead) {
        return $router->json(['error' => 'Lead not found'], 404);
    }

    $activities = $db->where('lead_activities', 'leadId', $lead['id']);
    $lead['activities'] = $activities;
    $router->json($lead);
    return null;
});

$router->patch('/api/dashboard/leads/{id}', function (array $params) use ($db, $router) {
    $user = requireAuth($db, $router);
    if (!$user) return null;

    $patch = body();
    $db->update('leads', $params['id'], $patch);
    $lead = $db->find('leads', $params['id']);
    if (!$lead) {
        return $router->json(['error' => 'Lead not found'], 404);
    }
    $db->insertAuditLog($user['id'], 'update', 'lead', $params['id'], json_encode(['method' => 'PATCH', 'body' => $patch]));
    $router->json($lead);
    return null;
});

// ─── Lead activities ────────────────────────────

$router->post('/api/dashboard/leads/{id}/activities', function (array $params) use ($db, $router) {
    $user = requireAuth($db, $router);
    if (!$user) return null;

    $lead = $db->find('leads', $params['id']);
    if (!$lead) {
        return $router->json(['error' => 'Lead not found'], 404);
    }

    $b = body();
    if (empty($b['type']) || empty($b['description'])) {
        return $router->json(['error' => 'type and description required'], 400);
    }

    $activity = [
        'id' => $db->uid('la'),
        'leadId' => $params['id'],
        'type' => $b['type'],
        'description' => $b['description'],
        'actorId' => $b['actorId'] ?? $user['id'],
        'createdAt' => gmdate('c'),
    ];
    $db->insert('lead_activities', $activity);
    http_response_code(201);
    $router->json($activity);
    return null;
});

// ─── Tasks ──────────────────────────────────────

$router->get('/api/dashboard/tasks', function () use ($db, $router) {
    $user = requireAuth($db, $router);
    if (!$user) return null;

    $tasks = $db->all('tasks');
    if (!in_array($user['role'], ['super_admin', 'sales_manager', 'branch_manager'], true)) {
        $tasks = array_values(array_filter($tasks, fn ($t) => $t['assigneeId'] === $user['id']));
    }
    $router->json($tasks);
    return null;
});

$router->post('/api/dashboard/tasks', function () use ($db, $router) {
    $user = requireAuth($db, $router);
    if (!$user) return null;

    $b = body();
    if (empty($b['title']) || empty($b['assigneeId']) || empty($b['dueAt'])) {
        return $router->json(['error' => 'title, assigneeId, and dueAt required'], 400);
    }

    $task = [
        'id' => $db->uid('tk'),
        'leadId' => $b['leadId'] ?? null,
        'assigneeId' => $b['assigneeId'],
        'title' => $b['title'],
        'dueAt' => $b['dueAt'],
        'done' => false,
    ];
    $db->insert('tasks', $task);
    http_response_code(201);
    $router->json($task);
    return null;
});

$router->patch('/api/dashboard/tasks/{id}', function (array $params) use ($db, $router) {
    $user = requireAuth($db, $router);
    if (!$user) return null;

    $patch = body();
    $db->update('tasks', $params['id'], $patch);
    $task = $db->find('tasks', $params['id']);
    if (!$task) {
        return $router->json(['error' => 'Task not found'], 404);
    }
    $router->json($task);
    return null;
});

// ─── Site visits ────────────────────────────────

$router->get('/api/dashboard/site-visits', function () use ($db, $router) {
    $user = requireAuth($db, $router);
    if (!$user) return null;
    $router->json($db->all('site_visits'));
    return null;
});

// ─── Visitors ───────────────────────────────────

$router->get('/api/dashboard/visitors', function () use ($db, $router) {
    $user = requireAuth($db, $router);
    if (!$user) return null;
    $router->json($db->all('visitors'));
    return null;
});

$router->post('/api/dashboard/visitors', function () use ($db, $router) {
    $user = requireAuth($db, $router);
    if (!$user) return null;

    $b = body();
    if (empty($b['hostUserId']) || empty($b['branchId']) || empty($b['name']) || empty($b['phone']) || empty($b['purpose']) || empty($b['expectedAt'])) {
        return $router->json(['error' => 'hostUserId, branchId, name, phone, purpose, and expectedAt required'], 400);
    }

    $visitor = [
        'id' => $db->uid('vis'),
        'hostUserId' => $b['hostUserId'],
        'branchId' => $b['branchId'],
        'name' => $b['name'],
        'phone' => $b['phone'],
        'purpose' => $b['purpose'],
        'qrToken' => strtoupper(substr(bin2hex(random_bytes(4)), 0, 8)),
        'expectedAt' => $b['expectedAt'],
        'checkedInAt' => null,
        'checkedOutAt' => null,
    ];
    $db->insert('visitors', $visitor);
    http_response_code(201);
    $router->json($visitor);
    return null;
});

$router->patch('/api/dashboard/visitors/{id}/checkin', function (array $params) use ($db, $router) {
    $user = requireAuth($db, $router);
    if (!$user) return null;

    $db->update('visitors', $params['id'], ['checkedInAt' => gmdate('c')]);
    $visitor = $db->find('visitors', $params['id']);
    if (!$visitor) {
        return $router->json(['error' => 'Visitor not found'], 404);
    }
    $router->json($visitor);
    return null;
});

$router->patch('/api/dashboard/visitors/{id}/checkout', function (array $params) use ($db, $router) {
    $user = requireAuth($db, $router);
    if (!$user) return null;

    $db->update('visitors', $params['id'], ['checkedOutAt' => gmdate('c')]);
    $visitor = $db->find('visitors', $params['id']);
    if (!$visitor) {
        return $router->json(['error' => 'Visitor not found'], 404);
    }
    $router->json($visitor);
    return null;
});

// ─── Bookings ───────────────────────────────────

$router->post('/api/dashboard/bookings', function () use ($db, $router) {
    $user = requireAuth($db, $router);
    if (!$user) return null;

    $b = body();
    if (empty($b['userId']) || empty($b['branchId']) || empty($b['resourceType']) || empty($b['resourceId']) || empty($b['startAt']) || empty($b['endAt'])) {
        return $router->json(['error' => 'userId, branchId, resourceType, resourceId, startAt, and endAt required'], 400);
    }

    // Conflict detection
    if ($db->hasBookingConflict($b['resourceId'], $b['startAt'], $b['endAt'])) {
        return $router->json(['error' => 'This room is already booked for that time. Please choose a different slot.'], 409);
    }

    $booking = [
        'id' => $db->uid('bk'),
        'userId' => $b['userId'],
        'branchId' => $b['branchId'],
        'resourceType' => $b['resourceType'],
        'resourceId' => $b['resourceId'],
        'startAt' => $b['startAt'],
        'endAt' => $b['endAt'],
        'amount' => $b['amount'] ?? 0,
        'status' => 'confirmed',
    ];
    $db->insert('bookings', $booking);
    http_response_code(201);
    $router->json($booking);
    return null;
});

$router->get('/api/dashboard/bookings/{id}/ics', function (array $params) use ($db, $router) {
    $user = requireAuth($db, $router);
    if (!$user) return null;

    $booking = $db->find('bookings', $params['id']);
    if (!$booking) {
        return $router->json(['error' => 'Booking not found'], 404);
    }

    $branch = $db->find('branches', $booking['branchId']);
    $title = 'Aztech Co-Works Booking';
    if ($booking['resourceType'] === 'meeting_room') {
        $rooms = $db->all('meeting_rooms');
        $room = null;
        foreach ($rooms as $r) {
            if ($r['id'] === $booking['resourceId']) { $room = $r; break; }
        }
        $title = 'Meeting Room: ' . ($room['name'] ?? $booking['resourceId']);
    } elseif ($booking['resourceType'] === 'day_pass') {
        $title = 'Day Pass — Aztech Co-Works';
    }

    $location = $branch['address'] ?? 'Aztech Co-Works, Coimbatore';
    $description = 'Booking at ' . ($branch['name'] ?? 'Aztech Co-Works');

    // Generate .ics
    $uid = $booking['id'] . '@aztechcoworks.in';
    $dtStart = gmdate('Ymd\THis\Z', strtotime($booking['startAt']));
    $dtEnd = gmdate('Ymd\THis\Z', strtotime($booking['endAt']));
    $now = gmdate('Ymd\THis\Z');

    $ics = "BEGIN:VCALENDAR\r\n"
        . "VERSION:2.0\r\n"
        . "CALSCALE:GREGORIAN\r\n"
        . "PRODID:aztech-coworks/booking\r\n"
        . "METHOD:PUBLISH\r\n"
        . "BEGIN:VEVENT\r\n"
        . "UID:{$uid}\r\n"
        . "DTSTART:{$dtStart}\r\n"
        . "DTEND:{$dtEnd}\r\n"
        . "DTSTAMP:{$now}\r\n"
        . "SUMMARY:{$title}\r\n"
        . "DESCRIPTION:{$description}\r\n"
        . "LOCATION:{$location}\r\n"
        . "STATUS:CONFIRMED\r\n"
        . "ORGANIZER;CN=Aztech Co-Works:mailto:noreply@aztechcoworks.in\r\n"
        . "END:VEVENT\r\n"
        . "END:VCALENDAR\r\n";

    header('Content-Type: text/calendar; charset=utf-8');
    header('Content-Disposition: attachment; filename="booking-' . $booking['id'] . '.ics"');
    echo $ics;
    return null;
});

// ─── Memberships ────────────────────────────────

$router->post('/api/dashboard/memberships', function () use ($db, $router) {
    $user = requireAuth($db, $router);
    if (!$user) return null;

    $b = body();
    if (empty($b['userId']) || empty($b['planId']) || empty($b['branchId']) || empty($b['seats']) || empty($b['startDate']) || empty($b['endDate'])) {
        return $router->json(['error' => 'userId, planId, branchId, seats, startDate, and endDate required'], 400);
    }

    $membership = [
        'id' => $db->uid('mb'),
        'userId' => $b['userId'],
        'planId' => $b['planId'],
        'branchId' => $b['branchId'],
        'seats' => $b['seats'],
        'status' => 'active',
        'startDate' => $b['startDate'],
        'endDate' => $b['endDate'],
    ];
    $db->insert('memberships', $membership);
    http_response_code(201);
    $router->json($membership);
    return null;
});

$router->patch('/api/dashboard/memberships/{id}/cancel', function (array $params) use ($db, $router) {
    $user = requireAuth($db, $router);
    if (!$user) return null;

    $db->update('memberships', $params['id'], ['status' => 'cancelled']);
    $membership = $db->find('memberships', $params['id']);
    if (!$membership) {
        return $router->json(['error' => 'Membership not found'], 404);
    }
    $db->insertAuditLog($user['id'], 'cancel', 'membership', $params['id']);
    $router->json($membership);
    return null;
});

// ─── Users (admin) ──────────────────────────────

$router->get('/api/dashboard/users', function () use ($db, $router) {
    $user = requireAuth($db, $router);
    if (!$user) return null;

    if (!requireRole($router, $user, ['super_admin', 'branch_manager'])) return null;
    $router->json(array_map(fn ($u) => $db->safeUser($u), $db->all('users')));
    return null;
});

$router->post('/api/dashboard/users', function () use ($db, $router) {
    $user = requireAuth($db, $router);
    if (!$user) return null;
    if (!requireRole($router, $user, ['super_admin'])) return null;

    $b = body();
    if (empty($b['name']) || empty($b['email']) || empty($b['role'])) {
        return $router->json(['error' => 'name, email, and role required'], 400);
    }

    if ($db->findBy('users', 'email', $b['email'])) {
        return $router->json(['error' => 'Email already registered'], 409);
    }

    $name = $b['name'];
    $newUser = [
        'id' => $db->uid('u'),
        'name' => $name,
        'email' => $b['email'],
        'phone' => $b['phone'] ?? null,
        'company' => null,
        'role' => $b['role'],
        'branchId' => $b['branchId'] ?? null,
        'referralCode' => strtoupper(substr(explode(' ', $name)[0], 0, 6)) . '-' . strtoupper(substr(bin2hex(random_bytes(2)), 0, 4)),
        'passwordHash' => $db->hashPassword('changeme123'),
        'createdAt' => gmdate('c'),
    ];
    $db->insert('users', $newUser);
    $db->insertAuditLog($user['id'], 'create', 'user', $newUser['id']);
    http_response_code(201);
    $router->json($db->safeUser($newUser));
    return null;
});

$router->patch('/api/dashboard/users/{id}', function (array $params) use ($db, $router) {
    $user = requireAuth($db, $router);
    if (!$user) return null;
    if (!requireRole($router, $user, ['super_admin'])) return null;

    $patch = body();
    $db->update('users', $params['id'], $patch);
    $updated = $db->find('users', $params['id']);
    if (!$updated) {
        return $router->json(['error' => 'User not found'], 404);
    }
    $db->insertAuditLog($user['id'], 'update', 'user', $params['id']);
    $router->json($db->safeUser($updated));
    return null;
});

// ─── All branches (admin) ───────────────────────

$router->get('/api/dashboard/all-branches', function () use ($db, $router) {
    $user = requireAuth($db, $router);
    if (!$user) return null;
    if (!requireRole($router, $user, ['super_admin'])) return null;
    $router->json($db->all('branches'));
    return null;
});

$router->post('/api/dashboard/branches', function () use ($db, $router) {
    $user = requireAuth($db, $router);
    if (!$user) return null;
    if (!requireRole($router, $user, ['super_admin'])) return null;

    $b = body();
    $branch = $b;
    $branch['id'] = $b['id'] ?? $db->uid('br');
    $branch['slug'] = $b['slug'] ?? strtolower(preg_replace('/\s+/', '-', $b['name'] ?? 'branch'));
    $db->insert('branches', $branch);
    http_response_code(201);
    $router->json($branch);
    return null;
});

$router->patch('/api/dashboard/branches/{id}', function (array $params) use ($db, $router) {
    $user = requireAuth($db, $router);
    if (!$user) return null;
    if (!requireRole($router, $user, ['super_admin'])) return null;

    $patch = body();
    $db->update('branches', $params['id'], $patch);
    $branch = $db->find('branches', $params['id']);
    if (!$branch) {
        return $router->json(['error' => 'Branch not found'], 404);
    }
    $router->json($branch);
    return null;
});

// ─── Branch photo upload ────────────────────────

$router->post('/api/dashboard/branches/{id}/photos', function (array $params) use ($db, $router) {
    $user = requireAuth($db, $router);
    if (!$user) return null;
    if (!requireRole($router, $user, ['super_admin', 'branch_manager'])) return null;

    $branch = $db->find('branches', $params['id']);
    if (!$branch) {
        return $router->json(['error' => 'Branch not found'], 404);
    }

    if (empty($_FILES['photos'])) {
        return $router->json(['error' => 'No files uploaded'], 400);
    }

    $uploadDir = dirname(__DIR__, 2) . '/photos';
    if (!is_dir($uploadDir)) {
        mkdir($uploadDir, 0755, true);
    }

    $allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/avif'];
    $maxSize = 5 * 1024 * 1024; // 5MB
    $uploaded = [];

    // Normalize $_FILES to always be arrays
    $files = $_FILES['photos'];
    if (!is_array($files['name'])) {
        $files = [
            'name' => [$files['name']],
            'type' => [$files['type']],
            'tmp_name' => [$files['tmp_name']],
            'error' => [$files['error']],
            'size' => [$files['size']],
        ];
    }

    $count = count($files['name']);
    for ($i = 0; $i < $count; $i++) {
        if ($files['error'][$i] !== UPLOAD_ERR_OK) continue;
        if ($files['size'][$i] > $maxSize) continue;
        if (!in_array($files['type'][$i], $allowed, true)) continue;

        $ext = match($files['type'][$i]) {
            'image/jpeg' => '.jpg',
            'image/png' => '.png',
            'image/webp' => '.webp',
            'image/avif' => '.avif',
            default => '.jpg',
        };

        $filename = $params['id'] . '_' . bin2hex(random_bytes(4)) . $ext;
        $dest = $uploadDir . '/' . $filename;

        if (move_uploaded_file($files['tmp_name'][$i], $dest)) {
            $uploaded[] = '/photos/' . $filename;
        }
    }

    if (empty($uploaded)) {
        return $router->json(['error' => 'No valid images uploaded. Accepted: JPG, PNG, WebP, AVIF (max 5MB)'], 400);
    }

    // Append to existing photos array
    $existing = $branch['photos'] ?? [];
    if (!is_array($existing)) $existing = [];
    $allPhotos = array_merge($existing, $uploaded);

    // Set first uploaded photo as cover if no cover set or still an unsplash ID
    $cover = $branch['photo'];
    if (str_starts_with($cover, 'photo-')) {
        $cover = $uploaded[0];
    }

    $db->update('branches', $params['id'], [
        'photos' => $allPhotos,
        'photo' => $cover,
    ]);

    $router->json([
        'uploaded' => $uploaded,
        'photos' => $allPhotos,
        'photo' => $cover,
    ]);
    return null;
});

$router->delete('/api/dashboard/branches/{id}/photos', function (array $params) use ($db, $router) {
    $user = requireAuth($db, $router);
    if (!$user) return null;
    if (!requireRole($router, $user, ['super_admin', 'branch_manager'])) return null;

    $branch = $db->find('branches', $params['id']);
    if (!$branch) {
        return $router->json(['error' => 'Branch not found'], 404);
    }

    $b = body();
    $photoUrl = $b['url'] ?? '';
    if (!$photoUrl) {
        return $router->json(['error' => 'Photo URL required'], 400);
    }

    // Remove from array
    $photos = $branch['photos'] ?? [];
    if (!is_array($photos)) $photos = [];
    $photos = array_values(array_filter($photos, fn($p) => $p !== $photoUrl));

    // Delete file from disk
    $filePath = dirname(__DIR__, 2) . $photoUrl;
    if (is_file($filePath)) {
        @unlink($filePath);
    }

    // If deleted photo was cover, use first remaining or fallback
    $cover = $branch['photo'];
    if ($cover === $photoUrl) {
        $cover = $photos[0] ?? '';
    }

    $db->update('branches', $params['id'], [
        'photos' => $photos,
        'photo' => $cover,
    ]);

    $router->json(['photos' => $photos, 'photo' => $cover]);
    return null;
});

// ─── Plans (admin) ──────────────────────────────

$router->post('/api/dashboard/plans', function () use ($db, $router) {
    $user = requireAuth($db, $router);
    if (!$user) return null;
    if (!requireRole($router, $user, ['super_admin'])) return null;

    $b = body();
    $plan = $b;
    $plan['id'] = $b['id'] ?? $db->uid('pl');
    $db->insert('plans', $plan);
    http_response_code(201);
    $router->json($plan);
    return null;
});

$router->patch('/api/dashboard/plans/{id}', function (array $params) use ($db, $router) {
    $user = requireAuth($db, $router);
    if (!$user) return null;
    if (!requireRole($router, $user, ['super_admin'])) return null;

    $patch = body();
    $db->update('plans', $params['id'], $patch);
    $plan = $db->find('plans', $params['id']);
    if (!$plan) {
        return $router->json(['error' => 'Plan not found'], 404);
    }
    $router->json($plan);
    return null;
});

$router->delete('/api/dashboard/plans/{id}', function (array $params) use ($db, $router) {
    $user = requireAuth($db, $router);
    if (!$user) return null;
    if (!requireRole($router, $user, ['super_admin'])) return null;

    $db->delete('plans', $params['id']);
    $db->insertAuditLog($user['id'], 'delete', 'plan', $params['id']);
    $router->json(['ok' => true]);
    return null;
});

// ─── Meeting rooms (all authenticated) ──────────

$router->get('/api/dashboard/meeting-rooms', function () use ($db, $router) {
    $user = requireAuth($db, $router);
    if (!$user) return null;
    $router->json($db->all('meeting_rooms'));
    return null;
});

// ─── Seat inventory (all authenticated) ─────────

$router->get('/api/dashboard/seat-inventory', function () use ($db, $router) {
    $user = requireAuth($db, $router);
    if (!$user) return null;
    $router->json($db->all('seat_inventory'));
    return null;
});

// ─── All memberships (admin/manager) ────────────

$router->get('/api/dashboard/all-memberships', function () use ($db, $router) {
    $user = requireAuth($db, $router);
    if (!$user) return null;
    if (!requireRole($router, $user, ['super_admin', 'branch_manager'])) return null;
    $router->json($db->all('memberships'));
    return null;
});

// ─── All bookings (admin/manager) ───────────────

$router->get('/api/dashboard/all-bookings', function () use ($db, $router) {
    $user = requireAuth($db, $router);
    if (!$user) return null;
    if (!requireRole($router, $user, ['super_admin', 'branch_manager'])) return null;
    $router->json($db->all('bookings'));
    return null;
});

// ─── Invoices (finance/admin) ───────────────────

$router->post('/api/dashboard/invoices', function () use ($db, $router) {
    $user = requireAuth($db, $router);
    if (!$user) return null;

    $b = body();
    $allInvoices = $db->all('invoices');
    $num = str_pad((string) (count($allInvoices) + 1), 4, '0', STR_PAD_LEFT);
    $year = date('Y');

    $invoice = [
        'id' => $db->uid('inv'),
        'number' => "AZTECH-{$year}-{$num}",
        'userId' => $b['userId'] ?? $user['id'],
        'bookingId' => $b['bookingId'] ?? null,
        'membershipId' => $b['membershipId'] ?? null,
        'subtotal' => $b['subtotal'],
        'gst' => $b['gst'],
        'total' => $b['total'],
        'status' => 'pending',
        'issuedAt' => gmdate('c'),
    ];
    $db->insert('invoices', $invoice);
    http_response_code(201);
    $router->json($invoice);
    return null;
});

$router->get('/api/dashboard/invoices', function () use ($db, $router) {
    $user = requireAuth($db, $router);
    if (!$user) return null;
    if (!requireRole($router, $user, ['super_admin', 'finance'])) return null;
    $router->json($db->all('invoices'));
    return null;
});

$router->get('/api/dashboard/invoices/{id}/pdf', function (array $params) use ($db, $router) {
    $user = requireAuth($db, $router);
    if (!$user) return null;

    $invoice = $db->find('invoices', $params['id']);
    if (!$invoice) {
        return $router->json(['error' => 'Invoice not found'], 404);
    }

    $invUser = $db->find('users', $invoice['userId']);
    if (!$invUser) {
        return $router->json(['error' => 'User not found'], 404);
    }

    // Build description
    $description = 'Aztech Co-Works services';
    $branchName = null;
    if (!empty($invoice['membershipId'])) {
        $memberships = $db->all('memberships');
        $membership = null;
        foreach ($memberships as $m) {
            if ($m['id'] === $invoice['membershipId']) { $membership = $m; break; }
        }
        if ($membership) {
            $plan = $db->find('plans', $membership['planId']);
            $branch = $db->find('branches', $membership['branchId']);
            $branchName = $branch['name'] ?? null;
            $description = ($plan['name'] ?? 'Membership') . " — {$membership['seats']} seat(s), {$membership['startDate']} to {$membership['endDate']}";
        }
    } elseif (!empty($invoice['bookingId'])) {
        $bookings = $db->all('bookings');
        $booking = null;
        foreach ($bookings as $bk) {
            if ($bk['id'] === $invoice['bookingId']) { $booking = $bk; break; }
        }
        if ($booking) {
            $branch = $db->find('branches', $booking['branchId']);
            $branchName = $branch['name'] ?? null;
            if ($booking['resourceType'] === 'day_pass') {
                $description = 'Day Pass — ' . ($branch['name'] ?? 'Aztech Co-Works');
            } else {
                $rooms = $db->all('meeting_rooms');
                $room = null;
                foreach ($rooms as $r) {
                    if ($r['id'] === $booking['resourceId']) { $room = $r; break; }
                }
                $description = 'Meeting Room: ' . ($room['name'] ?? $booking['resourceId']) . ' — ' . date('d M Y H:i', strtotime($booking['startAt']));
            }
        }
    }

    // Generate simple text-based PDF using raw PDF commands
    // This creates a valid PDF without any external library
    $cgst = (int) round($invoice['gst'] / 2);
    $sgst = $invoice['gst'] - $cgst;
    $inr = fn(int $n) => '₹' . number_format($n);
    $dateStr = date('d M Y', strtotime($invoice['issuedAt']));

    $lines = [
        "AZTECH CO-WORKS",
        "Premium Coworking & Managed Offices",
        "Coimbatore, Tamil Nadu, India",
        "",
        "TAX INVOICE  #{$invoice['number']}",
        "Date: {$dateStr}    Status: " . strtoupper($invoice['status']),
        $branchName ? "Branch: {$branchName}" : "",
        "",
        "Bill To: {$invUser['name']}",
        $invUser['company'] ?? "",
        $invUser['email'],
        "",
        str_repeat('-', 60),
        "Description                          HSN/SAC   Qty   Amount",
        str_repeat('-', 60),
        str_pad($description, 37) . "997212     1    {$inr($invoice['subtotal'])}",
        str_repeat('-', 60),
        "",
        str_pad("Subtotal", 50) . $inr($invoice['subtotal']),
        str_pad("CGST (9%)", 50) . $inr($cgst),
        str_pad("SGST (9%)", 50) . $inr($sgst),
        str_pad("TOTAL", 50) . $inr($invoice['total']),
        "",
        str_repeat('-', 60),
        "This is a computer-generated invoice and does not require a signature.",
        "Aztech Co-Works | +91 83106 96307 | aztechcoworks.in",
    ];

    $text = implode("\n", array_filter($lines, fn($l) => $l !== false));

    // Build a minimal valid PDF
    $content = "BT\n/F1 10 Tf\n";
    $y = 780;
    foreach (explode("\n", $text) as $line) {
        $escaped = str_replace(['\\', '(', ')'], ['\\\\', '\\(', '\\)'], $line);
        $content .= "1 0 0 1 40 {$y} Tm\n({$escaped}) Tj\n";
        $y -= 14;
    }
    $content .= "ET";

    $stream = "stream\n{$content}\nendstream";
    $streamLen = strlen($content);

    $pdf = "%PDF-1.4\n";
    $offsets = [];

    $offsets[1] = strlen($pdf);
    $pdf .= "1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n";

    $offsets[2] = strlen($pdf);
    $pdf .= "2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n";

    $offsets[3] = strlen($pdf);
    $pdf .= "3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>\nendobj\n";

    $offsets[4] = strlen($pdf);
    $pdf .= "4 0 obj\n<< /Length {$streamLen} >>\n{$stream}\nendobj\n";

    $offsets[5] = strlen($pdf);
    $pdf .= "5 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Courier >>\nendobj\n";

    $xrefOffset = strlen($pdf);
    $pdf .= "xref\n0 6\n0000000000 65535 f \n";
    for ($i = 1; $i <= 5; $i++) {
        $pdf .= sprintf("%010d 00000 n \n", $offsets[$i]);
    }
    $pdf .= "trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n{$xrefOffset}\n%%EOF";

    header('Content-Type: application/pdf');
    header('Content-Disposition: attachment; filename="' . $invoice['number'] . '.pdf"');
    header('Content-Length: ' . strlen($pdf));
    echo $pdf;
    return null;
});

// ─── Audit log (admin) ──────────────────────────

$router->get('/api/dashboard/audit-logs', function () use ($db, $router) {
    $user = requireAuth($db, $router);
    if (!$user) return null;
    if (!requireRole($router, $user, ['super_admin'])) return null;

    $logs = $db->auditLogs(500);
    $users = $db->all('users');
    $userMap = [];
    foreach ($users as $u) {
        $userMap[$u['id']] = $u['name'];
    }
    $enriched = array_map(function ($log) use ($userMap) {
        $log['userName'] = $userMap[$log['userId']] ?? $log['userId'];
        return $log;
    }, $logs);
    $router->json($enriched);
    return null;
});
