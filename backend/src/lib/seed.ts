import bcrypt from "bcrypt";
import { db } from "./database.js";
import { runMigrations } from "./migrate.js";

async function seed() {
  console.log("🌱 Seeding database...");

  try {
    // Run migrations first
    await runMigrations();

    // Create default admin user
    const hashedPassword = await bcrypt.hash("admin123", 10);

    await db.run(
      `INSERT OR IGNORE INTO users (email, password, firstName, lastName, isAdmin)
       VALUES (?, ?, ?, ?, ?)`,
      ["admin@example.com", hashedPassword, "Admin", "User", 1]
    );

    console.log("✅ Created admin user: admin@example.com");

    // Initialize system setup
    await db.run(
      `INSERT OR IGNORE INTO system_setup (id, isCompleted) VALUES (1, 0)`
    );

    console.log("✅ System setup initialized");
    console.log("\n📧 Default admin credentials:");
    console.log("   Email: admin@example.com");
    console.log("   Password: admin123");
    console.log("\n⚠️  Please change these credentials after first login!\n");

    await db.close();
  } catch (error) {
    console.error("❌ Seed failed:", error);
    process.exit(1);
  }
}

seed();
