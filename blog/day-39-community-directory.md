# Day 39: The Community Directory — Social Features for Coworking Members

**Series:** Building a Production SaaS in Public — 45 Days, 45 Posts
**Tags:** #buildinpublic #community #react #coworking #networking

---

Coworking isn't just about desks. It's about the people sitting at them. The community directory helps members discover who else works in the space.

## The Page

`/dashboard/community` — a searchable grid of member profiles:

```tsx
function CommunityPage() {
  const { data: allUsers = [] } = useUsers();
  const { data: branches = [] } = useBranches();
  const users = allUsers.filter((u) => u.role === "member");
  const [q, setQ] = useState("");

  const filtered = users.filter((u) =>
    `${u.name} ${u.company ?? ""}`.toLowerCase().includes(q.toLowerCase()),
  );

  return (
    <>
      <PageHeader title="Community" description="Network with founders, freelancers, and teams across Aztech." />
      <Input placeholder="Search by name or company" value={q} onChange={(e) => setQ(e.target.value)} />
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filtered.map((u) => (
          <Card key={u.id}>
            <div className="flex items-center gap-3">
              <div className="grid h-12 w-12 place-items-center rounded-full bg-accent text-accent-foreground font-semibold">
                {u.name.split(" ").map((p) => p[0]).slice(0, 2).join("")}
              </div>
              <div>
                <div className="text-sm font-semibold">{u.name}</div>
                <div className="text-xs text-muted-foreground">{u.company ?? "Member"}</div>
              </div>
            </div>
            {branch && <Badge variant="secondary">{branch.name}</Badge>}
          </Card>
        ))}
      </div>
    </>
  );
}
```

## The Avatar Pattern

No profile photos yet. Instead, initials in a colored circle:

```tsx
{u.name.split(" ").map((p) => p[0]).slice(0, 2).join("")}
```

"Praveen Kumar" → "PK". "Ravi" → "R". First two initials. Displayed in a 48px circle with the accent color background.

This is a common pattern when you don't have user-uploaded photos. It's better than a generic avatar icon because it's personalized and scannable — you can find "PK" in a grid faster than you can find a generic silhouette.

## Search

Client-side search against name and company:

```tsx
const filtered = users.filter((u) =>
  `${u.name} ${u.company ?? ""}`.toLowerCase().includes(q.toLowerCase()),
);
```

Concatenate name and company, lowercase both, check for substring match. With dozens of members, this is instant. No debouncing needed. No server-side search. Just `.filter()`.

## Privacy Consideration

The community page only shows members. Not staff. Not admins. Not visitors.

```tsx
const users = allUsers.filter((u) => u.role === "member");
```

And it only shows public information: name, company, branch. No email. No phone number. No membership details. Members can discover each other without exposing private data.

The full user list (with email, role, referral code) is only available to `super_admin` and `branch_manager` roles through the admin API.

---

**Tomorrow:** Day 40 — The Referral Program: Word-of-Mouth as a Growth Engine

**LinkedIn post:**

> The community directory: searchable member profiles with initials avatars, company names, and branch badges. No profile photos needed.
>
> "PK" in a gold circle is more recognizable than a generic avatar icon. And client-side search with .filter() is instant for dozens of members.
>
> Privacy: only member role. Only name + company + branch. No email, phone, or billing data exposed.
>
> Day 39 of 45: [link]

**X post:**

> Community directory: name + company + branch. Initials avatar. Client-side search.
>
> Privacy: members only. No email. No phone. No billing data.
>
> Sometimes the feature is what you DON'T show.
>
> Day 39/45
