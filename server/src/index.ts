import express from "express";
import cors from "cors";
import session from "express-session";
import authRoutes from "./routes/auth.routes.js";
import publicRoutes from "./routes/public.routes.js";
import dashboardRoutes from "./routes/dashboard.routes.js";

const app = express();
const PORT = Number(process.env.PORT) || 3001;

// ─── Middleware ─────────────────────────────────

app.use(cors({
  origin: process.env.CORS_ORIGIN || "http://localhost:5173",
  credentials: true,
}));

app.use(express.json());

app.use(session({
  secret: process.env.SESSION_SECRET || "aztech-dev-secret-change-in-prod",
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    secure: false, // set true behind HTTPS in production
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  },
}));

// ─── Routes ─────────────────────────────────────

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", time: new Date().toISOString() });
});

app.use("/api/auth", authRoutes);
app.use("/api", publicRoutes);
app.use("/api/dashboard", dashboardRoutes);

// ─── Start ──────────────────────────────────────

app.listen(PORT, () => {
  console.log(`Aztech API running on http://localhost:${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/api/health`);
  console.log(`Demo login:   POST http://localhost:${PORT}/api/auth/demo/u_super`);
});
