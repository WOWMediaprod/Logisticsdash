import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { StorageService } from './services/storage.service';
import { OcrService } from './services/ocr.service';
import { CreateDocumentDto } from './dto/create-document.dto';
import { UploadDocumentDto } from './dto/upload-document.dto';

@Injectable()
export class DocumentsService {
  private readonly logger = new Logger(DocumentsService.name);

  constructor(
    private prisma: PrismaService,
    private storageService: StorageService,
    private ocrService: OcrService,
  ) {}

  async uploadDocument(
    file: Express.Multer.File,
    uploadDto: UploadDocumentDto,
    companyId: string,
    userId: string,
  ) {
    try {
      this.logger.log(
        `Starting document upload for company ${companyId}, type: ${uploadDto.type}`,
      );

      // Validate file
      this.validateFile(file);

      // If jobId is provided, verify it exists and belongs to the company
      if (uploadDto.jobId) {
        await this.validateJobAccess(uploadDto.jobId, companyId);
      }

      // Upload file to storage
      const { fileUrl, fileName } = await this.storageService.uploadFile(
        file,
        companyId,
        uploadDto.type,
        uploadDto.jobId,
      );

      // Determine createdBy: null for demo/unauthenticated users, actual userId for authenticated users
      const createdByUserId = userId === 'demo-user-id' ? null : userId;

      this.logger.log(`Creating document record:`, {
        companyId,
        userId,
        createdByUserId,
        fileName,
        type: uploadDto.type,
        jobId: uploadDto.jobId,
        fileSize: file.size,
        mimeType: file.mimetype,
      });

      // Create document record
      let document;
      try {
        document = await this.prisma.document.create({
          data: {
            companyId,
            jobId: uploadDto.jobId,
            type: uploadDto.type,
            fileName,
            fileUrl,
            fileSize: file.size,
            mimeType: file.mimetype,
            isOriginal: uploadDto.isOriginal ?? true,
            metadata: uploadDto.metadata,
            createdBy: createdByUserId,
          },
        include: {
          job: {
            select: {
              id: true,
              status: true,
              client: { select: { name: true, code: true } },
            },
          },
          creator: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
        },
        });
      } catch (prismaError) {
        this.logger.error(`Prisma document creation failed:`, {
          error: prismaError.message,
          code: prismaError.code,
          meta: prismaError.meta,
          userId,
          createdByUserId,
          companyId,
          fileName,
          type: uploadDto.type,
        });
        throw new BadRequestException(`Failed to create document record: ${prismaError.message}`);
      }

      // Process OCR if enabled and file is supported
      if (uploadDto.enableOcr && this.isOcrSupported(file.mimetype)) {
        this.processOcrAsync(document.id, fileUrl, file.mimetype);
      }

      this.logger.log(`Document uploaded successfully: ${document.id}`);

      return {
        success: true,
        data: document,
        message: 'Document uploaded successfully',
      };
    } catch (error) {
      this.logger.error(`Document upload failed: ${error.message}`, error.stack);
      throw error;
    }
  }

