import bcrypt from "bcrypt";
import { db } from "./database.js";
import { runMigrations } from "./migrate.js";

async function seed() {
  console.log("🌱 Seeding database...");

  // Only run seed in development
  if (process.env.NODE_ENV !== "development") {
    console.log("⏭️  Skipping seed - not in development mode");
    console.log("   Use the admin setup wizard in production");
    return;
  }

  try {
    await runMigrations();

    // Check if admin already exists
    const existingAdmin = await db.get(
      "SELECT * FROM users WHERE email = ?",
      ["admin@example.com"]
    );

    if (existingAdmin) {
      console.log("ℹ️  Admin user already exists, skipping seed");
      await db.close();
      return;
    }

    // Create default admin
    const hashedPassword = await bcrypt.hash("admin123", 10);
    await db.run(
      `INSERT INTO users (email, password, firstName, lastName, isAdmin)
       VALUES (?, ?, ?, ?, ?)`,
      ["admin@example.com", hashedPassword, "Admin", "User", 1]
    );

    console.log("✅ Created admin user: admin@example.com");

    // Mark setup complete for dev
    await db.run(
      `INSERT OR IGNORE INTO system_setup (id, isCompleted, adminEmail, setupCompletedAt)
       VALUES (1, 1, 'admin@example.com', CURRENT_TIMESTAMP)`
    );

    console.log("✅ System setup initialized (dev mode - marked complete)");
    console.log("\n📧 Default admin credentials:");
    console.log("   Email: admin@example.com");
    console.log("   Password: admin123");
    console.log("\n⚠️  Change these credentials after first login!");
    console.log("💡 In production, use the setup wizard at /setup\n");

    await db.close();
  } catch (error) {
    console.error("❌ Seed failed:", error);
    process.exit(1);
  }
}

seed();
