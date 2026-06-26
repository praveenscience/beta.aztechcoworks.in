# Day 27: SQLite in Production — WAL Mode, Indexes, and Why You Don't Need Postgres

**Series:** Building a Production SaaS in Public — 45 Days, 45 Posts
**Tags:** #buildinpublic #sqlite #database #backend #performance

---

"You can't use SQLite in production."

Sure you can. Here's how, and here's why.

## The Scale Question

Let's do the math for this coworking platform:

- 6 branches, ~200 members each = ~1,200 users
- Maybe 50 concurrent users at peak (members checking dashboards)
- ~100 API requests per minute at peak
- ~50,000 rows across all tables combined

SQLite handles 100,000 requests per second on reads. Our peak is 100 per minute. We're using 0.001% of SQLite's capacity.

The question isn't "can SQLite handle this?" It's "at what scale would we outgrow SQLite?" The answer is: probably never. And if we do, migrating to Postgres is a well-documented path.

## better-sqlite3

I use `better-sqlite3` — a synchronous SQLite wrapper for Node.js. Synchronous means no callbacks, no promises, no `await` on database calls:

```typescript
const stmt = db.prepare("SELECT * FROM users WHERE email = ?");
const user = stmt.get(email);
```

One line. No `.then()`. No error callback. The query runs, the result returns. Done.

Why synchronous? Because SQLite queries against a local file complete in microseconds. The overhead of creating a Promise and scheduling microtasks is actually slower than the query itself. `better-sqlite3` is the fastest SQLite binding for Node.js precisely because it's synchronous.

## WAL Mode

The first thing I do after creating the database:

```typescript
db.pragma("journal_mode = WAL");
```

WAL (Write-Ahead Logging) enables concurrent reads while a write is happening. Without WAL, readers block writers and writers block readers. With WAL, the only blocking is writer-writer (and we have one server, so concurrent writes are rare).

For a web application where reads vastly outnumber writes, WAL mode is essential.

## The Data Store

