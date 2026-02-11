import { TaskCategory, TaskStatus } from '../enums/task.enum';
export interface CreateTaskDto {
  title: string;
  description?: string;
  category: TaskCategory;
  status: TaskStatus;
}

export interface UpdateTaskDto {
  title?: string;
  description?: string;
  category?: TaskCategory;
  status?: TaskStatus;
}
