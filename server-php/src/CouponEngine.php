<?php
declare(strict_types=1);

namespace Aztech;

/**
 * Coupon validation engine.
 *
 * Context array keys:
 *   serviceScope  — "membership" | "meeting_room" | "day_pass"
 *   planId        — e.g. "pl_hot"
 *   branchId      — e.g. "br_bk"
 *   seatType      — e.g. "hot_desk"
 *   subtotal      — order amount in rupees (integer)
 *   durationMonths — for memberships (integer, default 1)
 */
final class CouponEngine
{
    public function __construct(private Db $db) {}

    /**
     * Validate a coupon code against a purchase context.
     *
     * @return array{valid: bool, couponId?: string, discountType?: string, discountValue?: int, discountAmount?: int, message?: string, reason?: string}
     */
    public function validate(string $code, string $userId, array $context): array
    {
        $code = strtoupper(trim($code));
        if ($code === '') {
            return $this->fail('Coupon code is required.');
        }

        // 1. Lookup
        $coupon = $this->findByCode($code);
        if (!$coupon) {
            return $this->fail('Invalid coupon code.');
        }

        // 2. Status
        if ($coupon['status'] !== 'active') {
            return $this->fail('This coupon is no longer active.');
        }

        // 3. Time window
        $now = gmdate('Y-m-d');
        if ($now < substr($coupon['validFrom'], 0, 10)) {
            return $this->fail('This coupon is not yet valid.');
        }
        if ($now > substr($coupon['validUntil'], 0, 10)) {
            return $this->fail('This coupon has expired.');
        }

        // 4. Service scope
        $scope = $context['serviceScope'] ?? 'all';
        if ($coupon['serviceScope'] !== 'all' && $coupon['serviceScope'] !== $scope) {
            $labels = ['membership' => 'memberships', 'meeting_room' => 'meeting room bookings', 'day_pass' => 'day passes'];
            return $this->fail('This coupon is only valid for ' . ($labels[$coupon['serviceScope']] ?? $coupon['serviceScope']) . '.');
        }

        // 5. Plan restriction
        $allowedPlans = $coupon['allowedPlanIds'] ?? [];
        if (!empty($allowedPlans) && !empty($context['planId'])) {
            if (!in_array($context['planId'], $allowedPlans, true)) {
                return $this->fail('This coupon does not apply to the selected plan.');
            }
        }

        // 6. Branch restriction
        $allowedBranches = $coupon['allowedBranchIds'] ?? [];
        if (!empty($allowedBranches) && !empty($context['branchId'])) {
            if (!in_array($context['branchId'], $allowedBranches, true)) {
                return $this->fail('This coupon is not valid at the selected branch.');
            }
        }

        // 7. Seat type restriction
        $allowedSeats = $coupon['allowedSeatTypes'] ?? [];
        if (!empty($allowedSeats) && !empty($context['seatType'])) {
            if (!in_array($context['seatType'], $allowedSeats, true)) {
                return $this->fail('This coupon does not apply to this seat type.');
            }
        }

        // 8. Min order value
        $subtotal = (int) ($context['subtotal'] ?? 0);
        if ($coupon['minOrderValue'] > 0 && $subtotal < $coupon['minOrderValue']) {
            return $this->fail('Minimum order of ₹' . number_format($coupon['minOrderValue']) . ' required for this coupon.');
        }

        // 9. Min duration
        $duration = (int) ($context['durationMonths'] ?? 1);
        if ($coupon['minDurationMonths'] > 0 && $duration < $coupon['minDurationMonths']) {
            return $this->fail('This coupon requires a minimum ' . $coupon['minDurationMonths'] . '-month commitment.');
        }

        // 10. First purchase only
        if ($coupon['firstPurchaseOnly']) {
            $paidCount = (int) $this->db->pdo()->query(
                "SELECT COUNT(*) FROM invoices WHERE userId = " . $this->db->pdo()->quote($userId) . " AND status = 'paid'"
            )->fetchColumn();
            if ($paidCount > 0) {
                return $this->fail('This coupon is only valid for first-time purchases.');
            }
        }

        // 11. Global usage limit
        if ($coupon['maxUsesTotal'] > 0 && $coupon['currentUsesTotal'] >= $coupon['maxUsesTotal']) {
            return $this->fail('This coupon has reached its usage limit.');
        }

        // 12. Per-user usage limit
        if ($coupon['maxUsesPerUser'] > 0) {
            $userUses = (int) $this->db->pdo()->prepare(
                "SELECT COUNT(*) FROM coupon_usages WHERE couponId = ? AND userId = ?"
            )->execute([$coupon['id'], $userId]) ? $this->db->pdo()->prepare(
                "SELECT COUNT(*) FROM coupon_usages WHERE couponId = ? AND userId = ?"
            ) : null;

            // Simpler approach
            $stmt = $this->db->pdo()->prepare("SELECT COUNT(*) FROM coupon_usages WHERE couponId = ? AND userId = ?");
            $stmt->execute([$coupon['id'], $userId]);
            $userUses = (int) $stmt->fetchColumn();

            if ($userUses >= $coupon['maxUsesPerUser']) {
                return $this->fail('You have already used this coupon the maximum number of times.');
            }
        }

        // 13. free_days only for memberships
        if ($coupon['discountType'] === 'free_days' && $scope !== 'membership') {
            return $this->fail('Free day coupons can only be applied to memberships.');
        }

        // Calculate discount
        $discountAmount = $this->calculateDiscount($coupon, $subtotal);

        // Build success message
        $message = match ($coupon['discountType']) {
            'percentage' => $coupon['discountValue'] . '% off applied! You save ₹' . number_format($discountAmount) . '.',
            'flat' => '₹' . number_format($coupon['discountValue']) . ' off applied!',
            'free_days' => $coupon['discountValue'] . ' free days added to your membership!',
            default => 'Coupon applied!',
        };

        return [
            'valid' => true,
            'couponId' => $coupon['id'],
            'code' => $coupon['code'],
            'discountType' => $coupon['discountType'],
            'discountValue' => $coupon['discountValue'],
            'discountAmount' => $discountAmount,
            'message' => $message,
        ];
    }

