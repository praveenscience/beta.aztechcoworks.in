<?php
declare(strict_types=1);

/** @var \Aztech\Router $router */
/** @var \Aztech\Db $db */

// ─── Health ─────────────────────────────────────

$router->get('/api/health', fn () => ['status' => 'ok', 'time' => gmdate('c'), 'engine' => 'php']);

// ─── Branches ───────────────────────────────────

$router->get('/api/branches', function () use ($db) {
    return array_values(array_filter($db->all('branches'), fn ($b) => $b['isActive']));
});

$router->get('/api/branches/{id}', function (array $params) use ($db, $router) {
    $branch = $db->find('branches', $params['id'])
        ?? $db->findBy('branches', 'slug', $params['id']);

    if (!$branch) {
        return $router->json(['error' => 'Branch not found'], 404);
    }

    $branch['seatInventory'] = $db->where('seat_inventory', 'branchId', $branch['id']);
    $branch['meetingRooms'] = $db->where('meeting_rooms', 'branchId', $branch['id']);
    $router->json($branch);
    return null;
});

// ─── Plans ──────────────────────────────────────

$router->get('/api/plans', fn () => $db->all('plans'));

// ─── Blog ───────────────────────────────────────

$router->get('/api/blog', fn () => $db->all('blog'));

$router->get('/api/blog/{slug}', function (array $params) use ($db, $router) {
    $post = $db->findBy('blog', 'slug', $params['slug'])
        ?? $db->find('blog', $params['slug']);
    if (!$post) {
        return $router->json(['error' => 'Post not found'], 404);
    }
    $router->json($post);
    return null;
});

// ─── Testimonials ───────────────────────────────

$router->get('/api/testimonials', fn () => $db->all('testimonials'));

// ─── Lead capture ───────────────────────────────

$router->post('/api/leads', function () use ($db, $router) {
    $b = json_decode(file_get_contents('php://input') ?: '{}', true) ?? [];
    if (empty($b['name']) || empty($b['email']) || empty($b['phone'])) {
        return $router->json(['error' => 'Name, email, and phone are required'], 400);
    }

    $lead = [
        'id' => $db->uid('ld'),
        'name' => $b['name'], 'email' => $b['email'], 'phone' => $b['phone'],
        'source' => $b['source'] ?? 'website',
        'branchId' => $b['branchId'] ?? null,
        'planId' => $b['planId'] ?? null,
        'teamSize' => $b['teamSize'] ?? null,
        'budget' => $b['budget'] ?? null,
        'timeline' => $b['timeline'] ?? null,
        'message' => $b['message'] ?? null,
        'customFields' => $b['customFields'] ?? null,
        'score' => 0, 'stage' => 'new',
        'ownerId' => null,
        'createdAt' => gmdate('c'),
        'lostReason' => null,
    ];

    $db->insert('leads', $lead);
    http_response_code(201);
    $router->json($lead);
    return null;
});

// ─── Site visit booking ─────────────────────────

$router->post('/api/site-visits', function () use ($db, $router) {
    $b = json_decode(file_get_contents('php://input') ?: '{}', true) ?? [];
    if (empty($b['name']) || empty($b['email']) || empty($b['branchId'])) {
        return $router->json(['error' => 'Name, email, and branchId required'], 400);
    }

    $lead = [
        'id' => $db->uid('ld'),
        'name' => $b['name'], 'email' => $b['email'], 'phone' => $b['phone'] ?? '',
        'source' => 'website', 'branchId' => $b['branchId'],
        'planId' => null, 'teamSize' => null, 'budget' => null, 'timeline' => null,
        'message' => 'Site visit: ' . ($b['scheduledAt'] ?? 'TBD'),
        'customFields' => null,
        'score' => 0, 'stage' => 'site_visit', 'ownerId' => null,
        'createdAt' => gmdate('c'), 'lostReason' => null,
    ];
    $db->insert('leads', $lead);

    $visit = [
        'id' => $db->uid('sv'),
        'leadId' => $lead['id'],
        'branchId' => $b['branchId'],
        'scheduledAt' => $b['scheduledAt'] ?? gmdate('c'),
        'status' => 'scheduled',
        'mode' => $b['mode'] ?? 'self_serve',
    ];
    $db->insert('site_visits', $visit);

    http_response_code(201);
    $router->json(['lead' => $lead, 'visit' => $visit]);
    return null;
});
