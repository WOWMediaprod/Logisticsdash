import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { CompaniesService } from './companies.service';
import { CreateCompanyDto } from './dto/create-company.dto';
import { UpdateCompanyDto } from './dto/update-company.dto';

@ApiTags('companies')
@Controller('companies')
export class CompaniesController {
  constructor(private readonly companiesService: CompaniesService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new company' })
  create(
    @Body() createCompanyDto: CreateCompanyDto,
    @Query('userId') userId: string,
  ) {
    return this.companiesService.create(createCompanyDto, userId);
  }

  @Get()
  @ApiOperation({ summary: 'Get all companies for a user' })
  findAll(@Query('userId') userId: string) {
    return this.companiesService.findAll(userId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a single company' })
  findOne(@Param('id') id: string, @Query('userId') userId: string) {
    return this.companiesService.findOne(id, userId);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a company' })
  update(
    @Param('id') id: string,
    @Query('userId') userId: string,
    @Body() updateCompanyDto: UpdateCompanyDto,
  ) {
    return this.companiesService.update(id, userId, updateCompanyDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Remove company from user account' })
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id') id: string, @Query('userId') userId: string) {
    return this.companiesService.remove(id, userId);
  }

  @Post(':id/set-default')
  @ApiOperation({ summary: 'Set company as default for user' })
  setDefault(@Param('id') id: string, @Query('userId') userId: string) {
    return this.companiesService.setDefault(id, userId);
  }
}
