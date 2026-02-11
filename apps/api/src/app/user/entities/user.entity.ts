import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  ColumnOptions,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { Organization } from '../../organization/entities/organization.entity';
import { Role } from '@snzenwata-e1b7a28d-bebb-423b-9595-0c8eab0d1607/data';
import { Task } from '../../tasks/entities/task.entity';
import { AuditLog } from '../../audit-logs/entities/audits-log.entity';
import { Exclude } from 'class-transformer';

const roleColumnOptions: ColumnOptions = {
  type: 'varchar',
  length: 32,
  enum: Role,
  default: Role.VIEWER,
};

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Organization)
  @JoinColumn({ name: 'org_id' })
  organization: Organization;

  @Column({ unique: true })
  email: string;

  @Column()
  @Exclude()
  passwordHash: string;

  @Column(roleColumnOptions)
  role: Role;

  @Column({ default: true })
  isActive: boolean;

  @Column({ name: 'last_login_at', type: 'datetime', nullable: true })
  lastLoginAt?: Date | null;

  @Column({
    type: 'varchar',
    length: 255,
    name: 'profile_picture_url',
    nullable: true,
  })
  profilePictureUrl?: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'datetime' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'datetime' })
  updatedAt: Date;

  @OneToMany(() => Task, (task) => task.owner)
  tasks?: Task[] | null;

  @OneToMany(() => AuditLog, (auditLog) => auditLog.actorUser)
  auditLogs?: AuditLog[] | null;
}
