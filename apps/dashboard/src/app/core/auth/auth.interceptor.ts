import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from './auth.service';
import { environment } from '../../../environments/environment';

function ensureAbsoluteUrl(url: string): string {
  if (url.startsWith('http')) return url;
  const base = environment.apiUrl.replace(/\/$/, '');
  return `${base}${url.startsWith('/') ? url : '/' + url}`;
}

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  const token = auth.tokenValue;

  const originalUrl = req.url;
  const isAuthEndpoint =
    originalUrl.includes('auth/login') || originalUrl.includes('auth/register');

  const absoluteUrl = ensureAbsoluteUrl(originalUrl);
  let cloned = req.clone({ url: absoluteUrl });

  if (token && !isAuthEndpoint) {
    cloned = cloned.clone({
      setHeaders: { Authorization: `Bearer ${token}` },
    });
  }

  return next(cloned);
};
