import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  CreateTaskDto,
  UpdateTaskDto,
} from '@snzenwata-e1b7a28d-bebb-423b-9595-0c8eab0d1607/data';

export interface Task {
  id: string;
  title: string;
  description?: string;
  category: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

@Injectable({ providedIn: 'root' })
export class TasksApiService {
  private http = inject(HttpClient);

  findAll(): Observable<Task[]> {
    return this.http.get<Task[]>('/tasks');
  }

  findOne(id: string): Observable<Task> {
    return this.http.get<Task>(`/tasks/${id}`);
  }

  create(dto: CreateTaskDto): Observable<Task> {
    return this.http.post<Task>('/tasks', dto);
  }

  update(id: string, dto: UpdateTaskDto): Observable<Task> {
    return this.http.put<Task>(`/tasks/${id}`, dto);
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`/tasks/${id}`);
  }
}
