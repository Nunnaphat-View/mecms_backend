import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Exclude } from 'class-transformer';
import { Role } from '../role/role.entity.js';
import { Hospital } from '../hospital/entities/hospital.entity.js';

@Entity('user')
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 100, unique: true })
  username: string;

  @Exclude()
  @Column({ type: 'varchar', length: 255 })
  password: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  email: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  name: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  tel: string;


  @Column({ type: 'varchar', length: 500, nullable: true })
  signatureUrl: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  imageUrl: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  lineUserId: string;

  @Column({ nullable: true })
  roleId: number;

  @ManyToOne(() => Role, (role) => role.users, { eager: true })
  @JoinColumn({ name: 'roleId' })
  role: Role;

  @Column({ nullable: true })
  hospitalId: number;

  @ManyToOne(() => Hospital, (hospital) => hospital.users)
  @JoinColumn({ name: 'hospitalId' })
  hospital: Hospital;
}
