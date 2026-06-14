import {
  HttpInterceptorFn,
  HttpRequest,
  HttpHandlerFn,
  HttpErrorResponse,
  HttpEvent,
} from '@angular/common/http';
import { inject } from '@angular/core';
import { Observable, catchError, switchMap, throwError, BehaviorSubject, filter, take } from 'rxjs';
import { AuthService } from '../services/auth.service';
import { HttpClient } from '@angular/common/http';

// Prevent multiple concurrent refresh calls
let isRefreshing = false;
const refreshSubject = new BehaviorSubject<string | null>(null);

const AUTH_ENDPOINTS = [
  '/auth/login', '/auth/register', '/auth/refresh',
  '/auth/forgot-password', '/auth/reset-password', '/auth/google',
];

function isAuthEndpoint(url: string): boolean {
  return AUTH_ENDPOINTS.some(e => url.includes(e));
}

function addToken(req: HttpRequest<unknown>, token: string): HttpRequest<unknown> {
  return req.clone({ setHeaders: { Authorization: `Bearer ${token}` } });
}

export const authInterceptor: HttpInterceptorFn = (
  req: HttpRequest<unknown>,
  next: HttpHandlerFn,
): Observable<HttpEvent<unknown>> => {
  const authService = inject(AuthService);
  const http = inject(HttpClient);

  const skipAuth = isAuthEndpoint(req.url);
  const token = authService.accessToken();
  const authReq = (token && !skipAuth) ? addToken(req, token) : req;

  return next(authReq).pipe(
    catchError((error: HttpErrorResponse): Observable<HttpEvent<unknown>> => {
      if (error.status === 401 && !skipAuth) {
        return handle401(authReq, next, authService, http);
      }
      return throwError(() => error);
    }),
  ) as Observable<HttpEvent<unknown>>;
};

function handle401(
  req: HttpRequest<unknown>,
  next: HttpHandlerFn,
  authService: AuthService,
  http: HttpClient,
): Observable<HttpEvent<unknown>> {
  if (isRefreshing) {
    return refreshSubject.pipe(
      filter(t => t !== null),
      take(1),
      switchMap(t => next(addToken(req, t!)) as Observable<HttpEvent<unknown>>),
    );
  }

  isRefreshing = true;
  refreshSubject.next(null);

  const storedRefresh = typeof localStorage !== 'undefined'
    ? localStorage.getItem('refreshToken') : null;

  if (!storedRefresh) {
    isRefreshing = false;
    authService.logout();
    return throwError(() => new Error('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.'));
  }

  return http.post<{ accessToken: string }>(
    'http://localhost:3000/auth/refresh',
    { refreshToken: storedRefresh },
  ).pipe(
    switchMap((res): Observable<HttpEvent<unknown>> => {
      isRefreshing = false;
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem('accessToken', res.accessToken);
      }
      authService.updateAccessToken(res.accessToken);
      refreshSubject.next(res.accessToken);
      return next(addToken(req, res.accessToken)) as Observable<HttpEvent<unknown>>;
    }),
    catchError((err): Observable<HttpEvent<unknown>> => {
      isRefreshing = false;
      refreshSubject.next(null);
      authService.logout();
      return throwError(() => err);
    }),
  );
}
