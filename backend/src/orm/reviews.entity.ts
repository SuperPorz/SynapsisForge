// prettier-ignore
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, Unique } from 'typeorm';
import { Rating } from './enum/reviews.enum';
import { Enrollment } from './enrollments.entity';

@Entity('reviews')
@Unique(['enrollment_id'])
export class Review {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'enum', enum: Rating })
  rating!: Rating;

  @Column({ type: 'text', nullable: true })
  comment!: string | null;

  @ManyToOne(() => Enrollment, { nullable: false })
  enrollment!: Enrollment;
}
