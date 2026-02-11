import { Component, ChangeDetectionStrategy } from '@angular/core';
import { RouterModule } from '@angular/router';
import { IconComponent } from '../../../shared/icon.component';

@Component({
  imports: [RouterModule, IconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div
      class="min-h-[60vh] flex flex-col items-center justify-center text-center"
    >
      <div
        class="w-16 h-16 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center text-amber-600 dark:text-amber-400 mb-4"
      >
        <app-icon name="notFound" size="lg" />
      </div>
      <h1 class="text-2xl font-semibold text-slate-800 dark:text-slate-100">
        Page not found
      </h1>
      <p class="mt-2 text-slate-600 dark:text-slate-400 max-w-sm">
        The page you're looking for doesn't exist.
      </p>
      <a
        routerLink="/tasks"
        class="mt-6 px-4 py-2 rounded-lg bg-slate-800 dark:bg-slate-200 text-white dark:text-slate-900 font-medium hover:bg-slate-700 dark:hover:bg-slate-300 transition-colors"
      >
        Back to tasks
      </a>
    </div>
  `,
})
export class NotFoundComponent {}
