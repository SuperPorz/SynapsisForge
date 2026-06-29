import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { EnrollmentService, EnrollmentResponse, ActivityItem } from './enrollment.service';
import { environment } from '../../../environments/environment';

describe('EnrollmentService', () => {
  let service: EnrollmentService;
  let httpMock: HttpTestingController;

  const mockEnrollments: EnrollmentResponse[] = [
    {
      id: 'e1',
      progress_percent: 50,
      completed_at: null,
      enrolled_at: '2026-01-01T00:00:00Z',
      courseId: 'c1',
      courseTitle: 'Test Course',
      studentId: 'u1',
    },
  ];

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(EnrollmentService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('loadEnrolledCourseIds', () => {
    it('should GET /enrollments/my/ids and update signal', () => {
      service.loadEnrolledCourseIds();
      const req = httpMock.expectOne(`${environment.apiUrl}/enrollments/my/ids`);
      expect(req.request.method).toBe('GET');
      req.flush(['c1', 'c2']);

      expect(Array.from(service.enrolledCourseIds())).toEqual(['c1', 'c2']);
    });
  });

  describe('getMyEnrollment', () => {
    it('should GET /enrollments/my with courseId param', () => {
      service.getMyEnrollment('c1').subscribe();
      const req = httpMock.expectOne(
        (r) => r.url === `${environment.apiUrl}/enrollments/my` && r.method === 'GET',
      );
      expect(req.request.params.get('courseId')).toBe('c1');
      req.flush(mockEnrollments[0]);
    });
  });

  describe('getMyEnrollments', () => {
    it('should GET /enrollments/my', () => {
      service.getMyEnrollments().subscribe((enrollments) => expect(enrollments).toEqual(mockEnrollments));
      const req = httpMock.expectOne(`${environment.apiUrl}/enrollments/my`);
      expect(req.request.method).toBe('GET');
      req.flush(mockEnrollments);
    });
  });

  describe('getMyActivity', () => {
    it('should GET /enrollments/my/activity', () => {
      const mockActivity: ActivityItem[] = [
        { lessonId: 'l1', lessonTitle: 'Lesson 1', courseTitle: 'Test Course', courseId: 'c1', completedAt: '2026-06-01T00:00:00Z' },
      ];

      service.getMyActivity().subscribe((activity) => expect(activity).toEqual(mockActivity));
      const req = httpMock.expectOne(`${environment.apiUrl}/enrollments/my/activity`);
      expect(req.request.method).toBe('GET');
      req.flush(mockActivity);
    });
  });

  describe('enroll', () => {
    it('should POST /enrollments', () => {
      service.enroll('u1', 'c1').subscribe();
      const req = httpMock.expectOne(`${environment.apiUrl}/enrollments`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({ userId: 'u1', courseId: 'c1' });
      req.flush(mockEnrollments[0]);
    });
  });
});
