<?php
declare(strict_types=1);

/** @var \Aztech\Router $router */
/** @var \Aztech\Db $db */
/** @var \Aztech\Email $email */
/** @var \Aztech\Whatsapp $whatsapp */

$razorpayKeyId     = $_ENV['RAZORPAY_KEY_ID'] ?? '';
$razorpayKeySecret = $_ENV['RAZORPAY_KEY_SECRET'] ?? '';
$razorpayWebhookSecret = $_ENV['RAZORPAY_WEBHOOK_SECRET'] ?? '';

// ─── Helper: notify on successful payment ─────
$notifyPaymentSuccess = function (string $invoiceId) use ($db, $email, $whatsapp): void {
    $invoice = $db->find('invoices', $invoiceId);
    $user = $invoice ? $db->find('users', $invoice['userId']) : null;
    if (!$invoice || !$user) return;

    $email->sendInvoice(
        $user['email'], $user['name'],
        $invoice['number'], $invoice['subtotal'], $invoice['gst'], $invoice['total'], $invoice['issuedAt']
    );

    if (!empty($user['phone'])) {
        $inr = '₹' . number_format($invoice['total']);
        $whatsapp->sendPaymentReceipt($user['phone'], $user['name'], $inr, $invoice['number']);
    }
};

// ─── GET /api/payments/key — public key for frontend ─

$router->get('/api/payments/key', function () use ($router, $razorpayKeyId) {
    $router->json(['key' => $razorpayKeyId]);
    return null;
});

// ─── POST /api/payments/create-order ────────────

$router->post('/api/payments/create-order', function () use ($db, $router, $razorpayKeyId, $razorpayKeySecret) {
    if (empty($_SESSION['userId'])) {
        return $router->json(['error' => 'Not authenticated'], 401);
    }

    $b = body();
    if (empty($b['invoiceId'])) {
        return $router->json(['error' => 'invoiceId required'], 400);
    }
    $invoiceId = $b['invoiceId'];

    $invoice = $db->find('invoices', $invoiceId);
    if (!$invoice) {
        return $router->json(['error' => 'Invoice not found'], 404);
    }
    if ($invoice['status'] === 'paid') {
        return $router->json(['error' => 'Invoice already paid'], 400);
    }

    // Check for existing pending order
    $existing = $db->findBy('payments', 'invoiceId', $invoiceId);
    if ($existing && $existing['status'] === 'created') {
        $router->json([
            'orderId'   => $existing['orderId'],
            'amount'    => $existing['amount'],
            'currency'  => 'INR',
            'paymentId' => $existing['id'],
        ]);
        return null;
    }

    $amountPaise = (int) $invoice['total'] * 100;

    // Demo mode — no Razorpay keys configured
    if (!$razorpayKeyId || !$razorpayKeySecret) {
        $payment = [
            'id'        => $db->uid('pay'),
            'orderId'   => 'order_demo_' . time(),
            'invoiceId' => $invoiceId,
            'amount'    => $amountPaise,
            'status'    => 'created',
            'createdAt' => gmdate('c'),
        ];
        $db->insert('payments', $payment);
        $router->json([
            'orderId'   => $payment['orderId'],
            'amount'    => $payment['amount'],
            'currency'  => 'INR',
            'paymentId' => $payment['id'],
            'demo'      => true,
        ]);
        return null;
    }

    // Real Razorpay order via REST API
    $ch = curl_init('https://api.razorpay.com/v1/orders');
    curl_setopt_array($ch, [
        CURLOPT_POST => true,
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_USERPWD => "{$razorpayKeyId}:{$razorpayKeySecret}",
        CURLOPT_HTTPHEADER => ['Content-Type: application/json'],
        CURLOPT_POSTFIELDS => json_encode([
            'amount'   => $amountPaise,
            'currency' => 'INR',
            'receipt'  => $invoice['number'],
        ]),
    ]);
    $result = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    if ($httpCode >= 400) {
        return $router->json(['error' => 'Failed to create payment order', 'details' => $result], 500);
    }

    $order = json_decode($result, true);
    $payment = [
        'id'        => $db->uid('pay'),
        'orderId'   => $order['id'],
        'invoiceId' => $invoiceId,
        'amount'    => $amountPaise,
        'status'    => 'created',
        'createdAt' => gmdate('c'),
    ];
    $db->insert('payments', $payment);

    $router->json([
        'orderId'   => $order['id'],
        'amount'    => $order['amount'],
        'currency'  => $order['currency'],
        'paymentId' => $payment['id'],
    ]);
    return null;
});

