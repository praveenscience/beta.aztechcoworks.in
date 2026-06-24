# Aztech Co-Works — PHP Backend

A complete PHP backend for Aztech Co-Works, using SQLite via PDO. Same endpoints and seed data as the Node.js server. Designed for cPanel deployment.

## Requirements

- PHP 8.1+ with PDO SQLite extension (standard on most hosts)
- Apache with mod_rewrite (for cPanel), or PHP built-in server for local dev

## Local Development

```bash
cd server-php
php -S 127.0.0.1:3001 router.php
```

Then set `VITE_API_URL=http://127.0.0.1:3001` in the frontend (or it defaults to `localhost:3001`).

## cPanel Deployment

1. Upload the `server-php/` folder contents to your subdomain root (e.g., `api.aztechcoworks.in/`)
2. Ensure `.htaccess` is present — it routes all requests through `index.php`
3. Make sure the `data/` directory is writable by the web server
4. The SQLite database auto-creates and seeds on first request

## Endpoints

All endpoints match the Node.js server exactly:

### Auth
| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/auth/login` | Email + password login |
| POST | `/api/auth/register` | Create account |
| GET | `/api/auth/me` | Current session user |
| POST | `/api/auth/logout` | Destroy session |
| POST | `/api/auth/demo/{userId}` | Quick demo login |

### Public
| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/health` | Health check |
| GET | `/api/branches` | All active branches |
| GET | `/api/branches/{id}` | Branch detail + seats + rooms |
| GET | `/api/plans` | Pricing plans |
| GET | `/api/blog` | Blog posts |
| GET | `/api/blog/{slug}` | Single blog post |
| GET | `/api/testimonials` | Testimonials |
| POST | `/api/leads` | Create a lead |
| POST | `/api/site-visits` | Book a site visit |

### Dashboard (auth required)
| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/dashboard/me/memberships` | My memberships |
| GET | `/api/dashboard/me/invoices` | My invoices |
| GET | `/api/dashboard/me/bookings` | My bookings |
| GET | `/api/dashboard/leads` | Leads (role-filtered) |
| GET | `/api/dashboard/leads/{id}` | Lead detail + activities |
| PATCH | `/api/dashboard/leads/{id}` | Update lead |
| GET | `/api/dashboard/tasks` | Tasks (role-filtered) |
| PATCH | `/api/dashboard/tasks/{id}` | Update task |
| GET | `/api/dashboard/site-visits` | All site visits |
| GET | `/api/dashboard/users` | All users (admin) |
| GET | `/api/dashboard/all-branches` | All branches (admin) |
| GET | `/api/dashboard/invoices` | All invoices (finance) |
| GET | `/api/dashboard/visitors` | All visitors |

## Data

- SQLite database stored at `data/aztech.db`
- Auto-seeded with demo data on first run
- 8 demo users (password: `demo1234`)
- Same data as the Node.js backend
