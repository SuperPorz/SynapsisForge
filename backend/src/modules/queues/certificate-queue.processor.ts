import { Processor, WorkerHost, OnWorkerEvent } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Certificate } from '../../common/entities/certificate.entity';
import { Enrollment } from '../../common/entities/enrollments.entity';
import { PdfService } from '../pdf/pdf.service';
import * as path from 'path';

@Processor('certificate')
export class CertificateQueueProcessor extends WorkerHost {
  private readonly logger = new Logger(CertificateQueueProcessor.name);

  constructor(
    @InjectRepository(Certificate)
    private certificateRepository: Repository<Certificate>,

    @InjectRepository(Enrollment)
    private enrollmentRepository: Repository<Enrollment>,

    private readonly pdfService: PdfService,
  ) {
    super();
  }

  async process(job: Job): Promise<void> {
    this.logger.log(`Processing certificate job: ${job.id}`);

    const { enrollmentId } = job.data as { enrollmentId: string };

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

    // 3. Generate PDF
    const studentName = `${enrollment.student.user.first_name} ${enrollment.student.user.last_name}`;
    const fileName = `certificate-${saved.id}.pdf`;
    const outputPath = path.join(process.cwd(), 'uploads', 'certificates', fileName);

    await this.pdfService.generateCertificate(
      {
        studentName,
        courseTitle: enrollment.course.title,
        issuedAt: saved.issued_at,
        certificateCode: saved.certificate_code,
      },
      outputPath,
    );

    // 4. Update certificate record with PDF URL
    const pdfUrl = `/uploads/certificates/${fileName}`;
    saved.pdf_url = pdfUrl;
    await this.certificateRepository.save(saved);

    this.logger.log(`Certificate ${saved.id} generated → ${pdfUrl}`);
  }

  @OnWorkerEvent('failed')
  async onFailed(job: Job | undefined, error: Error) {
    this.logger.error(`Certificate job ${job?.id} (enrollment: ${(job?.data as any)?.enrollmentId}) failed after ${job?.attemptsMade} attempts: ${error.message}`);
  }
}
