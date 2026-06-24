import { Router } from "express";
import { db, hashPassword, verifyPassword } from "../store.js";
import { uid } from "../uid.js";
import { validate, loginSchema, registerSchema } from "../validation.js";
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
