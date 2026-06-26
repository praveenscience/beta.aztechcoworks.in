# Day 17: Visitor Management — Replacing Paper Logbooks with QR Tokens

**Series:** Building a Production SaaS in Public — 45 Days, 45 Posts
**Tags:** #buildinpublic #visitor #qrcode #react #coworking

---

Every coworking space has a visitor logbook at reception. A physical notebook where visitors write their name, phone number, and who they're visiting. In handwriting that nobody can read. With phone numbers that have missing digits.

We replaced it with 4 API endpoints and a form.

## The Flow

**Member pre-registers a visitor:**

1. Opens `/dashboard/visitors` in the member portal
2. Fills in: visitor name, phone, purpose, expected arrival time
3. System generates a unique QR token
4. Visitor gets notified (future: WhatsApp message with QR code)

**Visitor arrives at reception:**

5. Receptionist opens `/staff/reception`
6. Searches for the visitor by name or finds them in today's list
7. One click: "Check in" — records `checkedInAt` timestamp
8. One click later: "Check out" — records `checkedOutAt` timestamp

## The Data Model

```typescript
export interface Visitor {
  id: string;
  hostUserId: string;     // The member who invited them
  branchId: string;       // Which branch
  name: string;
  phone: string;
  purpose: string;        // "Client meeting", "Interview", etc.
  qrToken: string;        // Unique code for check-in
  expectedAt: string;     // When they're expected
  checkedInAt?: string;   // Set when they arrive
  checkedOutAt?: string;  // Set when they leave
}
```

The lifecycle is in the type. `checkedInAt` is optional — it doesn't exist until the visitor arrives. `checkedOutAt` is optional — it doesn't exist until they leave. The presence or absence of these fields IS the state machine.

No `status: "pending" | "checked_in" | "checked_out"` enum. No state transitions. Just timestamps.

## The QR Token

When a visitor is created, the backend generates a unique token:

```typescript
const visitor: Visitor = {
  id: uid("vis"),
  ...req.body,
  qrToken: uid("qr").slice(3).toUpperCase(), // e.g., "A7X9K2"
};
```

A 6-character alphanumeric code. Short enough to read aloud on the phone ("My code is Alpha Seven X-ray Nine Kilo Two"). Unique enough that collisions are negligible for a few hundred visitors per day.

In the future, this token will be encoded into an actual QR code that the visitor shows at reception. The receptionist scans it, and the system auto-checks them in.

## The Member Form

```tsx
function VisitorForm() {
  const { data: me } = useMe();
  const { data: branches = [] } = useBranches();
  const createVisitor = useCreateVisitor();
  const [form, setForm] = useState({
    name: "", phone: "", purpose: "", expectedAt: ""
  });

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    createVisitor.mutate({
      hostUserId: me.id,
      branchId: me.branchId,
      name: form.name,
      phone: form.phone,
      purpose: form.purpose,
      expectedAt: form.expectedAt,
    }, {
      onSuccess: () => {
        toast.success("Visitor pre-registered. They'll receive a check-in code.");
        setForm({ name: "", phone: "", purpose: "", expectedAt: "" });
      },
    });
  };
}
```

Four fields. The `hostUserId` and `branchId` are automatically set from the logged-in member's profile. The member doesn't choose a branch — they're already at one.

## The Reception View

The receptionist sees today's visitors in a list:

```tsx
{visitors.map((v) => (
  <tr key={v.id}>
    <td>{v.name}</td>
    <td>{v.phone}</td>
    <td>{v.purpose}</td>
    <td>{host?.name ?? "—"}</td>
    <td>
      {!v.checkedInAt && (
        <Button size="sm" onClick={() => checkInMutation.mutate(v.id)}>
          Check in
        </Button>
      )}
      {v.checkedInAt && !v.checkedOutAt && (
        <Button size="sm" variant="secondary" onClick={() => checkOutMutation.mutate(v.id)}>
          Check out
        </Button>
      )}
      {v.checkedOutAt && (
        <Badge variant="secondary">Done</Badge>
      )}
    </td>
  </tr>
))}
```

