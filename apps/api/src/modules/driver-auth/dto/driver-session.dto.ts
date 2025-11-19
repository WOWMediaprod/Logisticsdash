import { ApiProperty } from '@nestjs/swagger';

export class DriverProfileDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  phone: string;

  @ApiProperty()
  email: string;

  @ApiProperty()
  licenseNo: string;

  @ApiProperty()
  companyId: string;

  @ApiProperty()
  companyName: string;

  @ApiProperty()
  totalEarnings: number;

  @ApiProperty()
  monthlyEarnings: number;

  @ApiProperty()
  todayEarnings: number;

  @ApiProperty()
  isOnline: boolean;
}

export class JobSummaryDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  status: string;

  @ApiProperty()
  jobType: string;

  @ApiProperty()
  priority: string;

  @ApiProperty()
  client: any;

  @ApiProperty()
  vehicle: any;

  @ApiProperty()
  container: any;

  @ApiProperty()
  pickupTs?: Date;

  @ApiProperty()
  dropTs?: Date;

  @ApiProperty()
  etaTs?: Date;

  @ApiProperty()
  specialNotes?: string;
}

export class DriverStatsDto {
  @ApiProperty()
  completedJobs: number;

  @ApiProperty()
  activeJobs: number;

  @ApiProperty()
  totalDistance: number;

  @ApiProperty()
  averageRating: number;
}

export class DriverSessionDto {
  @ApiProperty({
    description: 'JWT authentication token',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  token: string;

  @ApiProperty({
    description: 'Session ID',
    example: 'session-12345',
  })
  sessionId: string;

  @ApiProperty({
    description: 'Driver profile information',
    type: DriverProfileDto,
  })
  driver: DriverProfileDto;

  @ApiProperty({
    description: 'Current active job if any',
    type: JobSummaryDto,
    required: false,
  })
  currentJob?: JobSummaryDto;

  @ApiProperty({
    description: 'Driver statistics',
    type: DriverStatsDto,
  })
  stats: DriverStatsDto;
}