    /**
     * Record coupon usage after successful payment.
     */
    public function recordUsage(string $couponId, string $userId, string $invoiceId, int $discountAmount): void
    {
        $this->db->insert('coupon_usages', [
            'id' => $this->db->uid('cu'),
            'couponId' => $couponId,
            'userId' => $userId,
            'invoiceId' => $invoiceId,
            'discountAmount' => $discountAmount,
            'appliedAt' => gmdate('c'),
        ]);

        // Increment global counter
        $this->db->pdo()->prepare("UPDATE coupons SET currentUsesTotal = currentUsesTotal + 1 WHERE id = ?")
            ->execute([$couponId]);
    }

    /**
     * Calculate the discount amount in rupees.
     */
    public function calculateDiscount(array $coupon, int $subtotal): int
    {
        return match ($coupon['discountType']) {
            'percentage' => (function () use ($coupon, $subtotal) {
                $amount = (int) floor($subtotal * $coupon['discountValue'] / 100);
                if ($coupon['maxDiscountAmount'] && $amount > $coupon['maxDiscountAmount']) {
                    $amount = (int) $coupon['maxDiscountAmount'];
                }
                return min($amount, $subtotal);
            })(),
            'flat' => min((int) $coupon['discountValue'], $subtotal),
            'free_days' => 0, // no monetary discount, days added to membership
            default => 0,
        };
    }

    private function findByCode(string $code): ?array
    {
        $stmt = $this->db->pdo()->prepare("SELECT * FROM coupons WHERE code = ?");
        $stmt->execute([$code]);
        $row = $stmt->fetch();
        if (!$row) return null;

        // Decode JSON/bool columns manually since we're bypassing Db::find
        foreach (['allowedPlanIds', 'allowedBranchIds', 'allowedSeatTypes'] as $col) {
            if (isset($row[$col]) && is_string($row[$col])) {
                $row[$col] = json_decode($row[$col], true) ?? [];
            }
        }
        foreach (['firstPurchaseOnly', 'stackable', 'isReferralCoupon'] as $col) {
            if (array_key_exists($col, $row)) {
                $row[$col] = (bool) $row[$col];
            }
        }
        return $row;
    }

    private function fail(string $reason): array
    {
        return ['valid' => false, 'reason' => $reason];
    }
}
