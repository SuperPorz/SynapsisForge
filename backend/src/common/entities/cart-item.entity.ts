// prettier-ignore
import { Entity, PrimaryGeneratedColumn, ManyToOne, CreateDateColumn, Unique } from 'typeorm';
import { User } from './users.entity';
import { Course } from './courses.entity';

@Entity('cart_items')
@Unique(['user', 'course'])
export class CartItem {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ManyToOne(() => User, (user) => user.cartItems, { nullable: false })
  user!: User;

  @ManyToOne(() => Course, { nullable: false, onDelete: 'CASCADE' })
  course!: Course;

  @CreateDateColumn()
  added_at!: Date;
}
