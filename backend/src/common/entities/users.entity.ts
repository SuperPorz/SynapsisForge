// prettier-ignore
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, OneToMany, OneToOne } from 'typeorm';
import { Country, UserRole } from './enum/users.enum';
import { Payment } from './payments.entity';
import { StudentProfile } from './StudentProfile.entity';
import { InstructorProfile } from './InstructorProfile.entity';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ unique: true })
  email!: string;

  @Column()
  password!: string;

  @Column()
  first_name!: string;

  @Column()
  last_name!: string;

  @Column({ type: 'date' })
  birth_date!: Date;

  @Column({ type: 'enum', enum: Country })
  country!: Country;

  @Column({ type: 'enum', enum: UserRole, default: UserRole.STUDENT })
  role!: UserRole;

  @CreateDateColumn()
  createdAt!: Date;

  @Column({ default: true })
  is_active!: boolean;

  @Column({ type: 'varchar', nullable: true })
  refresh_token_hash!: string | null;

  @OneToMany(() => Payment, (payment) => payment.user)
  payments?: Payment[];

  @OneToOne(() => InstructorProfile, (profile) => profile.user)
  instructorProfile?: InstructorProfile;

  @OneToOne(() => StudentProfile, (profile) => profile.user)
  studentProfile?: StudentProfile;
}
