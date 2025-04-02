import { migrate } from "drizzle-orm/node-postgres/migrator";
import { db } from "./db";
import { log } from "./vite";
import fs from "fs";
import path from "path";

// This function runs database migrations
export async function runMigrations() {
  try {
    log("Running database migrations...", "migrations");

    // Get the migration files from either migrations or drizzle directory
    // based on what drizzle.config.ts specifies
    let migrationsFolder = path.resolve(process.cwd(), "migrations");
    
    // If migrations directory doesn't exist, check for drizzle directory
    if (!fs.existsSync(migrationsFolder)) {
      const drizzleFolder = path.resolve(process.cwd(), "drizzle");
      
      // If drizzle exists, use that instead
      if (fs.existsSync(drizzleFolder)) {
        migrationsFolder = drizzleFolder;
        log("Using drizzle directory for migrations", "migrations");
      } else {
        // Create the migrations directory as fallback
        fs.mkdirSync(migrationsFolder, { recursive: true });
        log("Created migrations directory", "migrations");
      }
    }
    
    // Ensure meta directory and journal file exist
    const metaFolder = path.join(migrationsFolder, "meta");
    if (!fs.existsSync(metaFolder)) {
      fs.mkdirSync(metaFolder, { recursive: true });
      log("Created meta directory", "migrations");
    }
    
    const journalPath = path.join(metaFolder, "_journal.json");
    if (!fs.existsSync(journalPath)) {
      fs.writeFileSync(journalPath, JSON.stringify({ version: "5", dialect: "pg", entries: [] }));
      log("Created journal file", "migrations");
    }

    await migrate(db, { migrationsFolder });
    log("Database migrations completed successfully!", "migrations");
  } catch (error) {
    log(`Migration error: ${error}`, "migrations");
    throw error;
  }
}