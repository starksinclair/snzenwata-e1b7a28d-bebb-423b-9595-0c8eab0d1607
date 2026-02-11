import {
  Component,
  inject,
  signal,
  ChangeDetectionStrategy,
} from '@angular/core';
import { DatePipe } from '@angular/common';
import { AuditApiService, AuditLog } from '../audit-api.service';

@Component({
  imports: [DatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div
      class="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden transition-colors"
    >
      <div class="p-4 border-b border-slate-200 dark:border-slate-700">
        <h2 class="text-lg font-semibold text-slate-800 dark:text-slate-100">
          Audit Log
        </h2>
      </div>

      @if (loading()) {
        <div class="p-8 text-center text-slate-500 dark:text-slate-400">
          Loading…
        </div>
      } @else if (error()) {
        <div class="p-8 text-center text-red-600 dark:text-red-400">
          {{ error() }}
        </div>
      } @else if (!logs().length) {
        <div class="p-8 text-center text-slate-500 dark:text-slate-400">
          No audit entries
        </div>
      } @else {
        <!-- Desktop: table -->
        <div class="hidden md:block overflow-x-auto">
          <table class="w-full text-sm">
            <thead>
              <tr class="bg-slate-50/80 dark:bg-slate-700/50 text-left">
                <th
                  class="px-4 py-3 font-medium text-slate-700 dark:text-slate-300"
                >
                  Timestamp
                </th>
                <th
                  class="px-4 py-3 font-medium text-slate-700 dark:text-slate-300"
                >
                  Action
                </th>
                <th
                  class="px-4 py-3 font-medium text-slate-700 dark:text-slate-300"
                >
                  Success
                </th>
                <th
                  class="px-4 py-3 font-medium text-slate-700 dark:text-slate-300"
                >
                  Actor User
                </th>
                <th
                  class="px-4 py-3 font-medium text-slate-700 dark:text-slate-300"
                >
                  Actor Org
                </th>
                <th
                  class="px-4 py-3 font-medium text-slate-700 dark:text-slate-300"
                >
                  Resource
                </th>
                <th
                  class="px-4 py-3 font-medium text-slate-700 dark:text-slate-300"
                >
                  Reason
                </th>
              </tr>
            </thead>
            <tbody>
              @for (log of logs(); track log.id) {
                <tr
                  class="border-t border-slate-100 dark:border-slate-700 hover:bg-slate-50/50 dark:hover:bg-slate-700/30"
                >
                  <td class="px-4 py-3 text-slate-600 dark:text-slate-400">
                    {{ log.occurredAt | date: 'short' }}
                  </td>
                  <td
                    class="px-4 py-3 font-medium text-slate-800 dark:text-slate-200"
                  >
                    {{ log.action }}
                  </td>
                  <td class="px-4 py-3">
                    <span
                      [class]="
                        log.success
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : 'text-red-600 dark:text-red-400'
                      "
                    >
                      {{ log.success ? 'Yes' : 'No' }}
                    </span>
                  </td>
                  <td
                    class="px-4 py-3 text-slate-600 dark:text-slate-400 font-mono text-xs"
                  >
                    {{ log.actorUser.email }}
                  </td>
                  <td
                    class="px-4 py-3 text-slate-600 dark:text-slate-400 font-mono text-xs"
                  >
                    {{ log.actorOrg.name }}
                  </td>
                  <td class="px-4 py-3 text-slate-600 dark:text-slate-400">
                    {{ log.resourceType || '–'
                    }}{{ log.resourceId ? ' / ' + log.resourceId : '' }}
                  </td>
                  <td class="px-4 py-3 text-slate-500 dark:text-slate-400">
                    {{ log.reason || '–' }}
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>

        <!-- Mobile: card list -->
        <div class="md:hidden divide-y divide-slate-100 dark:divide-slate-700">
          @for (log of logs(); track log.id) {
            <div class="p-4 space-y-2">
              <div class="flex items-center justify-between">
                <span
                  class="text-sm font-medium text-slate-800 dark:text-slate-200"
                  >{{ log.action }}</span
                >
                <span
                  [class]="
                    log.success
                      ? 'text-emerald-600 dark:text-emerald-400'
                      : 'text-red-600 dark:text-red-400'
                  "
                  class="text-xs font-medium"
                >
                  {{ log.success ? 'Success' : 'Failed' }}
                </span>
              </div>
              <div class="text-xs text-slate-500 dark:text-slate-400 space-y-1">
                <div class="flex justify-between">
                  <span>Time</span>
                  <span class="text-slate-600 dark:text-slate-300">{{
                    log.occurredAt | date: 'short'
                  }}</span>
                </div>
                <div class="flex justify-between">
                  <span>Actor</span>
                  <span
                    class="text-slate-600 dark:text-slate-300 font-mono truncate ml-2 max-w-[180px]"
                    >{{ log.actorUser.email }}</span
                  >
                </div>
                @if (log.resourceType) {
                  <div class="flex justify-between">
                    <span>Resource</span>
                    <span class="text-slate-600 dark:text-slate-300"
                      >{{ log.resourceType
                      }}{{ log.resourceId ? ' / ' + log.resourceId : '' }}</span
                    >
                  </div>
                }
                @if (log.reason) {
                  <div class="flex justify-between">
                    <span>Reason</span>
                    <span class="text-slate-600 dark:text-slate-300">{{
                      log.reason
                    }}</span>
                  </div>
                }
              </div>
            </div>
          }
        </div>
      }
    </div>
  `,
})
export class AuditListComponent {
  private api = inject(AuditApiService);

  logs = signal<AuditLog[]>([]);
  loading = signal(false);
  error = signal('');

  constructor() {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.error.set('');
    this.api.findAll().subscribe({
      next: (data) => {
        this.logs.set(data);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(err.error?.message || 'Failed to load audit log');
        this.loading.set(false);
      },
    });
  }
}
