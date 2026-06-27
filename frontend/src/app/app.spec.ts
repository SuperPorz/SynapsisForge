import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { App } from './app';
import { ThemeService } from './core/services/theme.service';
import { AuthService } from './core/services/auth.service';
import { CartService } from './core/services/cart.service';
import { EnrollmentService } from './core/services/enrollment.service';
import { ToastService } from './core/services/toast.service';

describe('App', () => {
  let component: App;
  let fixture: ComponentFixture<App>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [App],
      providers: [
        provideRouter([]),
        { provide: ThemeService, useValue: { isDark: vi.fn(() => false), toggle: vi.fn() } },
        { provide: AuthService, useValue: { isLoggedIn: vi.fn(() => false), isAuthenticated: vi.fn(() => false), role: vi.fn(() => 'STUDENT'), currentUser: vi.fn(() => null) } },
        { provide: CartService, useValue: { loadCart: vi.fn(), cartCount: vi.fn(() => 0) } },
        { provide: EnrollmentService, useValue: { loadEnrolledCourseIds: vi.fn(), enrolledCourseIds: vi.fn(() => new Set()) } },
        { provide: ToastService, useValue: { toast: vi.fn(() => null), show: vi.fn() } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(App);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
