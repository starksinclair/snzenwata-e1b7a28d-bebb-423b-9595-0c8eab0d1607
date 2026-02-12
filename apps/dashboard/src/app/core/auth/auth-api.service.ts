import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  LoginRequest,
  RegisterRequest,
  AuthResponse,
} from '@snzenwata-e1b7a28d-bebb-423b-9595-0c8eab0d1607/data';

@Injectable({ providedIn: 'root' })
export class AuthApiService {
  private http = inject(HttpClient);

  login(body: LoginRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>('/auth/login', body);
  }

  register(body: RegisterRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>('/auth/register', body);
  }
}
