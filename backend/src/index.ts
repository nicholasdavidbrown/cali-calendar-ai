import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { db } from "./lib/database.js";
import { runMigrations } from "./lib/migrate.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 8080;

// Middleware
app.use(express.json());

// Initialize database
async function initDatabase() {
  await db.connect();
  await runMigrations();
}

// Health check
app.get("/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

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
      console.log(`🚀 Server running on http://localhost:${PORT}`);
      console.log(`📱 Health check: http://localhost:${PORT}/health`);
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
}

start();

export default app;
