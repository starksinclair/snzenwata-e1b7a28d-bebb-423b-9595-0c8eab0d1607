import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import {
  AuditReason,
  JwtPayload,
} from '@snzenwata-e1b7a28d-bebb-423b-9595-0c8eab0d1607/data';
import {
  Permission,
  ROLE_PERMISSIONS,
} from '@snzenwata-e1b7a28d-bebb-423b-9595-0c8eab0d1607/auth';
import { REQUIRED_PERMISSIONS_KEY } from '@snzenwata-e1b7a28d-bebb-423b-9595-0c8eab0d1607/auth/nestjs';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredPermissions = this.reflector.getAllAndOverride<Permission[]>(
      REQUIRED_PERMISSIONS_KEY,
      [context.getHandler(), context.getClass()],
    );
    if (!requiredPermissions?.length) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user as JwtPayload | undefined;
    if (!user?.role) {
      throw new ForbiddenException(AuditReason.PERMISSION_MISSING);
    }

    const allowed = ROLE_PERMISSIONS[user.role] ?? [];
    const missing = requiredPermissions.filter((p) => !allowed.includes(p));
    if (missing.length > 0) {
      throw new ForbiddenException(AuditReason.PERMISSION_MISSING);
    }
    return true;
  }
}
