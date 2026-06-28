import { HttpRequest, HttpHandler, HttpEvent, HttpErrorResponse } from '@angular/common/http';
import { Observable, of, throwError } from 'rxjs';
import { delay } from 'rxjs/operators';
import { AuthInterceptor } from './auth.interceptor';
import { AuthService } from '../services/auth.service';
import { environment } from '../../../environments/environment';

describe('AuthInterceptor', () => {
  let interceptor: AuthInterceptor;
  let authService: {
    getToken: ReturnType<typeof vi.fn>;
    refresh: ReturnType<typeof vi.fn>;
    logout: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    authService = {
      getToken: vi.fn(),
      refresh: vi.fn(),
      logout: vi.fn(),
    };
    interceptor = new AuthInterceptor(authService as unknown as AuthService);
  });

  function createRequest(url: string): HttpRequest<unknown> {
    return new HttpRequest<unknown>('GET', url);
  }

  function createHandler(): { handle: ReturnType<typeof vi.fn> } {
    return {
      handle: vi.fn().mockReturnValue(of({} as HttpEvent<unknown>)),
    };
  }

  describe('auth route bypass', () => {
    it('should not add token for /auth/login', () => {
      const req = createRequest(`${environment.apiUrl}/auth/login`);
      const handler = createHandler();

      interceptor.intercept(req, handler as unknown as HttpHandler);

      expect(handler.handle).toHaveBeenCalledWith(req);
      expect(authService.getToken).not.toHaveBeenCalled();
    });

    it('should not add token for /auth/refresh', () => {
      const req = createRequest(`${environment.apiUrl}/auth/refresh`);
      const handler = createHandler();

      interceptor.intercept(req, handler as unknown as HttpHandler);

      expect(handler.handle).toHaveBeenCalledWith(req);
      expect(authService.getToken).not.toHaveBeenCalled();
    });
  });

  describe('token injection', () => {
    it('should add Bearer token when token exists', () => {
      authService.getToken.mockReturnValue('test-token');
      const req = createRequest(`${environment.apiUrl}/courses`);
      const handler = createHandler();

      interceptor.intercept(req, handler as unknown as HttpHandler);

      const passedReq = handler.handle.mock.calls[0][0] as HttpRequest<unknown>;
      expect(passedReq.headers.get('Authorization')).toBe('Bearer test-token');
    });

    it('should pass through unchanged when no token', () => {
      authService.getToken.mockReturnValue(null);
      const req = createRequest(`${environment.apiUrl}/courses`);
      const handler = createHandler();

      interceptor.intercept(req, handler as unknown as HttpHandler);

      const passedReq = handler.handle.mock.calls[0][0] as HttpRequest<unknown>;
      expect(passedReq.headers.has('Authorization')).toBe(false);
    });
  });

  describe('401 handling', () => {
    it('should refresh token on 401 and retry', () => {
      authService.getToken.mockReturnValue('old-token');
      authService.refresh.mockReturnValue(of({ accessToken: 'new-token' }));

      const req = createRequest(`${environment.apiUrl}/courses`);
      const handler = {
        handle: vi.fn()
          .mockReturnValueOnce(throwError(() => new HttpErrorResponse({ status: 401 })))
          .mockReturnValue(of({} as HttpEvent<unknown>)),
      };

      interceptor.intercept(req, handler as unknown as HttpHandler).subscribe({
        error: () => {},
      });

      expect(authService.refresh).toHaveBeenCalled();
      expect(handler.handle).toHaveBeenCalledTimes(2);
      const retryReq = handler.handle.mock.calls[1][0] as HttpRequest<unknown>;
      expect(retryReq.headers.get('Authorization')).toBe('Bearer new-token');
    });

    it('should call logout when refresh fails', () => {
      authService.getToken.mockReturnValue('old-token');
      authService.refresh.mockReturnValue(throwError(() => new HttpErrorResponse({ status: 401 })));

      const req = createRequest(`${environment.apiUrl}/courses`);
      const handler = {
        handle: vi.fn().mockReturnValue(throwError(() => new HttpErrorResponse({ status: 401 }))),
      };

      interceptor.intercept(req, handler as unknown as HttpHandler).subscribe({
        error: () => {},
      });

      expect(authService.logout).toHaveBeenCalled();
    });

    it('should not intercept non-401 errors', () => {
      authService.getToken.mockReturnValue('test-token');
      const req = createRequest(`${environment.apiUrl}/courses`);
      const handler = {
        handle: vi.fn().mockReturnValue(throwError(() => new HttpErrorResponse({ status: 403 }))),
      };

      interceptor.intercept(req, handler as unknown as HttpHandler).subscribe({
        error: () => {},
      });

      expect(authService.refresh).not.toHaveBeenCalled();
    });

    it('should queue concurrent 401s and perform single refresh', () => new Promise<void>((done) => {
      authService.getToken.mockReturnValue('old-token');
      authService.refresh.mockReturnValue(
        of({ accessToken: 'new-token' }).pipe(delay(0)),
      );

      const req = createRequest(`${environment.apiUrl}/courses`);
      const handle = vi.fn()
        .mockReturnValueOnce(throwError(() => new HttpErrorResponse({ status: 401 })))
        .mockReturnValueOnce(throwError(() => new HttpErrorResponse({ status: 401 })))
        .mockReturnValue(of({} as HttpEvent<unknown>));

      let completed = 0;
      function onComplete() {
        completed++;
        if (completed === 2) {
          expect(authService.refresh).toHaveBeenCalledTimes(1);
          done();
        }
      }

      interceptor.intercept(req, { handle } as unknown as HttpHandler).subscribe({ next: onComplete, error: () => {} });
      interceptor.intercept(req, { handle } as unknown as HttpHandler).subscribe({ next: onComplete, error: () => {} });
    }));
  });
});
