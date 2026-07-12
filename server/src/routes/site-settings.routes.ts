import { Router } from "express";
import { requireAuth, requireRole } from "../auth.js";
import { db } from "../store.js";
import { randomBytes } from "node:crypto";
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve, extname } from "node:path";
import { fileURLToPath } from "node:url";
import multer from "multer";

const __dirname = dirname(fileURLToPath(import.meta.url));
const PHOTOS_DIR = resolve(__dirname, "../../photos");

// Ensure photos directory exists
mkdirSync(PHOTOS_DIR, { recursive: true });

const upload = multer({
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (_req, file, cb) => {
    const allowed = [".jpg", ".jpeg", ".png", ".webp", ".avif", ".svg"];
    const ext = extname(file.originalname).toLowerCase();
    if (allowed.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error(`Invalid file type. Accepted: ${allowed.join(", ")}`));
    }
  },
  storage: multer.diskStorage({
    destination: PHOTOS_DIR,
    filename: (_req, file, cb) => {
      const type = (_req.body?.type) || "site";
      const ext = extname(file.originalname).toLowerCase();
      const name = `${type}_${randomBytes(4).toString("hex")}${ext}`;
      cb(null, name);
    },
  }),
});

const router = Router();

function attachUser(req: any, _res: any, next: any) {
  req._user = db.users.find(req.session.userId!);
  next();
}

// ─── GET /api/site-settings — public ────────────

router.get("/site-settings", (_req, res) => {
  res.json({
    heroImages: db.siteSettings.get("hero_images") ?? [],
    clientLogos: db.siteSettings.get("client_logos") ?? [],
  });
});

// ─── PATCH /api/dashboard/site-settings/hero-images ─

router.patch("/dashboard/site-settings/hero-images", requireAuth, attachUser, requireRole("super_admin"), (req, res) => {
  const user = (req as any)._user;
  const images = req.body.heroImages ?? [];
  db.siteSettings.set("hero_images", images);
  db.auditLogs.insert({ userId: user.id, action: "update", entityType: "site_setting", entityId: "hero_images", detail: "Updated hero images" });
  res.json({ heroImages: images });
});

// ─── PATCH /api/dashboard/site-settings/client-logos ─

router.patch("/dashboard/site-settings/client-logos", requireAuth, attachUser, requireRole("super_admin"), (req, res) => {
  const user = (req as any)._user;
  const logos = req.body.clientLogos ?? [];
  db.siteSettings.set("client_logos", logos);
  db.auditLogs.insert({ userId: user.id, action: "update", entityType: "site_setting", entityId: "client_logos", detail: "Updated client logos" });
  res.json({ clientLogos: logos });
});

// ─── POST /api/dashboard/site-settings/upload ───

router.post("/dashboard/site-settings/upload", requireAuth, attachUser, requireRole("super_admin"), upload.single("file"), (req, res) => {
  if (!req.file) {
    res.status(400).json({ error: "No file uploaded" });
    return;
  }
  res.json({ url: `/photos/${req.file.filename}` });
});

export default router;
