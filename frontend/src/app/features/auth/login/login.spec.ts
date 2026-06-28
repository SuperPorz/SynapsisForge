import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { ActivatedRoute } from '@angular/router';
import { of, EMPTY } from 'rxjs';
import { Login } from './login';
import { AuthService } from '../../../core/services/auth.service';

describe('Login', () => {
  let component: Login;
  let fixture: ComponentFixture<Login>;
  let mockAuth: ReturnType<typeof createMockAuth>;

  function createMockAuth() {
    return { login: vi.fn() };
  }

  function createComponent(queryParams?: Record<string, string>) {
    mockAuth = createMockAuth();

    TestBed.configureTestingModule({
      imports: [Login],
      providers: [
        provideRouter([]),
        { provide: AuthService, useValue: mockAuth },
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              queryParamMap: new Map(Object.entries(queryParams ?? {})),
            },
            params: EMPTY,
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(Login);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }

  beforeEach(() => {
    mockAuth = createMockAuth();
  });

  it('should create', () => {
    createComponent();
    expect(component).toBeTruthy();
  });

  it('should have an invalid form when empty', () => {
    createComponent();
    expect(component.form.invalid).toBe(true);
  });

  it('should validate email field', () => {
    createComponent();
    const emailCtrl = component.f.email;
    emailCtrl.setValue('not-an-email');
    expect(emailCtrl.invalid).toBe(true);
    expect(emailCtrl.errors?.['email']).toBeTruthy();

    emailCtrl.setValue('valid@email.com');
    expect(emailCtrl.valid).toBe(true);
  });

  it('should validate password minlength', () => {
    createComponent();
    const passCtrl = component.f.password;
    passCtrl.setValue('short');
    expect(passCtrl.invalid).toBe(true);
    expect(passCtrl.errors?.['minlength']).toBeTruthy();

    passCtrl.setValue('longenough123');
    expect(passCtrl.valid).toBe(true);
  });

  it('should be valid when both fields are correct', () => {
    createComponent();
    component.form.setValue({ email: 'user@example.com', password: 'password123' });
    expect(component.form.valid).toBe(true);
  });

  it('should call authService.login on submit with valid form', () => {
    createComponent();
    mockAuth.login.mockReturnValue(of({ accessToken: 'token' }));
    component.form.setValue({ email: 'user@example.com', password: 'password123' });

    component.onSubmit();

    expect(mockAuth.login).toHaveBeenCalledWith({
      email: 'user@example.com',
      password: 'password123',
    });
  });

  it('should not call authService.login when form is invalid', () => {
    createComponent();
    component.onSubmit();
    expect(mockAuth.login).not.toHaveBeenCalled();
  });

  it('should disable submit button when form is invalid', () => {
    createComponent();
    fixture.detectChanges();
    const btn = (fixture.nativeElement as HTMLElement).querySelector('button[type="submit"]') as HTMLButtonElement;
    expect(btn.disabled).toBe(true);
  });

  it('should enable submit button when form is valid', () => {
    createComponent();
    component.form.setValue({ email: 'user@example.com', password: 'password123' });
    fixture.detectChanges();
    const btn = (fixture.nativeElement as HTMLElement).querySelector('button[type="submit"]') as HTMLButtonElement;
    expect(btn.disabled).toBe(false);
  });

  it('should show error message when email is touched and invalid', () => {
    createComponent();
    const emailCtrl = component.f.email;
    emailCtrl.setValue('bad');
    emailCtrl.markAsTouched();
    fixture.detectChanges();
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('Please enter a valid email.');
  });

  it('should show error message when password is touched and too short', () => {
    createComponent();
    const passCtrl = component.f.password;
    passCtrl.setValue('abc');
    passCtrl.markAsTouched();
    fixture.detectChanges();
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('Minimum 8 characters.');
  });

  it('should set registered=true based on query param', () => {
    createComponent({ registered: 'true' });
    expect(component.registered).toBe(true);
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('Account created!');
  });

  it('should set verified=true based on query param', () => {
    createComponent({ verified: 'true' });
    expect(component.verified).toBe(true);
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('Email verified!');
  });
});
