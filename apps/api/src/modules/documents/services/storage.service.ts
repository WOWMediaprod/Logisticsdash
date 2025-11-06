import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class StorageService {
  private readonly logger = new Logger(StorageService.name);
  private readonly supabase: SupabaseClient;
  private readonly bucketName: string;

  constructor(private configService: ConfigService) {
    const supabaseUrl = this.configService.get('SUPABASE_URL');
    const supabaseKey = this.configService.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Missing required Supabase configuration: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
    }

    this.supabase = createClient(supabaseUrl, supabaseKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    this.bucketName = this.configService.get('SUPABASE_BUCKET', 'logistics-documents');
  }

  async uploadFile(
    file: Express.Multer.File,
    companyId: string,
    documentType: string,
    jobId?: string,
  ): Promise<{ fileUrl: string; fileName: string }> {
    try {
      // Sanitize filename and extract extension
      const sanitizedName = this.sanitizeFilename(file.originalname);
      const fileExtension = this.extractFileExtension(sanitizedName);
      const fileName = `${uuidv4()}${fileExtension}`;
      const filePath = this.generateFilePath(companyId, documentType, fileName, jobId);

      // Upload to Supabase Storage
      const { data, error } = await this.supabase.storage
        .from(this.bucketName)
        .upload(filePath, file.buffer, {
          contentType: file.mimetype,
          upsert: false,
        });

      if (error) {
        this.logger.error(`Supabase upload error: ${error.message}`, error);
        throw new Error(`File upload failed: ${error.message}`);
      }

      // Get public URL
      const { data: { publicUrl } } = this.supabase.storage
        .from(this.bucketName)
        .getPublicUrl(filePath);

      this.logger.log(`File uploaded successfully: ${filePath}`);

      return {
        fileUrl: publicUrl,
        fileName: sanitizedName,
      };
    } catch (error) {
      this.logger.error(`Failed to upload file: ${error.message}`, error.stack);
      throw new Error(`File upload failed: ${error.message}`);
    }
  }

  async deleteFile(fileUrl: string): Promise<void> {
    try {
      const filePath = this.extractPathFromUrl(fileUrl);

      const { error } = await this.supabase.storage
        .from(this.bucketName)
        .remove([filePath]);

      if (error) {
        this.logger.error(`Supabase delete error: ${error.message}`, error);
        throw new Error(`File deletion failed: ${error.message}`);
      }

      this.logger.log(`File deleted successfully: ${filePath}`);
    } catch (error) {
      this.logger.error(`Failed to delete file: ${error.message}`, error.stack);
      throw new Error(`File deletion failed: ${error.message}`);
    }
  }

  async getSignedUrl(fileUrl: string, expiresIn: number = 3600): Promise<string> {
    try {
      const filePath = this.extractPathFromUrl(fileUrl);

      const { data, error } = await this.supabase.storage
        .from(this.bucketName)
        .createSignedUrl(filePath, expiresIn);

      if (error) {
        this.logger.error(`Supabase signed URL error: ${error.message}`, error);
        throw new Error(`Signed URL generation failed: ${error.message}`);
      }

      return data.signedUrl;
    } catch (error) {
      this.logger.error(`Failed to generate signed URL: ${error.message}`, error.stack);
      throw new Error(`Signed URL generation failed: ${error.message}`);
    }
  }

  async getFileBuffer(fileUrl: string): Promise<Buffer> {
    try {
      const filePath = this.extractPathFromUrl(fileUrl);

      const { data, error } = await this.supabase.storage
        .from(this.bucketName)
        .download(filePath);

      if (error) {
        this.logger.error(`Supabase download error: ${error.message}`, error);
        throw new Error(`File retrieval failed: ${error.message}`);
      }

      // Convert Blob to Buffer
      const arrayBuffer = await data.arrayBuffer();
      return Buffer.from(arrayBuffer);
    } catch (error) {
      this.logger.error(`Failed to get file buffer: ${error.message}`, error.stack);
      throw new Error(`File retrieval failed: ${error.message}`);
    }
  }

  private generateFilePath(
    companyId: string,
    documentType: string,
    fileName: string,
    jobId?: string,
  ): string {
    const timestamp = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

    if (jobId) {
      return `companies/${companyId}/jobs/${jobId}/documents/${documentType}/${timestamp}/${fileName}`;
    }

    return `companies/${companyId}/documents/${documentType}/${timestamp}/${fileName}`;
  }

  private extractPathFromUrl(fileUrl: string): string {
    try {
      const url = new URL(fileUrl);
      // Extract path after /storage/v1/object/public/{bucket}/
      const pathParts = url.pathname.split(`/object/public/${this.bucketName}/`);
      if (pathParts.length > 1) {
        return pathParts[1];
      }
      // Fallback: remove leading slash
      return url.pathname.substring(1);
    } catch (error) {
      // If not a valid URL, assume it's already a path
      return fileUrl;
    }
  }

  /**
   * Sanitize filename by removing or replacing problematic characters
   * Handles WhatsApp images and other files with special characters
   */
  private sanitizeFilename(filename: string): string {
    // Replace problematic characters with safe alternatives
    let sanitized = filename
      .replace(/\s+/g, '_') // Replace spaces with underscores
      .replace(/[^\w\-_.]/g, '') // Remove all non-word chars except dash, underscore, and dot
      .replace(/_{2,}/g, '_') // Replace multiple underscores with single underscore
      .replace(/\.{2,}/g, '.'); // Replace multiple dots with single dot

    // Ensure filename is not empty after sanitization
    if (!sanitized || sanitized === '.') {
      sanitized = 'file';
    }

    return sanitized;
  }

  /**
   * Extract file extension robustly, handling complex filenames
   */
  private extractFileExtension(filename: string): string {
    const lastDotIndex = filename.lastIndexOf('.');

    // If there's a dot and it's not at the start or end
    if (lastDotIndex > 0 && lastDotIndex < filename.length - 1) {
      return filename.substring(lastDotIndex).toLowerCase();
    }

    // No valid extension found
    return '';
  }
}
