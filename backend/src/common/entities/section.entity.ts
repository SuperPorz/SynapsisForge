//prettier-ignore
import { Column, Entity, ManyToOne, OneToMany, PrimaryGeneratedColumn, Index } from 'typeorm';
import { Course } from './courses.entity';
import { Lesson } from './lessons.entity';

@Entity('sections')
export class Section {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 255 })
  title!: string;

  @Column({ type: 'int' }) //per typeORM usare int invece di number
  order!: number;

  @Index(['course'])
  @ManyToOne(() => Course, (course) => course.sections, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  course!: Course;

  @OneToMany(() => Lesson, (lesson) => lesson.section)
  lessons!: Lesson[];
}
