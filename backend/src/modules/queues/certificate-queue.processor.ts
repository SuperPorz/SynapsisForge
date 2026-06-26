import { Processor, WorkerHost, OnWorkerEvent } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs';
import * as path from 'path';
import { Certificate } from '../../common/entities/certificate.entity';
import { Enrollment } from '../../common/entities/enrollments.entity';
import { PdfService } from '../pdf/pdf.service';
import { S3Service } from '../s3/s3.service';

@Processor('certificate')
export class CertificateQueueProcessor extends WorkerHost {
  private readonly logger = new Logger(CertificateQueueProcessor.name);

  constructor(
    @InjectRepository(Certificate)
    private certificateRepository: Repository<Certificate>,

    @InjectRepository(Enrollment)
    private enrollmentRepository: Repository<Enrollment>,

    private readonly pdfService: PdfService,
    private readonly s3Service: S3Service,
    private readonly configService: ConfigService,
  ) {
    super();
  }

  async process(job: Job): Promise<void> {
    this.logger.log(`Processing certificate job: ${job.id}`);

    const { enrollmentId } = job.data as { enrollmentId: string };
    const useS3 = this.configService.get<string>('USE_S3', 'false') === 'true';

    // 1. Load enrollment with relations
    const enrollment = await this.enrollmentRepository.findOne({
      where: { id: enrollmentId },
      relations: { student: { user: true }, course: true },
    });

    if (!enrollment) {
      throw new NotFoundException(`Enrollment ${enrollmentId} not found`);
    }

    // 2. Create certificate record
    const certificate = this.certificateRepository.create({
      enrollment,
      pdf_url: '',
    });

    const saved = await this.certificateRepository.save(certificate);

    // 3. Generate PDF Buffer
    const studentName = `${enrollment.student.user.first_name} ${enrollment.student.user.last_name}`;
    const pdfBuffer = await this.pdfService.generateCertificate({
      studentName,
      courseTitle: enrollment.course.title,
      issuedAt: saved.issued_at,
      certificateCode: saved.certificate_code,
    });

    if (useS3) {
      // 4a. Upload to S3 synapsisforge-private bucket
      const s3Key = `certificates/${saved.id}.pdf`;
      const privateBucket = this.configService.get<string>(
        'S3_PRIVATE_BUCKET',
        'synapsisforge-private',
      );

      await this.s3Service.putObject(s3Key, pdfBuffer, 'application/pdf', privateBucket);

      // 5a. Update certificate record with s3_key
      saved.s3_key = s3Key;
      await this.certificateRepository.save(saved);

      this.logger.log(`Certificate ${saved.id} generated → s3://${privateBucket}/${s3Key}`);
    } else {
      // 4b. Fallback: write to local filesystem
      const fileName = `certificate-${saved.id}.pdf`;
      const outputDir = path.join(process.cwd(), 'uploads', 'certificates');
      const outputPath = path.join(outputDir, fileName);

      fs.mkdirSync(outputDir, { recursive: true });
      fs.writeFileSync(outputPath, pdfBuffer);

      // 5b. Update certificate record with local pdf_url
      saved.pdf_url = `/uploads/certificates/${fileName}`;
      await this.certificateRepository.save(saved);

      this.logger.log(`Certificate ${saved.id} generated → ${outputPath}`);
    }
  }

  @OnWorkerEvent('failed')
  async onFailed(job: Job | undefined, error: Error) {
    this.logger.error(
      `Certificate job ${job?.id} (enrollment: ${job?.data?.enrollmentId}) failed after ${job?.attemptsMade} attempts: ${error.message}`,
    );
  }
}
