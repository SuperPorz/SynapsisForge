import { HttpInterceptorFn, HttpResponse } from '@angular/common/http';
import { map } from 'rxjs/operators';

interface ApiWrapper<T> {
  data: T;
  statusCode: number;
  timestamp: string;
}

function isApiWrapper(body: unknown): body is ApiWrapper<unknown> {
  return (
    typeof body === 'object' &&
    body !== null &&
    'data' in body &&
    'statusCode' in body &&
    'timestamp' in body
  );
}

export const transformInterceptor: HttpInterceptorFn = (req, next) => {
  return next(req).pipe(
    map((event) => {
      if (event instanceof HttpResponse && isApiWrapper(event.body)) {
        return event.clone({ body: event.body.data });
      }
      return event;
    }),
  );
};
