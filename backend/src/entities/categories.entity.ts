// prettier-ignore
import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { Course } from './courses.entity';

@Entity('categories')
export class Category {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ unique: true })
  name!: string;

  @Column({ unique: true, nullable: true })
  slug!: string;

  @Column()
  description!: string;

  @OneToMany(() => Course, (course) => course.category) // osserazione: non richiede @JoinColumn perché è la relazione inversa, la FK è definita in Course
  courses?: Course[];
}
