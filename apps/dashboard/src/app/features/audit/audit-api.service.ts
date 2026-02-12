import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuditLog } from '@snzenwata-e1b7a28d-bebb-423b-9595-0c8eab0d1607/data';

@Injectable({ providedIn: 'root' })
export class AuditApiService {
  private http = inject(HttpClient);

  findAll(): Observable<AuditLog[]> {
    return this.http.get<AuditLog[]>('/audits-logs');
  }
}
