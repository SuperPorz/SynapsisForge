// prettier-ignore
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, RelationId, DeleteDateColumn, Index } from 'typeorm';
import { Course } from './courses.entity';
import { Section } from './section.entity';

@Entity('lessons')
export class Lesson {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  title!: string;

  @Column({ type: 'int' })
  order!: number;

  @Column({ type: 'int' })
  duration_seconds!: number;

  @Column({ nullable: true })
  content_id?: string;

  @Index(['course'])
  @ManyToOne(() => Course, (course) => course.lessons, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  course!: Course;

  // Espone la FK come campo scalare leggibile, senza colonna aggiuntiva nel DB
  @RelationId((lesson: Lesson) => lesson.course)
  courseId!: string;

  @DeleteDateColumn()
  deleted_at?: Date;

  @ManyToOne(() => Section, (section) => section.lessons, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  section?: Section | null;
}
