import { Injectable, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Observable } from 'rxjs';

@Injectable()
export class DriverAuthGuard extends AuthGuard('driver-jwt') {
  canActivate(context: ExecutionContext): boolean | Promise<boolean> | Observable<boolean> {
    return super.canActivate(context);
  }

  handleRequest(err: any, user: any, info: any) {
    if (err || !user) {
      throw err || new UnauthorizedException('Driver authentication required');
    }

    // Ensure it's a driver account
    if (user.type !== 'driver') {
      throw new UnauthorizedException('Driver account required');
    }

    return user;
  }
}