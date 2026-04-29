// prettier-ignore
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne } from 'typeorm';
import { Course } from './courses.entity';
import { StudentProfile } from './StudentProfile.entity';

@Entity('enrollments')
export class Enrollment {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ManyToOne(() => StudentProfile, { nullable: false })
  student!: StudentProfile;

  @ManyToOne(() => Course, { nullable: false })
  course!: Course;

  @Column({ type: 'int' })
  progress_percent!: number;

  @CreateDateColumn()
  enrolled_at!: Date;

  @Column({ type: 'timestamp', nullable: true })
  completed_at: Date | null = null;
}
