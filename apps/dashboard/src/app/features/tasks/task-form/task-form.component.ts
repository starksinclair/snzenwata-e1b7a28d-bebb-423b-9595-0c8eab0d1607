import {
  Component,
  inject,
  signal,
  ChangeDetectionStrategy,
} from '@angular/core';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { TasksApiService } from '../tasks-api.service';
import {
  CreateTaskDto,
  UpdateTaskDto,
  TaskCategory,
  TaskStatus,
} from '@snzenwata-e1b7a28d-bebb-423b-9595-0c8eab0d1607/data';

@Component({
  imports: [ReactiveFormsModule, RouterModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="min-w-0 max-w-md mx-auto sm:mx-0">
      <div class="mb-4 sm:mb-6">
        <a
          routerLink="/tasks"
          class="text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
        >
          ← Back to tasks
        </a>
      </div>

      <div
        class="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm p-4 sm:p-6 transition-colors"
      >
        <h2
          class="text-lg font-semibold text-slate-800 dark:text-slate-100 mb-4"
        >
          {{ isEdit ? 'Edit task' : 'New task' }}
        </h2>

        @if (error()) {
          <div
            class="mb-4 p-3 rounded-lg bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300 text-sm"
          >
            {{ error() }}
          </div>
        }

        <form [formGroup]="form" (ngSubmit)="onSubmit()">
          <div class="space-y-4">
            <div>
              <label
                for="title"
                class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1"
                >Title</label
              >
              <input
                id="title"
                type="text"
                formControlName="title"
                class="w-full px-3 py-2 border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-slate-500 focus:border-slate-500 transition-colors"
                placeholder="Task title"
              />
              @if (form.get('title')?.invalid && form.get('title')?.touched) {
                <p class="mt-1 text-xs text-red-600 dark:text-red-400">
                  Title required
                </p>
              }
            </div>

            <div>
              <label
                for="description"
                class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1"
                >Description (optional)</label
              >
              <textarea
                id="description"
                formControlName="description"
                rows="3"
                class="w-full px-3 py-2 border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-slate-500 focus:border-slate-500 transition-colors"
                placeholder="Task description"
              ></textarea>
            </div>

            <div>
              <label
                for="category"
                class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1"
                >Category</label
              >
              <select
                id="category"
                formControlName="category"
                class="w-full px-3 py-2 border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-slate-500 focus:border-slate-500 transition-colors"
              >
                @for (c of categories; track c) {
                  <option [value]="c">{{ c }}</option>
                }
              </select>
            </div>

            <div>
              <label
                for="status"
                class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1"
                >Status</label
              >
              <select
                id="status"
                formControlName="status"
                class="w-full px-3 py-2 border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-slate-500 focus:border-slate-500 transition-colors"
              >
                @for (s of statuses; track s) {
                  <option [value]="s">{{ s }}</option>
                }
              </select>
            </div>
          </div>

          <div class="mt-6 flex gap-3">
            <button
              type="submit"
              [disabled]="form.invalid || loading()"
              class="px-4 py-2 rounded-lg bg-slate-800 dark:bg-slate-200 text-white dark:text-slate-900 font-medium hover:bg-slate-700 dark:hover:bg-slate-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {{ loading() ? 'Saving…' : isEdit ? 'Update' : 'Create' }}
            </button>
            <a
              routerLink="/tasks"
              class="px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-300 font-medium hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
            >
              Cancel
            </a>
          </div>
        </form>
      </div>
    </div>
  `,
})
export class TaskFormComponent {
  private fb = inject(FormBuilder);
  private api = inject(TasksApiService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  isEdit = false;
  taskId: string | null = null;

  form = this.fb.nonNullable.group({
    title: ['', Validators.required],
    description: [''],
    category: [TaskCategory.WORK, Validators.required],
    status: [TaskStatus.TODO, Validators.required],
  });

  categories = Object.values(TaskCategory);
  statuses = Object.values(TaskStatus);
  loading = signal(false);
  error = signal('');

  constructor() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id && id !== 'new') {
      this.isEdit = true;
      this.taskId = id;
      this.loadTask(id);
    }
  }

  loadTask(id: string): void {
    this.api.findOne(id).subscribe({
      next: (t) =>
        this.form.patchValue({
          title: t.title,
          description: t.description ?? '',
          category: t.category as TaskCategory,
          status: t.status as TaskStatus,
        }),
      error: () => this.router.navigate(['/tasks']),
    });
  }

  onSubmit(): void {
    this.error.set('');
    if (this.form.invalid) return;

    this.loading.set(true);
    const raw = this.form.getRawValue();

    if (this.isEdit && this.taskId) {
      const dto: UpdateTaskDto = {
        title: raw.title,
        description: raw.description || undefined,
        category: raw.category,
        status: raw.status,
      };
      this.api.update(this.taskId, dto).subscribe({
        next: () => this.router.navigate(['/tasks']),
        error: (err) => {
          this.error.set(err.error?.message || 'Failed to update');
          this.loading.set(false);
        },
      });
    } else {
      const dto: CreateTaskDto = {
        title: raw.title,
        description: raw.description || undefined,
        category: raw.category,
        status: raw.status,
      };
      this.api.create(dto).subscribe({
        next: () => this.router.navigate(['/tasks']),
        error: (err) => {
          this.error.set(err.error?.message || 'Failed to create');
          this.loading.set(false);
        },
      });
    }
  }
}
