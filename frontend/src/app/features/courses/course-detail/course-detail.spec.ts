import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { CourseDetail } from './course-detail';
import { CourseService } from '../../../core/services/courses.service';
import { EnrollmentService } from '../../../core/services/enrollment.service';
import { CartService } from '../../../core/services/cart.service';
import { AuthService } from '../../../core/services/auth.service';

describe('CourseDetail', () => {
  let component: CourseDetail;
  let fixture: ComponentFixture<CourseDetail>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CourseDetail],
      providers: [
        provideRouter([]),
        { provide: CourseService, useValue: { getCourseById: vi.fn(() => ({ subscribe: vi.fn() })) } },
        { provide: EnrollmentService, useValue: { getMyEnrollment: vi.fn(() => ({ subscribe: vi.fn() })), enroll: vi.fn(() => ({ subscribe: vi.fn() })) } },
        { provide: CartService, useValue: { isInCart: vi.fn(() => false), addItem: vi.fn(() => ({ subscribe: vi.fn() })) } },
        { provide: AuthService, useValue: { isLoggedIn: vi.fn(() => false), userId: vi.fn(() => null) } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(CourseDetail);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
