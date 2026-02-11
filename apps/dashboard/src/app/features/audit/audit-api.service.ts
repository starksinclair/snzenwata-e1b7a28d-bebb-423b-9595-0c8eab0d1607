import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface User {
  id: string;
  email: string;
}

export interface Organization {
  id: string;
  name: string;
}

export interface AuditLog {
  id: string;
  occurredAt: string;
  actorUserId: string;
  actorUser: User;
  actorOrgId: string;
  actorOrg: Organization;
  action: string;
  resourceType?: string | null;
  resourceId?: string | null;
  success: boolean;
  reason?: string | null;
}

@Injectable({ providedIn: 'root' })
export class AuditApiService {
  private http = inject(HttpClient);

  findAll(): Observable<AuditLog[]> {
    return this.http.get<AuditLog[]>('/audits-logs');
  }
}
