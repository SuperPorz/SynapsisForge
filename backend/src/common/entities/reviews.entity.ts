// prettier-ignore
import { Entity, PrimaryGeneratedColumn, Column, OneToOne, JoinColumn, CreateDateColumn } from 'typeorm';
import { Enrollment } from './enrollments.entity';

@Entity('reviews')
export class Review {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'int' })
  rating!: number;

  @Column({ type: 'text', nullable: true })
  comment!: string | null;

  @OneToOne(() => Enrollment, {
    nullable: false,
  })
  @JoinColumn()
  enrollment!: Enrollment;

  @CreateDateColumn()
  created_at!: Date;
}
