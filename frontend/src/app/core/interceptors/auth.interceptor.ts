import { HttpInterceptorFn, HttpRequest, HttpHandlerFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, switchMap, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';

export const authInterceptor: HttpInterceptorFn = (req: HttpRequest<unknown>, next: HttpHandlerFn) => {
  const authService = inject(AuthService);
  const token = authService.accessToken();

  let authReq = req;
  if (token) {
    authReq = req.clone({
      setHeaders: { Authorization: `Bearer ${token}` }
    });
  }

  return next(authReq).pipe(
    catchError((error: HttpErrorResponse) => {
      // Logic xử lý refreshToken nếu server trả 401
      if (error.status === 401 && req.url.indexOf('/auth/refresh') === -1) {
        // ... Logic refresh token sẽ được nối vào đây nếu auth service có func refreshToken
        return throwError(() => error);
      }
      return throwError(() => error);
    })
  );
};
