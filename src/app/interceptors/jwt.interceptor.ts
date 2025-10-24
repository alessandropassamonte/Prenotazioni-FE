// ========================================
// HTTP INTERCEPTOR - Angular
// ========================================
// File: src/app/interceptors/jwt.interceptor.ts

import { inject } from '@angular/core';
import {
    HttpRequest,
    HttpHandlerFn,
    HttpEvent,
    HttpErrorResponse,
    HttpInterceptorFn
} from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { AuthService } from '../services/auth.service';
import { Router } from '@angular/router';

export const jwtInterceptor: HttpInterceptorFn = (
    request: HttpRequest<any>,
    next: HttpHandlerFn
): Observable<HttpEvent<any>> => {
    const authService = inject(AuthService);
    const router = inject(Router);

    // Aggiungi token JWT alle richieste
    const token = authService.getToken();

    if (token) {
        request = request.clone({
            setHeaders: {
                Authorization: `Bearer ${token}`
            }
        });
    }

    return next(request).pipe(
        catchError((error: HttpErrorResponse) => {
            console.log('JWT INTERCEPTOR - Error:', error.status);
            if (error.status === 401) {
                // Token scaduto o non valido - logout
                authService.logout();
                router.navigate(['/login']);
            }
            return throwError(() => error);
        })
    );
};
