import { Module, OnModuleInit } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from './user/users.module';
import { TasksModule } from './tasks/tasks.module';
import { AuthModule } from './auth/auth.module';
import { AuditsLogsModule } from './audit-logs/audits-logs.module';
import { OrganizationModule } from './organization/organization.module';
import {
  IsExistsConstraint,
  setDataSourceForIsExists,
} from './validators/is-exists.validator';
import {
  IsUniqueConstraint,
  setDataSourceForIsUnique,
} from './validators/is-unique.validator';
import { PermissionsGuard } from './guards/permissions.guard';
// import { SeedService } from './database/seed.service';
import { User } from './user/entities/user.entity';
import { Organization } from './organization/entities/organization.entity';
import { AuditLog } from './audit-logs/entities/audits-log.entity';
import { Task } from './tasks/entities/task.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ThrottlerModule } from '@nestjs/throttler';
import { DataSource } from 'typeorm';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'sqlite',
      database: 'task_manager.sqlite',
      entities: [User, Organization, Task, AuditLog],
      synchronize: true,
    }),
    ThrottlerModule.forRoot({
      throttlers: [
        {
          ttl: 60000,
          limit: 10,
        },
      ],
    }),
    UsersModule,
    TasksModule,
    AuthModule,
    AuditsLogsModule,
    OrganizationModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    IsExistsConstraint,
    IsUniqueConstraint,
    PermissionsGuard,
  ],
})
export class AppModule implements OnModuleInit {
  constructor(private dataSource: DataSource) {}

  onModuleInit() {
    setDataSourceForIsExists(this.dataSource);
    setDataSourceForIsUnique(this.dataSource);
  }
}
