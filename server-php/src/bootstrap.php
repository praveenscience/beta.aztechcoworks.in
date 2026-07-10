<?php
declare(strict_types=1);

spl_autoload_register(function (string $class): void {
    $prefix = 'Aztech\\';
    if (!str_starts_with($class, $prefix)) return;
    $relative = substr($class, strlen($prefix));
    $path = __DIR__ . '/' . str_replace('\\', '/', $relative) . '.php';
    if (is_file($path)) require $path;
});

// ─── Session ────────────────────────────────────
session_name('aztech_sid');
session_start();

// ─── CORS ───────────────────────────────────────
$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
$allowed = ['http://localhost:5173', 'http://localhost:4173', 'http://127.0.0.1:5173'];

if (in_array($origin, $allowed, true)) {
    header("Access-Control-Allow-Origin: $origin");
} elseif (defined('AZTECH_CORS_ORIGIN')) {
    header('Access-Control-Allow-Origin: ' . AZTECH_CORS_ORIGIN);
}

header('Access-Control-Allow-Credentials: true');
header('Access-Control-Allow-Methods: GET, POST, PATCH, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if (($_SERVER['REQUEST_METHOD'] ?? '') === 'OPTIONS') {
    http_response_code(204);
    exit;
}

// ─── Shared helpers ────────────────────────────
function body(): array {
    return json_decode(file_get_contents('php://input') ?: '{}', true) ?? [];
}
