import { AuditAction } from '../enums/audit-log.enum';

type AuditResourceType = 'TASK' | 'USER' | 'ORG' | 'AUTH' | 'AUDIT_LOG';

export type AuditContext = {
  actorUserId?: string | null;
  actorOrgId?: string | null;
  action: AuditAction | string;

  resourceType?: AuditResourceType | string | null;
  resourceId?: string | null;

  success: boolean;
  reason?: string | null;

  ipAddress?: string | null;
  userAgent?: string | null;
};
