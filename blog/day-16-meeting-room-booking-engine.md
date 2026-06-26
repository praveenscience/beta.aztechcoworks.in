# Day 16: The Meeting Room Booking Engine — 160 Lines of Code

**Series:** Building a Production SaaS in Public — 45 Days, 45 Posts
**Tags:** #buildinpublic #react #booking #saas #ux

---

A complete meeting room booking engine with branch selection, room picker, date/time input, live GST calculation, and one-click confirmation. 160 lines of TypeScript. One component.

## The User Flow

1. **Pick a branch** — Dropdown with all active branches
2. **Pick a room** — Dropdown filtered by branch. Shows room name, capacity, and hourly price
3. **Pick a date and start time** — Native HTML date and time inputs
4. **Set duration** — Number input (1-8 hours)
5. **See the total** — Auto-calculated with 18% GST, displayed live
6. **Confirm & pay** — One button

The entire flow fits on one screen. No multi-step wizard. No "next" buttons. All fields visible at once. Change anything, the total recalculates instantly.

## The Code

```tsx
function BookingsPage() {
  const { data: me } = useMe();
  const { data: allBranches = [] } = useBranches();
  const branches = allBranches.filter((b) => b.isActive);
  const { data: bookings = [] } = useMyBookings();
  const { data: rooms = [] } = useMeetingRooms();
  const createBookingMutation = useCreateBooking();

  const [branchId, setBranchId] = useState(me?.branchId ?? branches[0]?.id);
  const [roomId, setRoomId] = useState("");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [start, setStart] = useState("10:00");
  const [hours, setHours] = useState(1);

  const branchRooms = rooms.filter((r) => r.branchId === branchId);
  const room = rooms.find((r) => r.id === roomId);
  const amount = room ? room.hourlyPrice * hours : 0;

  const book = () => {
    if (!room) { toast.error("Pick a room first"); return; }
    const startAt = new Date(`${date}T${start}:00`);
    const endAt = new Date(startAt.getTime() + hours * 3600 * 1000);
    createBookingMutation.mutate({
      userId: me.id,
      branchId: room.branchId,
      resourceType: "meeting_room",
      resourceId: room.id,
      startAt: startAt.toISOString(),
      endAt: endAt.toISOString(),
      amount,
    }, {
      onSuccess: () => toast.success(
        `${room.name} booked. Payment of ${inr(Math.round(amount * 1.18))} processed.`
      ),
    });
  };
  // ... JSX
}
```

That's the entire business logic. 30 lines. The remaining 130 lines are JSX layout with Select dropdowns, Input fields, and a Button.

## The GST Calculation

GST on meeting room bookings in India is 18%. The calculation is trivial:

```tsx
const amount = room ? room.hourlyPrice * hours : 0;
const totalWithGst = Math.round(amount * 1.18);
```

Displayed live as the user changes the room or duration:

```tsx
<div className="text-xs uppercase text-muted-foreground">Total (incl. 18% GST)</div>
<div className="mt-1 text-2xl font-bold">{inr(Math.round(amount * 1.18))}</div>
```

Pick "Nila (8-person)" at ₹500/hr for 2 hours → "₹1,180" appears instantly. Change to 3 hours → "₹1,770". No submit button. No "calculate" step. Just reactive state.

## Cascading Selects

When the branch changes, the room list updates:

```tsx
<Select value={branchId} onValueChange={(v) => {
  setBranchId(v);
  setRoomId(""); // Reset room selection
}}>
```

Changing the branch clears the room selection because rooms are branch-specific. The room dropdown then shows only rooms for the new branch:

```tsx
const branchRooms = rooms.filter((r) => r.branchId === branchId);
```

No complex form state management. No form library. Just `useState` and a `.filter()`.

## The Day Pass

Below the main booking form, there's a simpler card:

```
Day pass — Drop in at any branch for ₹350 + GST.
[Buy a day pass]
```

One button. Creates a booking with `resourceType: "day_pass"` and a fixed amount of ₹350:

