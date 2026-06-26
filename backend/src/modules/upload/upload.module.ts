import { Module } from '@nestjs/common';
import { UploadController } from './upload.controller';
import { S3Module } from '../s3/s3.module';

@Module({
  imports: [S3Module],
  controllers: [UploadController],
})
export class UploadModule {}
