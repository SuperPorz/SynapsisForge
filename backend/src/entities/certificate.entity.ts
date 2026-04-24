// prettier-ignore
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, OneToOne, JoinColumn } from 'typeorm';
import { Enrollment } from './enrollments.entity';

@Entity('certificates')
export class Certificate {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @OneToOne(() => Enrollment, (enrollment) => enrollment.certificate, {
    nullable: false,
  })
  @JoinColumn()
  enrollment!: Enrollment;

  @CreateDateColumn()
  issued_at!: Date;

  @Column({ type: 'text', nullable: true })
  pdf_url: string | null = null;
}
