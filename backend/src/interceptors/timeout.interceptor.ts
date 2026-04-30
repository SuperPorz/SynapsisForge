// prettier-ignore
import { Injectable, NestInterceptor, ExecutionContext, CallHandler, HttpException, HttpStatus, } from '@nestjs/common';
import { Observable, throwError, TimeoutError } from 'rxjs';
import { timeout, catchError } from 'rxjs/operators';

// usiamo una tipizzazione generica per evitare di usare any
// se la richiesta impiega più di 10 secondi, restituisce un errore 504 (Gateway Timeout)
@Injectable()
export class TimeoutInterceptor<T> implements NestInterceptor<T, T> {
  intercept(context: ExecutionContext, next: CallHandler<T>): Observable<T> {
    return next.handle().pipe(
      timeout(10000),
      catchError((err: unknown) => {
        if (err instanceof TimeoutError) {
          return throwError(
            () =>
              // gateway timeout corrisponde a 504;
              new HttpException('Gateway Timeout', HttpStatus.GATEWAY_TIMEOUT), // oppure: return throwError(() => new RequestTimeoutException('Request timeout')); 408
          );
        }
        return throwError(() => err);
      }),
    );
  }
}
