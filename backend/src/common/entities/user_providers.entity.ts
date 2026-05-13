// prettier-ignore
import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, Unique } from 'typeorm';
import { User } from './users.entity';

@Entity('user_providers')
@Unique(['userId', 'provider_name'])
export class UserProviders {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  userId!: string;

  @ManyToOne(() => User, (user) => user.providers)
  @JoinColumn({ name: 'userId' })
  user!: User;

  @Column({ type: 'varchar' })
  provider_name!: string;

  @Column({ type: 'varchar' })
  provider_id!: string;
}
