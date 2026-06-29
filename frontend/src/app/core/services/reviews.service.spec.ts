import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ReviewsService, ReviewItem, CreateReviewDto, UpdateReviewDto } from './reviews.service';
import { environment } from '../../../environments/environment';

describe('ReviewsService', () => {
  let service: ReviewsService;
  let httpMock: HttpTestingController;

  const mockReviews: ReviewItem[] = [
    {
      id: 'r1',
      rating: 5,
      comment: 'Great course!',
      createdAt: '2026-06-01T00:00:00Z',
      userId: 'u1',
      user: { firstName: 'Alice', lastName: 'Thompson', avatarUrl: null },
    },
  ];

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(ReviewsService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('getCourseReviews', () => {
    it('should GET /reviews/course/:courseId', () => {
      service.getCourseReviews('c1').subscribe((reviews) => expect(reviews).toEqual(mockReviews));
      const req = httpMock.expectOne(`${environment.apiUrl}/reviews/course/c1`);
      expect(req.request.method).toBe('GET');
      req.flush(mockReviews);
    });
  });

  describe('create', () => {
    it('should POST /reviews', () => {
      const dto: CreateReviewDto = { enrollmentId: 'e1', rating: 4, comment: 'Nice' };
      service.create(dto).subscribe((review) => expect(review).toEqual(mockReviews[0]));
      const req = httpMock.expectOne(`${environment.apiUrl}/reviews`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(dto);
      req.flush(mockReviews[0]);
    });
  });

  describe('update', () => {
    it('should PATCH /reviews/:id', () => {
      const dto: UpdateReviewDto = { rating: 3 };
      service.update('r1', dto).subscribe((review) => expect(review).toEqual(mockReviews[0]));
      const req = httpMock.expectOne(`${environment.apiUrl}/reviews/r1`);
      expect(req.request.method).toBe('PATCH');
      expect(req.request.body).toEqual(dto);
      req.flush(mockReviews[0]);
    });
  });

  describe('delete', () => {
    it('should DELETE /reviews/:id', () => {
      service.delete('r1').subscribe();
      const req = httpMock.expectOne(`${environment.apiUrl}/reviews/r1`);
      expect(req.request.method).toBe('DELETE');
      req.flush(null);
    });
  });
});