// ─── POST /api/payments/verify ─────────────────

$router->post('/api/payments/verify', function () use ($db, $router, $razorpayKeySecret, $notifyPaymentSuccess) {
    if (empty($_SESSION['userId'])) {
        return $router->json(['error' => 'Not authenticated'], 401);
    }

    $b = body();
    $orderId   = $b['razorpay_order_id'] ?? '';
    $paymentId = $b['razorpay_payment_id'] ?? '';
    $signature = $b['razorpay_signature'] ?? '';

    if (!$orderId || !$paymentId || !$signature) {
        return $router->json(['error' => 'Missing payment verification fields'], 400);
    }

    $payment = $db->findBy('payments', 'orderId', $orderId);
    if (!$payment) {
        return $router->json(['error' => 'Payment order not found'], 404);
    }

    // Demo mode — auto-verify
    if (str_starts_with($orderId, 'order_demo_')) {
        $db->update('payments', $payment['id'], [
            'razorpayPaymentId' => $paymentId,
            'razorpaySignature' => $signature,
            'status' => 'captured',
        ]);
        if (!empty($payment['invoiceId'])) {
            $db->update('invoices', $payment['invoiceId'], ['status' => 'paid']);
            $notifyPaymentSuccess($payment['invoiceId']);
        }
        $router->json(['verified' => true, 'paymentId' => $payment['id']]);
        return null;
    }

    // Verify Razorpay HMAC signature
    $expected = hash_hmac('sha256', "{$orderId}|{$paymentId}", $razorpayKeySecret);
    if (!hash_equals($expected, $signature)) {
        $db->update('payments', $payment['id'], ['status' => 'failed']);
        return $router->json(['error' => 'Payment verification failed'], 400);
    }

    $db->update('payments', $payment['id'], [
        'razorpayPaymentId' => $paymentId,
        'razorpaySignature' => $signature,
        'status' => 'captured',
    ]);

    if (!empty($payment['invoiceId'])) {
        $db->update('invoices', $payment['invoiceId'], ['status' => 'paid']);
        $notifyPaymentSuccess($payment['invoiceId']);
    }

    $router->json(['verified' => true, 'paymentId' => $payment['id']]);
    return null;
});

// ─── GET /api/payments/history ─────────────────

$router->get('/api/payments/history', function () use ($db, $router) {
    if (empty($_SESSION['userId'])) {
        return $router->json(['error' => 'Not authenticated'], 401);
    }

    $userId = $_SESSION['userId'];
    $invoices = $db->where('invoices', 'userId', $userId);
    $invoiceIds = array_column($invoices, 'id');

    if (empty($invoiceIds)) {
        $router->json([]);
        return null;
    }

    $allPayments = $db->all('payments');
    $userPayments = array_values(array_filter($allPayments, function ($p) use ($invoiceIds) {
        return !empty($p['invoiceId']) && in_array($p['invoiceId'], $invoiceIds, true);
    }));

    $router->json($userPayments);
    return null;
});

// ─── POST /api/payments/webhook — Razorpay async events ─

$router->post('/api/payments/webhook', function () use ($db, $router, $razorpayWebhookSecret) {
    if (!$razorpayWebhookSecret) {
        $router->json(['ok' => true]);
        return null;
    }

    $rawBody = file_get_contents('php://input') ?: '';
    $signature = $_SERVER['HTTP_X_RAZORPAY_SIGNATURE'] ?? '';
    $expected = hash_hmac('sha256', $rawBody, $razorpayWebhookSecret);

    if (!hash_equals($expected, $signature)) {
        return $router->json(['error' => 'Invalid webhook signature'], 400);
    }

    $payload = json_decode($rawBody, true) ?? [];
    $event = $payload['event'] ?? '';
    $entity = $payload['payload']['payment']['entity'] ?? null;

    if ($event === 'payment.captured' && !empty($entity['order_id'])) {
        $payment = $db->findBy('payments', 'orderId', $entity['order_id']);
        if ($payment && $payment['status'] !== 'captured') {
            $db->update('payments', $payment['id'], [
                'razorpayPaymentId' => $entity['id'],
                'status' => 'captured',
            ]);
            if (!empty($payment['invoiceId'])) {
                $db->update('invoices', $payment['invoiceId'], ['status' => 'paid']);
            }
        }
    }

    $router->json(['ok' => true]);
    return null;
});
