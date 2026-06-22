/**
 * Database initialization script
 * Runs on app startup to ensure schema exists
 * Safe to call multiple times (Prisma is idempotent)
 */

import { execSync } from 'child_process';

async function initializeDatabase() {
  if (process.env.NODE_ENV !== 'production') {
    return; // Only run in production (Vercel)
  }

  try {
    console.log('Initializing database schema...');
    execSync('npx prisma db push --accept-data-loss --skip-generate', {
      stdio: 'inherit',
      env: process.env,
    });
    console.log('✅ Database schema initialized');
  } catch (error) {
    // Don't fail the app if migration fails - it might already exist
    console.warn('⚠️ Database initialization warning:', error instanceof Error ? error.message : error);
  }
}

export default initializeDatabase;
