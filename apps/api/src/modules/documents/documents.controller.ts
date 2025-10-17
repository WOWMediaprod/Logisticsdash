import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Query,
  Body,
  UploadedFile,
  UseInterceptors,
  ParseUUIDPipe,
  BadRequestException,
  UseGuards,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiConsumes,
  ApiBody,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { DocumentsService } from './documents.service';
import { UploadDocumentDto } from './dto/upload-document.dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { CurrentCompany } from '../../common/decorators/current-company.decorator';
// import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';

@ApiTags('Documents')
@Controller('documents')
// @UseGuards(JwtAuthGuard) // Uncomment when auth is implemented
@ApiBearerAuth()
export class DocumentsController {
  constructor(private readonly documentsService: DocumentsService) {}

  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  @ApiOperation({ summary: 'Upload a document with OCR processing' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    description: 'Document upload with metadata',
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: 'Document file (PDF, JPEG, PNG, TIFF)',
        },
        type: {
          type: 'string',
          enum: ['BOL', 'INVOICE', 'DELIVERY_NOTE', 'GATE_PASS', 'CUSTOMS', 'INSURANCE', 'PHOTO', 'SIGNATURE', 'RELEASE_ORDER', 'CDN', 'LOADING_PASS', 'FCL_DOCUMENT', 'OTHER'],
          description: 'Document type',
        },
        jobId: {
          type: 'string',
          format: 'uuid',
          description: 'Optional job ID to associate document',
        },
        isOriginal: {
          type: 'boolean',
          description: 'Whether this is an original document or a copy',
          default: true,
        },
        enableOcr: {
          type: 'boolean',
          description: 'Enable OCR processing',
          default: true,
        },
        metadata: {
          type: 'object',
          description: 'Additional metadata',
        },
      },
      required: ['file', 'type'],
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Document uploaded successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        data: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            type: { type: 'string' },
            fileName: { type: 'string' },
            fileUrl: { type: 'string' },
            fileSize: { type: 'number' },
            mimeType: { type: 'string' },
            ocrData: { type: 'object', nullable: true },
            createdAt: { type: 'string', format: 'date-time' },
          },
        },
        message: { type: 'string' },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Invalid file or request data' })
  @ApiResponse({ status: 413, description: 'File too large' })
  async uploadDocument(
    @UploadedFile() file: Express.Multer.File,
    @Body() uploadDto: UploadDocumentDto,
    @CurrentCompany() companyId: string = 'cmfmbojit0000vj0ch078cnbu', // Demo company ID
    @CurrentUser() userId: string = 'demo-user-id', // Demo user ID
  ) {
    if (!file) {
      throw new BadRequestException('No file provided');
    }

    return this.documentsService.uploadDocument(file, uploadDto, companyId, userId);
  }

  @Get()
  @ApiOperation({ summary: 'Get all documents for company or specific job' })
  @ApiQuery({ name: 'jobId', required: false, description: 'Filter by job ID' })
  @ApiResponse({
    status: 200,
    description: 'Documents retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        data: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              type: { type: 'string' },
              fileName: { type: 'string' },
              fileSize: { type: 'number' },
              mimeType: { type: 'string' },
              ocrData: { type: 'object', nullable: true },
              job: { type: 'object', nullable: true },
              creator: { type: 'object' },
              createdAt: { type: 'string', format: 'date-time' },
            },
          },
        },
        meta: {
          type: 'object',
          properties: {
            total: { type: 'number' },
          },
        },
      },
    },
  })
  async getDocuments(
    @CurrentCompany() companyId: string = 'cmfmbojit0000vj0ch078cnbu', // Demo company ID
    @Query('jobId') jobId?: string,
  ) {
    return this.documentsService.getDocuments(companyId, jobId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get document by ID' })
  @ApiResponse({
    status: 200,
    description: 'Document retrieved successfully',
  })
  @ApiResponse({ status: 404, description: 'Document not found' })
  async getDocument(
    @Param('id', ParseUUIDPipe) documentId: string,
    @CurrentCompany() companyId: string = 'cmfmbojit0000vj0ch078cnbu', // Demo company ID
  ) {
    return this.documentsService.getDocument(documentId, companyId);
  }

  @Get(':id/download')
  @ApiOperation({ summary: 'Get signed URL for document download' })
  @ApiQuery({
    name: 'expires',
    required: false,
    description: 'URL expiration time in seconds (default: 3600)',
    type: 'number'
  })
  @ApiResponse({
    status: 200,
    description: 'Download URL generated successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        data: {
          type: 'object',
          properties: {
            url: { type: 'string' },
            expiresAt: { type: 'string', format: 'date-time' },
            fileName: { type: 'string' },
            mimeType: { type: 'string' },
          },
        },
      },
    },
  })
  @ApiResponse({ status: 404, description: 'Document not found' })
  async getDocumentUrl(
    @Param('id', ParseUUIDPipe) documentId: string,
    @CurrentCompany() companyId: string = 'cmfmbojit0000vj0ch078cnbu', // Demo company ID
    @Query('expires') expiresIn?: number,
  ) {
    return this.documentsService.getDocumentUrl(documentId, companyId, expiresIn);
  }

  @Get(':id/ocr')
  @ApiOperation({ summary: 'Get OCR results for document' })
  @ApiResponse({
    status: 200,
    description: 'OCR results retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        data: {
          type: 'object',
          properties: {
            text: { type: 'string' },
            confidence: { type: 'number' },
            words: { type: 'array' },
            lines: { type: 'array' },
            pages: { type: 'number' },
            processingTimeMs: { type: 'number' },
            extractedData: { type: 'object' },
            processedAt: { type: 'string' },
          },
          nullable: true,
        },
        message: { type: 'string', nullable: true },
      },
    },
  })
  @ApiResponse({ status: 404, description: 'Document not found' })
  async getOcrResults(
    @Param('id', ParseUUIDPipe) documentId: string,
    @CurrentCompany() companyId: string = 'cmfmbojit0000vj0ch078cnbu', // Demo company ID
  ) {
    return this.documentsService.getOcrResults(documentId, companyId);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete document' })
  @ApiResponse({
    status: 200,
    description: 'Document deleted successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        message: { type: 'string' },
      },
    },
  })
  @ApiResponse({ status: 404, description: 'Document not found' })
  async deleteDocument(
    @Param('id', ParseUUIDPipe) documentId: string,
    @CurrentCompany() companyId: string = 'cmfmbojit0000vj0ch078cnbu', // Demo company ID
  ) {
    return this.documentsService.deleteDocument(documentId, companyId);
  }
}