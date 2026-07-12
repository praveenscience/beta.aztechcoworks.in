import { Router } from "express";
import { requireAuth, requireRole } from "../auth.js";
import { db, hashPassword } from "../store.js";

const router = Router();
router.use(requireAuth);
router.use((req, _res, next) => {
  (req as any)._user = db.users.find(req.session.userId!);
  next();
});

const EXPORTABLE_TABLES = [
  "users", "branches", "plans", "leads", "memberships", "bookings",
  "invoices", "visitors", "coupons", "coupon_usages", "user_deals",
  "payments", "testimonials", "blog", "audit_logs",
];

// ─── GET /api/dashboard/export/:table.csv ───────

router.get("/export/:table", requireRole("super_admin"), (req, res) => {
  let table = req.params.table.replace(/\.csv$/, "");

  if (!EXPORTABLE_TABLES.includes(table)) {
    res.status(400).json({ error: `Table '${table}' is not exportable` });
    return;
  }

  let rows: Record<string, any>[];
  if (table === "audit_logs") {
    rows = db.raw.query("SELECT * FROM audit_logs ORDER BY id DESC LIMIT 5000") as any[];
  } else {
    rows = db.raw.query(`SELECT * FROM ${table}`) as any[];
  }

  if (rows.length === 0) {
    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader("Content-Disposition", `attachment; filename="${table}.csv"`);
    res.send("No data\n");
    return;
  }

  // Strip passwordHash from users
  if (table === "users") {
    rows = rows.map((r) => {
      const { passwordHash, ...rest } = r;
      return rest;
    });
  }

  const headers = Object.keys(rows[0]);
  const csvLines: string[] = [headers.map(escapeCsv).join(",")];
  for (const row of rows) {
    csvLines.push(headers.map((h) => {
      const v = row[h];
      return escapeCsv(v == null ? "" : typeof v === "object" ? JSON.stringify(v) : String(v));
    }).join(","));
  }

  res.setHeader("Content-Type", "text/csv; charset=utf-8");
  res.setHeader("Content-Disposition", `attachment; filename="${table}.csv"`);
  res.send(csvLines.join("\n") + "\n");
});

// ─── GET /api/dashboard/export-all ──────────────

router.get("/export-all", requireRole("super_admin"), (req, res) => {
  const user = (req as any)._user;
  const backup: Record<string, any> = {
    exportedAt: new Date().toISOString(),
    exportedBy: user.name,
    tables: {} as Record<string, any[]>,
  };

  for (const table of EXPORTABLE_TABLES) {
    let rows: any[];
    if (table === "audit_logs") {
      rows = db.raw.query("SELECT * FROM audit_logs ORDER BY id DESC LIMIT 5000") as any[];
    } else {
      rows = db.raw.query(`SELECT * FROM ${table}`) as any[];
    }
    if (table === "users") {
      rows = rows.map((r) => {
        const { passwordHash, ...rest } = r;
        return rest;
      });
    }
    backup.tables[table] = rows;
  }

  // Include site_settings
  backup.tables.site_settings = db.siteSettings.all();

  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Content-Disposition", `attachment; filename="aztech-backup-${new Date().toISOString().slice(0, 10)}.json"`);
  res.json(backup);
});

// ─── POST /api/dashboard/import ─────────────────

