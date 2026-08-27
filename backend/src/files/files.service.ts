import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class FilesService {
  private readonly logger = new Logger(FilesService.name);
  private s3Client: S3Client | null = null;
  private bucketName: string;

  constructor() {
    const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
    const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;
    const region = process.env.AWS_REGION || 'us-east-1';
    this.bucketName = process.env.S3_BUCKET_NAME || 'lpu-mentorconnect-assets';

    if (accessKeyId && accessKeyId !== 'mock_key') {
      const config: any = {
        region,
        credentials: {
          accessKeyId,
          secretAccessKey,
        },
      };

      // Custom endpoint for Cloudflare R2
      if (process.env.S3_ENDPOINT) {
        config.endpoint = process.env.S3_ENDPOINT;
        config.forcePathStyle = true;
      }

      this.s3Client = new S3Client(config);
    }
  }

  async getPresignedUploadUrl(userId: string, fileName: string, fileType: string) {
    const allowedMimeTypes = [
      'image/jpeg',
      'image/png',
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ];

    if (!allowedMimeTypes.includes(fileType)) {
      throw new BadRequestException('MIME type not allowed. Supported: JPEG, PNG, PDF, DOC, DOCX');
    }

    const fileExtension = fileName.split('.').pop();
    const uniqueKey = `verifications/${userId}/${uuidv4()}.${fileExtension}`;

    if (this.s3Client) {
      try {
        const command = new PutObjectCommand({
          Bucket: this.bucketName,
          Key: uniqueKey,
          ContentType: fileType,
        });

        // URL expires in 15 minutes
        const uploadUrl = await getSignedUrl(this.s3Client, command, { expiresIn: 900 });
        const publicUrl = process.env.S3_ENDPOINT
          ? `${process.env.S3_ENDPOINT}/${this.bucketName}/${uniqueKey}`
          : `https://${this.bucketName}.s3.${process.env.AWS_REGION || 'us-east-1'}.amazonaws.com/${uniqueKey}`;

        return {
          uploadUrl,
          publicUrl,
          key: uniqueKey,
        };
      } catch (err) {
        this.logger.error(`S3 presigned URL generation failed: ${err.message}`);
        throw new BadRequestException('Failed to generate upload URL');
      }
    } else {
      // Local dev mock fallback
      this.logger.log(`Mocking upload URL generation for file: ${fileName}`);
      const mockKey = `uploads/mock-${uuidv4()}-${fileName}`;
      return {
        uploadUrl: `${process.env.APP_URL || 'http://localhost:3001'}/api/v1/files/mock-upload?key=${mockKey}`,
        publicUrl: `${process.env.APP_URL || 'http://localhost:3001'}/api/v1/files/mock-download/${mockKey}`,
        key: mockKey,
      };
    }
  }
}
