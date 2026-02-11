import { Injectable, inject, signal, computed } from '@angular/core';
import { Router } from '@angular/router';
import {
  JwtPayload,
  Permission,
  ROLE_PERMISSIONS,
  Role,
} from '@snzenwata-e1b7a28d-bebb-423b-9595-0c8eab0d1607/data';

const TOKEN_KEY = 'accessToken';

function decodeJwt(token: string): JwtPayload | null {
  try {
    const payload = token.split('.')[1];
    if (!payload) return null;
    const decoded = JSON.parse(atob(payload));
    return {
      sub: decoded.sub,
      email: decoded.email,
      role: decoded.role as Role,
      orgId: decoded.orgId,
    };
  } catch {
    return null;
  }
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private router = inject(Router);

  private readonly tokenSignal = signal<string | null>(
    typeof localStorage !== 'undefined'
      ? localStorage.getItem(TOKEN_KEY)
      : null,
  );

  readonly token = computed(() => this.tokenSignal());
  readonly user = computed(() => {
    const t = this.tokenSignal();
    return t ? decodeJwt(t) : null;
  });
  readonly isLoggedIn = computed(() => !!this.user());

  get tokenValue(): string | null {
    return this.tokenSignal();
  }

  set tokenValue(value: string | null) {
    if (value) {
      localStorage.setItem(TOKEN_KEY, value);
    } else {
      localStorage.removeItem(TOKEN_KEY);
    }
    this.tokenSignal.set(value);
  }

  hasPermission(permission: Permission): boolean {
    const u = this.user();
    if (!u) return false;
    const granted = ROLE_PERMISSIONS[u.role] ?? [];
    return granted.includes(permission);
  }

  logout(): void {
    this.tokenValue = null;
    this.router.navigate(['/login']);
  }
}
