import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { User } from '../../user/entities/user.entity';
import { Organization } from '../../organization/entities/organization.entity';

@Entity('audit_logs')
@Index(['occurredAt'])
@Index(['actorUserId', 'occurredAt'])
@Index(['actorOrgId', 'occurredAt'])
@Index(['resourceType', 'resourceId'])
export class AuditLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @CreateDateColumn({ name: 'occurred_at', type: 'datetime' })
  occurredAt: Date;

  @Column({ type: 'uuid', name: 'actor_user_id' })
  actorUserId: string;

  @ManyToOne(() => User, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'actor_user_id' })
  actorUser: User;

  @Column({ type: 'uuid', name: 'actor_org_id' })
  actorOrgId: string;

  @ManyToOne(() => Organization, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'actor_org_id' })
  actorOrg: Organization;

  @Column({ type: 'varchar', length: 64 })
  action: string; // e.g. TASK_READ, TASK_UPDATE, LOGIN_SUCCESS, LOGIN_FAIL

  @Column({
    type: 'varchar',
    length: 64,
    name: 'resource_type',
    nullable: true,
  })
  resourceType?: string | null; // e.g. 'TASK'

  @Column({ type: 'uuid', name: 'resource_id', nullable: true })
  resourceId?: string | null;

  @Column({ type: 'boolean' })
  success: boolean;

  @Column({ type: 'varchar', length: 255, nullable: true })
  reason?: string | null;

  @Column({ type: 'varchar', length: 64, name: 'ip_address', nullable: true })
  ipAddress?: string | null;

  @Column({ type: 'varchar', length: 255, name: 'user_agent', nullable: true })
  userAgent?: string | null;
}
