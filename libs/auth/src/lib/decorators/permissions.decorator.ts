import { SetMetadata } from '@nestjs/common';
import { Permission } from '../rbac/permission';

export const REQUIRED_PERMISSIONS_KEY = 'required_permissions';

export const RequirePermissions = (...permissions: Permission[]) => {
  return SetMetadata(REQUIRED_PERMISSIONS_KEY, permissions);
};
