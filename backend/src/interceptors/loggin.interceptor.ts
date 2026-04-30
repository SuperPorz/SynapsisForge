// prettier-ignore
import { Injectable, NestInterceptor, ExecutionContext, CallHandler, Logger } from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

// registra (LOGGA) 'metodo/url/status code/tempo di esecuzione'
@Injectable()
export class LoggingInterceptor<T> implements NestInterceptor<T, T> {
  private readonly logger = new Logger(LoggingInterceptor.name);

  intercept(context: ExecutionContext, next: CallHandler<T>): Observable<T> {
    const request = context
      .switchToHttp()
      .getRequest<{ method: string; url: string }>();
    const response = context
      .switchToHttp()
      .getResponse<{ statusCode: number }>();
    const { method, url } = request;
    const start = Date.now();

    return next.handle().pipe(
      tap(() => {
        const elapsed = Date.now() - start;
        this.logger.log(
          `${method} ${url} → ${response.statusCode} | ${elapsed}ms`,
        );
      }),
    );
  }
}
