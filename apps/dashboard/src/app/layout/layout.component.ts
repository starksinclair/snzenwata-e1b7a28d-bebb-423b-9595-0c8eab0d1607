import {
  Component,
  inject,
  signal,
  ChangeDetectionStrategy,
} from '@angular/core';
import { RouterModule } from '@angular/router';
import { AuthService } from '../core/auth/auth.service';
import { ThemeService } from '../core/theme/theme.service';
import { Permission } from '@snzenwata-e1b7a28d-bebb-423b-9595-0c8eab0d1607/auth';
import { IconComponent } from '../shared/icon.component';

@Component({
  imports: [RouterModule, IconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div
      class="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-900 transition-colors"
    >
      <!-- Nav bar -->
      <nav
        class="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 px-4 py-3 transition-colors"
      >
        <div class="max-w-6xl mx-auto flex items-center justify-between">
          <!-- Left: brand + desktop nav -->
          <div class="flex items-center gap-4 sm:gap-6">
            <a
              routerLink="/tasks"
              class="text-lg sm:text-xl font-semibold text-slate-800 dark:text-slate-100 whitespace-nowrap"
            >
              Task Manager
            </a>
            <!-- Desktop nav links -->
            <div class="hidden sm:flex items-center gap-1">
              <a
                routerLink="/tasks"
                routerLinkActive="bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-white"
                [routerLinkActiveOptions]="{ exact: true }"
                class="px-3 py-2 rounded-lg text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition flex items-center gap-2"
              >
                <app-icon name="tasks" size="sm" />
                Tasks
              </a>
              @if (canReadAudit) {
                <a
                  routerLink="/audit-log"
                  routerLinkActive="bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-white"
                  class="px-3 py-2 rounded-lg text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition flex items-center gap-2"
                >
                  <app-icon name="audit" size="sm" />
                  Audit Log
                </a>
              }
            </div>
          </div>

          <!-- Right: theme toggle + user info (desktop) + hamburger (mobile) -->
          <div class="flex items-center gap-2 sm:gap-3">
            <!-- Theme toggle -->
            <button
              (click)="theme.toggle()"
              class="p-2 rounded-lg text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 transition"
              [title]="
                theme.isDark() ? 'Switch to light mode' : 'Switch to dark mode'
              "
            >
              @if (theme.isDark()) {
                <app-icon name="sun" size="sm" />
              } @else {
                <app-icon name="moon" size="sm" />
              }
            </button>

            <!-- Desktop user info -->
            <div class="hidden sm:flex items-center gap-3">
              @if (auth.user(); as u) {
                <span class="text-sm text-slate-500 dark:text-slate-400">
                  {{ u.email }}
                  <span class="text-slate-400 dark:text-slate-500"
                    >&middot;</span
                  >
                  <span class="text-slate-600 dark:text-slate-300">{{
                    u.role
                  }}</span>
                </span>
              }
              <button
                (click)="logout()"
                class="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition"
              >
                <app-icon name="logout" size="sm" />
                Logout
              </button>
            </div>
            <!-- Mobile hamburger -->
            <button
              (click)="mobileMenuOpen.set(!mobileMenuOpen())"
              class="sm:hidden p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition"
            >
              @if (mobileMenuOpen()) {
                <app-icon name="xMark" size="md" />
              } @else {
                <app-icon name="gripVertical" size="md" />
              }
            </button>
          </div>
        </div>

        <!-- Mobile menu -->
        @if (mobileMenuOpen()) {
          <div
            class="sm:hidden mt-3 pt-3 border-t border-slate-100 dark:border-slate-700 space-y-1"
          >
            <a
              routerLink="/tasks"
              routerLinkActive="bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-white"
              [routerLinkActiveOptions]="{ exact: true }"
              (click)="mobileMenuOpen.set(false)"
              class="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition"
            >
              <app-icon name="tasks" size="sm" />
              Tasks
            </a>
            @if (canReadAudit) {
              <a
                routerLink="/audit-log"
                routerLinkActive="bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-white"
                (click)="mobileMenuOpen.set(false)"
                class="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition"
              >
                <app-icon name="audit" size="sm" />
                Audit Log
              </a>
            }
            @if (auth.user(); as u) {
              <div class="px-3 py-2 text-sm text-slate-500 dark:text-slate-400">
                {{ u.email }}
                <span class="text-slate-400 dark:text-slate-500">&middot;</span>
                <span class="text-slate-600 dark:text-slate-300">{{
                  u.role
                }}</span>
              </div>
            }
            <button
              (click)="logout()"
              class="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition"
            >
              <app-icon name="logout" size="sm" />
              Logout
            </button>
          </div>
        }
      </nav>

      <!-- Main content -->
      <main class="flex-1 p-3 sm:p-4 max-w-6xl mx-auto w-full">
        <router-outlet />
      </main>
    </div>
  `,
})
export class LayoutComponent {
  auth = inject(AuthService);
  theme = inject(ThemeService);
  mobileMenuOpen = signal(false);

  get canReadAudit() {
    return this.auth.hasPermission(Permission.AUDIT_READ);
  }

  logout(): void {
    this.auth.logout();
  }
}
