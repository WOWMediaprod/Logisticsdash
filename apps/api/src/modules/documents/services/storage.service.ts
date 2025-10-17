import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as AWS from 'aws-sdk';
import { v4 as uuidv4 } from 'uuid';
import * as path from 'path';

@Injectable()
export class StorageService {
  private readonly logger = new Logger(StorageService.name);
  private readonly s3: AWS.S3;
  private readonly bucketName: string;

  constructor(private configService: ConfigService) {
    const endpoint = this.configService.get('S3_ENDPOINT');
    const accessKey = this.configService.get('S3_ACCESS_KEY');
    const secretKey = this.configService.get('S3_SECRET_KEY');
    const region = this.configService.get('S3_REGION', 'us-east-1');

    this.bucketName = this.configService.get('S3_BUCKET', 'logistics-assets');

    this.s3 = new AWS.S3({
      endpoint,
      accessKeyId: accessKey,
      secretAccessKey: secretKey,
      region,
      s3ForcePathStyle: true, // Required for Minio
      signatureVersion: 'v4',
    });
  }

  async uploadFile(
    file: Express.Multer.File,
    companyId: string,
    documentType: string,
    jobId?: string,
  ): Promise<{ fileUrl: string; fileName: string }> {
    try {
      const fileExtension = path.extname(file.originalname);
      const fileName = `${uuidv4()}${fileExtension}`;
      const key = this.generateFileKey(companyId, documentType, fileName, jobId);

      const params: AWS.S3.PutObjectRequest = {
        Bucket: this.bucketName,
        Key: key,
        Body: file.buffer,
        ContentType: file.mimetype,
        Metadata: {
          originalName: file.originalname,
          companyId,
          documentType,
          ...(jobId && { jobId }),
        },
      };

      const result = await this.s3.upload(params).promise();

      this.logger.log(`File uploaded successfully: ${key}`);

      return {
        fileUrl: result.Location,
        fileName: file.originalname,
      };
    } catch (error) {
      this.logger.error(`Failed to upload file: ${error.message}`, error.stack);
      throw new Error(`File upload failed: ${error.message}`);
    }
  }

  async deleteFile(fileUrl: string): Promise<void> {
    try {
      const key = this.extractKeyFromUrl(fileUrl);

      const params: AWS.S3.DeleteObjectRequest = {
        Bucket: this.bucketName,
        Key: key,
      };

      await this.s3.deleteObject(params).promise();
      this.logger.log(`File deleted successfully: ${key}`);
    } catch (error) {
      this.logger.error(`Failed to delete file: ${error.message}`, error.stack);
      throw new Error(`File deletion failed: ${error.message}`);
    }
  }

  async getSignedUrl(fileUrl: string, expiresIn: number = 3600): Promise<string> {
    try {
      const key = this.extractKeyFromUrl(fileUrl);

      const params = {
        Bucket: this.bucketName,
        Key: key,
        Expires: expiresIn,
      };

      return this.s3.getSignedUrl('getObject', params);
    } catch (error) {
      this.logger.error(`Failed to generate signed URL: ${error.message}`, error.stack);
      throw new Error(`Signed URL generation failed: ${error.message}`);
    }
  }

  async getFileBuffer(fileUrl: string): Promise<Buffer> {
    try {
      const key = this.extractKeyFromUrl(fileUrl);

      const params: AWS.S3.GetObjectRequest = {
        Bucket: this.bucketName,
        Key: key,
      };

      const result = await this.s3.getObject(params).promise();
      return result.Body as Buffer;
    } catch (error) {
      this.logger.error(`Failed to get file buffer: ${error.message}`, error.stack);
      throw new Error(`File retrieval failed: ${error.message}`);
    }
  }

  private generateFileKey(
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

  private extractKeyFromUrl(fileUrl: string): string {
    // Extract key from S3/Minio URL
    const url = new URL(fileUrl);
    // Remove leading slash from pathname
    return url.pathname.substring(1);
  }
}