import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as Tesseract from 'tesseract.js';

export interface OcrResult {
  text: string;
  confidence: number;
  words: Array<{
    text: string;
    confidence: number;
    bbox: {
      x0: number;
      y0: number;
      x1: number;
      y1: number;
    };
  }>;
  lines: Array<{
    text: string;
    confidence: number;
    bbox: {
      x0: number;
      y0: number;
      x1: number;
      y1: number;
    };
  }>;
  pages: number;
  processingTimeMs: number;
}

@Injectable()
export class OcrService {
  private readonly logger = new Logger(OcrService.name);

  constructor(private configService: ConfigService) {}

  async extractTextFromImage(fileBuffer: Buffer, mimeType: string): Promise<OcrResult> {
    const startTime = Date.now();

    try {
      this.logger.log('Starting OCR processing...');

      // Initialize Tesseract with English language
      const result = await Tesseract.recognize(fileBuffer, 'eng', {
        logger: (m) => {
          if (m.status === 'recognizing text') {
            this.logger.debug(`OCR Progress: ${Math.round(m.progress * 100)}%`);
          }
        },
      });

      const processingTime = Date.now() - startTime;

      this.logger.log(
        `OCR completed in ${processingTime}ms with confidence: ${result.data.confidence}%`,
      );

      // Extract structured data from Tesseract result
      const resultData = result.data as any;
      const ocrResult: OcrResult = {
        text: resultData.text,
        confidence: resultData.confidence,
        words: (resultData.words || []).map((word: any) => ({
          text: word.text,
          confidence: word.confidence,
          bbox: {
            x0: word.bbox?.x0 || 0,
            y0: word.bbox?.y0 || 0,
            x1: word.bbox?.x1 || 0,
            y1: word.bbox?.y1 || 0,
          },
        })),
        lines: (resultData.lines || []).map((line: any) => ({
          text: line.text,
          confidence: line.confidence,
          bbox: {
            x0: line.bbox?.x0 || 0,
            y0: line.bbox?.y0 || 0,
            x1: line.bbox?.x1 || 0,
            y1: line.bbox?.y1 || 0,
          },
        })),
        pages: 1, // Single image
        processingTimeMs: processingTime,
      };

      return ocrResult;
    } catch (error) {
      this.logger.error(`OCR processing failed: ${error.message}`, error.stack);
      throw new Error(`OCR processing failed: ${error.message}`);
    }
  }

  async extractTextFromPdf(fileBuffer: Buffer): Promise<OcrResult> {
    const startTime = Date.now();

    try {
      this.logger.log('Starting PDF OCR processing...');

      // For PDFs, we'll use a simplified approach
      // In production, you might want to use pdf2pic + Tesseract for each page
      const result = await Tesseract.recognize(fileBuffer, 'eng', {
        logger: (m) => {
          if (m.status === 'recognizing text') {
            this.logger.debug(`PDF OCR Progress: ${Math.round(m.progress * 100)}%`);
          }
        },
      });

      const processingTime = Date.now() - startTime;

      this.logger.log(
        `PDF OCR completed in ${processingTime}ms with confidence: ${result.data.confidence}%`,
      );

      const resultData = result.data as any;
      const ocrResult: OcrResult = {
        text: resultData.text,
        confidence: resultData.confidence,
        words: (resultData.words || []).map((word: any) => ({
          text: word.text,
          confidence: word.confidence,
          bbox: {
            x0: word.bbox?.x0 || 0,
            y0: word.bbox?.y0 || 0,
            x1: word.bbox?.x1 || 0,
            y1: word.bbox?.y1 || 0,
          },
        })),
        lines: (resultData.lines || []).map((line: any) => ({
          text: line.text,
          confidence: line.confidence,
          bbox: {
            x0: line.bbox?.x0 || 0,
            y0: line.bbox?.y0 || 0,
            x1: line.bbox?.x1 || 0,
            y1: line.bbox?.y1 || 0,
          },
        })),
        pages: 1, // Simplified for now
        processingTimeMs: processingTime,
      };

      return ocrResult;
    } catch (error) {
      this.logger.error(`PDF OCR processing failed: ${error.message}`, error.stack);
      throw new Error(`PDF OCR processing failed: ${error.message}`);
    }
  }

  async processDocument(fileBuffer: Buffer, mimeType: string): Promise<OcrResult> {
    this.logger.log(`Processing document with MIME type: ${mimeType}`);

    if (mimeType.startsWith('image/')) {
      return this.extractTextFromImage(fileBuffer, mimeType);
    } else if (mimeType === 'application/pdf') {
      return this.extractTextFromPdf(fileBuffer);
    } else {
      throw new Error(`Unsupported file type for OCR: ${mimeType}`);
    }
  }

  /**
   * Extract key logistics information from OCR text
   * This can be enhanced with AI/NLP for better extraction
   */
  extractLogisticsData(ocrText: string): Record<string, any> {
    const extractedData: Record<string, any> = {};

    // Extract container numbers (basic regex patterns)
    const containerPattern = /[A-Z]{4}\d{7}/g;
    const containers = ocrText.match(containerPattern);
    if (containers) {
      extractedData.containerNumbers = containers;
    }

    // Extract dates (MM/DD/YYYY or DD/MM/YYYY format)
    const datePattern = /\d{1,2}[\/\-]\d{1,2}[\/\-]\d{4}/g;
    const dates = ocrText.match(datePattern);
    if (dates) {
      extractedData.dates = dates;
    }

    // Extract amounts (currency format)
    const amountPattern = /[\$₹€£]\d{1,3}(?:,\d{3})*(?:\.\d{2})?/g;
    const amounts = ocrText.match(amountPattern);
    if (amounts) {
      extractedData.amounts = amounts;
    }

    // Extract phone numbers
    const phonePattern = /\+?\d{1,3}[-.\s]?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/g;
    const phoneNumbers = ocrText.match(phonePattern);
    if (phoneNumbers) {
      extractedData.phoneNumbers = phoneNumbers;
    }

    // Extract email addresses
    const emailPattern = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
    const emails = ocrText.match(emailPattern);
    if (emails) {
      extractedData.emails = emails;
    }

    this.logger.log('Extracted logistics data:', extractedData);

    return extractedData;
  }
}