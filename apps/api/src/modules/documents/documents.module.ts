import { Module } from '@nestjs/common';
import { DocumentsController } from './documents.controller';
import { DocumentsService } from './documents.service';
import { StorageService } from './services/storage.service';
import { OcrService } from './services/ocr.service';

@Module({
  controllers: [DocumentsController],
  providers: [DocumentsService, StorageService, OcrService],
  exports: [DocumentsService],
})
export class DocumentsModule {}