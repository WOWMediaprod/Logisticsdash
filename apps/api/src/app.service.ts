import { Injectable } from '@nestjs/common';
import { PrismaService } from './database/prisma.service';

@Injectable()
export class AppService {
  constructor(private readonly prisma: PrismaService) {}

  async getHealth(): Promise<{ status: string; timestamp: string; version: string; database?: string }> {
    let dbStatus = 'unknown';

    try {
      // Ping database to keep it active (prevents Neon auto-suspend)
      const isHealthy = await this.prisma.isHealthy();
      dbStatus = isHealthy ? 'connected' : 'disconnected';
    } catch (error) {
      dbStatus = 'error';
    }

    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      version: '1.0.0-S0',
      database: dbStatus,
    };
  }

  getRoot(): { message: string; docs: string } {
    return {
      message: 'Logistics Platform API - Phase S0',
      docs: '/api/docs',
    };
  }
}