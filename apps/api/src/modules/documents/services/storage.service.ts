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

      this.logger.log(`Starting Supabase upload:`, {
        bucket: this.bucketName,
        filePath,
        fileName: sanitizedName,
        fileSize: file.size,
        mimeType: file.mimetype,
        companyId,
        documentType,
      });

      // Upload to Supabase Storage
      const { data, error } = await this.supabase.storage
        .from(this.bucketName)
        .upload(filePath, file.buffer, {
          contentType: file.mimetype,
          upsert: false,
        });

      if (error) {
        this.logger.error(`Supabase upload error:`, {
          message: error.message,
          name: error.name,
          bucket: this.bucketName,
          filePath,
          fileName: sanitizedName,
          fullError: JSON.stringify(error),
        });
        throw new Error(`File upload failed: ${error.message}`);
      }

      this.logger.log(`Supabase upload succeeded, data:`, data);

      // Get public URL
      const { data: { publicUrl } } = this.supabase.storage
        .from(this.bucketName)
        .getPublicUrl(filePath);

      this.logger.log(`File uploaded successfully:`, {
        filePath,
        publicUrl,
        bucket: this.bucketName,
      });

      return {
        fileUrl: publicUrl,
        fileName: sanitizedName,
      };
    } catch (error) {
      this.logger.error(`Failed to upload file:`, {
        error: error.message,
        stack: error.stack,
        fileName: file.originalname,
      });
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
      // Log the input URL for debugging
      this.logger.log(`Generating signed URL for: ${fileUrl}`);

      const filePath = this.extractPathFromUrl(fileUrl);
      this.logger.log(`Extracted file path: ${filePath}`);
      this.logger.log(`Using bucket: ${this.bucketName}`);

      const { data, error } = await this.supabase.storage
        .from(this.bucketName)
        .createSignedUrl(filePath, expiresIn);

      if (error) {
        this.logger.error(`Supabase signed URL error: ${JSON.stringify(error)}`, error);
        this.logger.error(`Failed for fileUrl: ${fileUrl}, extracted path: ${filePath}`);
        throw new Error(`Signed URL generation failed: ${error.message}`);
      }

      if (!data || !data.signedUrl) {
        this.logger.error(`No signed URL returned for path: ${filePath}`);
        throw new Error('Signed URL generation returned no URL');
      }

      this.logger.log(`Successfully generated signed URL`);
      return data.signedUrl;
    } catch (error) {
      this.logger.error(`Failed to generate signed URL: ${error.message}`, error.stack);
      this.logger.error(`Original fileUrl: ${fileUrl}`);
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
      // Log for debugging
      this.logger.log(`Extracting path from URL: ${fileUrl}`);

      // If it's already just a path (doesn't start with http), return as-is
      if (!fileUrl.startsWith('http')) {
        this.logger.log(`Not a URL, treating as path: ${fileUrl}`);
        return fileUrl;
      }

      const url = new URL(fileUrl);

      // Handle Supabase public URLs
      // Format: https://[project].supabase.co/storage/v1/object/public/[bucket]/[path]
      const publicPattern = `/storage/v1/object/public/${this.bucketName}/`;
      if (url.pathname.includes(publicPattern)) {
        const pathParts = url.pathname.split(publicPattern);
        if (pathParts.length > 1) {
          const extractedPath = pathParts[1];
          this.logger.log(`Extracted path from public URL: ${extractedPath}`);
          return extractedPath;
        }
      }

      // Handle Supabase signed URLs (they might have different format)
      // Format: https://[project].supabase.co/storage/v1/object/sign/[bucket]/[path]
      const signedPattern = `/storage/v1/object/sign/${this.bucketName}/`;
      if (url.pathname.includes(signedPattern)) {
        const pathParts = url.pathname.split(signedPattern);
        if (pathParts.length > 1) {
          const extractedPath = pathParts[1].split('?')[0]; // Remove query params
          this.logger.log(`Extracted path from signed URL: ${extractedPath}`);
          return extractedPath;
        }
      }

      // Handle legacy format or other patterns
      // If URL contains the bucket name anywhere, extract after it
      if (url.pathname.includes(this.bucketName)) {
        const parts = url.pathname.split(this.bucketName + '/');
        if (parts.length > 1) {
          const extractedPath = parts[1];
          this.logger.log(`Extracted path using bucket name: ${extractedPath}`);
          return extractedPath;
        }
      }

      // Last fallback: remove leading slash from pathname
      const fallbackPath = url.pathname.startsWith('/')
        ? url.pathname.substring(1)
        : url.pathname;
      this.logger.log(`Using fallback path extraction: ${fallbackPath}`);
      return fallbackPath;
    } catch (error) {
      // If not a valid URL, assume it's already a path
      this.logger.log(`URL parsing failed, treating as path: ${fileUrl}`);
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

  /**
   * Check Supabase bucket status and configuration
   */
  async checkBucketStatus(): Promise<{
    bucketName: string;
    exists: boolean;
    isPublic: boolean | null;
    fileCount: number | null;
    error: string | null;
    supabaseUrl: string;
  }> {
    try {
      this.logger.log(`Checking bucket status for: ${this.bucketName}`);

      // Try to list files in the bucket
      const { data: files, error: listError } = await this.supabase.storage
        .from(this.bucketName)
        .list('', {
          limit: 1,
        });

      if (listError) {
        this.logger.error(`Bucket list error:`, listError);

        // Check if bucket doesn't exist (404 error)
        if (listError.message?.includes('not found') || listError.message?.includes('404')) {
          return {
            bucketName: this.bucketName,
            exists: false,
            isPublic: null,
            fileCount: null,
            error: `Bucket "${this.bucketName}" does not exist`,
            supabaseUrl: this.configService.get('SUPABASE_URL'),
          };
        }

        return {
          bucketName: this.bucketName,
          exists: false,
          isPublic: null,
          fileCount: null,
          error: listError.message,
          supabaseUrl: this.configService.get('SUPABASE_URL'),
        };
      }

      // Try to get bucket details
      const { data: buckets, error: bucketsError } = await this.supabase.storage.listBuckets();

      let isPublic = null;
      if (!bucketsError && buckets) {
        const bucket = buckets.find(b => b.name === this.bucketName);
        isPublic = bucket?.public || false;
      }

      this.logger.log(`Bucket status check successful:`, {
        exists: true,
        isPublic,
        fileCount: files?.length || 0,
      });

      return {
        bucketName: this.bucketName,
        exists: true,
        isPublic,
        fileCount: files?.length || 0,
        error: null,
        supabaseUrl: this.configService.get('SUPABASE_URL'),
      };
    } catch (error) {
      this.logger.error(`Failed to check bucket status:`, error);
      return {
        bucketName: this.bucketName,
        exists: false,
        isPublic: null,
        fileCount: null,
        error: error.message,
        supabaseUrl: this.configService.get('SUPABASE_URL'),
      };
    }
  }
}
