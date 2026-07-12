import { Router } from "express";
import { randomBytes } from "node:crypto";
import { db, hashPassword, verifyPassword } from "../store.js";
import { uid } from "../uid.js";
import { validate, loginSchema, registerSchema, forgotPasswordSchema, resetPasswordSchema } from "../validation.js";
import { sendWelcomeEmail, sendPasswordResetEmail } from "../email.js";
import type { User } from "../types.js";

const router = Router();

// POST /api/auth/login  — email + password
router.post("/login", validate(loginSchema), (req, res) => {
  const { email, password } = req.body;

  const user = db.users.findByEmail(email);
  if (!user || !verifyPassword(password, user.passwordHash)) {
    res.status(401).json({ error: "Invalid credentials" });
    return;
  }

  req.session.userId = user.id;
  const { passwordHash, ...safe } = user;
  res.json(safe);
});

// POST /api/auth/register  — create a member account
router.post("/register", validate(registerSchema), (req, res) => {
  const { name, email, password, phone } = req.body;

  if (db.users.findByEmail(email)) {
    res.status(409).json({ error: "Email already registered" });
    return;
  }

  const user: User = {
    id: uid("u"),
    name,
    email,
    phone: phone || undefined,
    role: "member",
    referralCode: `${name.split(" ")[0].toUpperCase().slice(0, 6)}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`,
    passwordHash: hashPassword(password),
    createdAt: new Date().toISOString(),
  };

  db.users.insert(user);
  req.session.userId = user.id;
  const { passwordHash: _, ...safe } = user;
  sendWelcomeEmail(user.email, user.name).catch(() => {});
  res.status(201).json(safe);
});

// GET /api/auth/me  — current session user
router.get("/me", (req, res) => {
  if (!req.session.userId) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }
  const user = db.users.find(req.session.userId);
  if (!user) {
    res.status(401).json({ error: "User not found" });
    return;
  }
  const { passwordHash, ...safe } = user;
  res.json(safe);
});

// POST /api/auth/logout
router.post("/logout", (req, res) => {
  req.session.destroy(() => {
    res.json({ ok: true });
  });
});

// POST /api/auth/change-password — authenticated password change
router.post("/change-password", (req, res) => {
  if (!req.session.userId) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }

  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword) {
    res.status(400).json({ error: "Current and new password required" });
    return;
  }
  if (newPassword.length < 6) {
    res.status(400).json({ error: "New password must be at least 6 characters" });
    return;
  }

  const user = db.users.find(req.session.userId);
  if (!user) {
    res.status(401).json({ error: "User not found" });
    return;
  }

  if (!verifyPassword(currentPassword, user.passwordHash)) {
    res.status(403).json({ error: "Current password is incorrect" });
    return;
  }

  db.users.updatePassword(user.id, hashPassword(newPassword));
  res.json({ ok: true });
});

// POST /api/auth/forgot-password — send reset link
router.post("/forgot-password", validate(forgotPasswordSchema), (req, res) => {
  const { email } = req.body;
  const user = db.users.findByEmail(email);

  // Always return 200 to avoid email enumeration
  if (!user) {
    res.json({ ok: true });
    return;
  }

  // Clean up expired tokens
  db.passwordResetTokens.deleteExpired();

  // Generate secure token
  const token = randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString(); // 1 hour

  db.passwordResetTokens.insert(token, user.id, expiresAt);
  sendPasswordResetEmail(user.email, user.name, token).catch(() => {});

  res.json({ ok: true });
});

// POST /api/auth/reset-password — verify token and update password
router.post("/reset-password", validate(resetPasswordSchema), (req, res) => {
  const { token, password } = req.body;

  const record = db.passwordResetTokens.find(token);
  if (!record) {
    res.status(400).json({ error: "Invalid or expired reset token" });
    return;
  }

  if (new Date(record.expiresAt) < new Date()) {
    db.passwordResetTokens.delete(token);
    res.status(400).json({ error: "Reset token has expired" });
    return;
  }

  const user = db.users.find(record.userId);
  if (!user) {
    res.status(400).json({ error: "User not found" });
    return;
  }

  db.users.updatePassword(user.id, hashPassword(password));
  db.passwordResetTokens.delete(token);

  res.json({ ok: true });
});

// POST /api/auth/demo/:userId — quick demo sign-in (dev only, no password)
if (process.env.NODE_ENV !== "production") {
  router.post("/demo/:userId", (req, res) => {
    const user = db.users.find(req.params.userId);
    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }
    req.session.userId = user.id;
    const { passwordHash, ...safe } = user;
    res.json(safe);
  });
}

export default router;
