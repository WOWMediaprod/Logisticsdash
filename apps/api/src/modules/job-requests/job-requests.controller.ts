import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  BadRequestException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { JobRequestsService } from './job-requests.service';
import { CreateJobRequestDto } from './dto/create-job-request.dto';
import { UpdateJobRequestDto } from './dto/update-job-request.dto';
import { JobRequestQueryDto } from './dto/job-request-query.dto';

@ApiTags('Job Requests')
@Controller('job-requests')
export class JobRequestsController {
  constructor(private readonly jobRequestsService: JobRequestsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new job request' })
  @ApiResponse({ status: 201, description: 'Job request created successfully' })
  create(@Body() createJobRequestDto: CreateJobRequestDto) {
    if (!createJobRequestDto.companyId) {
      throw new BadRequestException('companyId is required');
    }
    return this.jobRequestsService.create(createJobRequestDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all job requests with filters' })
  @ApiResponse({ status: 200, description: 'Job requests retrieved successfully' })
  findAll(@Query() query: any) {
    console.log('🔍 Job Requests API - Received query:', query);
    console.log('🔍 companyId type:', typeof query.companyId, 'value:', query.companyId);

    if (!query.companyId) {
      console.log('❌ companyId is missing!');
      throw new BadRequestException('companyId is required');
    }

    const queryParams = {
      companyId: query.companyId,
      status: query.status,
      priority: query.priority,
      clientId: query.clientId,
      page: query.page ? parseInt(query.page) : 1,
      limit: query.limit ? parseInt(query.limit) : 10,
    };

    console.log('✅ Processed query params:', queryParams);
    return this.jobRequestsService.findAll(queryParams);
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get job request statistics' })
  @ApiResponse({ status: 200, description: 'Job request stats retrieved successfully' })
  getStats(@Query('companyId') companyId: string) {
    if (!companyId) {
      throw new BadRequestException('companyId is required');
    }
    return this.jobRequestsService.getStats(companyId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get job request by ID' })
  @ApiResponse({ status: 200, description: 'Job request retrieved successfully' })
  findOne(@Param('id') id: string, @Query('companyId') companyId: string) {
    if (!companyId) {
      throw new BadRequestException('companyId is required');
    }
    return this.jobRequestsService.findOne(id, companyId);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update job request' })
  @ApiResponse({ status: 200, description: 'Job request updated successfully' })
  update(
    @Param('id') id: string,
    @Body() body: UpdateJobRequestDto & { companyId?: string }
  ) {
    if (!body.companyId) {
      throw new BadRequestException('companyId is required');
    }
    const { companyId, ...updateJobRequestDto } = body;
    return this.jobRequestsService.update(id, companyId, updateJobRequestDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete job request' })
  @ApiResponse({ status: 200, description: 'Job request deleted successfully' })
  remove(@Param('id') id: string, @Query('companyId') companyId: string) {
    if (!companyId) {
      throw new BadRequestException('companyId is required');
    }
    return this.jobRequestsService.remove(id, companyId);
  }

  @Post(':id/accept')
  @ApiOperation({ summary: 'Accept job request and create job' })
  @ApiResponse({ status: 200, description: 'Job request accepted and job created successfully' })
  acceptAndCreateJob(
    @Param('id') id: string,
    @Body() body: { companyId: string; reviewedBy: string; reviewNotes?: string }
  ) {
    if (!body.companyId) {
      throw new BadRequestException('companyId is required');
    }
    if (!body.reviewedBy) {
      throw new BadRequestException('reviewedBy is required');
    }
    return this.jobRequestsService.acceptAndCreateJob(
      id,
      body.companyId,
      body.reviewedBy,
      body.reviewNotes
    );
  }

  @Post(':id/decline')
  @ApiOperation({ summary: 'Decline job request' })
  @ApiResponse({ status: 200, description: 'Job request declined successfully' })
  declineRequest(
    @Param('id') id: string,
    @Body() body: { companyId: string; reviewedBy: string; reviewNotes: string }
  ) {
    if (!body.companyId) {
      throw new BadRequestException('companyId is required');
    }
    if (!body.reviewedBy) {
      throw new BadRequestException('reviewedBy is required');
    }
    if (!body.reviewNotes) {
      throw new BadRequestException('reviewNotes is required for declining');
    }
    return this.jobRequestsService.declineRequest(
      id,
      body.companyId,
      body.reviewedBy,
      body.reviewNotes
    );
  }
}
