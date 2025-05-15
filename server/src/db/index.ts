import { Pool } from 'pg';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Create a new Pool instance with the environment variables
const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'auth_db',
  user: process.env.DB_USER || 'auth_user',
  password: process.env.DB_PASSWORD || 'auth_password',
  ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
});

// Export the pool
export default pool;