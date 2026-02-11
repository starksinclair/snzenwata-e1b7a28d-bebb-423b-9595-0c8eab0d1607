import { Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import {
  AuditAction,
  AuditContext,
  AuditResourceType,
  JwtPayload,
} from '@snzenwata-e1b7a28d-bebb-423b-9595-0c8eab0d1607/data';
import { AuditLog } from './entities/audits-log.entity';
import { InjectRepository } from '@nestjs/typeorm';

@Injectable()
export class AuditsLogsService {
  constructor(
    @InjectRepository(AuditLog)
    private readonly auditLogRepository: Repository<AuditLog>,
  ) {}

  async logAction(ctx: AuditContext) {
    try {
      const record = this.auditLogRepository.create({
        actorUserId: ctx.actorUserId,
        actorOrgId: ctx.actorOrgId,
        action: ctx.action,
        resourceType: ctx.resourceType,
        resourceId: ctx.resourceId,
        success: ctx.success,
        reason: ctx.reason,
        ipAddress: ctx.ipAddress ?? null,
        userAgent: ctx.userAgent ?? null,
      });
      return this.auditLogRepository.save(record);
    } catch (error) {
      console.error(error);
    }
  }

  async findAll(jwtPayload: JwtPayload) {
    const auditLogs = await this.auditLogRepository.find({
      where: { actorOrgId: jwtPayload.orgId },
      relations: ['actorUser', 'actorOrg'],
    });
    await this.logAction({
      action: AuditAction.AUDIT_LOG_READ,
      success: true,
      actorUserId: jwtPayload.sub,
      actorOrgId: jwtPayload.orgId,
      resourceType: AuditResourceType.AUDIT_LOG,
      reason: null,
    });
    return auditLogs;
  }

  async findOne(id: string, jwtPayload: JwtPayload) {
    const auditLog = await this.auditLogRepository.findOne({
      where: { id, actorOrgId: jwtPayload.orgId },
    });
    await this.logAction({
      action: AuditAction.AUDIT_LOG_READ,
      success: true,
      actorUserId: jwtPayload.sub,
      actorOrgId: jwtPayload.orgId,
      resourceType: AuditResourceType.AUDIT_LOG,
      reason: null,
      resourceId: id,
    });
    return auditLog;
  }
}
