import type { RequestHandler } from "express";

// Extend express-session to hold our user ID
declare module "express-session" {
  interface SessionData {
    userId?: string;
  }
}

/** Require an authenticated session. Returns 401 if not logged in. */
export const requireAuth: RequestHandler = (req, res, next) => {
  if (!req.session.userId) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }
  next();
};

/** Require one of the given roles. Must be used after requireAuth. */
export function requireRole(...roles: string[]): RequestHandler {
  return (req, res, next) => {
    const user = (req as any)._user;
    if (!user || !roles.includes(user.role)) {
      res.status(403).json({ error: "Forbidden" });
      return;
    }
    next();
  };
}
