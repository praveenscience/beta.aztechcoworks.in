<?php
declare(strict_types=1);

use Aztech\MockServer\Db;

/** @var \Aztech\MockServer\Router $router */
$db = new Db();

$router->get('/api/mock/health', fn () => ['status' => 'ok', 'time' => date(DATE_ATOM)]);

$router->get('/api/mock/branches', fn () => $db->table('branches'));

$router->get('/api/mock/branches/{id}', function (array $params) use ($db) {
    foreach ($db->table('branches') as $row) {
        if (($row['id'] ?? null) === $params['id'] || ($row['slug'] ?? null) === $params['id']) {
            return $row;
        }
    }
    http_response_code(404);
    return ['error' => 'Branch not found'];
});

$router->get('/api/mock/plans', fn () => $db->table('plans'));

$router->get('/api/mock/leads', fn () => $db->table('leads'));

$router->post('/api/mock/leads', function () use ($db) {
    $raw = file_get_contents('php://input') ?: '{}';
    $body = json_decode($raw, true);
    if (!is_array($body)) {
        http_response_code(400);
        return ['error' => 'Invalid JSON body'];
    }

    $errors = [];
    foreach (['name', 'email', 'phone', 'source'] as $field) {
        if (empty($body[$field]) || !is_string($body[$field])) {
            $errors[$field] = 'required string';
        }
    }
    $score = $body['score'] ?? 0;
    if (!is_int($score) || $score < 0 || $score > 100) {
        $errors['score'] = 'integer 0-100';
    }
    if (!empty($errors)) {
        http_response_code(422);
        return ['error' => 'Validation failed', 'fields' => $errors];
    }

    $lead = [
        'id'        => 'ld_' . bin2hex(random_bytes(4)),
        'name'      => $body['name'],
        'email'     => $body['email'],
        'phone'     => $body['phone'],
        'source'    => $body['source'],
        'score'     => $score,
        'createdAt' => date(DATE_ATOM),
    ];
    $db->insert('leads', $lead);
    http_response_code(201);
    return $lead;
});
