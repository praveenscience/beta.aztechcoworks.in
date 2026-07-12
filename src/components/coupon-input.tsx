import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Tag, X } from "lucide-react";
import { api } from "@/lib/api";
import type { CouponServiceScope } from "@/types";

export interface ValidatedCoupon {
  couponId: string;
  code: string;
  discountType: "percentage" | "flat" | "free_days";
  discountValue: number;
  discountAmount: number;
  message: string;
}

interface CouponInputProps {
  serviceScope: CouponServiceScope;
  planId?: string;
  branchId?: string;
  seatType?: string;
  subtotal: number;
  durationMonths?: number;
  onApplied: (coupon: ValidatedCoupon | null) => void;
}

export function CouponInput({ serviceScope, planId, branchId, seatType, subtotal, durationMonths = 1, onApplied }: CouponInputProps) {
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [applied, setApplied] = useState<ValidatedCoupon | null>(null);

  const apply = async () => {
    const trimmed = code.trim().toUpperCase();
    if (!trimmed) return;

    setLoading(true);
    setError("");
    try {
      const result = await api.post<any>("/api/coupons/validate", {
        code: trimmed,
        serviceScope,
        planId,
        branchId,
        seatType,
        subtotal,
        durationMonths,
      });

      if (result.valid) {
        const coupon: ValidatedCoupon = {
          couponId: result.couponId,
          code: result.code,
          discountType: result.discountType,
          discountValue: result.discountValue,
          discountAmount: result.discountAmount,
          message: result.message,
        };
        setApplied(coupon);
        onApplied(coupon);
      } else {
        setError(result.reason || "Invalid coupon");
        setApplied(null);
        onApplied(null);
      }
    } catch (err: any) {
      setError(err.message || "Failed to validate coupon");
      setApplied(null);
      onApplied(null);
    } finally {
      setLoading(false);
    }
  };

  const remove = () => {
    setApplied(null);
    setCode("");
    setError("");
    onApplied(null);
  };

  if (applied) {
    return (
      <div className="flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 px-3 py-2 dark:border-green-900 dark:bg-green-950">
        <Tag className="h-4 w-4 text-green-600 dark:text-green-400" />
        <div className="flex-1">
          <Badge variant="secondary" className="mr-2 font-mono text-xs">{applied.code}</Badge>
          <span className="text-sm text-green-700 dark:text-green-300">{applied.message}</span>
        </div>
        <button type="button" onClick={remove} className="text-muted-foreground hover:text-destructive" aria-label="Remove coupon">
          <X className="h-4 w-4" />
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-1.5">
      <div className="flex gap-2">
        <Input
          placeholder="Coupon code"
          value={code}
          onChange={(e) => { setCode(e.target.value.toUpperCase()); setError(""); }}
          onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), apply())}
          className="font-mono uppercase"
        />
        <Button type="button" variant="outline" onClick={apply} disabled={loading || !code.trim()}>
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Apply"}
        </Button>
      </div>
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
