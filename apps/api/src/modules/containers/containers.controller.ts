import { Controller, Get, Post, Patch, Delete, Body, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { ContainersService } from './containers.service';
import { CreateContainerDto } from './dto/create-container.dto';
import { UpdateContainerDto } from './dto/update-container.dto';

@ApiTags('Containers')
@Controller('containers')
export class ContainersController {
  constructor(private readonly containersService: ContainersService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new container' })
  @ApiResponse({ status: 201, description: 'Container created successfully' })
  async create(@Body() createContainerDto: CreateContainerDto) {
    return this.containersService.create(createContainerDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all containers for a company' })
  @ApiResponse({ status: 200, description: 'Containers retrieved successfully' })
  async findAll(
    @Query('companyId') companyId: string,
    @Query('checkOk') checkOk?: string,
  ) {
    const checkOkBoolean = checkOk === 'true' ? true : checkOk === 'false' ? false : undefined;
    return this.containersService.findAll(companyId, checkOkBoolean);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a container by ID' })
  @ApiResponse({ status: 200, description: 'Container retrieved successfully' })
  async findOne(
    @Param('id') id: string,
    @Query('companyId') companyId: string,
  ) {
    return this.containersService.findOne(id, companyId);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a container' })
  @ApiResponse({ status: 200, description: 'Container updated successfully' })
  async update(
    @Param('id') id: string,
    @Query('companyId') companyId: string,
    @Body() updateContainerDto: UpdateContainerDto,
  ) {
    return this.containersService.update(id, companyId, updateContainerDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a container' })
  @ApiResponse({ status: 200, description: 'Container deleted successfully' })
  async remove(
    @Param('id') id: string,
    @Query('companyId') companyId: string,
  ) {
    return this.containersService.remove(id, companyId);
  }
}