  async getDocuments(companyId: string, jobId?: string) {
    const whereClause: any = { companyId };

    if (jobId) {
      // Verify job belongs to company
      await this.validateJobAccess(jobId, companyId);
      whereClause.jobId = jobId;
    }

    const documents = await this.prisma.document.findMany({
      where: whereClause,
      include: {
        job: {
          select: {
            id: true,
            status: true,
            client: { select: { name: true, code: true } },
          },
        },
        creator: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return {
      success: true,
      data: documents,
      meta: {
        total: documents.length,
      },
    };
  }

  async getDocument(documentId: string, companyId: string) {
    const document = await this.prisma.document.findFirst({
      where: {
        id: documentId,
        companyId,
      },
      include: {
        job: {
          select: {
            id: true,
            status: true,
            client: { select: { name: true, code: true } },
          },
        },
        creator: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    if (!document) {
      throw new NotFoundException('Document not found');
    }

    return {
      success: true,
      data: document,
    };
  }

  async getDocumentUrl(documentId: string, companyId: string, expiresIn: number = 3600) {
    const document = await this.prisma.document.findFirst({
      where: {
        id: documentId,
        companyId,
      },
    });

    if (!document) {
      throw new NotFoundException('Document not found');
    }

    // Ensure expiresIn has a valid default value (1 hour)
    const validExpiresIn = expiresIn || 3600;

    const signedUrl = await this.storageService.getSignedUrl(document.fileUrl, validExpiresIn);

    return {
      success: true,
      data: {
        url: signedUrl,
        expiresAt: new Date(Date.now() + validExpiresIn * 1000),
        fileName: document.fileName,
        mimeType: document.mimeType,
      },
    };
  }

  async deleteDocument(documentId: string, companyId: string) {
    const document = await this.prisma.document.findFirst({
      where: {
        id: documentId,
        companyId,
      },
    });

    if (!document) {
      throw new NotFoundException('Document not found');
    }

    // Delete from storage
    await this.storageService.deleteFile(document.fileUrl);

    // Delete from database
    await this.prisma.document.delete({
      where: { id: documentId },
    });

    this.logger.log(`Document deleted successfully: ${documentId}`);

    return {
      success: true,
      message: 'Document deleted successfully',
    };
  }

  async getOcrResults(documentId: string, companyId: string) {
    const document = await this.prisma.document.findFirst({
      where: {
        id: documentId,
        companyId,
      },
    });

    if (!document) {
      throw new NotFoundException('Document not found');
    }

    if (!document.ocrData) {
      return {
        success: true,
        data: null,
        message: 'OCR data not available for this document',
      };
    }

    return {
      success: true,
      data: document.ocrData,
    };
  }

  private async validateJobAccess(jobId: string, companyId: string) {
    const job = await this.prisma.job.findFirst({
      where: {
        id: jobId,
        companyId,
      },
    });

    if (!job) {
      throw new NotFoundException('Job not found or access denied');
    }

    return job;
  }

  private validateFile(file: Express.Multer.File) {
    const maxSize = 50 * 1024 * 1024; // 50MB
    const allowedTypes = [
      'application/pdf',
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/tiff',
      'image/tif',
    ];

    if (file.size > maxSize) {
      throw new BadRequestException(`File size exceeds ${maxSize / 1024 / 1024}MB limit`);
    }

    if (!allowedTypes.includes(file.mimetype)) {
      throw new BadRequestException(
        `Unsupported file type. Allowed types: ${allowedTypes.join(', ')}`,
      );
    }
  }

  private isOcrSupported(mimeType: string): boolean {
    const supportedTypes = [
      'application/pdf',
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/tiff',
      'image/tif',
    ];

    return supportedTypes.includes(mimeType);
  }

  private async processOcrAsync(documentId: string, fileUrl: string, mimeType: string) {
    try {
      this.logger.log(`Starting async OCR processing for document: ${documentId}`);

      // Get file buffer from storage
      const fileBuffer = await this.storageService.getFileBuffer(fileUrl);

      // Process OCR
      const ocrResult = await this.ocrService.processDocument(fileBuffer, mimeType);

      // Extract logistics-specific data
      const logisticsData = this.ocrService.extractLogisticsData(ocrResult.text);

      // Combine OCR result with extracted data
      const ocrData = {
        ...ocrResult,
        extractedData: logisticsData,
        processedAt: new Date().toISOString(),
      };

      // Update document with OCR results
      await this.prisma.document.update({
        where: { id: documentId },
        data: { ocrData },
      });

      this.logger.log(`OCR processing completed for document: ${documentId}`);
    } catch (error) {
      this.logger.error(
        `OCR processing failed for document ${documentId}: ${error.message}`,
        error.stack,
      );

      // Update document with error status
      await this.prisma.document.update({
        where: { id: documentId },
        data: {
          ocrData: {
            error: error.message,
            processedAt: new Date().toISOString(),
          },
        },
      });
    }
  }

  async checkBucketStatus() {
    try {
      const status = await this.storageService.checkBucketStatus();
      return {
        success: true,
        data: status,
      };
    } catch (error) {
      this.logger.error(`Failed to check bucket status: ${error.message}`, error.stack);
      return {
        success: false,
        error: error.message,
      };
    }
  }
}