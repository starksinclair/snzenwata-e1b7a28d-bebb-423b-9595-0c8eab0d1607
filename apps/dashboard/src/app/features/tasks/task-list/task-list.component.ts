import {
  Component,
  inject,
  signal,
  computed,
  ChangeDetectionStrategy,
} from '@angular/core';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import {
  CdkDragDrop,
  CdkDrag,
  CdkDropList,
  moveItemInArray,
  transferArrayItem, CdkDragHandle,
} from '@angular/cdk/drag-drop';
import { TasksApiService, Task } from '../tasks-api.service';
import { AuthService } from '../../../core/auth/auth.service';
import {
  Permission,
  TaskCategory,
  TaskStatus,
} from '@snzenwata-e1b7a28d-bebb-423b-9595-0c8eab0d1607/data';
import { IconComponent } from '../../../shared/icon.component';

type ViewMode = 'list' | 'board';
type SortKey = 'title' | 'createdAt' | 'status' | 'category';

@Component({
  imports: [
    RouterModule,
    FormsModule,
    IconComponent,
    CdkDrag,
    CdkDropList,
    CdkDragHandle,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <!-- Toolbar -->
    <div
      class="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"
    >
      <h2 class="text-lg font-semibold text-slate-800 dark:text-slate-100">
        Tasks
      </h2>

      <div class="flex flex-wrap items-center gap-2">
        <!-- Category filter -->
        <select
          [ngModel]="filterCategory()"
          (ngModelChange)="filterCategory.set($event)"
          class="text-sm border border-slate-200 dark:border-slate-600 rounded-lg px-2 py-1.5 bg-white dark:bg-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-slate-500 transition-colors"
        >
          <option value="">All categories</option>
          @for (c of categories; track c) {
            <option [value]="c">{{ c }}</option>
          }
        </select>

        <!-- Status filter -->
        <select
          [ngModel]="filterStatus()"
          (ngModelChange)="filterStatus.set($event)"
          class="text-sm border border-slate-200 dark:border-slate-600 rounded-lg px-2 py-1.5 bg-white dark:bg-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-slate-500 transition-colors"
        >
          <option value="">All statuses</option>
          @for (s of statuses; track s) {
            <option [value]="s">{{ s }}</option>
          }
        </select>

        <!-- Sort -->
        <select
          [ngModel]="sortKey()"
          (ngModelChange)="sortKey.set($event)"
          class="text-sm border border-slate-200 dark:border-slate-600 rounded-lg px-2 py-1.5 bg-white dark:bg-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-slate-500 transition-colors"
        >
          <option value="createdAt">Newest</option>
          <option value="title">Title</option>
          <option value="status">Status</option>
          <option value="category">Category</option>
        </select>

        <!-- View toggle -->
        <div
          class="flex border border-slate-200 dark:border-slate-600 rounded-lg overflow-hidden"
        >
          <button
            (click)="viewMode.set('list')"
            [class]="
              viewMode() === 'list'
                ? 'bg-slate-800 dark:bg-slate-200 text-white dark:text-slate-900'
                : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'
            "
            class="p-1.5 transition-colors"
            title="List view"
          >
            <app-icon name="listBullet" size="sm" />
          </button>
          <button
            (click)="viewMode.set('board')"
            [class]="
              viewMode() === 'board'
                ? 'bg-slate-800 dark:bg-slate-200 text-white dark:text-slate-900'
                : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'
            "
            class="p-1.5 transition-colors"
            title="Board view"
          >
            <app-icon name="viewColumns" size="sm" />
          </button>
        </div>

        @if (canCreate) {
          <a
            routerLink="/tasks/new"
            class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium bg-slate-800 dark:bg-slate-200 text-white dark:text-slate-900 hover:bg-slate-700 dark:hover:bg-slate-300 transition-colors"
          >
            <app-icon name="plus" size="sm" />
            <span class="hidden sm:inline">New task</span>
          </a>
        }
      </div>
    </div>

    <!-- Content -->
    @if (loading()) {
      <div class="p-8 text-center text-slate-500 dark:text-slate-400">
        Loading…
      </div>
    } @else if (error()) {
      <div class="p-8 text-center text-red-600 dark:text-red-400">
        {{ error() }}
      </div>
    } @else if (!allTasks().length) {
      <div
        class="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm p-8 text-center text-slate-500 dark:text-slate-400 transition-colors"
      >
        No tasks yet
      </div>
    } @else {
      <!-- LIST VIEW -->
      @if (viewMode() === 'list') {
        <div
          class="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden transition-colors"
        >
          <div
            cdkDropList
            [cdkDropListData]="filteredTasks()"
            (cdkDropListDropped)="onListDrop($event)"
            class="divide-y divide-slate-100 dark:divide-slate-700"
          >
            @for (t of filteredTasks(); track t.id) {
              <div
                cdkDrag
                [cdkDragDisabled]="!canUpdate"
                class="p-3 sm:p-4 flex items-center gap-3 hover:bg-slate-50/50 dark:hover:bg-slate-700/50 transition group"
              >
                <!-- Drag handle -->
                @if (canUpdate) {
                  <span
                    cdkDragHandle
                    class="cursor-grab text-slate-300 dark:text-slate-600 group-hover:text-slate-400 dark:group-hover:text-slate-500 hidden sm:block"
                  >
                    <app-icon name="gripVertical" size="sm" />
                  </span>
                }
                <!-- Category badge -->
                <span [class]="categoryBadge(t.category)">{{
                  t.category
                }}</span>
                <!-- Title -->
                <div class="flex-1 min-w-0">
                  @if (canUpdate) {
                    <a
                      [routerLink]="['/tasks', t.id, 'edit']"
                      class="block font-medium text-slate-800 dark:text-slate-100 hover:text-slate-600 dark:hover:text-slate-300 truncate text-sm sm:text-base"
                    >
                      {{ t.title }}
                    </a>
                  } @else {
                    <span
                      class="block font-medium text-slate-800 dark:text-slate-100 truncate text-sm sm:text-base"
                      >{{ t.title }}</span
                    >
                  }
                </div>
                <!-- Status pill -->
                <span
                  [class]="statusPill(t.status)"
                  class="text-xs hidden sm:inline-flex"
                  >{{ t.status }}</span
                >
                <!-- Actions -->
                <div class="flex items-center gap-1 shrink-0">
                  @if (canUpdate) {
                    <a
                      [routerLink]="['/tasks', t.id, 'edit']"
                      class="p-1.5 rounded-lg text-slate-400 dark:text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700 hover:text-slate-600 dark:hover:text-slate-300 transition"
                      title="Edit"
                    >
                      <app-icon name="pencil" size="sm" />
                    </a>
                  }
                  @if (canDelete) {
                    <button
                      (click)="onDelete(t.id)"
                      class="p-1.5 rounded-lg text-slate-400 dark:text-slate-500 hover:bg-red-50 dark:hover:bg-red-900/30 hover:text-red-600 dark:hover:text-red-400 transition"
                      title="Delete"
                    >
                      <app-icon name="trash" size="sm" />
                    </button>
                  }
                </div>
              </div>
            }
          </div>
        </div>
      }

      <!-- BOARD VIEW (Kanban) -->
      @if (viewMode() === 'board') {
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4" cdkDropListGroup>
          @for (col of boardColumns(); track col.status) {
            <div class="flex flex-col">
              <div class="flex items-center gap-2 mb-2 px-1">
                <span [class]="statusDot(col.status)"></span>
                <h3
                  class="text-sm font-semibold text-slate-700 dark:text-slate-200"
                >
                  {{ col.label }}
                </h3>
                <span
                  class="text-xs text-slate-400 dark:text-slate-500 ml-auto"
                  >{{ col.tasks.length }}</span
                >
              </div>
              <div
                cdkDropList
                [cdkDropListData]="col.tasks"
                [id]="col.status"
                [cdkDropListConnectedTo]="columnIds()"
                (cdkDropListDropped)="onBoardDrop($event)"
                class="flex-1 space-y-2 min-h-[80px] rounded-xl bg-slate-100/60 dark:bg-slate-800/40 border border-dashed border-slate-200 dark:border-slate-700 p-2 transition-colors"
              >
                @for (t of col.tasks; track t.id) {
                  <div
                    cdkDrag
                    [cdkDragDisabled]="!canUpdate"
                    class="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm p-3 cursor-grab active:cursor-grabbing hover:shadow transition-colors"
                  >
                    <div class="flex items-start justify-between gap-2">
                      <div class="min-w-0 flex-1">
                        @if (canUpdate) {
                          <a
                            [routerLink]="['/tasks', t.id, 'edit']"
                            class="block text-sm font-medium text-slate-800 dark:text-slate-100 hover:text-slate-600 dark:hover:text-slate-300 truncate"
                          >
                            {{ t.title }}
                          </a>
                        } @else {
                          <span
                            class="block text-sm font-medium text-slate-800 dark:text-slate-100 truncate"
                            >{{ t.title }}</span
                          >
                        }
                        @if (t.description) {
                          <p
                            class="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2"
                          >
                            {{ t.description }}
                          </p>
                        }
                      </div>
                      @if (canDelete) {
                        <button
                          (click)="onDelete(t.id)"
                          class="p-1 rounded text-slate-300 dark:text-slate-600 hover:text-red-500 dark:hover:text-red-400 transition shrink-0"
                          title="Delete"
                        >
                          <app-icon name="trash" size="sm" />
                        </button>
                      }
                    </div>
                    <div class="mt-2">
                      <span [class]="categoryBadge(t.category)">{{
                        t.category
                      }}</span>
                    </div>
                  </div>
                } @empty {
                  <div
                    class="text-center text-xs text-slate-400 dark:text-slate-500 py-4"
                  >
                    Drop tasks here
                  </div>
                }
              </div>
            </div>
          }
        </div>
      }
    }
  `,
})
export class TaskListComponent {
  private api = inject(TasksApiService);
  private auth = inject(AuthService);

  allTasks = signal<Task[]>([]);
  loading = signal(false);
  error = signal('');

  viewMode = signal<ViewMode>('board');
  filterCategory = signal('');
  filterStatus = signal('');
  sortKey = signal<SortKey>('createdAt');

  categories = Object.values(TaskCategory);
  statuses = Object.values(TaskStatus);

  canCreate = this.auth.hasPermission(Permission.TASK_CREATE);
  canUpdate = this.auth.hasPermission(Permission.TASK_UPDATE);
  canDelete = this.auth.hasPermission(Permission.TASK_DELETE);

  filteredTasks = computed(() => {
    let tasks = [...this.allTasks()];
    const cat = this.filterCategory();
    const status = this.filterStatus();
    if (cat) tasks = tasks.filter((t) => t.category === cat);
    if (status) tasks = tasks.filter((t) => t.status === status);
    const key = this.sortKey();
    tasks.sort((a, b) => {
      if (key === 'createdAt')
        return (
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
      return (a[key] ?? '').localeCompare(b[key] ?? '');
    });
    return tasks;
  });

  boardColumns = computed(() => {
    const tasks = this.filteredTasks();
    return [
      {
        status: TaskStatus.TODO,
        label: 'To Do',
        tasks: tasks.filter((t) => t.status === TaskStatus.TODO),
      },
      {
        status: TaskStatus.IN_PROGRESS,
        label: 'In Progress',
        tasks: tasks.filter((t) => t.status === TaskStatus.IN_PROGRESS),
      },
      {
        status: TaskStatus.COMPLETED,
        label: 'Completed',
        tasks: tasks.filter((t) => t.status === TaskStatus.COMPLETED),
      },
    ];
  });

  columnIds = computed(() => this.statuses.map((s) => s as string));

  constructor() {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.error.set('');
    this.api.findAll().subscribe({
      next: (data) => {
        this.allTasks.set(data);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(err.error?.message || 'Failed to load tasks');
        this.loading.set(false);
      },
    });
  }

  onDelete(id: string): void {
    if (!confirm('Delete this task?')) return;
    this.api.delete(id).subscribe({
      next: () => this.load(),
      error: (err) => {
        this.error.set(err.error?.message || 'Failed to delete');
      },
    });
  }

  onListDrop(event: CdkDragDrop<Task[]>): void {
    const arr = [...this.filteredTasks()];
    moveItemInArray(arr, event.previousIndex, event.currentIndex);
    this.allTasks.set(arr);
  }

  onBoardDrop(event: CdkDragDrop<Task[]>): void {
    if (event.previousContainer === event.container) {
      const arr = [...event.container.data];
      moveItemInArray(arr, event.previousIndex, event.currentIndex);
      this.rebuildAllTasks(event.container.id as TaskStatus, arr);
    } else {
      const prev = [...event.previousContainer.data];
      const curr = [...event.container.data];
      transferArrayItem(prev, curr, event.previousIndex, event.currentIndex);

      const task = curr[event.currentIndex];
      const newStatus = event.container.id as TaskStatus;

      this.allTasks.update((all) =>
        all.map((t) => (t.id === task.id ? { ...t, status: newStatus } : t)),
      );

      if (this.canUpdate) {
        this.api.update(task.id, { status: newStatus }).subscribe({
          error: () => this.load(),
        });
      }
    }
  }

  private rebuildAllTasks(status: TaskStatus, updated: Task[]): void {
    const ids = new Set(updated.map((t) => t.id));
    this.allTasks.update((all) => {
      const others = all.filter((t) => t.status !== status || !ids.has(t.id));
      return [...others, ...updated];
    });
  }

  categoryBadge(category: string): string {
    const base =
      'inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium uppercase tracking-wide';
    switch (category) {
      case TaskCategory.WORK:
        return `${base} bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300`;
      case TaskCategory.PERSONAL:
        return `${base} bg-violet-50 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300`;
      default:
        return `${base} bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300`;
    }
  }

  statusPill(status: string): string {
    const base = 'items-center px-2 py-0.5 rounded-full font-medium';
    switch (status) {
      case TaskStatus.TODO:
        return `${base} bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300`;
      case TaskStatus.IN_PROGRESS:
        return `${base} bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300`;
      case TaskStatus.COMPLETED:
        return `${base} bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300`;
      default:
        return `${base} bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300`;
    }
  }

  statusDot(status: string): string {
    const base = 'w-2 h-2 rounded-full';
    switch (status) {
      case TaskStatus.TODO:
        return `${base} bg-slate-400`;
      case TaskStatus.IN_PROGRESS:
        return `${base} bg-amber-400`;
      case TaskStatus.COMPLETED:
        return `${base} bg-emerald-400`;
      default:
        return `${base} bg-slate-300`;
    }
  }
}
