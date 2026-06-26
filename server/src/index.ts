import express from "express";
import cors from "cors";
import session from "express-session";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import authRoutes from "./routes/auth.routes.js";
import publicRoutes from "./routes/public.routes.js";
import dashboardRoutes from "./routes/dashboard.routes.js";
import paymentRoutes from "./routes/payment.routes.js";

const app = express();
const PORT = Number(process.env.PORT) || 3001;
const isProd = process.env.NODE_ENV === "production";

// ─── Security headers ──────────────────────────
app.use(helmet());

// ─── CORS ───────────────────────────────────────
app.use(cors({
  origin: process.env.CORS_ORIGIN || "http://localhost:5173",
  credentials: true,
}));

// ─── Body parsing ───────────────────────────────
app.use(express.json({ limit: "100kb" }));

// ─── Session ────────────────────────────────────
const sessionSecret = process.env.SESSION_SECRET;
if (isProd && !sessionSecret) {
  console.error("FATAL: SESSION_SECRET environment variable is required in production.");
  process.exit(1);
}

app.use(session({
  secret: sessionSecret || "aztech-dev-secret-DO-NOT-USE-IN-PROD",
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    secure: isProd,
    sameSite: "lax",
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  },
}));

// ─── Rate limiting ──────────────────────────────
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20,                   // 20 requests per window
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many requests, please try again later." },
});

const publicFormLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many submissions, please try again later." },
});

// ─── Routes ─────────────────────────────────────

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", time: new Date().toISOString() });
});

app.use("/api/auth", authLimiter, authRoutes);
app.use("/api", publicRoutes(publicFormLimiter));
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/payments", paymentRoutes);

// ─── Start ──────────────────────────────────────

app.listen(PORT, () => {
  console.log(`Aztech API running on http://localhost:${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/api/health`);
  if (!isProd) {
    console.log(`Demo login:   POST http://localhost:${PORT}/api/auth/demo/u_super`);
  }
});
