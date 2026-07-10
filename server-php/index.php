<?php
// Apache / cPanel entry point (via .htaccess rewrite)
declare(strict_types=1);

require __DIR__ . '/src/bootstrap.php';

use Aztech\Router;
use Aztech\Db;
use Aztech\Email;
use Aztech\Whatsapp;

$db       = new Db();
$router   = new Router();
$email    = new Email();
$whatsapp = new Whatsapp();
require __DIR__ . '/src/routes.php';

$router->dispatch(
    $_SERVER['REQUEST_METHOD'] ?? 'GET',
    parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH) ?: '/'
);
