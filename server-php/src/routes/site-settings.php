<?php
declare(strict_types=1);

/**
 * Site settings routes — hero images & client logos management.
 *
 * @var \Aztech\Router $router
 * @var \Aztech\Db $db
 */

// ─── GET /api/site-settings — public (frontend reads this) ─

$router->get('/api/site-settings', function () use ($db, $router) {
    $router->json([
        'heroImages'  => $db->getSetting('hero_images') ?? [],
        'clientLogos' => $db->getSetting('client_logos') ?? [],
    ]);
    return null;
});

// ─── PATCH /api/dashboard/site-settings/hero-images ─

$router->patch('/api/dashboard/site-settings/hero-images', function () use ($db, $router) {
    $user = requireAuth($db, $router);
    if (!$user) return null;
    if (!requireRole($router, $user, ['super_admin'])) return null;

    $b = body();
    $images = $b['heroImages'] ?? [];
    $db->setSetting('hero_images', $images);
    $db->audit($user['id'], 'update', 'site_setting', 'hero_images', 'Updated hero images');

    $router->json(['heroImages' => $images]);
    return null;
});

// ─── PATCH /api/dashboard/site-settings/client-logos ─

$router->patch('/api/dashboard/site-settings/client-logos', function () use ($db, $router) {
    $user = requireAuth($db, $router);
    if (!$user) return null;
    if (!requireRole($router, $user, ['super_admin'])) return null;

    $b = body();
    $logos = $b['clientLogos'] ?? [];
    $db->setSetting('client_logos', $logos);
    $db->audit($user['id'], 'update', 'site_setting', 'client_logos', 'Updated client logos');

    $router->json(['clientLogos' => $logos]);
    return null;
});

// ─── POST /api/dashboard/site-settings/upload — image upload for logos/hero ─

$router->post('/api/dashboard/site-settings/upload', function () use ($db, $router) {
    $user = requireAuth($db, $router);
    if (!$user) return null;
    if (!requireRole($router, $user, ['super_admin'])) return null;

    if (empty($_FILES['file'])) {
        return $router->json(['error' => 'No file uploaded'], 400);
    }

    $file = $_FILES['file'];
    $ext = strtolower(pathinfo($file['name'], PATHINFO_EXTENSION));
    $allowed = ['jpg', 'jpeg', 'png', 'webp', 'avif', 'svg'];

    if (!in_array($ext, $allowed, true)) {
        return $router->json(['error' => 'Invalid file type. Accepted: ' . implode(', ', $allowed)], 400);
    }

    if ($file['size'] > 5 * 1024 * 1024) {
        return $router->json(['error' => 'File too large (max 5MB)'], 400);
    }

    $uploadDir = dirname(__DIR__, 2) . '/photos';
    if (!is_dir($uploadDir)) {
        mkdir($uploadDir, 0755, true);
    }

    $type = $_POST['type'] ?? 'site';
    $filename = "{$type}_" . bin2hex(random_bytes(4)) . ".{$ext}";
    $dest = $uploadDir . '/' . $filename;

    if (!move_uploaded_file($file['tmp_name'], $dest)) {
        return $router->json(['error' => 'Upload failed'], 500);
    }

    $url = '/photos/' . $filename;
    $router->json(['url' => $url]);
    return null;
});
