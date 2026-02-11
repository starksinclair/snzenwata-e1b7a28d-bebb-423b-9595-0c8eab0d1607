import { Route } from '@angular/router';
import { authGuard } from './core/auth/auth.guard';
import { permissionGuard } from './core/auth/permission.guard';
import { Permission } from '@snzenwata-e1b7a28d-bebb-423b-9595-0c8eab0d1607/data';

export const appRoutes: Route[] = [
  {
    path: 'login',
    loadComponent: () =>
      import('./features/auth/login/login.component').then(
        (m) => m.LoginComponent,
      ),
  },
  {
    path: 'register',
    loadComponent: () =>
      import('./features/auth/register/register.component').then(
        (m) => m.RegisterComponent,
      ),
  },

  {
    path: '',
    loadComponent: () =>
      import('./layout/layout.component').then((m) => m.LayoutComponent),
    canActivate: [authGuard],
    children: [
      { path: '', redirectTo: 'tasks', pathMatch: 'full' },
      {
        path: 'tasks',
        loadComponent: () =>
          import('./features/tasks/task-list/task-list.component').then(
            (m) => m.TaskListComponent,
          ),
        canActivate: [permissionGuard],
        data: { permissions: [Permission.TASK_READ] },
      },
      {
        path: 'tasks/new',
        loadComponent: () =>
          import('./features/tasks/task-form/task-form.component').then(
            (m) => m.TaskFormComponent,
          ),
        canActivate: [permissionGuard],
        data: { permissions: [Permission.TASK_CREATE] },
      },
      {
        path: 'tasks/:id/edit',
        loadComponent: () =>
          import('./features/tasks/task-form/task-form.component').then(
            (m) => m.TaskFormComponent,
          ),
        canActivate: [permissionGuard],
        data: { permissions: [Permission.TASK_UPDATE] },
      },
      {
        path: 'audit-log',
        loadComponent: () =>
          import('./features/audit/audit-list/audit-list.component').then(
            (m) => m.AuditListComponent,
          ),
        canActivate: [permissionGuard],
        data: { permissions: [Permission.AUDIT_READ] },
      },
      {
        path: 'forbidden',
        loadComponent: () =>
          import('./features/errors/forbidden/forbidden.component').then(
            (m) => m.ForbiddenComponent,
          ),
      },
    ],
  },

  {
    path: '**',
    loadComponent: () =>
      import('./features/errors/not-found/not-found.component').then(
        (m) => m.NotFoundComponent,
      ),
  },
];
