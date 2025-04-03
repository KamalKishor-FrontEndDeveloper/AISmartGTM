import { drizzle } from "drizzle-orm/node-postgres";
import pkg from "pg";
const { Pool } = pkg;
import * as schema from "@shared/schema";

// Create a PostgreSQL connection pool
// Use connection pooling with Neon
const poolConfig = {
  connectionString: process.env.DATABASE_URL?.replace('.us-east-2', '-pooler.us-east-2'),
  max: 10
};

const pool = new Pool(poolConfig);

// Create Drizzle ORM instance with our schema
export const db = drizzle(pool, { schema });