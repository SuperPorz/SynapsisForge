// prettier-ignore
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, OneToOne, JoinColumn, Generated } from 'typeorm';
import { Enrollment } from './enrollments.entity';

@Entity('certificates')
export class Certificate {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @OneToOne(() => Enrollment, {
    nullable: false,
  })
  @JoinColumn()
  enrollment!: Enrollment;

  @CreateDateColumn()
  issued_at!: Date;

  @Column({ type: 'text' })
  pdf_url!: string;

  @Column({ type: 'varchar', nullable: true })
  s3_key?: string;

  @Column({ type: 'boolean', default: true })
  is_valid!: boolean;

  @Generated('uuid')
  @Column({ type: 'uuid', unique: true })
  certificate_code!: string;
}
