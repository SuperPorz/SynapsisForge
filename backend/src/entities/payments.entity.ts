// prettier-ignore
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn } from 'typeorm';
import { Course } from './courses.entity';
import { User } from './users.entity';
import { Currency, Status } from './enum/payments.enum';

@Entity('payments')
export class Payment {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ManyToOne(() => User, { nullable: false })
  user!: User;

  @ManyToOne(() => Course, { nullable: false })
  course!: Course;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  amount!: number;

  @Column({ type: 'enum', enum: Currency })
  currency!: Currency;

  @Column()
  gateway_id!: string;

  @Column({ type: 'enum', enum: Status })
  status!: Status;

  @CreateDateColumn()
  created_at!: Date;
}