```tsx
createBookingMutation.mutate({
  userId: me.id,
  branchId,
  resourceType: "day_pass",
  resourceId: "day_pass",
  startAt: new Date().toISOString(),
  endAt: new Date(Date.now() + 86400000).toISOString(),
  amount: 350,
});
```

Same mutation hook. Same API endpoint. Different `resourceType`. The backend doesn't care — it creates a Booking entity either way.

## Booking History

Below the booking form, a table shows all past and upcoming bookings:

```tsx
{bookings.map((b) => {
  const room = rooms.find((r) => r.id === b.resourceId);
  const branch = allBranches.find((br) => br.id === b.branchId);
  return (
    <tr key={b.id}>
      <td>{room?.name ?? b.resourceType.replace("_", " ")}</td>
      <td>{branch?.name}</td>
      <td>{new Date(b.startAt).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}</td>
      <td className="font-mono">{inr(Math.round(b.amount * 1.18))}</td>
      <td><Badge>{b.status}</Badge></td>
    </tr>
  );
})}
```

The room name is resolved from the `resourceId`. If the room isn't found (perhaps it was a day pass), it falls back to the resource type with underscores replaced.

Dates are formatted with `toLocaleString("en-IN")` for Indian date formatting (DD/MM/YYYY, 12-hour time). Amounts include GST. Status is a Badge.

## What I'd Add for Production

This booking engine works. But for production, it needs:

1. **Availability checking** — Currently, you can double-book a room. The backend should check for overlapping bookings before confirming.

2. **Razorpay integration** — The "Confirm & pay" button currently creates the booking instantly. In production, it should open a Razorpay payment modal first. Booking confirms only after payment succeeds.

3. **Calendar view** — Show a weekly calendar grid with existing bookings so members can visually find open slots.

4. **Cancellation** — Members should be able to cancel bookings (with a refund policy).

5. **Email confirmation** — Send a confirmation email with the room details and a calendar invite (.ics file).

These are Phase 2 features. The current 160-line engine handles the core flow: pick a room, pick a time, book it. Everything else is an enhancement.

## Why Not a Form Library?

I didn't use React Hook Form, Formik, or any form library. For a form with 5 fields and no complex validation, `useState` is the right tool:

```tsx
const [branchId, setBranchId] = useState("");
const [roomId, setRoomId] = useState("");
const [date, setDate] = useState(todayString);
const [start, setStart] = useState("10:00");
const [hours, setHours] = useState(1);
```

Five state variables. Five onChange handlers. Zero form library configuration. Zero `register()` calls. Zero schema validation (the backend validates with Zod).

Form libraries earn their keep when you have 20+ fields, complex validation rules, and dynamic field arrays. For 5 fields? useState is less code, less abstraction, and easier to debug.

---

**Tomorrow:** Day 17 — Visitor Management: Replacing Paper Logbooks with QR Tokens

**Image suggestions:**
- SCREENSHOT: The meeting room booking form with all fields visible
- SCREENSHOT: The GST calculation section showing live total
- SCREENSHOT: The booking history table with status badges
- SCREENSHOT: The day pass card

**LinkedIn post:**

> A complete meeting room booking engine in 160 lines of code:
>
> 1. Pick branch (dropdown)
> 2. Pick room (filtered by branch, shows capacity + price)
> 3. Pick date + time
> 4. Set duration (1-8 hrs)
> 5. Total with 18% GST calculates live
> 6. One-click confirm
>
> The entire business logic is 30 lines. The rest is JSX layout.
>
> No form library. No multi-step wizard. No "calculate" button. Just useState + filter + multiply.
>
> Pick "Nila (8-person)" at ₹500/hr for 2 hours → "₹1,180" appears instantly.
>
> Sometimes the simplest solution is the right solution.
>
> Day 16 of 45: [link]

**X post:**

> Meeting room booking in 160 lines:
>
> 5 useState vars. 1 useMutation hook. 1 filter for cascading selects.
>
> Live GST calculation: amount * 1.18. That's it.
>
> No form library. No wizard. No "calculate" button.
>
> Simple > Clever.
>
> Day 16/45
