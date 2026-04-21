// prettier-ignore
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne } from 'typeorm';
import { User } from './users.entity';
import { Course } from './courses.entity';

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
  completed_at!: Date | null;
}
