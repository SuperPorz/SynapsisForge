// prettier-ignore
import { Entity, PrimaryGeneratedColumn, Column, OneToOne, JoinColumn } from 'typeorm';
import { Rating } from './enum/reviews.enum';
import { Enrollment } from './enrollments.entity';

@Entity('reviews')
export class Review {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'enum', enum: Rating })
  rating!: Rating;

  @Column({ type: 'text', nullable: true })
  comment!: string | null;

  @OneToOne(() => Enrollment, (enrollment) => enrollment.review, {
    nullable: false,
  })
  @JoinColumn()
  enrollment!: Enrollment;
}
