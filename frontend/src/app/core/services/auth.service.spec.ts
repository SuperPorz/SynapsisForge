import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { AuthService, RegisterDto } from './auth.service';
import { environment } from '../../../environments/environment';
import { Router } from '@angular/router';

const VALID_TOKEN =
  'eyJhbGciOiJIUzI1NiJ9.' +
  btoa(JSON.stringify({
    sub: '123e4567-e89b-12d3-a456-426614174000',
    email: 'test@synapsis.com',
    role: 'INSTRUCTOR',
    plan: 'PREMIUM',
    exp: 9999999999,
  })) +
  '.sig';

function expiredToken(): string {
  return (
    'eyJhbGciOiJIUzI1NiJ9.' +
    btoa(
      JSON.stringify({
        sub: '123e4567-e89b-12d3-a456-426614174000',
        email: 'test@synapsis.com',
        role: 'STUDENT',
        exp: 0,
      }),
    ) +
    '.sig'
  );
}

describe('AuthService', () => {
  let service: AuthService;
  let httpMock: HttpTestingController;
  let router: { navigate: ReturnType<typeof vi.fn> };

  function configureModule() {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: Router, useValue: { navigate: vi.fn() } },
      ],
    });
  }

  beforeEach(() => {
    const store: Record<string, string> = {};
    vi.stubGlobal('localStorage', {
      getItem: vi.fn((key: string) => store[key] ?? null),
      setItem: vi.fn((key: string, value: string) => { store[key] = value; }),
      removeItem: vi.fn((key: string) => { delete store[key]; }),
      clear: vi.fn(() => { Object.keys(store).forEach(k => delete store[k]); }),
      key: vi.fn((_i: number) => null),
      length: 0,
    });

    configureModule();
    service = TestBed.inject(AuthService);
    httpMock = TestBed.inject(HttpTestingController);
    router = TestBed.inject(Router) as unknown as { navigate: ReturnType<typeof vi.fn> };
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    httpMock?.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('constructor hydration', () => {
    beforeEach(() => {
      TestBed.resetTestingModule();
    });

    it('should hydrate user from valid token in localStorage', () => {
      localStorage.setItem('access_token', VALID_TOKEN);
      configureModule();
      const svc = TestBed.inject(AuthService);
      expect(svc.currentUser()).toEqual({
        id: '123e4567-e89b-12d3-a456-426614174000',
        email: 'test@synapsis.com',
        role: 'INSTRUCTOR',
        plan: 'PREMIUM',
      });
      expect(svc.isAuthenticated()).toBe(true);
      expect(svc.role()).toBe('INSTRUCTOR');
      expect(svc.plan()).toBe('PREMIUM');
    });

    it('should keep user null when no token', () => {
      configureModule();
      const svc = TestBed.inject(AuthService);
      expect(svc.currentUser()).toBeNull();
      expect(svc.isAuthenticated()).toBe(false);
    });

    it('should keep user null when token is expired', () => {
      localStorage.setItem('access_token', expiredToken());
      configureModule();
      const svc = TestBed.inject(AuthService);
      expect(svc.currentUser()).toBeNull();
      expect(svc.isAuthenticated()).toBe(false);
    });

    it('should keep user null when token is malformed', () => {
      localStorage.setItem('access_token', 'not-a-valid-jwt');
      configureModule();
      const svc = TestBed.inject(AuthService);
      expect(svc.currentUser()).toBeNull();
    });
  });

  describe('register', () => {
    it('should POST /auth/register with dto', () => {
      const dto: RegisterDto = {
        first_name: 'John',
        last_name: 'Doe',
        email: 'john@test.com',
        birth_date: '2000-01-01',
        country: 'US',
        password: 'secret123',
      };

      service.register(dto).subscribe((res) => expect(res).toEqual({ message: 'OK' }));
      const req = httpMock.expectOne(`${environment.apiUrl}/auth/register`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(dto);
      expect(req.request.withCredentials).toBeFalsy();
      req.flush({ message: 'OK' });
    });
  });

  describe('login', () => {
    it('should POST /auth/login with credentials and save token', () => {
      const dto = { email: 'test@test.com', password: 'pass' };

      service.login(dto).subscribe((res) => expect(res.accessToken).toBe(VALID_TOKEN));
      const req = httpMock.expectOne(`${environment.apiUrl}/auth/login`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(dto);
      expect(req.request.withCredentials).toBe(true);

      req.flush({ accessToken: VALID_TOKEN });

      expect(service.currentUser()).not.toBeNull();
      expect(service.isAuthenticated()).toBe(true);
      expect(service.role()).toBe('INSTRUCTOR');
      expect(service.plan()).toBe('PREMIUM');
    });
  });

  describe('logout', () => {
    it('should POST /auth/logout and clear session', () => {
      service.logout();
      const req = httpMock.expectOne(`${environment.apiUrl}/auth/logout`);
      expect(req.request.method).toBe('POST');
      expect(req.request.withCredentials).toBe(true);
      req.flush(null);

      expect(service.currentUser()).toBeNull();
      expect(service.isAuthenticated()).toBe(false);
      expect(router.navigate).toHaveBeenCalledWith(['/login']);
    });

    it('should clear session even when POST /auth/logout fails', () => {
      service.logout();
      const req = httpMock.expectOne(`${environment.apiUrl}/auth/logout`);
      req.error(new ProgressEvent('error'));

      expect(service.currentUser()).toBeNull();
      expect(router.navigate).toHaveBeenCalledWith(['/login']);
    });
  });

  describe('refresh', () => {
    it('should POST /auth/refresh and save new token', () => {
      service.refresh().subscribe((res) => expect(res.accessToken).toBe(VALID_TOKEN));
      const req = httpMock.expectOne(`${environment.apiUrl}/auth/refresh`);
      expect(req.request.method).toBe('POST');
      expect(req.request.withCredentials).toBe(true);

      req.flush({ accessToken: VALID_TOKEN });

      expect(service.currentUser()).not.toBeNull();
    });
  });

  describe('isLoggedIn', () => {
    it('should return false when no token', () => {
      expect(service.isLoggedIn()).toBe(false);
    });

    it('should return false when token is expired', () => {
      service.login({ email: 'a@b.com', password: 'x' }).subscribe();
      httpMock.expectOne(`${environment.apiUrl}/auth/login`).flush({ accessToken: expiredToken() });
      expect(service.isLoggedIn()).toBe(false);
    });

    it('should return true when valid token is set via login', () => {
      service.login({ email: 'a@b.com', password: 'x' }).subscribe();
      httpMock.expectOne(`${environment.apiUrl}/auth/login`).flush({ accessToken: VALID_TOKEN });
      expect(service.isLoggedIn()).toBe(true);
    });
  });

  describe('hasRole', () => {
    it('should return true when user has matching role', () => {
      service.login({ email: 'a@b.com', password: 'x' }).subscribe();
      httpMock.expectOne(`${environment.apiUrl}/auth/login`).flush({ accessToken: VALID_TOKEN });
      expect(service.hasRole(['INSTRUCTOR'])).toBe(true);
      expect(service.hasRole(['INSTRUCTOR', 'ADMIN'])).toBe(true);
    });

    it('should return false when user does not have matching role', () => {
      service.login({ email: 'a@b.com', password: 'x' }).subscribe();
      httpMock.expectOne(`${environment.apiUrl}/auth/login`).flush({ accessToken: VALID_TOKEN });
      expect(service.hasRole(['STUDENT'])).toBe(false);
      expect(service.hasRole(['ADMIN'])).toBe(false);
    });

    it('should return false when no user is logged in', () => {
      expect(service.hasRole(['STUDENT'])).toBe(false);
    });
  });

  describe('getToken', () => {
    it('should return token from localStorage', () => {
      localStorage.setItem('access_token', VALID_TOKEN);
      expect(service.getToken()).toBe(VALID_TOKEN);
    });

    it('should return null when no token', () => {
      expect(service.getToken()).toBeNull();
    });
  });

  describe('signals', () => {
    it('should reflect user state after login', () => {
      expect(service.currentUser()).toBeNull();
      expect(service.isAuthenticated()).toBe(false);
      expect(service.role()).toBeNull();
      expect(service.plan()).toBe('FREE');

      service.login({ email: 'a@b.com', password: 'x' }).subscribe();
      httpMock.expectOne(`${environment.apiUrl}/auth/login`).flush({ accessToken: VALID_TOKEN });

      expect(service.currentUser()).toEqual({
        id: '123e4567-e89b-12d3-a456-426614174000',
        email: 'test@synapsis.com',
        role: 'INSTRUCTOR',
        plan: 'PREMIUM',
      });
      expect(service.isAuthenticated()).toBe(true);
      expect(service.role()).toBe('INSTRUCTOR');
      expect(service.plan()).toBe('PREMIUM');
    });

    it('should reflect guest state after logout', () => {
      service.login({ email: 'a@b.com', password: 'x' }).subscribe();
      httpMock.expectOne(`${environment.apiUrl}/auth/login`).flush({ accessToken: VALID_TOKEN });

      service.logout();
      httpMock.expectOne(`${environment.apiUrl}/auth/logout`).flush(null);

      expect(service.currentUser()).toBeNull();
      expect(service.isAuthenticated()).toBe(false);
      expect(service.role()).toBeNull();
    });
  });

  describe('setPlan', () => {
    it('should update plan signal', () => {
      expect(service.plan()).toBe('FREE');
      service.setPlan('PREMIUM');
      expect(service.plan()).toBe('PREMIUM');
    });
  });

  describe('userId', () => {
    it('should return user id when logged in', () => {
      service.login({ email: 'a@b.com', password: 'x' }).subscribe();
      httpMock.expectOne(`${environment.apiUrl}/auth/login`).flush({ accessToken: VALID_TOKEN });
      expect(service.userId()).toBe('123e4567-e89b-12d3-a456-426614174000');
    });

    it('should return null when not logged in', () => {
      expect(service.userId()).toBeNull();
    });
  });
});
