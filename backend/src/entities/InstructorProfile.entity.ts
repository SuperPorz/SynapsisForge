// prettier-ignore
import { Entity, JoinColumn, OneToMany, OneToOne, PrimaryColumn } from 'typeorm';
import { User } from './users.entity';
import { Course } from './courses.entity';

@Entity('instructor_profiles')
export class InstructorProfile {
  @PrimaryColumn()
  userId!: string;

  @OneToOne(() => User, (user) => user.instructorProfile)
  @JoinColumn({ name: 'userId' })
  user!: User;

  @OneToMany(() => Course, (course) => course.instructor)
  courses?: Course[] | null;
}
