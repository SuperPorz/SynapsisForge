// prettier-ignore
import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

interface Response<T> {
  data: T;
  statusCode: number;
  timestamp: string;
}

// trasforma la risposta in un oggetto con data, statusCode e timestamp
// prettier-ignore
@Injectable()
export class TransformInterceptor<T> implements NestInterceptor<T, Response<T>> {
  intercept(
    context: ExecutionContext,
    next: CallHandler<T>,
  ): Observable<Response<T>> {
    const response = context
      .switchToHttp()
      .getResponse<{ statusCode: number }>();

    return next.handle().pipe(
      map((data: T) => ({
        data,
        statusCode: response.statusCode,
        timestamp: new Date().toISOString(),
      })),
    );
  }
}
