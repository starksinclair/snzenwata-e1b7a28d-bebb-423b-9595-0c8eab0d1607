import { Injectable, OnModuleInit } from '@nestjs/common';
import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { Organization } from '../organization/entities/organization.entity';
import { User } from '../user/entities/user.entity';
import { Task } from '../tasks/entities/task.entity';
import {
  OrganizationType,
  Role,
  TaskCategory,
  TaskStatus,
} from '@snzenwata-e1b7a28d-bebb-423b-9595-0c8eab0d1607/data';

const SEED_PASSWORD = 'SeedPassword123';

@Injectable()
export class SeedService implements OnModuleInit {
  constructor(private readonly dataSource: DataSource) {}

  async onModuleInit() {
    await this.runSeed();
  }

  async runSeed() {
    const passwordHash = await bcrypt.hash(SEED_PASSWORD, 10);

    await this.dataSource.transaction(async (manager) => {
      const orgRepoTx = manager.getRepository(Organization);
      const userRepoTx = manager.getRepository(User);
      const taskRepoTx = manager.getRepository(Task);

      // Organizations: create only if no org with same name and type exists
      const ensureOrg = async (
        name: string,
        type: OrganizationType,
        parent?: Organization,
      ): Promise<Organization> => {
        const existing = await orgRepoTx.findOne({ where: { name, type } });
        if (existing) return existing;
        const org = orgRepoTx.create({ name, type, parent });
        return orgRepoTx.save(org);
      };

      const acme = await ensureOrg('Acme Corp', OrganizationType.COMPANY);
      const acmeTeam = await ensureOrg(
        'Acme Engineering',
        OrganizationType.TEAM,
        acme,
      );
      const sideProject = await ensureOrg(
        'Side Project Alpha',
        OrganizationType.PROJECT,
      );

      // Users: create only if email does not exist
      const ensureUser = async (
        email: string,
        role: Role,
        org: Organization,
      ): Promise<User> => {
        const existing = await userRepoTx.findOne({
          where: { email },
          relations: ['organization'],
        });
        if (existing) return existing;
        const user = userRepoTx.create({
          email,
          passwordHash,
          role,
          organization: org,
        });
        return userRepoTx.save(user);
      };

      const ownerAcme = await ensureUser('owner@acme.com', Role.OWNER, acme);
      const adminAcme = await ensureUser('admin@acme.com', Role.ADMIN, acme);
      const viewerAcme = await ensureUser('viewer@acme.com', Role.VIEWER, acme);
      await ensureUser('admin@acme-team.com', Role.ADMIN, acmeTeam);
      await ensureUser('viewer@acme-team.com', Role.VIEWER, acmeTeam);
      const ownerSide = await ensureUser(
        'owner@side.com',
        Role.OWNER,
        sideProject,
      );

      // Tasks: create only if no task with same title for same owner exists
      const ensureTask = async (
        title: string,
        opts: {
          description?: string;
          category: TaskCategory;
          status: TaskStatus;
          organization: Organization;
          owner: User;
        },
      ) => {
        const existing = await taskRepoTx.findOne({
          where: { title, owner: { id: opts.owner.id } },
        });
        if (existing) return existing;
        const task = taskRepoTx.create({ ...opts, title });
        return taskRepoTx.save(task);
      };

      await ensureTask('Setup CI/CD', {
        description: 'Configure pipeline for main app',
        category: TaskCategory.WORK,
        status: TaskStatus.IN_PROGRESS,
        organization: acme,
        owner: ownerAcme,
      });
      await ensureTask('Review Q4 goals', {
        description: 'Align team on objectives',
        category: TaskCategory.WORK,
        status: TaskStatus.TODO,
        organization: acme,
        owner: adminAcme,
      });
      await ensureTask('Read API docs', {
        category: TaskCategory.WORK,
        status: TaskStatus.TODO,
        organization: acme,
        owner: viewerAcme,
      });
      await ensureTask('Deploy staging', {
        description: 'Deploy to staging environment',
        category: TaskCategory.WORK,
        status: TaskStatus.COMPLETED,
        organization: acme,
        owner: ownerAcme,
      });
      await ensureTask('Personal learning', {
        description: 'NestJS and TypeORM',
        category: TaskCategory.PERSONAL,
        status: TaskStatus.IN_PROGRESS,
        organization: sideProject,
        owner: ownerSide,
      });
      await ensureTask('Misc task', {
        category: TaskCategory.OTHER,
        status: TaskStatus.TODO,
        organization: sideProject,
        owner: ownerSide,
      });
    });
  }
}
