import { Module } from '@nestjs/common';
import { CertificatesService } from './certificates.service';
import { CertificatesController } from './certificates.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Certificate } from 'src/common/entities/certificate.entity';
import { Enrollment } from 'src/common/entities/enrollments.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Certificate, Enrollment])],
  controllers: [CertificatesController],
  providers: [CertificatesService],
})
export class CertificatesModule {}
