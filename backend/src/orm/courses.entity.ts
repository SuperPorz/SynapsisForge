// prettier-ignore
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn } from 'typeorm';
import { Status } from './enum/courses.enum';
import { User } from './users.entity';
import { Category } from './categories.entity';

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

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  price!: number;

  @Column({ type: 'enum', enum: Status })
  status!: Status;

  @Column()
  thumbnail_url!: string;

  // colonna importante per la relazione FK con la tabella User, rappresenta l'insegnante del corso
  @ManyToOne(() => User, { nullable: false })
  instructor!: User;

  @ManyToOne(() => Category, { nullable: false })
  category!: Category;

  @CreateDateColumn()
  created_at!: Date;
}
