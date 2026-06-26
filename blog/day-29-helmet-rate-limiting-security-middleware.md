# Day 29: Helmet, Rate Limiting, and the Security Middleware Stack

**Series:** Building a Production SaaS in Public — 45 Days, 45 Posts
**Tags:** #buildinpublic #security #helmet #ratelimiting #express

---

Three npm packages. Five minutes to configure. They prevent the top 5 web application attacks. There's no excuse for skipping this.

## Helmet — Security Headers in One Line

```typescript
import helmet from "helmet";
app.use(helmet());
```

One line. Helmet sets 11 security headers:

- **Content-Security-Policy** — Prevents XSS by controlling which scripts can execute
- **Strict-Transport-Security** — Forces HTTPS for all future requests
- **X-Content-Type-Options: nosniff** — Prevents MIME-type sniffing attacks
- **X-Frame-Options: DENY** — Prevents clickjacking (your site can't be embedded in an iframe)
- **X-XSS-Protection** — Legacy XSS protection for older browsers
- **Referrer-Policy** — Controls how much referrer information is sent
- And 5 more

Without Helmet, your Express server sends none of these headers. Browsers have no guidance on how to protect users.

## Rate Limiting

Two rate limiters with different thresholds:

```typescript
import rateLimit from "express-rate-limit";

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20,                   // 20 requests per window
  message: { error: "Too many attempts. Try again in 15 minutes." },
});

const publicFormLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { error: "Too many submissions. Try again in 15 minutes." },
});

app.use("/api/auth", authLimiter, authRoutes);
```

**Auth limiter (20/15min):** Prevents credential stuffing — automated tools that try thousands of username/password combinations. 20 attempts is generous for a real user who mistyped their password. It's devastating for a bot that needs millions of attempts.

**Public form limiter (10/15min):** Prevents form spam — automated submissions of the lead capture and site visit forms. 10 submissions in 15 minutes is more than enough for any real user.

Dashboard endpoints have no rate limit because they're already behind session authentication. An attacker would need a valid session to hit them, at which point rate limiting is less important than authorization.

## Zod Validation

Every POST and PATCH endpoint validates input with Zod:

```typescript
import { z } from "zod";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

const registerSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(8),
  phone: z.string().optional(),
});

const leadPatchSchema = z.object({
  stage: z.enum(["new", "contacted", "qualified", "site_visit", "proposal", "negotiation", "won", "lost"]).optional(),
  score: z.number().min(0).max(100).optional(),
  ownerId: z.string().optional(),
  lostReason: z.string().optional(),
});
```

The `validate()` middleware:

```typescript
function validate(schema: z.ZodSchema) {
  return (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      const fields: Record<string, string> = {};
      result.error.issues.forEach((issue) => {
        const key = issue.path.join(".");
        fields[key] = issue.message;
      });
      res.status(400).json({ error: "Validation failed", fields });
      return;
    }
    req.body = result.data;
    next();
  };
}
```

The response format `{ error, fields }` is designed for the frontend. The `fields` object maps field names to error messages, so the UI can show per-field errors:

```json
{
  "error": "Validation failed",
  "fields": {
    "password": "String must contain at least 8 character(s)",
    "email": "Invalid email"
  }
}
```

## CORS

```typescript
app.use(cors({
  origin: process.env.CORS_ORIGIN || "http://localhost:5173",
  credentials: true,
}));
```

- **origin** — Only the frontend domain can make requests. Other domains get blocked by the browser.
- **credentials: true** — Allows the session cookie to be sent cross-origin.

In production, `CORS_ORIGIN` is set to the actual frontend domain. In development, it defaults to Vite's dev server.

## The Complete Middleware Stack

In order of execution:

```
Request →
  1. helmet()              — Set security headers
  2. cors()                — Check origin, allow credentials
  3. express.json()        — Parse JSON body
  4. express-session()     — Attach/create session
  5. rate limiter          — Check request count (auth/form routes only)
  6. requireAuth()         — Verify session exists (dashboard routes only)
  7. validate(schema)      — Zod validation (POST/PATCH routes only)
  8. requireRole(role)     — Check user role (admin routes only)
  9. Route handler         — Business logic
→ Response
```

Nine layers. Each does one thing. Each is a few lines of configuration. Together, they create a defense-in-depth stack that handles authentication, authorization, input validation, rate limiting, CORS, and security headers.

## What This Prevents

| Attack | Prevention |
|--------|-----------|
| XSS (Cross-Site Scripting) | Helmet CSP, httpOnly cookies |
| CSRF (Cross-Site Request Forgery) | sameSite cookies, CORS |
| Credential stuffing | Rate limiting (20/15min) |
| Form spam | Rate limiting (10/15min) |
| Clickjacking | X-Frame-Options: DENY |
| MIME sniffing | X-Content-Type-Options: nosniff |
| SQL injection | Prepared statements (better-sqlite3) |
| Invalid input | Zod validation |
| Privilege escalation | requireRole() middleware |

## The Afternoon Investment

Adding helmet, rate limiting, and Zod validation took an afternoon. The security posture went from "prototype" to "production-ready" in about 4 hours.

There is no version of "we'll add security later" that works. Security debt compounds. Every day without rate limiting is a day your login endpoint is vulnerable to brute force. Every day without helmet is a day your users are vulnerable to XSS.

An afternoon. That's all it costs.

---

**Tomorrow:** Day 30 — The PHP Backend: Building the Same API in a Different Language

**Image suggestions:**
- DIAGRAM: The middleware stack showing 9 layers in order
- CODE SCREENSHOT: The validate() middleware function
- CODE SCREENSHOT: The rate limiting configuration
- SCREENSHOT: Terminal showing a 429 Too Many Requests response

**LinkedIn post:**

> The security middleware stack for this SaaS backend:
>
> 1. helmet() — 11 security headers, one line
> 2. cors() — origin whitelist + credential support
> 3. express-session — secure, httpOnly, sameSite cookies
> 4. rate-limit — 20/15min auth, 10/15min forms
> 5. requireAuth() — session check on dashboard routes
> 6. validate(zod) — input validation on every mutation
> 7. requireRole() — RBAC on admin routes
>
> What this prevents:
> XSS, CSRF, credential stuffing, form spam, clickjacking, MIME sniffing, SQL injection, invalid input, privilege escalation.
>
> Time to implement: one afternoon.
>
> There is no version of "we'll add security later" that works.
>
> Day 29 of 45: [link]

**X post:**

> Security middleware stack:
>
> helmet() — 11 headers, 1 line
> rate-limit — 20/15min auth, 10/15min forms
> Zod — validate every mutation
> requireRole() — RBAC check
>
> Prevents: XSS, CSRF, brute force, injection, privilege escalation.
>
> Time: one afternoon. Excuse: none.
>
> Day 29/45
