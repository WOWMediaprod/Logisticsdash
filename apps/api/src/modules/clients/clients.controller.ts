import { Controller, Get, Post, Patch, Delete, Body, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { ClientsService } from './clients.service';
import { CreateClientDto } from './dto/create-client.dto';
import { UpdateClientDto } from './dto/update-client.dto';

@ApiTags('Clients')
@Controller('clients')
export class ClientsController {
  constructor(private readonly clientsService: ClientsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new client' })
  @ApiResponse({ status: 201, description: 'Client created successfully' })
  async create(@Body() createClientDto: CreateClientDto) {
    return this.clientsService.create(createClientDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all clients for a company' })
  @ApiResponse({ status: 200, description: 'Clients retrieved successfully' })
  async findAll(@Query('companyId') companyId: string) {
    return this.clientsService.findAll(companyId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a client by ID' })
  @ApiResponse({ status: 200, description: 'Client retrieved successfully' })
  async findOne(@Param('id') id: string, @Query('companyId') companyId: string) {
    return this.clientsService.findOne(id, companyId);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a client' })
  @ApiResponse({ status: 200, description: 'Client updated successfully' })
  async update(
    @Param('id') id: string,
    @Query('companyId') companyId: string,
    @Body() updateClientDto: UpdateClientDto,
  ) {
    return this.clientsService.update(id, companyId, updateClientDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a client' })
  @ApiResponse({ status: 200, description: 'Client deleted successfully' })
  async remove(@Param('id') id: string, @Query('companyId') companyId: string) {
    return this.clientsService.remove(id, companyId);
  }
}