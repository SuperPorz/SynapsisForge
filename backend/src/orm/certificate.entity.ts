// prettier-ignore
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne } from 'typeorm';
import { Enrollment } from './enrollments.entity';

@Entity('certificates')
export class Certificate {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ManyToOne(() => Enrollment, { nullable: false })
  enrollment!: Enrollment;

  @CreateDateColumn()
  issued_at!: Date;

  @Column({ type: 'text', nullable: true })
  pdf_url!: string;
}
