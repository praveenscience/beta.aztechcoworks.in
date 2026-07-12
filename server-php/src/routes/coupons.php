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

// ─── GET /api/dashboard/me/deals ─────────────────
// Authenticated user: list my available deals with coupon details.

$router->get('/api/dashboard/me/deals', function () use ($db, $router) {
    if (empty($_SESSION['userId'])) {
        return $router->json(['error' => 'Not authenticated'], 401);
    }

    $deals = $db->where('user_deals', 'userId', $_SESSION['userId']);

    // Auto-expire past-due deals
    $now = gmdate('Y-m-d\TH:i:s\Z');
    foreach ($deals as &$d) {
        if ($d['status'] === 'available' && !empty($d['expiresAt']) && $d['expiresAt'] < $now) {
            $d['status'] = 'expired';
            $db->update('user_deals', $d['id'], ['status' => 'expired']);
        }
    }
    unset($d);

    // Enrich with coupon details
    foreach ($deals as &$d) {
        $coupon = $db->find('coupons', $d['couponId']);
        $d['coupon'] = $coupon;
    }
    unset($d);

    // Sort: available first, then used, then expired
    usort($deals, function ($a, $b) {
        $order = ['available' => 0, 'used' => 1, 'expired' => 2];
        return ($order[$a['status']] ?? 3) - ($order[$b['status']] ?? 3);
    });

    $router->json($deals);
    return null;
});

// ─── GET /api/dashboard/deals ────────────────────
// Admin: list all user deals.

$router->get('/api/dashboard/deals', function () use ($db, $router) {
    $user = requireAuth($db, $router);
    if (!$user) return null;
    if (!requireRole($router, $user, ['super_admin', 'marketing'])) return null;

    $deals = $db->all('user_deals');

    // Enrich with coupon + user info
    foreach ($deals as &$d) {
        $coupon = $db->find('coupons', $d['couponId']);
        $d['coupon'] = $coupon;
        $usr = $db->find('users', $d['userId']);
        $d['userName'] = $usr ? $usr['name'] : 'Unknown';
    }
    unset($d);

    $router->json($deals);
    return null;
});

// ─── POST /api/dashboard/deals ───────────────────
// Admin: assign a deal (coupon) to one or more users.

$router->post('/api/dashboard/deals', function () use ($db, $router) {
    $user = requireAuth($db, $router);
    if (!$user) return null;
    if (!requireRole($router, $user, ['super_admin', 'marketing'])) return null;

    $b = body();
    $couponId = $b['couponId'] ?? '';
    $userIds = $b['userIds'] ?? [];
    $expiresAt = $b['expiresAt'] ?? null;

    if (!$couponId || empty($userIds)) {
        return $router->json(['error' => 'couponId and userIds are required'], 400);
    }

    $coupon = $db->find('coupons', $couponId);
    if (!$coupon) {
        return $router->json(['error' => 'Coupon not found'], 404);
    }

    $now = gmdate('c');
    $created = [];
    foreach ($userIds as $uid) {
        // Check if user already has this deal available
        $existing = $db->pdo()->prepare("SELECT id FROM user_deals WHERE userId = ? AND couponId = ? AND status = 'available'");
        $existing->execute([$uid, $couponId]);
        if ($existing->fetch()) {
            continue; // Skip duplicate
        }

        $deal = [
            'id'         => $db->uid('ud'),
            'userId'     => $uid,
            'couponId'   => $couponId,
            'status'     => 'available',
            'assignedBy' => $user['id'],
            'assignedAt' => $now,
            'expiresAt'  => $expiresAt,
            'usedAt'     => null,
        ];
        $db->insert('user_deals', $deal);
        $created[] = $deal;
    }

    $db->audit($user['id'], 'create', 'user_deal', $couponId, "Assigned deal to " . count($created) . " user(s)");

    http_response_code(201);
    $router->json(['created' => count($created), 'deals' => $created]);
    return null;
});

// ─── DELETE /api/dashboard/deals/{id} ────────────
// Admin: revoke a deal.

$router->delete('/api/dashboard/deals/{id}', function (array $params) use ($db, $router) {
    $user = requireAuth($db, $router);
    if (!$user) return null;
    if (!requireRole($router, $user, ['super_admin', 'marketing'])) return null;

    $deal = $db->find('user_deals', $params['id']);
    if (!$deal) {
        return $router->json(['error' => 'Deal not found'], 404);
    }

    $db->update('user_deals', $params['id'], ['status' => 'expired']);
    $db->audit($user['id'], 'delete', 'user_deal', $params['id'], 'Revoked deal');

    $router->json(['ok' => true]);
    return null;
});
