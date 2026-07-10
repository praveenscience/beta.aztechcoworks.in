<?php
declare(strict_types=1);

/** @var \Aztech\Router $router */
/** @var \Aztech\Db $db */
/** @var \Aztech\Email $email */

$router->post('/api/auth/login', function () use ($db, $router) {
    $b = body();
    if (empty($b['email']) || empty($b['password'])) {
        return $router->json(['error' => 'Email and password required'], 400);
    }

    $user = $db->findBy('users', 'email', $b['email']);
    if (!$user || !$db->verifyPassword($b['password'], $user['passwordHash'])) {
        return $router->json(['error' => 'Invalid credentials'], 401);
    }

    $_SESSION['userId'] = $user['id'];
    $router->json($db->safeUser($user));
    return null;
});

$router->post('/api/auth/register', function () use ($db, $router, $email) {
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
    $email->sendWelcome($user['email'], $user['name']);
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

// ─── POST /api/auth/forgot-password ─────────────

$router->post('/api/auth/forgot-password', function () use ($db, $router, $email) {
    $b = body();
    $userEmail = $b['email'] ?? '';

    // Always return 200 to avoid email enumeration
    if (empty($userEmail)) {
        $router->json(['ok' => true]);
        return null;
    }

    $user = $db->findBy('users', 'email', $userEmail);
    if (!$user) {
        $router->json(['ok' => true]);
        return null;
    }

    // Clean up expired tokens
    $db->pdo->exec("DELETE FROM password_reset_tokens WHERE expiresAt < '" . gmdate('c') . "'");

    // Generate secure token (64-char hex)
    $token = bin2hex(random_bytes(32));
    $expiresAt = gmdate('c', time() + 3600); // 1 hour

    $db->insert('password_reset_tokens', [
        'token'     => $token,
        'userId'    => $user['id'],
        'expiresAt' => $expiresAt,
    ]);

    $email->sendPasswordReset($user['email'], $user['name'], $token);
    $router->json(['ok' => true]);
    return null;
});

// ─── POST /api/auth/reset-password ──────────────

$router->post('/api/auth/reset-password', function () use ($db, $router) {
    $b = body();
    $token    = $b['token'] ?? '';
    $password = $b['password'] ?? '';

    if (empty($token) || empty($password)) {
        return $router->json(['error' => 'Token and password required'], 400);
    }

    $record = $db->findBy('password_reset_tokens', 'token', $token);
    if (!$record) {
        return $router->json(['error' => 'Invalid or expired reset token'], 400);
    }

    if ($record['expiresAt'] < gmdate('c')) {
        $db->deleteBy('password_reset_tokens', 'token', $token);
        return $router->json(['error' => 'Reset token has expired'], 400);
    }

    $user = $db->find('users', $record['userId']);
    if (!$user) {
        return $router->json(['error' => 'User not found'], 400);
    }

    $db->update('users', $user['id'], ['passwordHash' => $db->hashPassword($password)]);
    $db->deleteBy('password_reset_tokens', 'token', $token);

    $router->json(['ok' => true]);
    return null;
});

// ─── POST /api/auth/demo/{userId} ──────────────

$router->post('/api/auth/demo/{userId}', function (array $params) use ($db, $router) {
    $user = $db->find('users', $params['userId']);
    if (!$user) {
        return $router->json(['error' => 'User not found'], 404);
    }
    $_SESSION['userId'] = $user['id'];
    $router->json($db->safeUser($user));
    return null;
});
