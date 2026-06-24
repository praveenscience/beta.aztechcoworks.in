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

    $patch = json_decode(file_get_contents('php://input') ?: '{}', true) ?? [];
    $db->update('leads', $params['id'], $patch);
    $lead = $db->find('leads', $params['id']);
    if (!$lead) {
        return $router->json(['error' => 'Lead not found'], 404);
    }
    $router->json($lead);
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

$router->patch('/api/dashboard/tasks/{id}', function (array $params) use ($db, $router) {
    $user = requireAuth($db, $router);
    if (!$user) return null;

    $patch = json_decode(file_get_contents('php://input') ?: '{}', true) ?? [];
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

// ─── Users (admin) ──────────────────────────────

$router->get('/api/dashboard/users', function () use ($db, $router) {
    $user = requireAuth($db, $router);
    if (!$user) return null;

    if (!in_array($user['role'], ['super_admin', 'branch_manager'], true)) {
        return $router->json(['error' => 'Forbidden'], 403);
    }
    $router->json(array_map(fn ($u) => $db->safeUser($u), $db->all('users')));
    return null;
});

// ─── All branches (admin) ───────────────────────

$router->get('/api/dashboard/all-branches', function () use ($db, $router) {
    $user = requireAuth($db, $router);
    if (!$user) return null;

    if ($user['role'] !== 'super_admin') {
        return $router->json(['error' => 'Forbidden'], 403);
    }
    $router->json($db->all('branches'));
    return null;
});

// ─── Invoices (finance/admin) ───────────────────

$router->get('/api/dashboard/invoices', function () use ($db, $router) {
    $user = requireAuth($db, $router);
    if (!$user) return null;

    if (!in_array($user['role'], ['super_admin', 'finance'], true)) {
        return $router->json(['error' => 'Forbidden'], 403);
    }
    $router->json($db->all('invoices'));
    return null;
});

// ─── Visitors ───────────────────────────────────

$router->get('/api/dashboard/visitors', function () use ($db, $router) {
    $user = requireAuth($db, $router);
    if (!$user) return null;
    $router->json($db->all('visitors'));
    return null;
});
