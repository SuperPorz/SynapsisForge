import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { CourseCard } from './course-card';
import { AuthService } from '../../../core/services/auth.service';
import { CartService } from '../../../core/services/cart.service';
import { EnrollmentService } from '../../../core/services/enrollment.service';
import { Course } from '../../../core/models/course-model';

describe('CourseCard', () => {
  let component: CourseCard;
  let fixture: ComponentFixture<CourseCard>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CourseCard],
      providers: [
        provideRouter([]),
        { provide: AuthService, useValue: { isLoggedIn: vi.fn(() => false), isAuthenticated: vi.fn(() => false), plan: vi.fn(() => 'FREE'), currentUser: vi.fn(() => null) } },
        { provide: CartService, useValue: { isInCart: vi.fn(() => false), addItem: vi.fn(() => ({ subscribe: vi.fn() })), loading: vi.fn(() => false) } },
        { provide: EnrollmentService, useValue: { enrolledCourseIds: vi.fn(() => new Set()) } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(CourseCard);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('course', { id: '1', title: 'Test', thumbnail_url: '', rating: 4, price: 0 } as Course);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
