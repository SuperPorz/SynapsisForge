import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { Component } from '@angular/core';
import { AuthService } from '../services/auth.service';
import { authGuard } from './auth-guard';

@Component({ template: '', standalone: true })
class DummyComponent {}

describe('authGuard', () => {
  let router: Router;

  const fakeRoute = {} as any;
  const fakeState = {} as any;

  function setup(isLoggedIn: boolean) {
    TestBed.configureTestingModule({
      providers: [
        provideRouter([{ path: 'login', component: DummyComponent }, { path: '**', component: DummyComponent }]),
        { provide: AuthService, useValue: { isLoggedIn: () => isLoggedIn } },
      ],
    });
    router = TestBed.inject(Router);
  }

  it('should return true when user is logged in', () => {
    setup(true);
    const result = TestBed.runInInjectionContext(() => authGuard(fakeRoute, fakeState));
    expect(result).toBe(true);
  });

  it('should redirect to /login when user is not logged in', () => {
    setup(false);
    const result = TestBed.runInInjectionContext(() => authGuard(fakeRoute, fakeState));
    expect(router.isActive(result as any, false)).toBe(false);
    const tree = router.parseUrl('/login');
    expect(result).toEqual(tree);
  });
});
