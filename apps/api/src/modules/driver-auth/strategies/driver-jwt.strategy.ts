import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../../database/prisma.service';

@Injectable()
export class DriverJwtStrategy extends PassportStrategy(Strategy, 'driver-jwt') {
  constructor(
    private configService: ConfigService,
    private prisma: PrismaService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get('JWT_SECRET'),
    });
  }

  async validate(payload: any) {
    // Verify driver exists and is active
    const driver = await this.prisma.driver.findUnique({
      where: { id: payload.sub },
      select: {
        id: true,
        name: true,
        licenseNo: true,
        companyId: true,
        isActive: true,
        isOnline: true,
      },
    });

    if (!driver || !driver.isActive) {
      throw new UnauthorizedException('Driver account not found or inactive');
    }

    return {
      id: driver.id,
      driverId: driver.id,
      name: driver.name,
      licenseNo: driver.licenseNo,
      companyId: driver.companyId,
      type: 'driver',
      isOnline: driver.isOnline,
    };
  }
}