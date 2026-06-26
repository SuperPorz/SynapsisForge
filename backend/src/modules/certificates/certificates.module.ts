import { Module } from '@nestjs/common';
import { CertificatesService } from './certificates.service';
import { CertificatesController } from './certificates.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Certificate } from 'src/common/entities/certificate.entity';
import { Enrollment } from 'src/common/entities/enrollments.entity';
import { S3Module } from '../s3/s3.module';

@Module({
  imports: [TypeOrmModule.forFeature([Certificate, Enrollment]), S3Module],
  controllers: [CertificatesController],
  providers: [CertificatesService],
})
export class CertificatesModule {}
