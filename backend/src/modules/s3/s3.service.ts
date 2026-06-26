import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  S3Client,
  GetObjectCommand,
  PutObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

@Injectable()
export class S3Service {
  private s3Client: S3Client;

  constructor(private configService: ConfigService) {
    this.s3Client = new S3Client({
      region: this.configService.get<string>('AWS_REGION', ''),
      credentials: {
        accessKeyId: this.configService.get<string>('AWS_ACCESS_KEY_ID', ''),
        secretAccessKey: this.configService.get<string>(
          'AWS_SECRET_ACCESS_KEY',
          '',
        ),
      },
    });
  }

  async generatePresignedPutUrl(
    key: string,
    contentType: string,
    expiresIn = 600,
  ): Promise<string> {
    const command = new PutObjectCommand({
      Bucket: this.configService.get<string>('S3_MEDIA_BUCKET', ''),
      Key: key,
      ContentType: contentType,
    });
    return getSignedUrl(this.s3Client, command, { expiresIn });
  }

  async generatePresignedGetUrl(
    key: string,
    bucket?: string,
    expiresIn = 3600,
  ): Promise<string> {
    const command = new GetObjectCommand({
      Bucket: bucket ?? this.configService.get<string>('S3_MEDIA_BUCKET', ''),
      Key: key,
    });
    return getSignedUrl(this.s3Client, command, { expiresIn });
  }

  getClient(): S3Client {
    return this.s3Client;
  }
}
