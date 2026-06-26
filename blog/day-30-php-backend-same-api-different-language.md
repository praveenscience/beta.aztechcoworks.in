# Day 30: The PHP Backend — Building the Same API in a Different Language

**Series:** Building a Production SaaS in Public — 45 Days, 45 Posts
**Tags:** #buildinpublic #php #backend #cpanel #api

---

I built the same backend twice. In two languages. And I'd do it again.

## The Why

The coworking business has cPanel shared hosting. cPanel runs PHP. It doesn't run Node.js.

I could have:
1. Migrated to a VPS that supports Node.js ($5-20/month)
2. Used a Node.js hosting platform (Render, Railway, etc.)
3. Built the backend in PHP

I chose option 3. Here's the logic:

The business already pays for hosting. The hosting runs PHP. Adding another server adds another cost, another point of failure, and another thing to monitor. Using the existing hosting is simpler, cheaper, and the business team can manage it through the cPanel dashboard they already know.

## The API Contract

The Node.js backend defined the API contract:

```
POST /api/auth/login       → { email, password } → User
POST /api/auth/register    → { name, email, password } → User
GET  /api/auth/me          → User | 401
POST /api/auth/logout      → {}
GET  /api/branches         → Branch[]
GET  /api/branches/:slug   → Branch & { seatInventory, meetingRooms }
GET  /api/plans            → Plan[]
POST /api/leads            → Lead
POST /api/site-visits      → { lead, visit }
GET  /api/dashboard/leads  → Lead[]
// ... 20 more endpoints
```

The PHP backend implements the exact same contract. Same URLs. Same request bodies. Same response shapes. The frontend doesn't know (or care) which backend it's talking to.

## PHP + PDO SQLite

```php
class Db {
    private PDO $pdo;

    public function __construct(string $path = __DIR__ . '/../../data/aztech.db') {
        $this->pdo = new PDO("sqlite:$path");
        $this->pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
        $this->pdo->exec("PRAGMA journal_mode = WAL");
        $this->pdo->exec("PRAGMA foreign_keys = ON");
        $this->createTables();
        $this->seedIfEmpty();
    }

    public function findUserByEmail(string $email): ?array {
        $stmt = $this->pdo->prepare("SELECT * FROM users WHERE email = ?");
        $stmt->execute([$email]);
        return $stmt->fetch(PDO::FETCH_ASSOC) ?: null;
    }
    // ... more methods
}
```

Same SQLite database format. Same WAL mode. Same prepared statements. Same seed data. Different language.

## The .htaccess Router

cPanel uses Apache. PHP routing needs `.htaccess`:

```apache
RewriteEngine On
RewriteCond %{REQUEST_FILENAME} !-f
RewriteRule ^(.*)$ index.php [QSA,L]
```

All requests route to `index.php`, which parses the URL and dispatches to the right handler. It's a miniature router — the PHP equivalent of Express routing.

## Session Handling

PHP has built-in session management:

```php
session_start();

// Login
$_SESSION['userId'] = $user['id'];

// Check auth
if (!isset($_SESSION['userId'])) {
    http_response_code(401);
    echo json_encode(['error' => 'Unauthorized']);
    exit;
}

// Logout
session_destroy();
```

No external packages. No configuration. PHP sessions use server-side file storage by default, with a session cookie sent to the browser.

## Password Hashing in PHP

PHP has bcrypt built in:

```php
// Hash
$hash = password_hash($password, PASSWORD_BCRYPT, ['cost' => 12]);

// Verify
if (!password_verify($password, $hash)) {
    http_response_code(401);
    echo json_encode(['error' => 'Invalid credentials']);
    exit;
}
```

`password_hash` and `password_verify` are PHP standard library functions. No composer packages needed. Same bcrypt algorithm, same cost factor, compatible hashes.

## The One-Day Build

Building the PHP backend took one day because:

1. **The API contract was defined.** Every endpoint, every request shape, every response shape was documented by the existing Node.js backend.

2. **The database schema was defined.** Same SQLite tables. Same column names. Same indexes.

3. **The seed data was defined.** Same branches, users, plans, leads. Just translated from TypeScript objects to PHP arrays.

4. **The business logic was simple.** Most endpoints are CRUD operations. Find a record, return it. Create a record, return it. Update a record, return it.

The PHP version has fewer features (no helmet equivalent, simpler rate limiting) but covers the core API contract completely.

## Which Backend Runs in Production?

The answer depends on the hosting:

- **cPanel shared hosting** → PHP backend
- **VPS or cloud** → Node.js backend
- **No backend at all** → Mock mode (frontend works standalone)

The frontend API layer hits the same URLs regardless. `GET /api/branches` returns the same data from Node.js, PHP, or the in-browser mock router.

## The Lesson

Having a clear API contract makes multi-language backends trivial. The hard part isn't writing PHP or Node.js. The hard part is deciding what the API should do, what it should accept, and what it should return.

Once that's decided, implementing it in any language is a matter of:
1. Parse the request
2. Validate the input
3. Query the database
4. Return the response

The language is a detail. The contract is the architecture.

---

**Tomorrow:** Day 31 — The Mock Mode: A Frontend That Works Without a Backend

**Image suggestions:**
- DIAGRAM: Frontend → API contract → Node.js backend OR PHP backend OR Mock mode
- CODE SCREENSHOT: PHP PDO SQLite query vs Node.js better-sqlite3 query (side by side)
- CODE SCREENSHOT: PHP password_hash and password_verify
- SCREENSHOT: cPanel file manager showing the PHP backend files

**LinkedIn post:**

> I built the same backend twice. In two languages.
>
> Node.js version: Express + better-sqlite3 (for modern hosting)
> PHP version: PDO SQLite + .htaccess routing (for cPanel hosting)
>
> Same API contract. Same database schema. Same seed data.
>
> The PHP version took 1 day because:
> 1. API contract was already defined
> 2. Database schema was already defined
> 3. Business logic is CRUD
>
> The frontend doesn't know which backend it's talking to. Same URLs. Same responses.
>
> The lesson: The hard part isn't the language. It's the API contract. Once that's decided, implementing it in any language is mechanical.
>
> Day 30 of 45: [link]

**X post:**

> Built the same backend in Node.js AND PHP.
>
> Same API contract. Same database. Same seed data. One day for the second implementation.
>
> The frontend doesn't know which backend it's talking to. That's the point.
>
> The language is a detail. The contract is the architecture.
>
> Day 30/45
