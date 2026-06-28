// prettier-ignore
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn, DeleteDateColumn, OneToMany, Index } from 'typeorm';
import { Status } from './enum/courses.enum';
import { Category } from './categories.entity';
import { Lesson } from './lessons.entity';
import { InstructorProfile } from './instructor-profile.entity';
import { Section } from './section.entity';

@Entity('courses')
export class Course {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ unique: true })
  title!: string;

  @Column({ unique: true, nullable: true })
  slug!: string;

  @Column()
  description!: string;

  @Column({
    type: 'decimal',
    precision: 10,
    scale: 2,
    transformer: {
      to: (v: number) => v,
      from: (v: string | null) => (v ? parseFloat(v) : 0),
    },
  })
  price!: number;

  @Index()
  @Column({ type: 'enum', enum: Status, default: Status.DRAFT })
  status!: Status;

  @Column({ nullable: true })
  thumbnail_url?: string;

  // colonna importante per la relazione FK con la tabella InstructorProfile, rappresenta l'insegnante del corso
  // prettier-ignore
  @ManyToOne(() => InstructorProfile, (instructorProfile) => instructorProfile.courses)
  instructor!: InstructorProfile;

  @ManyToOne(() => Category, { nullable: false })
  category!: Category;

  @OneToMany(() => Lesson, (lesson) => lesson.course)
  lessons?: Lesson[];

  @CreateDateColumn()
  created_at!: Date;

  @DeleteDateColumn()
  deleted_at?: Date;

  @Column({ default: false })
  featured?: boolean;

  @OneToMany(() => Section, (section) => section.course)
  sections?: Section[];
}
