import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { DriverAuthController } from './driver-auth.controller';
import { DriverAuthService } from './driver-auth.service';
import { DriverJwtStrategy } from './strategies/driver-jwt.strategy';
import { PrismaService } from '../../database/prisma.service';

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'driver-jwt' }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get('JWT_SECRET'),
        signOptions: {
          expiresIn: '7d', // Driver sessions last 7 days
        },
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [DriverAuthController],
  providers: [DriverAuthService, DriverJwtStrategy, PrismaService],
  exports: [DriverAuthService],
})
export class DriverAuthModule {}