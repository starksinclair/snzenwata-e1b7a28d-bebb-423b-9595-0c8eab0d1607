import { Controller, Get, Param, Req, UseGuards } from '@nestjs/common';
import { AuditsLogsService } from './audits-logs.service';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { PermissionsGuard } from '../guards/permissions.guard';
import { JwtPayload } from '@snzenwata-e1b7a28d-bebb-423b-9595-0c8eab0d1607/data';
import { Permission } from '@snzenwata-e1b7a28d-bebb-423b-9595-0c8eab0d1607/auth';
import { RequirePermissions } from '@snzenwata-e1b7a28d-bebb-423b-9595-0c8eab0d1607/auth/nestjs';

@Controller('audits-logs')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class AuditsLogsController {
  constructor(private readonly auditsLogsService: AuditsLogsService) {}

  @Get()
  @RequirePermissions(Permission.AUDIT_READ)
  findAll(@Req() req: { user: JwtPayload }) {
    return this.auditsLogsService.findAll(req.user);
  }

  @Get(':id')
  @RequirePermissions(Permission.AUDIT_READ)
  findOne(@Req() req: { user: JwtPayload }, @Param('id') id: string) {
    return this.auditsLogsService.findOne(id, req.user);
  }
}
