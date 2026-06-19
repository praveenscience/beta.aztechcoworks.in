import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { PageHeader } from "@/components/dashboard-shell";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useShallow } from "zustand/react/shallow";
import { CreditCard } from "lucide-react";
import { toast } from "sonner";
import { useStore } from "@/lib/store";
import { inr } from "@/lib/format";

export const Route = createFileRoute("/dashboard/bookings")({
  component: BookingsPage,
});

function BookingsPage() {
  const me = useStore((s) => s.users.find((u) => u.id === s.currentUserId));
  const branches = useStore(useShallow((s) => s.branches.filter((b) => b.isActive)));
  const rooms = useStore((s) => s.meetingRooms);
  const bookings = useStore(useShallow((s) => s.bookings.filter((b) => b.userId === me?.id)));
  const createBooking = useStore((s) => s.createBooking);

  const [branchId, setBranchId] = useState(me?.branchId ?? branches[0]?.id);
  const [roomId, setRoomId] = useState<string>("");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [start, setStart] = useState("10:00");
  const [hours, setHours] = useState(1);

  const branchRooms = rooms.filter((r) => r.branchId === branchId);
  const room = rooms.find((r) => r.id === roomId);
  const amount = room ? room.hourlyPrice * hours : 0;

  if (!me) return null;

  const book = () => {
    if (!room) {
      toast.error("Pick a room first");
      return;
    }
    const startAt = new Date(`${date}T${start}:00`);
    const endAt = new Date(startAt.getTime() + hours * 3600 * 1000);
    createBooking({
      userId: me.id,
      branchId: room.branchId,
      resourceType: "meeting_room",
      resourceId: room.id,
      startAt: startAt.toISOString(),
      endAt: endAt.toISOString(),
      amount,
    });
    toast.success(`${room.name} booked. Payment of ${inr(Math.round(amount * 1.18))} processed (demo).`);
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
              <div className="rounded-lg border bg-secondary/40 p-4">
                <div className="text-xs uppercase text-muted-foreground">Total (incl. 18% GST)</div>
                <div className="mt-1 text-2xl font-bold">{inr(Math.round(amount * 1.18))}</div>
              </div>
            </div>
            <Button onClick={book} className="mt-5" size="lg">
              <CreditCard className="mr-1.5 h-4 w-4" /> Confirm & pay
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Day pass</CardTitle>
            <CardDescription>Drop in at any branch for ₹350 + GST.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => {
              if (!branchId) return;
              createBooking({
                userId: me.id,
                branchId,
                resourceType: "day_pass",
                resourceId: "day_pass",
                startAt: new Date().toISOString(),
                endAt: new Date(Date.now() + 86400000).toISOString(),
                amount: 350,
              });
              toast.success("Day pass purchased. Show QR at reception.");
            }} className="w-full">Buy a day pass</Button>
          </CardContent>
        </Card>
      </div>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Upcoming & past bookings</CardTitle>
        </CardHeader>
        <CardContent>
          <table className="w-full text-sm">
            <thead className="text-left text-xs uppercase text-muted-foreground"><tr><th className="py-2">Type</th><th>Branch</th><th>When</th><th>Amount</th><th>Status</th></tr></thead>
            <tbody>
              {bookings.map((b) => {
                const room = rooms.find((r) => r.id === b.resourceId);
                const branch = branches.find((br) => br.id === b.branchId);
                return (
                  <tr key={b.id} className="border-t">
                    <td className="py-3">{room?.name ?? b.resourceType.replace("_", " ")}</td>
                    <td>{branch?.name}</td>
                    <td>{new Date(b.startAt).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}</td>
                    <td className="font-mono">{inr(Math.round(b.amount * 1.18))}</td>
                    <td><Badge>{b.status}</Badge></td>
                  </tr>
                );
              })}
              {bookings.length === 0 && <tr><td colSpan={5} className="py-6 text-center text-muted-foreground">No bookings yet.</td></tr>}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </>
  );
}
