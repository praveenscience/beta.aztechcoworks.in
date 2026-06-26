# Day 28: Password Hashing — From SHA256 to bcrypt and Why It Matters

**Series:** Building a Production SaaS in Public — 45 Days, 45 Posts
**Tags:** #buildinpublic #security #bcrypt #authentication #backend

---

The first version of the backend used SHA256 for password hashing. This is wrong. Here's why, and what I replaced it with.

## Why SHA256 Is Wrong for Passwords

SHA256 is a cryptographic hash function. It's designed to be fast. A modern GPU can compute billions of SHA256 hashes per second.

This is great for verifying file integrity. It's terrible for passwords.

If an attacker gets your database and passwords are SHA256-hashed, they can brute-force every 8-character password in hours. Not days. Not weeks. Hours.

## Why bcrypt Is Right

bcrypt is a password-hashing function designed to be slow. It has a "cost factor" that controls how many rounds of hashing to perform:

```typescript
import bcrypt from "bcrypt";

export function hashPassword(plain: string): string {
  return bcrypt.hashSync(plain, 12);
}

export async function verifyPassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}
```

Cost factor 12 means 2^12 = 4,096 iterations. Each password hash takes about 250ms on a modern server. That's imperceptible to a user logging in, but devastating to an attacker trying millions of passwords.

At cost 12:
- **Legitimate login:** 250ms (unnoticeable)
- **Brute-force attack:** 250ms × millions of attempts = years

## The Migration

Replacing SHA256 with bcrypt was a 3-file change:

**1. Hash function:**
```typescript
// Before
function hashPassword(plain: string): string {
  return crypto.createHash("sha256").update(plain).digest("hex");
}

// After
function hashPassword(plain: string): string {
  return bcrypt.hashSync(plain, 12);
}
```

**2. Verify function (new):**
```typescript
export async function verifyPassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}
```

**3. Login route:**
```typescript
// Before
if (user.passwordHash !== hashPassword(req.body.password)) {
  return res.status(401).json({ error: "Invalid credentials" });
}

// After
if (!await verifyPassword(req.body.password, user.passwordHash)) {
  return res.status(401).json({ error: "Invalid credentials" });
}
```

The bcrypt hash includes the salt and cost factor in the hash string itself (`$2b$12$...`), so there's no separate salt storage needed.

## Cost Factor: Why 12?

The cost factor is a trade-off between security and UX:

| Cost | Time per hash | Use case |
|------|--------------|----------|
| 10 | ~65ms | Minimum acceptable |
| 12 | ~250ms | Recommended default |
| 14 | ~1s | High-security applications |
| 16 | ~4s | Too slow for web apps |

12 is the sweet spot. Fast enough that login is instant. Slow enough that brute-force is infeasible. OWASP recommends a minimum of 10.

## Seed Data Update

All seed user passwords needed to be re-hashed with bcrypt:

```typescript
const seedUsers = [
  {
    id: "u_admin",
    name: "Praveen Kumar",
    email: "praveen@aztechcoworks.in",
    passwordHash: hashPassword("changeme123"),
    role: "super_admin",
    // ...
  },
  // ... other users
];
```

The `hashPassword()` function is called at seed time, so the database stores bcrypt hashes from the start.

## Other Authentication Security

While upgrading password hashing, I also hardened the session cookie:

```typescript
cookie: {
  secure: isProd,        // HTTPS only in production
  sameSite: "lax",       // Prevents CSRF
  httpOnly: true,        // JavaScript can't read the cookie
  maxAge: 7 * 24 * 3600 * 1000, // 7-day expiry
}
```

- **secure** — The cookie is only sent over HTTPS in production. In development (`localhost`), it works over HTTP.
- **sameSite: "lax"** — The cookie is sent on same-site requests and top-level navigations, but not on cross-site POST requests. This prevents the most common CSRF attacks.
- **httpOnly** — JavaScript can't access `document.cookie`. An XSS vulnerability can't steal the session cookie.

## The SESSION_SECRET

```typescript
const sessionSecret = process.env.SESSION_SECRET;
if (isProd && !sessionSecret) {
  console.error("FATAL: SESSION_SECRET environment variable is required in production.");
  process.exit(1);
}
```

The server refuses to start in production without a proper secret. No default. No fallback. The `"dev-only-secret"` fallback only works when `NODE_ENV !== "production"`.

This prevents the most common session security mistake: using a predictable session secret in production, which would allow attackers to forge session cookies.

## The Lesson

Security isn't a feature you add at the end. It's a set of decisions you make at every layer:

1. **Password hashing:** bcrypt with cost 12
2. **Session cookies:** secure, httpOnly, sameSite
3. **Session secret:** Required in production
4. **Password in responses:** Stripped from every API response
5. **Demo endpoint:** Disabled in production

None of these are complex. Each is a few lines of code. Together, they prevent the most common authentication attacks: brute force, credential stuffing, session hijacking, CSRF, and XSS-based cookie theft.

---

**Tomorrow:** Day 29 — Helmet, Rate Limiting, and the Security Middleware Stack

**Image suggestions:**
- DIAGRAM: SHA256 (billions/sec) vs bcrypt (4/sec) brute-force comparison
- CODE SCREENSHOT: The hashPassword and verifyPassword functions
- CODE SCREENSHOT: The session cookie configuration
- GENERIC: A padlock icon

**LinkedIn post:**

> SHA256 for password hashing is wrong. Here's why:
>
> SHA256: designed to be fast. A GPU computes billions per second.
> bcrypt: designed to be slow. Cost 12 = 250ms per hash.
>
> For login: 250ms is unnoticeable.
> For brute-force: 250ms × millions = years.
>
> The fix was a 3-file change:
> 1. hashPassword(): SHA256 → bcrypt.hashSync(plain, 12)
> 2. verifyPassword(): new function using bcrypt.compare()
> 3. Login route: === comparison → await verifyPassword()
>
> Also hardened:
> - Cookie: secure + httpOnly + sameSite
> - SESSION_SECRET: server won't start without it in prod
> - passwordHash: stripped from every API response
>
> Security isn't a feature. It's a set of decisions at every layer.
>
> Day 28 of 45: [link]

**X post:**

> SHA256: billions of hashes/sec on a GPU.
> bcrypt (cost 12): 4 hashes/sec.
>
> For login: both feel instant.
> For attackers: SHA256 = hours. bcrypt = centuries.
>
> 3-file change. The most important diff in the codebase.
>
> Day 28/45