Three states, determined by timestamps:
- No `checkedInAt` → Show "Check in" button
- Has `checkedInAt`, no `checkedOutAt` → Show "Check out" button
- Has both → Show "Done" badge

No state machine. No status field. Just conditional rendering based on which timestamps exist.

## The API Endpoints

Four endpoints handle the entire visitor lifecycle:

```
POST   /api/dashboard/visitors           — Create a visitor
PATCH  /api/dashboard/visitors/:id/checkin  — Record check-in time
PATCH  /api/dashboard/visitors/:id/checkout — Record check-out time
GET    /api/dashboard/visitors           — List all visitors
```

The check-in endpoint is beautifully simple:

```typescript
router.patch("/visitors/:id/checkin", (req, res) => {
  const visitor = db.visitors.update(req.params.id, {
    checkedInAt: new Date().toISOString()
  });
  if (!visitor) return res.status(404).json({ error: "Visitor not found" });
  res.json(visitor);
});
```

One field update. One timestamp. The visitor's state transitions from "expected" to "checked in." That's the entire check-in operation.

## What This Replaces

The paper logbook had these problems:

1. **Illegible handwriting** — Try reading "Ravi Chandran" written in hurried cursive
2. **Missing data** — Half the entries had no phone number
3. **No host association** — No way to know which member the visitor was meeting
4. **No timestamps** — The logbook said "10am" but the visitor arrived at 10:47
5. **No history** — After the page fills up, the old visitors are... in a drawer somewhere
6. **No analytics** — How many visitors per branch per month? Nobody knows

The digital system solves all six. Every field is required (Zod validation). Every timestamp is exact. Every visitor is linked to a host member. Every visit is queryable forever.

## The Security Angle

Visitor management isn't just convenience. It's compliance.

India's fire safety regulations require workspaces to know who is in the building at any time. During an emergency evacuation, the reception desk can pull up the list of currently checked-in visitors and verify everyone is accounted for.

```
Currently in building: visitors.filter(v => v.checkedInAt && !v.checkedOutAt)
```

One query. The paper logbook can't do that.

---

**Tomorrow:** Day 18 — The Sales Pipeline: Building a CRM Inside a Coworking Platform

**Image suggestions:**
- SCREENSHOT: The visitor pre-registration form
- SCREENSHOT: The reception desk showing visitors with Check in / Check out buttons
- SCREENSHOT: A visitor entry showing the QR token
- DIAGRAM: Visitor lifecycle: Pre-register → QR Token → Check in → Check out

**LinkedIn post:**

> We replaced the visitor logbook at 6 coworking branches.
>
> Before: Paper notebook. Illegible handwriting. Missing phone numbers. No timestamps.
>
> After: 4 API endpoints and a form.
>
> Member pre-registers visitor → QR token generated → Visitor arrives → Receptionist taps "Check in" → Timestamp recorded → Taps "Check out" → Done.
>
> The data model uses optional timestamps instead of a status enum:
>
> checkedInAt?: string   // undefined = expected
> checkedOutAt?: string  // undefined = still here
>
> No state machine. No transitions. Just: does the timestamp exist?
>
> Bonus: "Who's in the building right now?" is one filter:
> visitors.filter(v => v.checkedInAt && !v.checkedOutAt)
>
> Paper can't do that.
>
> Day 17 of 45: [link]

**X post:**

> Replaced paper visitor logbooks at 6 branches with 4 API endpoints:
>
> POST /visitors — pre-register
> PATCH /visitors/:id/checkin — tap "check in"
> PATCH /visitors/:id/checkout — tap "check out"
> GET /visitors — list all
>
> State = timestamps. No enum. checkedInAt exists? They're here.
>
> Day 17/45