router.post("/import", requireRole("super_admin"), (req, res) => {
  const user = (req as any)._user;
  const data = req.body;

  if (!data?.tables) {
    res.status(400).json({ error: 'Invalid backup format. Expected JSON with "tables" key.' });
    return;
  }

  const imported: Record<string, number> = {};
  const allowedTables = [...EXPORTABLE_TABLES, "site_settings"];

  try {
    db.raw.transaction(() => {
      for (const [table, rows] of Object.entries(data.tables)) {
        if (!allowedTables.includes(table)) continue;
        if (!Array.isArray(rows) || rows.length === 0) continue;
        if (["audit_logs", "password_reset_tokens"].includes(table)) continue;

        let count = 0;
        for (const row of rows) {
          if (typeof row !== "object" || !row) continue;

          if (table === "site_settings") {
            if (row.key && row.value != null) {
              const val = typeof row.value === "string" ? row.value : JSON.stringify(row.value);
              db.raw.run(
                "INSERT INTO site_settings (key, value, updatedAt) VALUES (?, ?, ?) ON CONFLICT(key) DO UPDATE SET value=excluded.value, updatedAt=excluded.updatedAt",
                row.key, val, new Date().toISOString()
              );
              count++;
            }
            continue;
          }

          if (!row.id) continue;

          // For users, set default password if missing
          if (table === "users" && !row.passwordHash) {
            row.passwordHash = hashPassword("changeme123");
          }

          db.raw.insertOrReplace(table, row);
          count++;
        }
        imported[table] = count;
      }
    });

    db.auditLogs.insert({ userId: user.id, action: "import", entityType: "database", detail: `Imported data: ${JSON.stringify(imported)}` });
    res.json({ ok: true, imported });
  } catch (err: any) {
    res.status(500).json({ error: `Import failed: ${err.message}` });
  }
});

// ─── GET /api/dashboard/analytics/user-activity ──

router.get("/analytics/user-activity", requireRole("super_admin", "branch_manager"), (_req, res) => {
  const since = new Date(Date.now() - 30 * 86400000).toISOString();
  const logs = db.raw.query("SELECT * FROM audit_logs WHERE createdAt >= ? ORDER BY id DESC", since) as any[];

  // Build user map
  const users = db.users.all();
  const userMap = new Map(users.map((u) => [u.id, { name: u.name, role: u.role, email: u.email }]));

  // Per-user activity summary
  const userActivityMap = new Map<string, {
    userId: string; name: string; role: string; email: string;
    totalActions: number; lastActive: string; actions: Record<string, number>;
  }>();

  for (const log of logs) {
    const uid = log.userId;
    if (!userActivityMap.has(uid)) {
      const info = userMap.get(uid) ?? { name: uid, role: "unknown", email: "" };
      userActivityMap.set(uid, {
        userId: uid, name: info.name, role: info.role, email: info.email,
        totalActions: 0, lastActive: log.createdAt, actions: {},
      });
    }
    const ua = userActivityMap.get(uid)!;
    ua.totalActions++;
    ua.actions[log.action] = (ua.actions[log.action] ?? 0) + 1;
  }

  const userActivity = [...userActivityMap.values()].sort((a, b) => b.totalActions - a.totalActions);

  // Daily activity
  const dailyMap = new Map<string, number>();
  for (const log of logs) {
    const day = log.createdAt.slice(0, 10);
    dailyMap.set(day, (dailyMap.get(day) ?? 0) + 1);
  }
  const dailyChart = [...dailyMap.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, actions]) => ({ date, actions }));

  // Hourly pattern
  const hourly = new Array(24).fill(0);
  for (const log of logs) {
    const h = parseInt(log.createdAt.slice(11, 13), 10);
    if (!isNaN(h)) hourly[h]++;
  }
  const hourlyChart = hourly.map((actions, h) => ({
    hour: `${String(h).padStart(2, "0")}:00`,
    actions,
  }));

  // Action breakdown
  const actionBreakdown: Record<string, number> = {};
  for (const log of logs) {
    actionBreakdown[log.action] = (actionBreakdown[log.action] ?? 0) + 1;
  }
  // Sort descending
  const sortedBreakdown = Object.fromEntries(
    Object.entries(actionBreakdown).sort(([, a], [, b]) => b - a)
  );

  // Recent activity (last 50)
  const recentActivity = logs.slice(0, 50).map((log: any) => ({
    ...log,
    userName: userMap.get(log.userId)?.name ?? log.userId,
  }));

  res.json({
    period: "30d",
    totalActions: logs.length,
    activeUsers: userActivity.length,
    userActivity,
    dailyChart,
    hourlyChart,
    actionBreakdown: sortedBreakdown,
    recentActivity,
  });
});

function escapeCsv(val: string): string {
  if (val.includes(",") || val.includes('"') || val.includes("\n")) {
    return `"${val.replace(/"/g, '""')}"`;
  }
  return val;
}

export default router;
