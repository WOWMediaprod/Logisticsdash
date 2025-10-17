import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as QRCode from 'qrcode';

@Injectable()
export class QrCodeService {
  private readonly logger = new Logger(QrCodeService.name);

  constructor(
    private configService: ConfigService
  ) {}

  async generateTripPackQR(jobData: any): Promise<{ qrCode: string; tripPack: any }> {
    try {
      const frontendUrl = this.configService.get('FRONTEND_URL', 'http://localhost:3000');

      const tripPackData = {
        jobId: jobData.id,
        client: jobData.client?.name || 'N/A',
        route: jobData.route ? `${jobData.route.origin} → ${jobData.route.destination}` : 'N/A',
        container: jobData.container?.iso || 'N/A',
        driver: jobData.driver?.name || 'Unassigned',
        vehicle: jobData.vehicle?.regNo || 'Unassigned',
        status: jobData.status,
        generatedAt: new Date().toISOString(),
      };

      const qrCodeUrl = `${frontendUrl}/trip-pack/${jobData.id}?data=${Buffer.from(JSON.stringify(tripPackData)).toString('base64')}`;
      const qrCode = await QRCode.toDataURL(qrCodeUrl, {
        errorCorrectionLevel: 'M',
        margin: 1,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        },
        width: 256
      });

      this.logger.log(`Generated trip pack QR code for job ${jobData.id}`);

      return {
        qrCode,
        tripPack: tripPackData
      };
    } catch (error) {
      this.logger.error(`Failed to generate trip pack QR code: ${error.message}`);
      throw new Error('QR code generation failed');
    }
  }

  async generateTrackingQR(jobId: string): Promise<string> {
    try {
      const frontendUrl = this.configService.get('FRONTEND_URL', 'http://localhost:3000');
      const trackingUrl = `${frontendUrl}/track/${jobId}`;

      const qrCode = await QRCode.toDataURL(trackingUrl, {
        errorCorrectionLevel: 'M',
        margin: 1,
        color: {
          dark: '#1F2937',
          light: '#FFFFFF'
        },
        width: 200
      });

      this.logger.log(`Generated tracking QR code for job ${jobId}`);
      return qrCode;
    } catch (error) {
      this.logger.error(`Failed to generate tracking QR code: ${error.message}`);
      throw new Error('QR code generation failed');
    }
  }

  async generateDeliveryQR(jobId: string): Promise<string> {
    try {
      const frontendUrl = this.configService.get('FRONTEND_URL', 'http://localhost:3000');
      const deliveryUrl = `${frontendUrl}/delivery-confirm/${jobId}`;

      const qrCode = await QRCode.toDataURL(deliveryUrl, {
        errorCorrectionLevel: 'M',
        margin: 1,
        color: {
          dark: '#059669',
          light: '#FFFFFF'
        },
        width: 200
      });

      this.logger.log(`Generated delivery QR code for job ${jobId}`);
      return qrCode;
    } catch (error) {
      this.logger.error(`Failed to generate delivery QR code: ${error.message}`);
      throw new Error('QR code generation failed');
    }
  }
}