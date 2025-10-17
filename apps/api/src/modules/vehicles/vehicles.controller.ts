import { Controller, Get, Post, Patch, Delete, Body, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { VehiclesService } from './vehicles.service';
import { CreateVehicleDto } from './dto/create-vehicle.dto';
import { UpdateVehicleDto } from './dto/update-vehicle.dto';

@ApiTags('Vehicles')
@Controller('vehicles')
export class VehiclesController {
  constructor(private readonly vehiclesService: VehiclesService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new vehicle' })
  @ApiResponse({ status: 201, description: 'Vehicle created successfully' })
  async create(@Body() createVehicleDto: CreateVehicleDto) {
    return this.vehiclesService.create(createVehicleDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all vehicles for a company' })
  @ApiResponse({ status: 200, description: 'Vehicles retrieved successfully' })
  async findAll(
    @Query('companyId') companyId: string,
    @Query('isActive') isActive?: string,
  ) {
    const isActiveBoolean = isActive === 'true' ? true : isActive === 'false' ? false : undefined;
    return this.vehiclesService.findAll(companyId, isActiveBoolean);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a vehicle by ID' })
  @ApiResponse({ status: 200, description: 'Vehicle retrieved successfully' })
  async findOne(
    @Param('id') id: string,
    @Query('companyId') companyId: string,
  ) {
    return this.vehiclesService.findOne(id, companyId);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a vehicle' })
  @ApiResponse({ status: 200, description: 'Vehicle updated successfully' })
  async update(
    @Param('id') id: string,
    @Query('companyId') companyId: string,
    @Body() updateVehicleDto: UpdateVehicleDto,
  ) {
    return this.vehiclesService.update(id, companyId, updateVehicleDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a vehicle' })
  @ApiResponse({ status: 200, description: 'Vehicle deleted successfully' })
  async remove(
    @Param('id') id: string,
    @Query('companyId') companyId: string,
  ) {
    return this.vehiclesService.remove(id, companyId);
  }
}