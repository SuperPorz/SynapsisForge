import { Injectable } from '@angular/core';
import {
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpInterceptor,
  HttpErrorResponse
} from '@angular/common/http';
import { BehaviorSubject, Observable, throwError } from 'rxjs';
import { catchError, filter, switchMap, take } from 'rxjs/operators';
import { AuthService } from '../services/auth.service';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {

  private isRefreshing = false;
  private refreshTokenSubject = new BehaviorSubject<string | null>(null);

  constructor(private authService: AuthService) {}

  intercept(req: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    if (this.isAuthRoute(req.url)) {
      return next.handle(req);
    }

    const token = this.authService.getToken();
    const authReq = token ? this.addToken(req, token) : req;

    return next.handle(authReq).pipe(
      catchError(error => {
        if (error instanceof HttpErrorResponse && error.status === 401) {
          return this.handle401(req, next);
        }
        return throwError(() => error);
      })
    );
  }

  private isAuthRoute(url: string): boolean {
    return url.includes('/auth/login') || url.includes('/auth/refresh');
  }

  private addToken(req: HttpRequest<unknown>, token: string): HttpRequest<unknown> {
    return req.clone({
      setHeaders: { Authorization: `Bearer ${token}` }
    });
  }

  private handle401(req: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    if (this.isRefreshing) {
      // ── CODA PENDING ──────────────────────────────────────────────────────
      // Un refresh è già in corso: invece di lanciarne un altro (race condition),
      // questa richiesta si mette in attesa sul Subject.
      // filter(token !== null) blocca il flusso finché il refresh non completa.
      // take(1) fa sì che ogni richiesta in coda si sblocchi una volta sola.
      return this.refreshTokenSubject.pipe(
        filter(token => token !== null),
        take(1),
        switchMap(token => next.handle(this.addToken(req, token!)))
      );
    }

    // ── AVVIA IL REFRESH ───────────────────────────────────────────────────
    // Prima richiesta che riceve 401: prende il "lock" e fa il refresh.
    // next(null) chiude il cancello: le richieste successive entrano nella coda.
    this.isRefreshing = true;
    this.refreshTokenSubject.next(null);

    return this.authService.refresh().pipe(
      switchMap(({ accessToken }) => {
        this.isRefreshing = false;
        this.refreshTokenSubject.next(accessToken); // apre il cancello: sblocca la coda
        return next.handle(this.addToken(req, accessToken));
      }),
      catchError(err => {
        // Refresh fallito (refresh token scaduto o revocato): logout forzato
        this.isRefreshing = false;
        this.authService.logout();
        return throwError(() => err);
      })
    );
  }
}