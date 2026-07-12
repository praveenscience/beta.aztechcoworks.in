<?php
declare(strict_types=1);

/**
 * Coupon routes — validate (authenticated user) + CRUD (admin/marketing).
 *
 * @var \Aztech\Router $router
 * @var \Aztech\Db $db
 */

use Aztech\CouponEngine;

$couponEngine = new CouponEngine($db);

// ─── POST /api/coupons/validate ─────────────────
// Authenticated users validate a coupon against a purchase context.

$router->post('/api/coupons/validate', function () use ($db, $router, $couponEngine) {
    if (empty($_SESSION['userId'])) {
        return $router->json(['error' => 'Not authenticated'], 401);
    }

    $b = body();
    $code = $b['code'] ?? '';
    $context = [
        'serviceScope'   => $b['serviceScope'] ?? 'all',
        'planId'         => $b['planId'] ?? '',
        'branchId'       => $b['branchId'] ?? '',
        'seatType'       => $b['seatType'] ?? '',
        'subtotal'       => (int) ($b['subtotal'] ?? 0),
        'durationMonths' => (int) ($b['durationMonths'] ?? 1),
    ];

    $result = $couponEngine->validate($code, $_SESSION['userId'], $context);
    $router->json($result);
    return null;
});

// ─── GET /api/dashboard/coupons ─────────────────
// Admin/marketing: list all coupons with usage counts.

$router->get('/api/dashboard/coupons', function () use ($db, $router) {
    $user = requireAuth($db, $router);
    if (!$user) return null;
    if (!requireRole($router, $user, ['super_admin', 'marketing'])) return null;

    $coupons = $db->all('coupons');

    // Auto-expire coupons past their validUntil date
    $now = gmdate('Y-m-d');
    foreach ($coupons as &$c) {
        if ($c['status'] === 'active' && substr($c['validUntil'], 0, 10) < $now) {
            $c['status'] = 'expired';
            $db->update('coupons', $c['id'], ['status' => 'expired']);
        }
    }
    unset($c);

    $router->json($coupons);
    return null;
});

// ─── POST /api/dashboard/coupons ────────────────
// Admin/marketing: create a new coupon.

$router->post('/api/dashboard/coupons', function () use ($db, $router) {
    $user = requireAuth($db, $router);
    if (!$user) return null;
    if (!requireRole($router, $user, ['super_admin', 'marketing'])) return null;

    $b = body();
    $code = strtoupper(trim($b['code'] ?? ''));
    if ($code === '') {
        return $router->json(['error' => 'Coupon code is required'], 400);
    }

    // Check uniqueness
    $existing = $db->pdo()->prepare("SELECT id FROM coupons WHERE code = ?");
    $existing->execute([$code]);
    if ($existing->fetch()) {
        return $router->json(['error' => 'A coupon with this code already exists'], 400);
    }

    $now = gmdate('c');
    $coupon = [
        'id'                => $b['id'] ?? $db->uid('cp'),
        'code'              => $code,
        'description'       => trim($b['description'] ?? ''),
        'discountType'      => $b['discountType'] ?? 'percentage',
        'discountValue'     => (int) ($b['discountValue'] ?? 0),
        'maxDiscountAmount' => isset($b['maxDiscountAmount']) && $b['maxDiscountAmount'] !== '' ? (int) $b['maxDiscountAmount'] : null,
        'serviceScope'      => $b['serviceScope'] ?? 'all',
        'allowedPlanIds'    => $b['allowedPlanIds'] ?? [],
        'allowedBranchIds'  => $b['allowedBranchIds'] ?? [],
        'allowedSeatTypes'  => $b['allowedSeatTypes'] ?? [],
        'minOrderValue'     => (int) ($b['minOrderValue'] ?? 0),
        'minDurationMonths' => (int) ($b['minDurationMonths'] ?? 0),
        'firstPurchaseOnly' => (bool) ($b['firstPurchaseOnly'] ?? false),
        'maxUsesTotal'      => (int) ($b['maxUsesTotal'] ?? 0),
        'maxUsesPerUser'    => (int) ($b['maxUsesPerUser'] ?? 0),
        'currentUsesTotal'  => 0,
        'stackable'         => (bool) ($b['stackable'] ?? false),
        'isReferralCoupon'  => (bool) ($b['isReferralCoupon'] ?? false),
        'validFrom'         => $b['validFrom'] ?? $now,
        'validUntil'        => $b['validUntil'] ?? '2027-12-31',
        'status'            => $b['status'] ?? 'active',
        'createdBy'         => $user['id'],
        'createdAt'         => $now,
    ];

    $db->insert('coupons', $coupon);
    $db->audit($user['id'], 'create', 'coupon', $coupon['id'], "Created coupon {$code}");

    http_response_code(201);
    $router->json($db->find('coupons', $coupon['id']));
    return null;
});

