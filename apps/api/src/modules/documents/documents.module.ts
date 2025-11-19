import { Module, forwardRef } from '@nestjs/common';
import { DocumentsController } from './documents.controller';
import { DocumentsService } from './documents.service';
import { StorageService } from './services/storage.service';
import { OcrService } from './services/ocr.service';
import { TrackingV2Module } from '../tracking-v2/tracking-v2.module';

@Module({
  imports: [forwardRef(() => TrackingV2Module)],
  controllers: [DocumentsController],
  providers: [DocumentsService, StorageService, OcrService],
  exports: [DocumentsService],
})
export class DocumentsModule {}