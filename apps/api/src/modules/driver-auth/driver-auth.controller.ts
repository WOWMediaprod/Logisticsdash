import { Controller, Post, Body, Get, UseGuards, Request, Headers, Ip, Patch, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { DriverAuthService } from './driver-auth.service';
import { DriverAuthGuard } from './guards/driver-auth.guard';
import { DriverLoginDto } from './dto/driver-login.dto';
import { ChangePinDto } from './dto/change-pin.dto';
import { DriverSessionDto } from './dto/driver-session.dto';

@ApiTags('Driver Authentication')
@Controller('driver-auth')
export class DriverAuthController {
  constructor(private readonly driverAuthService: DriverAuthService) {}

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Driver login with license number and PIN' })
  @ApiResponse({ status: 200, description: 'Login successful', type: DriverSessionDto })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  async login(
    @Body() loginDto: DriverLoginDto,
    @Ip() ipAddress: string,
    @Headers('user-agent') userAgent: string,
  ): Promise<DriverSessionDto> {
    return this.driverAuthService.login(loginDto, ipAddress, userAgent);
  }

  @Post('login-by-job')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Simple driver login using job ID and PIN (for testing)' })
  @ApiResponse({ status: 200, description: 'Login successful' })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  async loginByJob(
    @Body() body: { jobId: string; pin: string }
  ): Promise<{ success: boolean; token?: string; driverId?: string; message?: string }> {
    return this.driverAuthService.loginByJob(body.jobId, body.pin);
  }

  @Post('logout')
  @UseGuards(DriverAuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Driver logout' })
  @ApiResponse({ status: 204, description: 'Logout successful' })
  async logout(@Request() req: any): Promise<void> {
    await this.driverAuthService.logout(req.user.id);
  }

  @Get('profile')
  @UseGuards(DriverAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get driver profile and stats' })
  @ApiResponse({ status: 200, description: 'Driver profile retrieved' })
  async getProfile(@Request() req: any): Promise<any> {
    return this.driverAuthService.getDriverProfile(req.user.id);
  }

  @Patch('change-pin')
  @UseGuards(DriverAuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Change driver PIN' })
  @ApiResponse({ status: 204, description: 'PIN changed successfully' })
  @ApiResponse({ status: 400, description: 'Invalid PIN format' })
  @ApiResponse({ status: 401, description: 'Invalid current PIN' })
  async changePin(
    @Request() req: any,
    @Body() changePinDto: ChangePinDto,
  ): Promise<void> {
    await this.driverAuthService.changePin(
      req.user.id,
      changePinDto.oldPin,
      changePinDto.newPin,
    );
  }

  @Post('refresh-status')
  @UseGuards(DriverAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Refresh driver online status' })
  @ApiResponse({ status: 200, description: 'Status refreshed' })
  async refreshStatus(@Request() req: any): Promise<any> {
    await this.driverAuthService.updateDeviceInfo(req.user.id, req.body.deviceInfo);
    return { success: true, driverId: req.user.id };
  }

  @Get('verify')
  @UseGuards(DriverAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Verify driver token validity' })
  @ApiResponse({ status: 200, description: 'Token is valid' })
  async verifyToken(@Request() req: any): Promise<any> {
    return {
      valid: true,
      driver: {
        id: req.user.id,
        name: req.user.name,
        companyId: req.user.companyId,
      },
    };
  }
}