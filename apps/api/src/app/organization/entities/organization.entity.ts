import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { OrganizationType } from '@snzenwata-e1b7a28d-bebb-423b-9595-0c8eab0d1607/data';

@Entity('organizations')
export class Organization {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 32, enum: OrganizationType })
  type: OrganizationType;

  @Column()
  name: string;

  @ManyToOne(() => Organization, { nullable: true })
  @JoinColumn({ name: 'parent_org_id' })
  parent?: Organization;

  @CreateDateColumn({ name: 'created_at', type: 'datetime' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'datetime' })
  updatedAt: Date;
}
