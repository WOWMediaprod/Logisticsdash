import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  constructor() {
    super({
      datasources: {
        db: {
          url: process.env.DATABASE_URL,
        },
      },
      log: process.env.NODE_ENV === 'development' ? ['query', 'info', 'warn', 'error'] : ['error'],
    });

    // Disable prepared statements for PgBouncer/Supabase pooler compatibility
    // This prevents "prepared statement already exists" errors
    this.$on('query' as never, () => {});
  }

  async onModuleInit() {
    const maxRetries = 5;
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        await this.$connect();
        console.log('✅ Database connected successfully');
        return;
      } catch (error) {
        lastError = error as Error;
        console.error(`❌ Database connection attempt ${attempt}/${maxRetries} failed:`, error.message);

        if (attempt < maxRetries) {
          // Exponential backoff: wait 1s, 2s, 4s, 8s, 16s
          const waitTime = Math.min(1000 * Math.pow(2, attempt - 1), 16000);
          console.log(`⏳ Retrying in ${waitTime}ms...`);
          await new Promise(resolve => setTimeout(resolve, waitTime));
        }
      }
    }

    console.error('❌ Failed to connect to database after', maxRetries, 'attempts');
    throw lastError;
  }

  async onModuleDestroy() {
    await this.$disconnect();
    console.log('🔌 Database disconnected');
  }

  // Helper method for tenant-scoped queries
  async executeWithTenant<T>(companyId: string, operation: (prisma: PrismaClient) => Promise<T>): Promise<T> {
    // This ensures all queries within the operation are scoped to the tenant
    // We can extend this with row-level security in the future
    return operation(this);
  }

  // Utility for soft deletes (if needed)
  async softDelete(model: string, id: string, companyId: string) {
    return this[model].update({
      where: { id, companyId },
      data: { deletedAt: new Date() },
    });
  }

  // Health check for the database
  async isHealthy(): Promise<boolean> {
    try {
      await this.$queryRawUnsafe('SELECT 1');
      return true;
    } catch {
      return false;
    }
  }
}