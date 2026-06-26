// prettier-ignore
import { BadRequestException, Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Certificate } from 'src/common/entities/certificate.entity';
import { Enrollment } from 'src/common/entities/enrollments.entity';
import { Repository } from 'typeorm';
import { S3Service } from '../s3/s3.service';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class CertificatesService {
  constructor(
    @InjectRepository(Certificate)
    private certificateRepository: Repository<Certificate>,

    @InjectRepository(Enrollment)
    private enrollmentRepository: Repository<Enrollment>,

    private readonly s3Service: S3Service,
    private readonly configService: ConfigService,
  ) {}

  async findOne(id: string): Promise<Certificate> {
    const certificate = await this.certificateRepository.findOne({
      where: { id: id },
    });

    if (!certificate) {
      throw new NotFoundException('Certificate not found');
    }
    return certificate;
  }

  async verify(certificate_code: string): Promise<object> {
    // cerco il certificato (lo metto in variabile 'cert')
    const cert = await this.certificateRepository.findOne({
      where: { certificate_code: certificate_code },
      // prettier-ignore
      relations: ['enrollment', 'enrollment.student', 'enrollment.student.user', 'enrollment.course'],
    });

    if (!cert) {
      throw new NotFoundException('Certificate not found');
    }

    return {
      certificate_code: cert.certificate_code,
      issued_at: cert.issued_at,
      is_valid: cert.is_valid,
      student_name: `${cert.enrollment.student.user.first_name} ${cert.enrollment.student.user.last_name}`,
      course_title: cert.enrollment.course.title,
    };
  }

  async findByUser(userId: string): Promise<
    {
      id: string;
      issued_at: Date;
      pdf_url: string;
      is_valid: boolean;
      certificate_code: string;
      courseTitle: string;
      courseId: string;
      s3_key: string | null;
    }[]
  > {
    const certificates = await this.certificateRepository
      .createQueryBuilder('cert')
      .innerJoinAndSelect('cert.enrollment', 'enrollment')
      .innerJoin('enrollment.student', 'student')
      .innerJoin('enrollment.course', 'course')
      .where('student.userId = :userId', { userId })
      .select([
        'cert.id',
        'cert.issued_at',
        'cert.pdf_url',
        'cert.is_valid',
        'cert.certificate_code',
        'cert.s3_key',
        'course.title',
        'course.id',
      ])
      .orderBy('cert.issued_at', 'DESC')
      .getRawMany();

    return certificates.map((c) => ({
      id: c.cert_id,
      issued_at: c.cert_issued_at,
      pdf_url: c.cert_pdf_url,
      is_valid: c.cert_is_valid,
      certificate_code: c.cert_certificate_code,
      s3_key: c.cert_s3_key ?? null,
      courseTitle: c.course_title,
      courseId: c.course_id,
    }));
  }

  async download(id: string, userId: string): Promise<{ downloadUrl: string }> {
    const certificate = await this.certificateRepository.findOne({
      where: { id },
      relations: ['enrollment', 'enrollment.student'],
    });

    if (!certificate) {
      throw new NotFoundException('Certificate not found');
    }

    if (certificate.enrollment.student.userId !== userId) {
      throw new ForbiddenException('Access denied');
    }

    if (!certificate.is_valid) {
      throw new BadRequestException('Certificate is revoked');
    }

    const s3Key = certificate.s3_key;
    if (!s3Key) {
      throw new NotFoundException('Certificate file not found on storage');
    }

    const privateBucket = this.configService.get<string>(
      'S3_PRIVATE_BUCKET',
      'synapsisforge-private',
    );

    const downloadUrl = await this.s3Service.generatePresignedGetUrl(
      s3Key,
      privateBucket,
      3600,
    );

    return { downloadUrl };
  }

  async revoke(id: string): Promise<void> {
    const certificate = await this.certificateRepository.findOne({
      where: { id: id },
    });

    if (!certificate) {
      throw new NotFoundException('Certificate not found');
    }

    // se già revocato
    if (!certificate.is_valid) {
      throw new BadRequestException('Certificate is already revoked');
    }

    certificate.is_valid = false;
    await this.certificateRepository.save(certificate);
  }
}
