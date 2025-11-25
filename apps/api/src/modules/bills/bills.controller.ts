import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  Patch,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { BillsService } from './bills.service';
import { CreateBillDto } from './dto/create-bill.dto';
import { UpdateBillDto } from './dto/update-bill.dto';
import { BillQueryDto } from './dto/bill-query.dto';
import { CurrentCompany } from '../../common/decorators/current-company.decorator';

@ApiTags('Bills')
@Controller('bills')
@ApiBearerAuth()
export class BillsController {
  constructor(private readonly billsService: BillsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new bill for a job' })
  @ApiResponse({ status: 201, description: 'Bill created successfully' })
  @ApiResponse({ status: 400, description: 'Bad request - Job not found or bill already exists' })
  async create(
    @Body() createBillDto: CreateBillDto,
    @CurrentCompany() companyId: string = 'cmfmbojit0000vj0ch078cnbu', // Demo company ID
  ) {
    return this.billsService.create(createBillDto, companyId);
  }

  @Get()
  @ApiOperation({ summary: 'Get all bills with optional filters' })
  @ApiResponse({ status: 200, description: 'Bills retrieved successfully' })
  async findAll(
    @Query() query: BillQueryDto,
    @CurrentCompany() companyId: string = 'cmfmbojit0000vj0ch078cnbu', // Demo company ID
  ) {
    return this.billsService.findAll(query, companyId);
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get billing statistics for the company' })
  @ApiResponse({ status: 200, description: 'Statistics retrieved successfully' })
  async getStats(
    @CurrentCompany() companyId: string = 'cmfmbojit0000vj0ch078cnbu', // Demo company ID
    @Query('clientId') clientId?: string,
  ) {
    return this.billsService.getStats(companyId, clientId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get bill by ID' })
  @ApiResponse({ status: 200, description: 'Bill retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Bill not found' })
  async findOne(
    @Param('id') id: string,
    @CurrentCompany() companyId: string = 'cmfmbojit0000vj0ch078cnbu', // Demo company ID
  ) {
    return this.billsService.findOne(id, companyId);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update a bill' })
  @ApiResponse({ status: 200, description: 'Bill updated successfully' })
  @ApiResponse({ status: 404, description: 'Bill not found' })
  async update(
    @Param('id') id: string,
    @Body() updateBillDto: UpdateBillDto,
    @CurrentCompany() companyId: string = 'cmfmbojit0000vj0ch078cnbu', // Demo company ID
  ) {
    return this.billsService.update(id, updateBillDto, companyId);
  }

  @Patch(':id/send')
  @ApiOperation({ summary: 'Mark bill as sent to client' })
  @ApiResponse({ status: 200, description: 'Bill marked as sent successfully' })
  @ApiResponse({ status: 404, description: 'Bill not found' })
  async markAsSent(
    @Param('id') id: string,
    @CurrentCompany() companyId: string = 'cmfmbojit0000vj0ch078cnbu', // Demo company ID
  ) {
    return this.billsService.markAsSent(id, companyId);
  }

  @Patch(':id/paid')
  @ApiOperation({ summary: 'Mark bill as paid' })
  @ApiResponse({ status: 200, description: 'Bill marked as paid successfully' })
  @ApiResponse({ status: 404, description: 'Bill not found' })
  async markAsPaid(
    @Param('id') id: string,
    @Body() body: { paidDate?: string },
    @CurrentCompany() companyId: string = 'cmfmbojit0000vj0ch078cnbu', // Demo company ID
  ) {
    return this.billsService.markAsPaid(id, companyId, body.paidDate);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a bill' })
  @ApiResponse({ status: 200, description: 'Bill deleted successfully' })
  @ApiResponse({ status: 404, description: 'Bill not found' })
  async remove(
    @Param('id') id: string,
    @CurrentCompany() companyId: string = 'cmfmbojit0000vj0ch078cnbu', // Demo company ID
  ) {
    return this.billsService.remove(id, companyId);
  }
}
