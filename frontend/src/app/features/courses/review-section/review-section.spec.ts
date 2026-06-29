import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReviewSection } from './review-section';
import { ReviewsService } from '../../../core/services/reviews.service';
import { AuthService } from '../../../core/services/auth.service';
import { of } from 'rxjs';

describe('ReviewSection', () => {
  let component: ReviewSection;
  let fixture: ComponentFixture<ReviewSection>;

  const mockReviewsService = {
    getCourseReviews: vi.fn(() => of([])),
    create: vi.fn(() => of({ id: 'r1', rating: 5, comment: 'Great', createdAt: '', userId: 'u1', user: { firstName: 'A', lastName: 'B', avatarUrl: null } })),
    update: vi.fn(() => of({ id: 'r1', rating: 4, comment: 'Updated', createdAt: '', userId: 'u1', user: { firstName: 'A', lastName: 'B', avatarUrl: null } })),
    delete: vi.fn(() => of(void 0)),
  };

  const mockAuthService = {
    userId: vi.fn(() => 'u1'),
    isLoggedIn: vi.fn(() => true),
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ReviewSection],
      providers: [
        { provide: ReviewsService, useValue: mockReviewsService },
        { provide: AuthService, useValue: mockAuthService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ReviewSection);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('courseId', 'c1');
    fixture.componentRef.setInput('enrollment', null);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load reviews on init', () => {
    expect(mockReviewsService.getCourseReviews).toHaveBeenCalledWith('c1');
  });

  it('should show empty state when no reviews', () => {
    const el = fixture.nativeElement as HTMLElement;
    expect(el.textContent).toContain('No reviews yet');
  });

  it('should not show write form when not enrolled', () => {
    const el = fixture.nativeElement as HTMLElement;
    expect(el.textContent).not.toContain('Write a review');
  });

  it('should show write button when enrolled and completed', () => {
    fixture.componentRef.setInput('enrollment', { id: 'e1', completed_at: '2026-06-01T00:00:00Z', progress_percent: 100, enrolled_at: '', courseId: 'c1', studentId: 'u1' });
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    expect(el.textContent).toContain('Write a review');
  });
});
