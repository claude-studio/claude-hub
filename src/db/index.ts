import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schema';
import { createLogger } from '../utils/logger';

const logger = createLogger('db');

const pool = new Pool({
  connectionString: process.env['DATABASE_URL'],
  max: 10
});

pool.on('error', err => {
  logger.error({ err }, 'PostgreSQL pool error');
});

export const db = drizzle(pool, { schema });

export async function checkDbConnection(): Promise<boolean> {
  try {
    await pool.query('SELECT 1');
    return true;
  } catch {
    return false;
  }
}
