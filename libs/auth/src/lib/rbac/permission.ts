import { Role } from '@snzenwata-e1b7a28d-bebb-423b-9595-0c8eab0d1607/data';

export enum Permission {
  TASK_CREATE = 'TASK_CREATE',
  TASK_READ = 'TASK_READ',
  TASK_UPDATE = 'TASK_UPDATE',
  TASK_DELETE = 'TASK_DELETE',

  AUDIT_READ = 'AUDIT_READ',

  ORG_CREATE = 'ORG_CREATE',
  USER_CREATE = 'USER_CREATE',
}

export const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  [Role.VIEWER]: [Permission.TASK_READ],

  [Role.ADMIN]: [
    Permission.TASK_READ,
    Permission.TASK_CREATE,
    Permission.TASK_UPDATE,
    Permission.TASK_DELETE,
  ],

  [Role.OWNER]: [
    Permission.TASK_READ,
    Permission.TASK_CREATE,
    Permission.TASK_UPDATE,
    Permission.TASK_DELETE,
    Permission.AUDIT_READ,
    Permission.ORG_CREATE,
    Permission.USER_CREATE,
  ],
};
