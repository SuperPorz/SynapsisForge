// prettier-ignore
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, Index } from 'typeorm';
import { User } from './users.entity';
import { DevicePlatform } from './enum/notifications.enum';

@Entity('user_devices')
export class UserDevice {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Index()
  @Column({ type: 'uuid' })
  user_id!: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user?: User;

  @Column({ type: 'varchar', length: 512 })
  token!: string;

  @Column({ type: 'enum', enum: DevicePlatform })
  platform!: DevicePlatform;

  @Column({ default: true })
  active!: boolean;

  @CreateDateColumn()
  created_at!: Date;

  @UpdateDateColumn()
  updated_at!: Date;
}
