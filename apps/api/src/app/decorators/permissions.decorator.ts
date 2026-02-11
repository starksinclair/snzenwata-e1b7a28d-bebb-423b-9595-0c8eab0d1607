// libs/auth/src/lib/decorators/permissions.decorator.ts
import { SetMetadata } from '@nestjs/common';
import { Permission } from '@snzenwata-e1b7a28d-bebb-423b-9595-0c8eab0d1607/data';

export const REQUIRED_PERMISSIONS_KEY = 'required_permissions';

export const RequirePermissions = (...permissions: Permission[]) => {
  return SetMetadata(REQUIRED_PERMISSIONS_KEY, permissions);
};
