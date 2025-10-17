import { Controller, Get, Post, Patch, Delete, Body, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { DriversService } from './drivers.service';
import { CreateDriverDto } from './dto/create-driver.dto';
import { UpdateDriverDto } from './dto/update-driver.dto';

@ApiTags('Drivers')
@Controller('drivers')
export class DriversController {
  constructor(private readonly driversService: DriversService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new driver' })
  @ApiResponse({ status: 201, description: 'Driver created successfully' })
  async create(@Body() createDriverDto: CreateDriverDto) {
    return this.driversService.create(createDriverDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all drivers for a company' })
  @ApiResponse({ status: 200, description: 'Drivers retrieved successfully' })
  async findAll(
    @Query('companyId') companyId: string,
    @Query('isActive') isActive?: string,
  ) {
    const isActiveBoolean = isActive === 'true' ? true : isActive === 'false' ? false : undefined;
    return this.driversService.findAll(companyId, isActiveBoolean);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a driver by ID' })
  @ApiResponse({ status: 200, description: 'Driver retrieved successfully' })
  async findOne(
    @Param('id') id: string,
    @Query('companyId') companyId: string,
  ) {
    return this.driversService.findOne(id, companyId);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a driver' })
  @ApiResponse({ status: 200, description: 'Driver updated successfully' })
  async update(
    @Param('id') id: string,
    @Query('companyId') companyId: string,
    @Body() updateDriverDto: UpdateDriverDto,
  ) {
    return this.driversService.update(id, companyId, updateDriverDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a driver' })
  @ApiResponse({ status: 200, description: 'Driver deleted successfully' })
  async remove(
    @Param('id') id: string,
    @Query('companyId') companyId: string,
  ) {
    return this.driversService.remove(id, companyId);
  }
}