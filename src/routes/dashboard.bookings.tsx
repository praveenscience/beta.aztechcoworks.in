import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { PageHeader } from "@/components/dashboard-shell";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Calendar, CreditCard } from "lucide-react";
import { toast } from "sonner";
import { useMe, useBranches, useMyBookings, useCreateBooking, useCreateInvoice, useMeetingRooms } from "@/lib/queries";
import { inr } from "@/lib/format";
import { payInvoice } from "@/lib/razorpay";
import { CouponInput, type ValidatedCoupon } from "@/components/coupon-input";

export const Route = createFileRoute("/dashboard/bookings")({
  component: BookingsPage,
});

function BookingsPage() {
  const { data: me } = useMe();
  const { data: allBranches = [] } = useBranches();
  const branches = allBranches.filter((b) => b.isActive);
  const { data: bookings = [] } = useMyBookings();
  const { data: rooms = [] } = useMeetingRooms();
  const createBookingMutation = useCreateBooking();
  const createInvoiceMutation = useCreateInvoice();
  const [paying, setPaying] = useState(false);

  const [branchId, setBranchId] = useState(me?.branchId ?? branches[0]?.id);
  const [roomId, setRoomId] = useState<string>("");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [start, setStart] = useState("10:00");
  const [hours, setHours] = useState(1);
  const [roomCoupon, setRoomCoupon] = useState<ValidatedCoupon | null>(null);
  const [dayPassCoupon, setDayPassCoupon] = useState<ValidatedCoupon | null>(null);

  const branchRooms = rooms.filter((r) => r.branchId === branchId);
  const room = rooms.find((r) => r.id === roomId);
  const amount = room ? room.hourlyPrice * hours : 0;

  const roomDiscount = roomCoupon?.discountAmount ?? 0;
  const roomSubtotal = Math.max(0, amount - roomDiscount);
  const roomGst = Math.round(roomSubtotal * 0.18);
  const roomTotal = roomSubtotal + roomGst;

  const dayPassBase = 350;
  const dayPassDiscount = dayPassCoupon?.discountAmount ?? 0;
  const dayPassSubtotal = Math.max(0, dayPassBase - dayPassDiscount);
  const dayPassGst = Math.round(dayPassSubtotal * 0.18);
  const dayPassTotal = dayPassSubtotal + dayPassGst;

  if (!me) return null;

  const book = async () => {
    if (!room) {
      toast.error("Pick a room first");
      return;
    }
    const startAt = new Date(`${date}T${start}:00`);
    const endAt = new Date(startAt.getTime() + hours * 3600 * 1000);
    const subtotal = roomSubtotal;
    const gst = roomGst;
    const total = roomTotal;

    setPaying(true);
    try {
      // 1. Create booking
      const booking = await new Promise<any>((resolve, reject) => {
        createBookingMutation.mutate(
          {
            userId: me.id,
            branchId: room.branchId,
            resourceType: "meeting_room",
            resourceId: room.id,
            startAt: startAt.toISOString(),
            endAt: endAt.toISOString(),
            amount: subtotal,
          },
          { onSuccess: resolve, onError: reject },
        );
      });

      // 2. Create invoice
      const invoice = await new Promise<any>((resolve, reject) => {
        createInvoiceMutation.mutate(
          { userId: me.id, bookingId: booking.id, couponId: roomCoupon?.couponId, discountAmount: roomDiscount, subtotal, gst, total },
          { onSuccess: resolve, onError: reject },
        );
      });

      // 3. Pay via Razorpay
      await payInvoice(invoice.id, { name: me.name, email: me.email, phone: me.phone });
      setRoomCoupon(null);
      toast.success(`${room.name} booked and paid! ${inr(total)} including GST.`);
    } catch (err: any) {
      if (err.message === "Payment cancelled") {
        toast.info("Payment cancelled. Your booking is held — pay from Invoices to confirm.");
      } else {
        toast.error(err.message || "Booking failed");
      }
    } finally {
      setPaying(false);
    }
  };

  return (
    <>
      <PageHeader title="Bookings" description="Book meeting rooms by the hour. Pay online with GST invoice." />

      <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        <Card>
          <CardHeader>
            <CardTitle>Book a meeting room</CardTitle>
            <CardDescription>Real-time availability across {branches.length} branches.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label>Branch</Label>
                <Select value={branchId} onValueChange={(v) => { setBranchId(v); setRoomId(""); }}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {branches.map((b) => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Room</Label>
                <Select value={roomId} onValueChange={setRoomId}>
                  <SelectTrigger><SelectValue placeholder="Select a room" /></SelectTrigger>
                  <SelectContent>
                    {branchRooms.map((r) => (
                      <SelectItem key={r.id} value={r.id}>{r.name} · seats {r.capacity} · {inr(r.hourlyPrice)}/hr</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div><Label>Date</Label><Input type="date" value={date} onChange={(e) => setDate(e.target.value)} /></div>
              <div><Label>Start time</Label><Input type="time" value={start} onChange={(e) => setStart(e.target.value)} /></div>
              <div><Label>Duration (hrs)</Label><Input type="number" min={1} max={8} value={hours} onChange={(e) => setHours(Number(e.target.value))} /></div>
            </div>

            {/* Coupon */}
            <div className="mt-4">
              <Label className="mb-1.5 block text-xs text-muted-foreground">Have a coupon?</Label>
              <CouponInput
                serviceScope="meeting_room"
                branchId={branchId}
                subtotal={amount}
                onApplied={setRoomCoupon}
              />
            </div>

            {/* Price breakdown */}
            {room && (
              <div className="mt-4 space-y-1 rounded-lg border bg-secondary/40 p-4 text-sm">
                <div className="flex justify-between"><span className="text-muted-foreground">Subtotal ({hours}h × {inr(room.hourlyPrice)})</span><span>{inr(amount)}</span></div>
                {roomDiscount > 0 && (
                  <div className="flex justify-between text-green-600 dark:text-green-400"><span>Discount ({roomCoupon?.code})</span><span>−{inr(roomDiscount)}</span></div>
                )}
                <div className="flex justify-between"><span className="text-muted-foreground">GST (18%)</span><span>{inr(roomGst)}</span></div>
                <div className="flex justify-between border-t pt-1 font-semibold"><span>Total</span><span>{inr(roomTotal)}</span></div>
              </div>
            )}

            <Button onClick={book} className="mt-5" size="lg" disabled={paying}>
              <CreditCard className="mr-1.5 h-4 w-4" /> {paying ? "Processing..." : `Confirm & pay ${room ? inr(roomTotal) : ""}`}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Day pass</CardTitle>
            <CardDescription>Drop in at any branch for {inr(dayPassBase)} + GST.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <CouponInput
              serviceScope="day_pass"
              branchId={branchId}
              subtotal={dayPassBase}
              onApplied={setDayPassCoupon}
            />
            <div className="space-y-1 rounded-lg border bg-secondary/40 p-3 text-sm">
              <div className="flex justify-between"><span className="text-muted-foreground">Day pass</span><span>{inr(dayPassBase)}</span></div>
              {dayPassDiscount > 0 && (
                <div className="flex justify-between text-green-600 dark:text-green-400"><span>Discount ({dayPassCoupon?.code})</span><span>−{inr(dayPassDiscount)}</span></div>
              )}
              <div className="flex justify-between"><span className="text-muted-foreground">GST (18%)</span><span>{inr(dayPassGst)}</span></div>
              <div className="flex justify-between border-t pt-1 font-semibold"><span>Total</span><span>{inr(dayPassTotal)}</span></div>
            </div>
            <Button onClick={async () => {
              if (!branchId) return;
              setPaying(true);
              try {
                const booking = await new Promise<any>((resolve, reject) => {
                  createBookingMutation.mutate(
                    {
                      userId: me.id,
                      branchId,
                      resourceType: "day_pass",
                      resourceId: "day_pass",
                      startAt: new Date().toISOString(),
                      endAt: new Date(Date.now() + 86400000).toISOString(),
                      amount: dayPassSubtotal,
                    },
                    { onSuccess: resolve, onError: reject },
                  );
                });
                const invoice = await new Promise<any>((resolve, reject) => {
                  createInvoiceMutation.mutate(
                    { userId: me.id, bookingId: booking.id, couponId: dayPassCoupon?.couponId, discountAmount: dayPassDiscount, subtotal: dayPassSubtotal, gst: dayPassGst, total: dayPassTotal },
                    { onSuccess: resolve, onError: reject },
                  );
                });
                await payInvoice(invoice.id, { name: me.name, email: me.email, phone: me.phone });
                setDayPassCoupon(null);
                toast.success("Day pass purchased! Show this at reception.");
              } catch (err: any) {
                if (err.message !== "Payment cancelled") toast.error(err.message || "Purchase failed");
              } finally {
                setPaying(false);
              }
            }} className="w-full" disabled={paying}>{paying ? "Processing..." : `Buy day pass — ${inr(dayPassTotal)}`}</Button>
          </CardContent>
        </Card>
      </div>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Upcoming & past bookings</CardTitle>
        </CardHeader>
        <CardContent>
          <table className="w-full text-sm">
            <thead className="text-left text-xs uppercase text-muted-foreground"><tr><th className="py-2">Type</th><th>Branch</th><th>When</th><th>Amount</th><th>Status</th><th></th></tr></thead>
            <tbody>
              {bookings.map((b) => {
                const room = rooms.find((r) => r.id === b.resourceId);
                const branch = allBranches.find((br) => br.id === b.branchId);
                return (
                  <tr key={b.id} className="border-t">
                    <td className="py-3">{room?.name ?? b.resourceType.replace("_", " ")}</td>
                    <td>{branch?.name}</td>
                    <td>{new Date(b.startAt).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}</td>
                    <td className="font-mono">{inr(Math.round(b.amount * 1.18))}</td>
                    <td><Badge>{b.status}</Badge></td>
                    <td>
                      {b.status === "confirmed" && (
                        <Button size="sm" variant="ghost" asChild>
                          <a href={`${import.meta.env.VITE_API_URL || "http://localhost:3001"}/api/dashboard/bookings/${b.id}/ics`} download>
                            <Calendar className="h-4 w-4" />
                          </a>
                        </Button>
                      )}
                    </td>
                  </tr>
                );
              })}
              {bookings.length === 0 && <tr><td colSpan={6} className="py-6 text-center text-muted-foreground">No bookings yet.</td></tr>}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </>
  );
}