// ─── PATCH /api/dashboard/coupons/{id} ──────────
// Admin/marketing: update a coupon.

$router->patch('/api/dashboard/coupons/{id}', function (array $params) use ($db, $router) {
    $user = requireAuth($db, $router);
    if (!$user) return null;
    if (!requireRole($router, $user, ['super_admin', 'marketing'])) return null;

    $coupon = $db->find('coupons', $params['id']);
    if (!$coupon) {
        return $router->json(['error' => 'Coupon not found'], 404);
    }

    $patch = body();

    // Uppercase code if changed
    if (isset($patch['code'])) {
        $patch['code'] = strtoupper(trim($patch['code']));
        // Check uniqueness (exclude self)
        $existing = $db->pdo()->prepare("SELECT id FROM coupons WHERE code = ? AND id != ?");
        $existing->execute([$patch['code'], $params['id']]);
        if ($existing->fetch()) {
            return $router->json(['error' => 'A coupon with this code already exists'], 400);
        }
    }

    // Don't allow manual currentUsesTotal edits
    unset($patch['currentUsesTotal'], $patch['createdAt'], $patch['createdBy']);

    $db->update('coupons', $params['id'], $patch);
    $db->audit($user['id'], 'update', 'coupon', $params['id'], 'Updated coupon');

    $router->json($db->find('coupons', $params['id']));
    return null;
});

// ─── DELETE /api/dashboard/coupons/{id} ─────────
// Admin/marketing: soft-delete (set status=inactive).

$router->delete('/api/dashboard/coupons/{id}', function (array $params) use ($db, $router) {
    $user = requireAuth($db, $router);
    if (!$user) return null;
    if (!requireRole($router, $user, ['super_admin', 'marketing'])) return null;

    $coupon = $db->find('coupons', $params['id']);
    if (!$coupon) {
        return $router->json(['error' => 'Coupon not found'], 404);
    }

    $db->update('coupons', $params['id'], ['status' => 'inactive']);
    $db->audit($user['id'], 'delete', 'coupon', $params['id'], "Deactivated coupon {$coupon['code']}");

    $router->json(['ok' => true]);
    return null;
});

// ─── GET /api/dashboard/coupons/{id}/usages ─────
// Admin/marketing: view usage history for a coupon.

$router->get('/api/dashboard/coupons/{id}/usages', function (array $params) use ($db, $router) {
    $user = requireAuth($db, $router);
    if (!$user) return null;
    if (!requireRole($router, $user, ['super_admin', 'marketing', 'finance'])) return null;

    $coupon = $db->find('coupons', $params['id']);
    if (!$coupon) {
        return $router->json(['error' => 'Coupon not found'], 404);
    }

    $usages = $db->where('coupon_usages', 'couponId', $params['id']);

    // Enrich with user names
    foreach ($usages as &$u) {
        $usr = $db->find('users', $u['userId']);
        $u['userName'] = $usr ? $usr['name'] : 'Unknown';
        $u['userEmail'] = $usr ? $usr['email'] : '';
    }
    unset($u);

    $router->json($usages);
    return null;
});
