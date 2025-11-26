import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import cookieParser from "cookie-parser";
import cors from "cors";
import { db } from "./lib/database.js";
import { runMigrations } from "./lib/migrate.js";
import authRouter from "./routes/auth.js";
import calendarRouter from "./routes/calendar.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 8080;
const PUBLIC_PORT = process.env.PUBLIC_PORT || PORT; // External port for Docker port mapping

// Middleware
app.use(express.json());
app.use(cookieParser());
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps or curl)
      if (!origin) return callback(null, true);

      // In development, allow any localhost origin
      if (process.env.NODE_ENV !== 'production' && origin.startsWith('http://localhost:')) {
        return callback(null, true);
      }

      // In production, use specific allowed origins
      const allowedOrigins = process.env.CLIENT_URL ? [process.env.CLIENT_URL] : [];
      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
  })
);

// Initialize database
async function initDatabase() {
  await db.connect();
  await runMigrations();
}

// Health check
app.get("/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// API Routes
app.use("/api/auth", authRouter);
app.use("/api/calendar", calendarRouter);

// 404 handler for API routes
app.use("/api", (req, res) => {
  res.status(404).json({ error: "API endpoint not found" });
});

// Error handler
app.use(
  (err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error("Server error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
);

// Serve static files in production only
if (process.env.NODE_ENV === "production") {
  const staticPath = path.join(__dirname, "..", "..", "frontend_dist");
  app.use(express.static(staticPath));

  // Catch-all route for SPA - serves index.html for all non-API routes
  app.use((_req, res) => {
    res.sendFile(path.join(staticPath, "index.html"));
  });
}

// Start server
async function start() {
  try {
    await initDatabase();

    app.listen(PORT, () => {
      console.log(`🚀 Server running on http://localhost:${PUBLIC_PORT}`);
      console.log(`📱 Health check: http://localhost:${PUBLIC_PORT}/health`);
      console.log(`🔐 Auth endpoints: http://localhost:${PUBLIC_PORT}/api/auth/*`);
      console.log(`📅 Calendar endpoints: http://localhost:${PUBLIC_PORT}/api/calendar/*`);
      if (PUBLIC_PORT !== PORT) {
        console.log(`   (Container internal port: ${PORT})`);
      }
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
}

start();

export default app;
