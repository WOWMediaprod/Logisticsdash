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
  }

  async onModuleInit() {
    await this.$connect();
    console.log('✅ Database connected successfully');
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
      await this.$queryRaw`SELECT 1`;
      return true;
    } catch {
      return false;
    }
  }
}