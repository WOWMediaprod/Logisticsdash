import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TrackingV2Gateway } from './tracking-v2.gateway';
import { TrackingV2Service } from './tracking-v2.service';
import { TrackingV2Controller } from './tracking-v2.controller';
import { PrismaService } from '../../database/prisma.service';
import { DriverAuthModule } from '../driver-auth/driver-auth.module';

@Module({
  imports: [
    DriverAuthModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET') || 'default-jwt-secret',
        signOptions: {
          expiresIn: '7d',
        },
      }),
      inject: [ConfigService],
    }),
  ],
  providers: [TrackingV2Gateway, TrackingV2Service, PrismaService],
  controllers: [TrackingV2Controller],
  exports: [TrackingV2Service, TrackingV2Gateway],
})
export class TrackingV2Module {}