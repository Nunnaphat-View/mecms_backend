import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from './user.entity.js';

@Entity('user_specialty')
export class UserSpecialty {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'userId', type: 'int' })
  userId: number;

  @Column({ name: 'toolName', type: 'varchar', length: 255 })
  toolName: string;

  @ManyToOne(() => User, (user) => user.specialties, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;
}
