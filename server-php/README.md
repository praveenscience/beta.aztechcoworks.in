# Aztech Co-Works — PHP Mock Server

A lightweight PHP mock API that mirrors the TanStack mock server in `src/server/`.
Useful for local integration testing from non-Node clients (Postman, mobile, etc.).

## Requirements
- PHP 8.1+ (no extensions beyond the standard library)

## Run

```bash
cd server-php
php -S 127.0.0.1:8787 router.php
```

Data is persisted to `server-php/data/db.json` (auto-seeded on first run).

## Endpoints

| Method | Path                  | Description              |
| ------ | --------------------- | ------------------------ |
| GET    | `/api/mock/health`    | Health check             |
| GET    | `/api/mock/branches`  | List branches            |
| GET    | `/api/mock/branches/{id}` | Get one branch       |
| GET    | `/api/mock/plans`     | List pricing plans       |
| GET    | `/api/mock/leads`     | List leads               |
| POST   | `/api/mock/leads`     | Create a lead            |

### POST /api/mock/leads body
```json
{
  "name": "Jane Doe",
  "email": "jane@example.com",
  "phone": "+91 90000 00000",
  "source": "website",
  "score": 42
}
```

All responses are JSON with permissive CORS so the Vite dev server (port 8080)
can call it directly during development.
