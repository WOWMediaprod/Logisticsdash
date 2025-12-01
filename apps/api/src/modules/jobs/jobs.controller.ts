import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  BadRequestException,
} from "@nestjs/common";
import { ApiOperation, ApiResponse, ApiTags } from "@nestjs/swagger";
import { JobsService } from "./jobs.service";
import { QrCodeService } from "./services/qr-code.service";
import { CreateJobDto } from "./dto/create-job.dto";
import { UpdateJobDto } from "./dto/update-job.dto";
import { JobQueryDto } from "./dto/job-query.dto";
import { AmendJobDto } from "./dto/amend-job.dto";

@ApiTags("Jobs")
@Controller("jobs")
export class JobsController {
  constructor(private readonly jobsService: JobsService, private readonly qrCodeService: QrCodeService) {}

  @Post()
  @ApiOperation({ summary: "Create a new job" })
  @ApiResponse({ status: 201, description: "Job created successfully" })
  create(@Body() createJobDto: CreateJobDto) {
    if (!createJobDto.companyId) {
      throw new BadRequestException("companyId is required");
    }
    return this.jobsService.create(createJobDto);
  }

  @Get()
  @ApiOperation({ summary: "Get all jobs with filters" })
  @ApiResponse({ status: 200, description: "Jobs retrieved successfully" })
  findAll(@Query() query: JobQueryDto) {
    if (!query.companyId) {
      throw new BadRequestException("companyId is required");
    }
    return this.jobsService.findAll(query);
  }

  @Get("stats")
  @ApiOperation({ summary: "Get job statistics for dashboard" })
  @ApiResponse({ status: 200, description: "Job stats retrieved successfully" })
  getStats(@Query("companyId") companyId: string) {
    if (!companyId) {
      throw new BadRequestException("companyId is required");
    }
    return this.jobsService.getStats(companyId);
  }

  @Get(":id")
  @ApiOperation({ summary: "Get job by ID" })
  @ApiResponse({ status: 200, description: "Job retrieved successfully" })
  findOne(@Param("id") id: string, @Query("companyId") companyId: string) {
    if (!companyId) {
      throw new BadRequestException("companyId is required");
    }
    return this.jobsService.findOne(id, companyId);
  }

  @Patch(":id")
  @ApiOperation({ summary: "Update job" })
  @ApiResponse({ status: 200, description: "Job updated successfully" })
  update(@Param("id") id: string, @Body() body: UpdateJobDto & { companyId?: string }) {
    if (!body.companyId) {
      throw new BadRequestException("companyId is required");
    }
    const { companyId, ...updateJobDto } = body;
    return this.jobsService.update(id, companyId, updateJobDto);
  }

  @Patch(":id/assign")
  @ApiOperation({ summary: "Assign job to driver and vehicle" })
  @ApiResponse({ status: 200, description: "Job assigned successfully" })
  assign(
    @Param("id") id: string,
    @Body() assignDto: { companyId?: string; driverId: string; vehicleId: string; assignedBy: string }
  ) {
    if (!assignDto.companyId) {
      throw new BadRequestException("companyId is required");
    }
    const { companyId, ...rest } = assignDto;
    return this.jobsService.assignJob(id, companyId, rest);
  }

  @Patch(":id/status")
  @ApiOperation({ summary: "Update job status" })
  @ApiResponse({ status: 200, description: "Job status updated successfully" })
  updateStatus(
    @Param("id") id: string,
    @Body() statusDto: { companyId?: string; status: string; note?: string }
  ) {
    if (!statusDto.companyId) {
      throw new BadRequestException("companyId is required");
    }
    const { companyId, ...rest } = statusDto;
    return this.jobsService.updateStatus(id, companyId, rest);
  }

  @Patch(":id/amend")
  @ApiOperation({ summary: "Amend job with change tracking and notifications" })
  @ApiResponse({ status: 200, description: "Job amended successfully" })
  amendJob(
    @Param("id") id: string,
    @Body() amendDto: AmendJobDto & { companyId?: string }
  ) {
    if (!amendDto.companyId) {
      throw new BadRequestException("companyId is required");
    }
    const { companyId, ...rest } = amendDto;
    return this.jobsService.amendJob(id, companyId, rest);
  }

  @Get(":id/history")
  @ApiOperation({ summary: "Get job amendment history" })
  @ApiResponse({ status: 200, description: "Job history retrieved successfully" })
  getJobHistory(@Param("id") id: string, @Query("companyId") companyId: string) {
    if (!companyId) {
      throw new BadRequestException("companyId is required");
    }
    return this.jobsService.getJobHistory(id, companyId);
  }

  @Get(":id/qr/trip-pack")
  @ApiOperation({ summary: "Generate Trip Pack QR code with embedded job data" })
  @ApiResponse({ status: 200, description: "Trip Pack QR code generated successfully" })
  async generateTripPackQR(@Param("id") jobId: string, @Query("companyId") companyId: string) {
    if (!companyId) {
      throw new BadRequestException("companyId is required");
    }

    const job = await this.jobsService.findOne(jobId, companyId);
    if (!job.success) {
      return job;
    }

    const qrResult = await this.qrCodeService.generateTripPackQR(job.data);

    return {
      success: true,
      data: qrResult,
      message: "Trip Pack QR generated successfully",
    };
  }

  @Get(":id/qr/tracking")
  @ApiOperation({ summary: "Generate simple tracking QR code" })
  @ApiResponse({ status: 200, description: "Tracking QR code generated successfully" })
  async generateTrackingQR(@Param("id") jobId: string, @Query("companyId") companyId: string) {
    if (!companyId) {
      throw new BadRequestException("companyId is required");
    }

    await this.jobsService.findOne(jobId, companyId);
    const qrCode = await this.qrCodeService.generateTrackingQR(jobId);

    return {
      success: true,
      data: {
        qrCode,
        trackingUrl: `${process.env.FRONTEND_URL || "http://localhost:3001"}/track/${jobId}`,
      },
      message: "Tracking QR generated successfully",
    };
  }

  @Post(":id/qr/delivery")
  @ApiOperation({ summary: "Generate delivery confirmation QR code" })
  @ApiResponse({ status: 200, description: "Delivery QR code generated successfully" })
  async generateDeliveryQR(
    @Param("id") jobId: string,
    @Query("companyId") companyId: string,
    @Body() deliveryData: { location: string; recipientName: string; signatureUrl?: string }
  ) {
    if (!companyId) {
      throw new BadRequestException("companyId is required");
    }

    await this.jobsService.findOne(jobId, companyId);
    const qrCode = await this.qrCodeService.generateDeliveryQR(jobId);

    return {
      success: true,
      data: {
        qrCode,
        deliveryData,
      },
      message: "Delivery confirmation QR generated successfully",
    };
  }

  @Patch(':id/complete')
  @ApiOperation({ summary: 'Mark job as completed by driver' })
  @ApiResponse({ status: 200, description: 'Job completed successfully' })
  async completeJob(
    @Param('id') id: string,
    @Body() completeDto: { companyId?: string; driverId: string; timestamp?: string }
  ) {
    if (!completeDto.companyId) {
      throw new BadRequestException('companyId is required');
    }
    const { companyId, ...rest } = completeDto;
    return this.jobsService.completeJob(id, companyId, rest);
  }

  @Delete(":id")
  @ApiOperation({ summary: "Delete job" })
  @ApiResponse({ status: 200, description: "Job deleted successfully" })
  remove(@Param("id") id: string, @Query("companyId") companyId: string) {
    if (!companyId) {
      throw new BadRequestException("companyId is required");
    }
    return this.jobsService.remove(id, companyId);
  }
}
