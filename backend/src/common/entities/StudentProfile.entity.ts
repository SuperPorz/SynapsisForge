// prettier-ignore
import { Entity, JoinColumn, OneToMany, OneToOne, PrimaryColumn } from 'typeorm';
import { User } from './users.entity';
import { Enrollment } from './enrollments.entity';

@Entity('student_profiles')
export class StudentProfile {
  @PrimaryColumn({ type: 'uuid' })
  userId!: string;

  @OneToOne(() => User, (user) => user.studentProfile)
  @JoinColumn({ name: 'userId' })
  user!: User;

  // prettier-ignore
  @OneToMany(() => Enrollment, (enrollment) => enrollment.student)
  enrollments?: Enrollment[] | null;
}
