<?php
// Front controller for `php -S 127.0.0.1:8787 router.php`
declare(strict_types=1);

require __DIR__ . '/src/bootstrap.php';

use Aztech\MockServer\Router;

$router = new Router();
require __DIR__ . '/src/routes.php';

$router->dispatch(
    $_SERVER['REQUEST_METHOD'] ?? 'GET',
    parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH) ?: '/'
);
