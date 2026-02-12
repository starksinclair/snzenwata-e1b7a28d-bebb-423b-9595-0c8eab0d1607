import { inject } from '@angular/core';
import { Router, CanActivateFn, ActivatedRouteSnapshot } from '@angular/router';
import { AuthService } from './auth.service';
import { Permission } from '@snzenwata-e1b7a28d-bebb-423b-9595-0c8eab0d1607/auth';

export const permissionGuard: CanActivateFn = (
  route: ActivatedRouteSnapshot,
) => {
  const auth = inject(AuthService);
  const router = inject(Router);

  if (!auth.isLoggedIn()) {
    return router.createUrlTree(['/login']);
  }

  const permissions = route.data['permissions'] as Permission[] | undefined;
  if (!permissions?.length) return true;

  const hasAll = permissions.every((p) => auth.hasPermission(p));
  if (hasAll) return true;

  return router.createUrlTree(['/forbidden']);
};
