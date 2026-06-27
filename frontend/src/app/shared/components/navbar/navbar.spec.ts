import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { Navbar } from './navbar';
import { AuthService } from '../../../core/services/auth.service';
import { ThemeService } from '../../../core/services/theme.service';
import { CartService } from '../../../core/services/cart.service';
import { EnrollmentService } from '../../../core/services/enrollment.service';

describe('Navbar', () => {
  let component: Navbar;
  let fixture: ComponentFixture<Navbar>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Navbar],
      providers: [
        provideRouter([]),
        { provide: AuthService, useValue: { isLoggedIn: vi.fn(() => false), isAuthenticated: vi.fn(() => false), role: vi.fn(() => 'STUDENT'), currentUser: vi.fn(() => null) } },
        { provide: ThemeService, useValue: { isDarkMode: vi.fn(() => false), toggle: vi.fn() } },
        { provide: CartService, useValue: { loadCart: vi.fn(), cartCount: vi.fn(() => 0) } },
        { provide: EnrollmentService, useValue: { loadEnrolledCourseIds: vi.fn(), enrolledCourseIds: vi.fn(() => new Set()) } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(Navbar);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