```typescript
import Database from "better-sqlite3";

const sqlite = new Database("aztech.db");
sqlite.pragma("journal_mode = WAL");
sqlite.pragma("foreign_keys = ON");

// Create tables
sqlite.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    phone TEXT,
    role TEXT NOT NULL DEFAULT 'member',
    branchId TEXT,
    referralCode TEXT,
    passwordHash TEXT NOT NULL,
    createdAt TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS branches (
    id TEXT PRIMARY KEY,
    slug TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    address TEXT NOT NULL,
    city TEXT NOT NULL,
    phone TEXT,
    hours TEXT,
    amenities TEXT, -- JSON array
    totalSeats INTEGER NOT NULL,
    availableSeats INTEGER NOT NULL,
    isActive INTEGER NOT NULL DEFAULT 1,
    photo TEXT,
    description TEXT
  );

  -- ... 10 more tables
`);
```

## Indexes

12 indexes on frequently queried columns:

```sql
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_leads_stage ON leads(stage);
CREATE INDEX IF NOT EXISTS idx_leads_owner ON leads(ownerId);
CREATE INDEX IF NOT EXISTS idx_memberships_user ON memberships(userId);
CREATE INDEX IF NOT EXISTS idx_memberships_branch ON memberships(branchId);
CREATE INDEX IF NOT EXISTS idx_bookings_user ON bookings(userId);
CREATE INDEX IF NOT EXISTS idx_bookings_branch ON bookings(branchId);
CREATE INDEX IF NOT EXISTS idx_invoices_user ON invoices(userId);
CREATE INDEX IF NOT EXISTS idx_seat_inv_branch ON seatInventory(branchId);
CREATE INDEX IF NOT EXISTS idx_meeting_rooms_branch ON meetingRooms(branchId);
CREATE INDEX IF NOT EXISTS idx_visitors_branch ON visitors(branchId);
```

Every `WHERE` clause and every `JOIN` condition has an index. At 50,000 rows, indexes are optional. But they cost nothing to add and ensure consistent sub-millisecond queries regardless of data growth.

## The CRUD Pattern

Each table gets a set of functions:

```typescript
const db = {
  users: {
    all: () => sqlite.prepare("SELECT * FROM users").all(),
    find: (id: string) => sqlite.prepare("SELECT * FROM users WHERE id = ?").get(id),
    findByEmail: (email: string) => sqlite.prepare("SELECT * FROM users WHERE email = ?").get(email),
    insert: (user: User) => {
      sqlite.prepare(`INSERT INTO users (id, name, email, phone, role, branchId, referralCode, passwordHash, createdAt)
                       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`)
            .run(user.id, user.name, user.email, user.phone, user.role, user.branchId, user.referralCode, user.passwordHash, user.createdAt);
    },
    update: (id: string, patch: Partial<User>) => {
      const existing = db.users.find(id);
      if (!existing) return null;
      const updated = { ...existing, ...patch };
      sqlite.prepare(`UPDATE users SET name=?, email=?, phone=?, role=?, branchId=? WHERE id=?`)
            .run(updated.name, updated.email, updated.phone, updated.role, updated.branchId, id);
      return updated;
    },
  },
  // ... same pattern for leads, tasks, visitors, bookings, etc.
};
```

No ORM. No query builder. Just prepared statements. The SQL is readable, debuggable, and fast. I can copy any query into `sqlite3` CLI and run it manually for debugging.

## Seed Data

On first run, the database is empty. I seed it with realistic data:

```typescript
if (db.users.all().length === 0) {
  console.log("Seeding database...");
  seedUsers.forEach((u) => db.users.insert(u));
  seedBranches.forEach((b) => db.branches.insert(b));
  seedLeads.forEach((l) => db.leads.insert(l));
  seedPlans.forEach((p) => db.plans.insert(p));
  // ...
  console.log("Seed complete.");
}
```

The seed data matches the frontend mock data exactly. Same branch names, same user roles, same lead stages. The demo experience is consistent whether you're running against the real backend or the mock mode.

## Backups

SQLite backups are trivially simple:

```bash
cp aztech.db aztech-backup-$(date +%Y%m%d).db
```

Copy one file. The WAL mode ensures the copy is consistent even if the server is running. No `pg_dump`. No connection strings. No backup tools. Just `cp`.

For production, I'd add a cron job that copies the database file to cloud storage daily.

## Why Not Postgres?

Postgres gives you:
- Concurrent write connections (SQLite: single writer)
- Advanced queries (window functions, CTEs, full-text search)
- Replication and high availability
- Mature tooling (pgAdmin, pg_dump, pg_restore)

I don't need any of these. Yet.

SQLite gives me:
- Zero configuration (no server to install, no connection pool)
- Single file deployment (copy one file to deploy the database)
- Microsecond queries (no network round-trip to a database server)
- Built-in with Node.js via better-sqlite3

For a single-server deployment serving 1,200 members, SQLite is not a compromise. It's the right choice.

---

**Tomorrow:** Day 28 — Password Hashing: From SHA256 to bcrypt and Why It Matters

**Image suggestions:**
- SCREENSHOT: Terminal showing SQLite database file size (it's tiny)
- CODE SCREENSHOT: The WAL mode pragma and table creation
- CODE SCREENSHOT: The CRUD pattern for the users table
- DIAGRAM: SQLite vs Postgres feature comparison for this use case

**LinkedIn post:**

> "You can't use SQLite in production."
>
> My coworking platform:
> - 1,200 users, 50 concurrent at peak
> - 100 API requests/minute at peak
> - 50,000 rows across 12 tables
>
> SQLite handles 100,000 reads/second. We use 0.001% of its capacity.
>
> Setup:
> - WAL mode (concurrent reads during writes)
> - 12 indexes on query columns
> - better-sqlite3 (synchronous, fastest Node.js binding)
> - No ORM, just prepared statements
>
> Backups: cp aztech.db backup.db
> Deploy: copy one file
> Config: zero
>
> Postgres gives me things I don't need yet. SQLite gives me simplicity I need today.
>
> Day 27 of 45: [link]

**X post:**

> SQLite in production:
>
> WAL mode. 12 indexes. better-sqlite3. Prepared statements.
>
> Backup: cp file.db backup.db
> Deploy: copy one file
> Config: zero
> Capacity used: 0.001%
>
> You don't need Postgres until you need Postgres.
>
> Day 27/45
