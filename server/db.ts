import { drizzle } from 'drizzle-orm/neon-http';
import { neon } from '@neondatabase/serverless';
import * as schema from '../shared/schema';

// Initialize Neon client 
const sql = neon(process.env.DATABASE_URL!);

// Initialize Drizzle with the Neon HTTP client
export const db = drizzle(sql, { schema });