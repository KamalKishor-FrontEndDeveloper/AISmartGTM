
import { drizzle } from 'drizzle-orm/node-postgres';
import pg from 'pg';
const { Pool } = pg;
import * as schema from "@shared/schema";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL environment variable is required");
}

// Configure connection pool with proper settings
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? {
    rejectUnauthorized: false
  } : false,
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 20000,
});

// Add proper error handling for the pool
pool.on('error', (err) => {
  console.error('Unexpected database pool error:', err);
  // Don't exit the process, let it recover
  if (!pool.ended) {
    console.log('Attempting to recover pool...');
  }
});

// Create Drizzle ORM instance with schema
export const db = drizzle(pool, { schema });

// Test the connection
pool.query('SELECT NOW()', (err) => {
  if (err) {
    console.error('Database connection test failed:', err);
  } else {
    console.log('Database connection test successful');
  }
});
