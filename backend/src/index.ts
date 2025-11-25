import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import sqlite3 from "sqlite3";
import { open, Database } from "sqlite";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 8080;
const DB_PATH = process.env.DB_PATH || path.join(__dirname, "..", "..", "data", "db.sqlite");

let db: Database<sqlite3.Database, sqlite3.Statement>;

async function initDb() {
  db = await open({
    filename: DB_PATH,
    driver: sqlite3.Database,
  });

  await db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL
    );
  `);
}

app.use(express.json());

app.get("/api/users", async (_req, res) => {
  const rows = await db.all("SELECT * FROM users");
  res.json(rows);
});

app.post("/api/users", async (req, res) => {
  const { name } = req.body;
  const result = await db.run("INSERT INTO users (name) VALUES (?)", name);
  res.json({ id: result.lastID, name });
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

initDb().then(() => {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
});
