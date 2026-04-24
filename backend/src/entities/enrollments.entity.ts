// prettier-ignore
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, OneToOne } from 'typeorm';
import { User } from './users.entity';
import { Course } from './courses.entity';
import { Certificate } from './certificate.entity';
import { Review } from './reviews.entity';

@Entity('enrollments')
export class Enrollment {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ManyToOne(() => User, { nullable: false })
  user!: User;

  @ManyToOne(() => Course, { nullable: false })
  course!: Course;

  @Column({ type: 'int' })
  progress_percent!: number;

  @CreateDateColumn()
  enrolled_at!: Date;

  @Column({ type: 'timestamp', nullable: true })
  completed_at: Date | null = null;

  @OneToOne(() => Certificate, (certificate) => certificate.enrollment, {
    nullable: true, // l'enrollment può non avere ancora un certificato
    eager: false, // non caricarla sempre automaticamente
  })
  certificate: Certificate | null = null;

  @OneToOne(() => Review, (review) => review.enrollment, { nullable: true })
  review: Review | null = null;
}
