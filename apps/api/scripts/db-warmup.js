#!/usr/bin/env node

/**
 * Database Warmup Script
 *
 * This script wakes up the Neon database before deployment.
 * Add to Render's "Build Command": node scripts/db-warmup.js && npm run build
 */

const { PrismaClient } = require('@prisma/client');

async function warmupDatabase() {
  const prisma = new PrismaClient({
    datasources: {
      db: {
        url: process.env.DATABASE_URL,
      },
    },
  });

  const maxRetries = 5;
  console.log('🔥 Warming up database connection...');

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      await prisma.$connect();
      console.log('✅ Database connected');

      // Execute a simple query to ensure database is fully awake
      await prisma.$queryRawUnsafe('SELECT 1');
      console.log('✅ Database is fully active and ready');

      await prisma.$disconnect();
      process.exit(0);
    } catch (error) {
      const errorMsg = error.message || String(error);
      console.log(`🔄 Attempt ${attempt}/${maxRetries}: Database waking up...`);

      if (attempt < maxRetries) {
        const waitTime = attempt === 1 ? 5000 : 2000 * attempt;
        console.log(`⏳ Waiting ${waitTime}ms before retry...`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
      } else {
        console.error('❌ Failed to wake up database:', errorMsg);
        process.exit(1);
      }
    }
  }
}

warmupDatabase().catch((error) => {
  console.error('❌ Warmup script failed:', error);
  process.exit(1);
});
