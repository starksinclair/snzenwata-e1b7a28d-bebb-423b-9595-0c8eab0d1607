import { Module } from '@nestjs/common';
import { TasksService } from './tasks.service';
import { TasksController } from './tasks.controller';
import { Task } from './entities/task.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuditLog } from '../audit-logs/entities/audits-log.entity';
import { AuthModule } from '../auth/auth.module';
import { AuditsLogsModule } from '../audit-logs/audits-logs.module';
import { OrganizationModule } from '../organization/organization.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Task, AuditLog]),
    AuthModule,
    AuditsLogsModule,
    OrganizationModule,
  ],
  controllers: [TasksController],
  providers: [TasksService],
})
export class TasksModule {}
