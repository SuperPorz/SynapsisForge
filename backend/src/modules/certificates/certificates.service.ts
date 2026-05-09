// prettier-ignore
import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { InjectRepository } from '@nestjs/typeorm';
import { Certificate } from 'src/common/entities/certificate.entity';
import { Enrollment } from 'src/common/entities/enrollments.entity';
import { Repository } from 'typeorm';

@Injectable()
export class CertificatesService {
  constructor(
    @InjectRepository(Certificate)
    private certificateRepository: Repository<Certificate>,

    @InjectRepository(Enrollment)
    private enrollmentRepository: Repository<Enrollment>,
  ) {}

  @OnEvent('enrollment.completed')
  async create(payload: { enrollmentId: string }): Promise<void> {
    const enrollment = await this.enrollmentRepository.findOne({
      where: { id: payload.enrollmentId },
    });

    if (!enrollment) {
      throw new NotFoundException(`Enrollment ${payload.enrollmentId} not found`);
    }

    const certificate = this.certificateRepository.create({
      enrollment,
      pdf_url: `something/${payload.enrollmentId}`, //da modificare più avanti
    });

    await this.certificateRepository.save(certificate);
  }

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
