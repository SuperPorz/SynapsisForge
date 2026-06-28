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
  let mockAuth: ReturnType<typeof createMockAuth>;
  let mockCart: ReturnType<typeof createMockCart>;
  let mockEnrollment: ReturnType<typeof createMockEnrollment>;

  function createMockAuth(overrides?: { plan?: string }) {
    return { plan: vi.fn(() => overrides?.plan ?? 'FREE'), isLoggedIn: vi.fn(() => false), isAuthenticated: vi.fn(() => false), currentUser: vi.fn(() => null), role: vi.fn(() => 'STUDENT') };
  }

  function createMockCart(overrides?: { isInCart?: boolean; loading?: boolean }) {
    return { isInCart: vi.fn(() => overrides?.isInCart ?? false), addItem: vi.fn(() => ({ subscribe: vi.fn() })), loading: vi.fn(() => overrides?.loading ?? false) };
  }

  function createMockEnrollment(overrides?: { enrolled?: boolean }) {
    return { enrolledCourseIds: vi.fn(() => new Set(overrides?.enrolled ? ['c1'] : [])) };
  }

  const baseCourse: Course = {
    id: 'c1',
    title: 'Test Course',
    slug: 'test-course',
    description: 'A test course',
    price: 29.99,
    thumbnail_url: 'https://example.com/thumb.jpg',
    category: { id: 'cat1', name: 'Tech', slug: 'tech' },
    instructor: { user: { first_name: 'John', last_name: 'Doe', email: 'john@test.com' } },
    rating: 4,
  };

  function createComponent(course: Course = baseCourse) {
    mockAuth = createMockAuth();
    mockCart = createMockCart();
    mockEnrollment = createMockEnrollment();

    TestBed.configureTestingModule({
      imports: [CourseCard],
      providers: [
        provideRouter([]),
        { provide: AuthService, useValue: mockAuth },
        { provide: CartService, useValue: mockCart },
        { provide: EnrollmentService, useValue: mockEnrollment },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(CourseCard);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('course', course);
    fixture.detectChanges();
  }

  it('should create', () => {
    createComponent();
    expect(component).toBeTruthy();
  });

  it('should render course title and instructor name', () => {
    createComponent();
    const el = fixture.nativeElement as HTMLElement;
    expect(el.textContent).toContain('Test Course');
    expect(el.textContent).toContain('John Doe');
  });

  it('should render price', () => {
    createComponent();
    const el = fixture.nativeElement as HTMLElement;
    expect(el.textContent).toContain('$29.99');
  });

  it('should show "Included" badge when plan is PREMIUM and not enrolled', () => {
    mockAuth = { plan: vi.fn(() => 'PREMIUM'), isLoggedIn: vi.fn(() => true), isAuthenticated: vi.fn(() => true), currentUser: vi.fn(() => null), role: vi.fn(() => 'STUDENT') };
    mockCart = createMockCart();
    mockEnrollment = createMockEnrollment({ enrolled: false });
    TestBed.configureTestingModule({
      imports: [CourseCard],
      providers: [
        provideRouter([]),
        { provide: AuthService, useValue: mockAuth },
        { provide: CartService, useValue: mockCart },
        { provide: EnrollmentService, useValue: mockEnrollment },
      ],
    }).compileComponents();
    fixture = TestBed.createComponent(CourseCard);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('course', baseCourse);
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Included');
    expect(fixture.nativeElement.textContent).not.toContain('$29.99');
  });

  it('should show "Go to course" when enrolled', () => {
    mockAuth = createMockAuth();
    mockCart = createMockCart();
    mockEnrollment = createMockEnrollment({ enrolled: true });
    TestBed.configureTestingModule({
      imports: [CourseCard],
      providers: [
        provideRouter([]),
        { provide: AuthService, useValue: mockAuth },
        { provide: CartService, useValue: mockCart },
        { provide: EnrollmentService, useValue: mockEnrollment },
      ],
    }).compileComponents();
    fixture = TestBed.createComponent(CourseCard);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('course', baseCourse);
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Go to course');
  });

  it('should show "In cart" disabled button when course is in cart and not enrolled', () => {
    mockAuth = createMockAuth();
    mockCart = createMockCart({ isInCart: true });
    mockEnrollment = createMockEnrollment({ enrolled: false });
    TestBed.configureTestingModule({
      imports: [CourseCard],
      providers: [
        provideRouter([]),
        { provide: AuthService, useValue: mockAuth },
        { provide: CartService, useValue: mockCart },
        { provide: EnrollmentService, useValue: mockEnrollment },
      ],
    }).compileComponents();
    fixture = TestBed.createComponent(CourseCard);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('course', baseCourse);
    fixture.detectChanges();
    const btn = (fixture.nativeElement as HTMLElement).querySelector('button[disabled]');
    expect(btn?.textContent?.trim()).toBe('In cart');
  });

  it('should show "Add to cart" button when not enrolled and not in cart', () => {
    createComponent();
    const el = fixture.nativeElement as HTMLElement;
    expect(el.textContent).toContain('Add to cart');
  });

  it('should call cart.addItem when addToCart is clicked', () => {
    mockAuth = createMockAuth();
    mockCart = createMockCart();
    mockEnrollment = createMockEnrollment();
    TestBed.configureTestingModule({
      imports: [CourseCard],
      providers: [
        provideRouter([]),
        { provide: AuthService, useValue: mockAuth },
        { provide: CartService, useValue: mockCart },
        { provide: EnrollmentService, useValue: mockEnrollment },
      ],
    }).compileComponents();
    fixture = TestBed.createComponent(CourseCard);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('course', baseCourse);
    fixture.detectChanges();
    const addBtn = Array.from((fixture.nativeElement as HTMLElement).querySelectorAll('button')).find(b => b.textContent?.includes('Add to cart'));
    addBtn?.click();
    expect(mockCart.addItem).toHaveBeenCalledWith('c1');
  });

  it('should compute starStates based on rounded rating', () => {
    createComponent({ ...baseCourse, rating: 3.7 });
    expect(component.starStates()).toEqual([true, true, true, true, false]);
  });

  it('should show "Unrated" badge when rating is null', () => {
    createComponent({ ...baseCourse, rating: undefined as any });
    const el = fixture.nativeElement as HTMLElement;
    expect(el.textContent).toContain('Unrated');
  });
});
