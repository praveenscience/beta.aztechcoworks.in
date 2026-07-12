<?php
error_reporting(E_ALL);
ini_set('display_errors', '1');

require __DIR__ . '/src/bootstrap.php';

use Aztech\Router;
use Aztech\Db;
use Aztech\Email;
use Aztech\Whatsapp;

$db       = new Db();
$router   = new Router();
$email    = new Email();
$whatsapp = new Whatsapp();

// Count routes before loading
header('Content-Type: application/json');

try {
    require __DIR__ . '/src/routes.php';
} catch (Throwable $e) {
    echo json_encode(['error' => $e->getMessage(), 'file' => $e->getFile(), 'line' => $e->getLine()]);
    exit;
}

// Use reflection to check route count
$ref = new ReflectionClass($router);
$prop = $ref->getProperty('routes');
$routes = $prop->getValue($router);

echo json_encode([
    'route_count' => count($routes),
    'first_5' => array_map(fn($r) => $r['method'] . ' ' . $r['pattern'], array_slice($routes, 0, 5)),
    'path' => parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH),
], JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES);
