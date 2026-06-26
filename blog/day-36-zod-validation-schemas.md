# Day 36: Zod Validation Schemas — One Pattern for Every Endpoint

**Series:** Building a Production SaaS in Public — 45 Days, 45 Posts
**Tags:** #buildinpublic #zod #validation #typescript #backend

---

15 Zod schemas. One `validate()` middleware. Every POST and PATCH endpoint protected. Structured errors the frontend can display per-field.

## The Pattern

Every schema defines the exact shape of valid input:

```typescript
const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

const taskCreateSchema = z.object({
  leadId: z.string().optional(),
  assigneeId: z.string(),
  title: z.string().min(2),
  dueAt: z.string(),
  done: z.boolean().optional(),
});

const userCreateSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  role: z.enum(["member", "reception", "sales_exec", "sales_manager", "branch_manager", "finance", "marketing", "super_admin"]),
  branchId: z.string().optional(),
  phone: z.string().optional(),
});
```

Each schema uses Zod's fluent API: `z.string()` for strings, `.min(8)` for minimum length, `.email()` for email format, `.enum([...])` for allowed values, `.optional()` for nullable fields.

The `validate()` middleware applies any schema to any route:

```typescript
router.post("/tasks", validate(taskCreateSchema), handler);
router.post("/users", requireRole("super_admin"), validate(userCreateSchema), handler);
router.patch("/leads/:id", validate(leadPatchSchema), handler);
```

One function. Works with any schema. Positioned in the middleware chain after auth but before the handler.

## The Error Response

When validation fails, the response is structured for frontend consumption:

```json
{
  "error": "Validation failed",
  "fields": {
    "email": "Invalid email",
    "password": "String must contain at least 8 character(s)"
  }
}
```

The `fields` object maps field names to error messages. The frontend can display errors next to each input field instead of showing a generic "Something went wrong."

## Type Safety from Zod

After `req.body = result.data`, the body is typed and sanitized. Extra fields are stripped. Missing optional fields are set to `undefined`. The handler receives exactly what the schema defines — nothing more, nothing less.

This prevents:
- **Mass assignment:** Extra fields like `{ role: "super_admin" }` injected into a user update are stripped
- **Type coercion bugs:** A string `"123"` where a number is expected is caught
- **Missing required fields:** Caught before the handler runs

## The 15 Schemas

```
loginSchema           — email + password (min 8)
registerSchema        — name + email + password + optional phone
leadCaptureSchema     — name + email + phone + source
siteVisitSchema       — name + email + phone + branchId + date
leadPatchSchema       — partial lead fields (stage, score, owner)
taskCreateSchema      — assignee + title + due date
taskPatchSchema       — partial task fields (done, title)
leadActivitySchema    — type + description
visitorCreateSchema   — host + branch + name + phone + purpose + expected time
bookingCreateSchema   — user + branch + resource + start/end + amount
membershipCreateSchema — user + plan + branch + seats + start/end
branchUpsertSchema    — name + address + city + seats
planUpsertSchema      — name + seatType + price + GST + features
userCreateSchema      — name + email + role
userPatchSchema       — partial user fields (role, branch, name)
```

Each schema is 5-15 lines. The total validation code is about 120 lines. For 15 endpoints, that's 8 lines per endpoint on average.

---

**Tomorrow:** Day 37 — The Membership Lifecycle: Join, Pay, Cancel, Renew

**LinkedIn post:**

> 15 Zod schemas protect every mutation endpoint. One middleware applies them all:
>
> validate(schema) → safeParse → 400 with per-field errors or next()
>
> Error format the frontend can use:
> { "error": "Validation failed", "fields": { "email": "Invalid email" } }
>
> This prevents mass assignment, type coercion bugs, and missing required fields. 120 lines total. 8 lines per endpoint average.
>
> Day 36 of 45: [link]

**X post:**

> 15 Zod schemas. 1 validate() middleware. Every mutation protected.
>
> { "fields": { "email": "Invalid email" } } — per-field errors for the frontend.
>
> 120 lines total. The cheapest security investment in the codebase.
>
> Day 36/45
