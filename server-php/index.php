<?php
// Apache / cPanel entry point (via .htaccess rewrite)
declare(strict_types=1);

require __DIR__ . '/src/bootstrap.php';

use Aztech\Router;
use Aztech\Db;

$db = new Db();
$router = new Router();
require __DIR__ . '/src/routes.php';

$router->dispatch(
    $_SERVER['REQUEST_METHOD'] ?? 'GET',
    parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH) ?: '/'
);
