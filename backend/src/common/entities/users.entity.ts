// prettier-ignore
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, OneToMany, OneToOne } from 'typeorm';
import { Country, UserRole, SubscriptionPlan } from './enum/users.enum';
import { Payment } from './payments.entity';
import { CartItem } from './cart-item.entity';
import { StudentProfile } from './student-profile.entity';
import { InstructorProfile } from './instructor-profile.entity';
import { UserProviders } from './user_providers.entity';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', unique: true, nullable: true })
  email!: string | null;

  @Column({ type: 'varchar', nullable: true })
  password!: string | null;

  @Column()
  first_name!: string;

  @Column()
  last_name!: string;

  @Column({ type: 'date', nullable: true })
  birth_date!: Date | null;

  @Column({ type: 'enum', enum: Country, nullable: true })
  country!: Country | null;

  @Column({ type: 'enum', enum: UserRole, default: UserRole.STUDENT })
  role!: UserRole;

  @CreateDateColumn()
  createdAt!: Date;

  @Column({ default: true })
  is_active!: boolean;

  @Column({ type: 'boolean', default: false })
  isVerified!: boolean;

  @Column({ type: 'varchar', nullable: true })
  refresh_token_hash!: string | null;

  @Column({ type: 'varchar', nullable: true })
  subscription_id!: string | null;

  @Column({
    type: 'enum',
    enum: SubscriptionPlan,
    default: SubscriptionPlan.FREE,
  })
  plan!: SubscriptionPlan;

  @Column({ type: 'varchar', nullable: true })
  subscription_status!: string | null;

  @Column({ type: 'uuid', nullable: true })
  email_verification_token!: string | null;

  @Column({ type: 'uuid', nullable: true })
  password_reset_token!: string | null;

  @Column({ type: 'timestamptz', nullable: true })
  password_reset_expires_at!: Date | null;

  @Column({ type: 'varchar', nullable: true })
  avatar_url!: string | null;

  @Column({ type: 'varchar', nullable: true })
  bio!: string | null;

  @OneToMany(() => Payment, (payment) => payment.user)
  payments?: Payment[];

  @OneToMany(() => CartItem, (item) => item.user)
  cartItems?: CartItem[];

  @OneToOne(() => InstructorProfile, (profile) => profile.user)
  instructorProfile?: InstructorProfile;

  @OneToOne(() => StudentProfile, (profile) => profile.user)
  studentProfile?: StudentProfile;

  @OneToMany(() => UserProviders, (provider) => provider.user)
  providers?: UserProviders[];
}
