// prettier-ignore
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn, Index } from 'typeorm';
import { Course } from './courses.entity';
import { User } from './users.entity';
import { Currency, Status } from './enum/payments.enum';

@Entity('payments')
@Index(['user', 'course', 'status'])
@Index(['gateway_id'])
export class Payment {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ManyToOne(() => User, (user) => user.payments, { nullable: false })
  user!: User;

  @ManyToOne(() => Course, { nullable: true, onDelete: 'CASCADE' })
  course?: Course;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  amount!: number;

  @Column({ type: 'enum', enum: Currency })
  currency!: Currency;

  @Column()
  gateway_id!: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  payment_method?: string;

  @Column({ type: 'enum', enum: Status })
  status!: Status;

  @Column({ type: 'varchar', nullable: true })
  receipt_url?: string;

  @CreateDateColumn()
  created_at!: Date;
}
