<?php
declare(strict_types=1);

/** @var \Aztech\Router $router */
/** @var \Aztech\Db $db */

function body(): array {
    return json_decode(file_get_contents('php://input') ?: '{}', true) ?? [];
}

$router->post('/api/auth/login', function () use ($db, $router) {
    $b = body();
    if (empty($b['email']) || empty($b['password'])) {
        return $router->json(['error' => 'Email and password required'], 400);
    }

    $user = $db->findBy('users', 'email', $b['email']);
    if (!$user || $user['passwordHash'] !== $db->hashPassword($b['password'])) {
        return $router->json(['error' => 'Invalid credentials'], 401);
    }

    $_SESSION['userId'] = $user['id'];
    $router->json($db->safeUser($user));
    return null;
});

$router->post('/api/auth/register', function () use ($db, $router) {
    $b = body();
    if (empty($b['name']) || empty($b['email']) || empty($b['password'])) {
        return $router->json(['error' => 'Name, email, and password required'], 400);
    }

    if ($db->findBy('users', 'email', $b['email'])) {
        return $router->json(['error' => 'Email already registered'], 409);
    }

    $name = $b['name'];
    $user = [
        'id' => $db->uid('u'),
        'name' => $name,
        'email' => $b['email'],
        'phone' => $b['phone'] ?? null,
        'company' => null,
        'role' => 'member',
        'branchId' => null,
        'referralCode' => strtoupper(substr(explode(' ', $name)[0], 0, 6)) . '-' . strtoupper(substr(bin2hex(random_bytes(2)), 0, 4)),
        'passwordHash' => $db->hashPassword($b['password']),
        'createdAt' => gmdate('c'),
    ];

    $db->insert('users', $user);
    $_SESSION['userId'] = $user['id'];
    http_response_code(201);
    $router->json($db->safeUser($user));
    return null;
});

$router->get('/api/auth/me', function () use ($db, $router) {
    if (empty($_SESSION['userId'])) {
        return $router->json(['error' => 'Not authenticated'], 401);
    }
    $user = $db->find('users', $_SESSION['userId']);
    if (!$user) {
        return $router->json(['error' => 'User not found'], 401);
    }
    $router->json($db->safeUser($user));
    return null;
});

$router->post('/api/auth/logout', function () use ($router) {
    $_SESSION = [];
    session_destroy();
    $router->json(['ok' => true]);
    return null;
});

$router->post('/api/auth/demo/{userId}', function (array $params) use ($db, $router) {
    $user = $db->find('users', $params['userId']);
    if (!$user) {
        return $router->json(['error' => 'User not found'], 404);
    }
    $_SESSION['userId'] = $user['id'];
    $router->json($db->safeUser($user));
    return null;
});
