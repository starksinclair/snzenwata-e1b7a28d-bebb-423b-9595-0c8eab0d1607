import { Module, forwardRef } from '@nestjs/common';
import { AuditsLogsService } from './audits-logs.service';
import { AuditsLogsController } from './audits-logs.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuditLog } from './entities/audits-log.entity';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [TypeOrmModule.forFeature([AuditLog]), forwardRef(() => AuthModule)],
  controllers: [AuditsLogsController],
  providers: [AuditsLogsService],
  exports: [AuditsLogsService],
})
export class AuditsLogsModule {}
