import { drizzle } from 'drizzle-orm/node-postgres';
import pg from 'pg';
const { Pool } = pg;
import * as schema from "@shared/schema";
import dotenv from 'dotenv';

dotenv.config();

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL environment variable is required");
}

// Configure connection pool with proper settings
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }, // Force SSL for NeonDB
  max: 10, // Max concurrent connections
  idleTimeoutMillis: 60000, // Close idle clients after 60s
  connectionTimeoutMillis: 30000, // Wait 30s before timing out
});

// Add proper error handling for the pool
pool.on('error', (err) => {
  console.error('Unexpected database pool error:', err);
  if (!pool.ended) {
    console.log('Attempting to recover pool...');
  }
});

// Create Drizzle ORM instance with schema
export const db = drizzle(pool, { schema });

// Test the connection
(async () => {
  try {
    const result = await pool.query('SELECT NOW()');
    console.log('✅ Database connection test successful:', result.rows[0].now);
  } catch (err) {
    console.error('❌ Database connection test failed:', err);
  }
})();
