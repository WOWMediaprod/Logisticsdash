import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { TrailersService } from './trailers.service';
import { CreateTrailerDto } from './dto/create-trailer.dto';
import { UpdateTrailerDto } from './dto/update-trailer.dto';

@ApiTags('Trailers')
@Controller('trailers')
export class TrailersController {
  constructor(private readonly trailersService: TrailersService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new trailer' })
  @ApiResponse({ status: 201, description: 'Trailer created successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  async create(@Body() createTrailerDto: CreateTrailerDto) {
    return this.trailersService.create(createTrailerDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all trailers for a company' })
  @ApiQuery({ name: 'companyId', required: true, description: 'Company ID' })
  @ApiQuery({ name: 'isActive', required: false, description: 'Filter by active status' })
  @ApiResponse({ status: 200, description: 'Returns all trailers' })
  async findAll(
    @Query('companyId') companyId: string,
    @Query('isActive') isActive?: string,
  ) {
    return this.trailersService.findAll(companyId, isActive);
  }

  @Get('available')
  @ApiOperation({ summary: 'Get available trailers for assignment' })
  @ApiQuery({ name: 'companyId', required: true, description: 'Company ID' })
  @ApiResponse({ status: 200, description: 'Returns available trailers' })
  async getAvailable(@Query('companyId') companyId: string) {
    return this.trailersService.getAvailableTrailers(companyId);
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get trailer statistics' })
  @ApiQuery({ name: 'companyId', required: true, description: 'Company ID' })
  @ApiResponse({ status: 200, description: 'Returns trailer statistics' })
  async getStats(@Query('companyId') companyId: string) {
    return this.trailersService.getStats(companyId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a trailer by ID' })
  @ApiQuery({ name: 'companyId', required: true, description: 'Company ID' })
  @ApiResponse({ status: 200, description: 'Returns the trailer' })
  @ApiResponse({ status: 404, description: 'Trailer not found' })
  async findOne(
    @Param('id') id: string,
    @Query('companyId') companyId: string,
  ) {
    return this.trailersService.findOne(id, companyId);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a trailer' })
  @ApiQuery({ name: 'companyId', required: true, description: 'Company ID' })
  @ApiResponse({ status: 200, description: 'Trailer updated successfully' })
  @ApiResponse({ status: 404, description: 'Trailer not found' })
  async update(
    @Param('id') id: string,
    @Query('companyId') companyId: string,
    @Body() updateTrailerDto: UpdateTrailerDto,
  ) {
    return this.trailersService.update(id, companyId, updateTrailerDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Soft delete a trailer' })
  @ApiQuery({ name: 'companyId', required: true, description: 'Company ID' })
  @ApiResponse({ status: 200, description: 'Trailer deactivated successfully' })
  @ApiResponse({ status: 404, description: 'Trailer not found' })
  async remove(
    @Param('id') id: string,
    @Query('companyId') companyId: string,
  ) {
    return this.trailersService.remove(id, companyId);
  }
}