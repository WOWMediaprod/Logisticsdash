import { Controller, Get, Post, Patch, Delete, Body, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { RoutesService } from './routes.service';
import { CreateRouteDto } from './dto/create-route.dto';
import { UpdateRouteDto } from './dto/update-route.dto';

@ApiTags('Routes')
@Controller('routes')
export class RoutesController {
  constructor(private readonly routesService: RoutesService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new route' })
  @ApiResponse({ status: 201, description: 'Route created successfully' })
  async create(@Body() createRouteDto: CreateRouteDto) {
    return this.routesService.create(createRouteDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all routes for a company' })
  @ApiResponse({ status: 200, description: 'Routes retrieved successfully' })
  async findAll(
    @Query('companyId') companyId: string,
    @Query('clientId') clientId?: string,
    @Query('isActive') isActive?: string,
  ) {
    const isActiveBoolean = isActive === 'true' ? true : isActive === 'false' ? false : undefined;
    return this.routesService.findAll(companyId, clientId, isActiveBoolean);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a route by ID' })
  @ApiResponse({ status: 200, description: 'Route retrieved successfully' })
  async findOne(
    @Param('id') id: string,
    @Query('companyId') companyId: string,
  ) {
    return this.routesService.findOne(id, companyId);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a route' })
  @ApiResponse({ status: 200, description: 'Route updated successfully' })
  async update(
    @Param('id') id: string,
    @Query('companyId') companyId: string,
    @Body() updateRouteDto: UpdateRouteDto,
  ) {
    return this.routesService.update(id, companyId, updateRouteDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a route' })
  @ApiResponse({ status: 200, description: 'Route deleted successfully' })
  async remove(
    @Param('id') id: string,
    @Query('companyId') companyId: string,
  ) {
    return this.routesService.remove(id, companyId);
  }
}