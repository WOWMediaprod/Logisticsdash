import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHealth(): { status: string; timestamp: string; version: string } {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      version: '1.0.0-S0',
    };
  }

  getRoot(): { message: string; docs: string } {
    return {
      message: 'Logistics Platform API - Phase S0',
      docs: '/api/docs',
    };
  }
}