import {
  Component,
  inject,
  signal,
  ChangeDetectionStrategy,
} from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { AuthService } from '../../../core/auth/auth.service';
import { AuthApiService } from '../../../core/auth/auth-api.service';
import { IconComponent } from '../../../shared/icon.component';

@Component({
  imports: [ReactiveFormsModule, RouterModule, IconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div
      class="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900 px-4 transition-colors"
    >
      <div class="w-full max-w-sm">
        <div class="text-center mb-8">
          <h1 class="text-2xl font-semibold text-slate-800 dark:text-slate-100">
            Create account
          </h1>
          <p class="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Task Manager
          </p>
        </div>

        <form
          class="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-6 space-y-4 transition-colors"
          [formGroup]="form"
          (ngSubmit)="onSubmit()"
        >
          @if (error()) {
            <div
              class="p-3 rounded-lg bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300 text-sm"
            >
              {{ error() }}
            </div>
          }

          <div>
            <label
              for="org_name"
              class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1"
              >Organization name</label
            >
            <div class="relative">
              <span
                class="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 w-5 h-5"
              >
                <app-icon name="building" size="sm" />
              </span>
              <input
                id="org_name"
                type="text"
                formControlName="org_name"
                class="w-full pl-10 pr-3 py-2 border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-slate-500 focus:border-slate-500 transition-colors"
                placeholder="Acme Inc"
              />
            </div>
            @if (
              form.get('org_name')?.invalid && form.get('org_name')?.touched
            ) {
              <p class="mt-1 text-xs text-red-600 dark:text-red-400">
                Organization name required
              </p>
            }
          </div>

          <div>
            <label
              for="email"
              class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1"
              >Email</label
            >
            <div class="relative">
              <span
                class="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 w-5 h-5"
              >
                <app-icon name="mail" size="sm" />
              </span>
              <input
                id="email"
                type="email"
                formControlName="email"
                class="w-full pl-10 pr-3 py-2 border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-slate-500 focus:border-slate-500 transition-colors"
                placeholder="you@example.com"
              />
            </div>
            @if (form.get('email')?.invalid && form.get('email')?.touched) {
              <p class="mt-1 text-xs text-red-600 dark:text-red-400">
                Valid email required
              </p>
            }
          </div>

          <div>
            <label
              for="password"
              class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1"
              >Password (min 6 characters)</label
            >
            <div class="relative">
              <span
                class="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 w-5 h-5"
              >
                <app-icon name="lock" size="sm" />
              </span>
              <input
                id="password"
                type="password"
                formControlName="password"
                class="w-full pl-10 pr-3 py-2 border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-slate-500 focus:border-slate-500 transition-colors"
                placeholder="••••••••"
              />
            </div>
            @if (
              form.get('password')?.invalid && form.get('password')?.touched
            ) {
              <p class="mt-1 text-xs text-red-600 dark:text-red-400">
                Password required (min 6 characters)
              </p>
            }
          </div>

          <button
            type="submit"
            [disabled]="form.invalid || loading()"
            class="w-full py-2.5 px-4 rounded-lg bg-slate-800 dark:bg-slate-200 text-white dark:text-slate-900 font-medium hover:bg-slate-700 dark:hover:bg-slate-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {{ loading() ? 'Creating account…' : 'Create account' }}
          </button>
        </form>

        <p class="mt-4 text-center text-sm text-slate-500 dark:text-slate-400">
          Already have an account?
          <a
            routerLink="/login"
            class="font-medium text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
            >Sign in</a
          >
        </p>
      </div>
    </div>
  `,
})
export class RegisterComponent {
  private fb = inject(FormBuilder);
  private authApi = inject(AuthApiService);
  private auth = inject(AuthService);
  private router = inject(Router);

  form = this.fb.nonNullable.group({
    org_name: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
  });

  loading = signal(false);
  error = signal('');

  constructor() {
    if (this.auth.isLoggedIn()) {
      this.router.navigate(['/tasks']);
    }
  }

  onSubmit(): void {
    this.error.set('');
    if (this.form.invalid) return;

    this.loading.set(true);
    this.authApi.register(this.form.getRawValue()).subscribe({
      next: (res) => {
        this.loading.set(false);
        this.auth.tokenValue = res.accessToken;
        this.router.navigate(['/tasks']);
      },
      error: (err) => {
        this.loading.set(false);
        this.error.set(
          err.error?.message ||
            'Registration failed. Email or org name may already exist.',
        );
      },
    });
  }
}
