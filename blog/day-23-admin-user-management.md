# Day 23: Admin User Management — Inline Role Editing and Adding Team Members

**Series:** Building a Production SaaS in Public — 45 Days, 45 Posts
**Tags:** #buildinpublic #admin #rbac #react #usermanagement

---

Adding a team member should take 10 seconds. Changing someone's role should take 2. The admin user management page makes both trivial.

## The Add User Form

At the top of `/admin/users`, a single-row form:

```tsx
<form className="grid gap-3 sm:grid-cols-[1.5fr_1.5fr_1fr_1fr_auto]">
  <Input required placeholder="Full name" />
  <Input required type="email" placeholder="Email" />
  <Select value={form.role}>
    {ALL_ROLES.map((r) => <SelectItem key={r} value={r}>{roleLabels[r]}</SelectItem>)}
  </Select>
  <Select value={form.branchId}>
    {branches.map((b) => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}
  </Select>
  <Button type="submit"><Plus /> Add</Button>
</form>
```

Five columns on desktop: Name, Email, Role, Branch, Add button. All inline. No modal. No multi-step wizard. Fill in the row, click Add.

The mutation:

```tsx
createUserMutation.mutate({
  name: form.name,
  email: form.email,
  role: form.role,
  branchId: form.branchId || undefined,
});
```

The backend creates the user with a generated password (`changeme123` — they'll reset on first login), a referral code, and the assigned role. The response excludes `passwordHash`.

## The User Table

Below the form, a table of all users:

```tsx
<table className="w-full text-sm">
  <thead>
    <tr><th>Name</th><th>Email</th><th>Role</th><th>Branch</th><th>Code</th></tr>
  </thead>
  <tbody>
    {users.map((u) => (
      <tr key={u.id} className="border-t">
        <td className="font-medium">{u.name}</td>
        <td className="text-muted-foreground">{u.email}</td>
        <td>
          <Select value={u.role} onValueChange={(v) =>
            updateUserMutation.mutate({ id: u.id, role: v })
          }>
            <SelectTrigger className="h-8 w-[160px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {ALL_ROLES.map((r) => (
                <SelectItem key={r} value={r}>{roleLabels[r]}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </td>
        <td>{branches.find((b) => b.id === u.branchId)?.name ?? "—"}</td>
        <td>
          <Badge variant="secondary" className="font-mono text-xs">
            {u.referralCode}
          </Badge>
        </td>
      </tr>
    ))}
  </tbody>
</table>
```

The role column is an inline Select dropdown. Click it, pick a new role, and the mutation fires immediately:

```tsx
onValueChange={(v) => updateUserMutation.mutate({ id: u.id, role: v as Role })}
```

No "Edit" button. No modal. No "Save" button. Just change the dropdown and it's done. TanStack Query invalidates the user list and refetches.

Promoting a receptionist to branch manager: one dropdown change. Onboarding a new sales exec: one form submission. Done.

## Role Labels

The 9 roles use human-readable labels instead of raw enum values:

```typescript
export const roleLabels: Record<Role, string> = {
  visitor: "Visitor",
  member: "Member",
  reception: "Reception",
  sales_exec: "Sales Executive",
  sales_manager: "Sales Manager",
  branch_manager: "Branch Manager",
  finance: "Finance",
  marketing: "Marketing",
  super_admin: "Super Admin",
};
```

The dropdown shows "Sales Executive" instead of "sales_exec". The database stores `sales_exec`. The label map translates between the two.

## Backend Authorization

Only `super_admin` can create or modify users:

```typescript
router.post("/users", requireRole("super_admin"), validate(userCreateSchema), handler);
router.patch("/users/:id", requireRole("super_admin"), validate(userPatchSchema), handler);
```

The `requireRole("super_admin")` middleware returns 403 for anyone else. Even if a branch manager somehow navigates to `/admin/users`, the API calls will fail.

The GET endpoint is slightly more permissive — branch managers can also see the user list (to look up member details):

```typescript
router.get("/users", (req, res) => {
  const user = req._user;
  if (!["super_admin", "branch_manager"].includes(user.role)) {
    return res.status(403).json({ error: "Forbidden" });
  }
  res.json(db.users.all().map(({ passwordHash, ...u }) => u));
});
```

Note the `passwordHash` is stripped from every response. The frontend type `SafeUser` reflects this:

```typescript
type SafeUser = Omit<User, "passwordHash"> & { passwordHash?: never };
```

The `passwordHash?: never` ensures TypeScript errors if any component tries to access it. The field literally cannot exist on the type.

## Referral Codes

Every user gets a referral code on creation:

```typescript
referralCode: `${name.split(" ")[0].toUpperCase().slice(0, 6)}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`
```

Example: "PRAVEE-X7K9". The member's first name (up to 6 chars) + a random suffix. Displayed as a monospace Badge in the user table.

Members share their referral code. When a new lead signs up using a code, the referrer gets credited. The code is visible on the member's dashboard and on the admin user table.

## Email Deduplication

The backend checks for duplicate emails:

```typescript
if (db.users.findByEmail(email)) {
  res.status(409).json({ error: "Email already registered" });
  return;
}
```

409 Conflict. Clear error. The admin knows the email is taken. No cryptic database error.

## The 100-Line Component

The entire admin users page is 107 lines. A form, a table, two mutations, and one query. No pagination (the user count is in the dozens, not thousands). No search (Cmd+F works fine). No sorting (not needed yet).

Simple because the scale doesn't demand complexity. When the user count reaches hundreds, I'll add search and pagination. Not before.

---

**Tomorrow:** Day 24 — Admin Branch & Plan CRUD: Editing Business Data Without Touching Code

**Image suggestions:**
- SCREENSHOT: The admin users page with the add form and user table
- SCREENSHOT: An inline role dropdown being changed
- SCREENSHOT: The referral code badge on a user row
- CODE SCREENSHOT: The SafeUser type with passwordHash?: never

**LinkedIn post:**

> Admin user management in 107 lines of code:
>
> Adding a team member: Fill 4 fields in a row (name, email, role, branch), click Add.
> Changing a role: Click the dropdown in the user's row. Done.
>
> No modal. No "Edit" button. No "Save" button. Inline editing with immediate API mutation.
>
> Security details that matter:
> - passwordHash stripped from every API response
> - SafeUser type: `{ passwordHash?: never }` — TypeScript errors if you try to access it
> - Only super_admin can create/modify users (403 for everyone else)
> - Email deduplication: 409 Conflict if email exists
>
> Simple UI. Strict backend. That's the pattern.
>
> Day 23 of 45: [link]

**X post:**

> User management: 107 lines.
>
> Add user: inline form, one row.
> Change role: click dropdown, done.
>
> passwordHash?: never — TypeScript won't let you touch it.
> requireRole("super_admin") — backend won't let you try.
>
> Simple UI. Strict backend.
>
> Day 23/45
