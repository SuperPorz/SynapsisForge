import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { AdminService, AdminUser, PendingCourse, AdminStats } from './admin.service';
import { environment } from '../../../environments/environment';

describe('AdminService', () => {
  let service: AdminService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(AdminService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('getUsers', () => {
    it('should GET /admin/users without filters', () => {
      const mockUsers: AdminUser[] = [{ id: 'u1', email: 'a@b.com', first_name: 'A', last_name: 'B', role: 'STUDENT', is_active: true, isVerified: true, avatar_url: null, bio: null }];

      service.getUsers().subscribe((users) => expect(users).toEqual(mockUsers));
      const req = httpMock.expectOne(`${environment.apiUrl}/admin/users`);
      expect(req.request.method).toBe('GET');
      req.flush(mockUsers);
    });

    it('should pass role and is_active filters as query params', () => {
      service.getUsers({ role: 'INSTRUCTOR', is_active: true }).subscribe();
      const req = httpMock.expectOne(
        (r) => r.url === `${environment.apiUrl}/admin/users` && r.method === 'GET',
      );
      expect(req.request.params.get('role')).toBe('INSTRUCTOR');
      expect(req.request.params.get('is_active')).toBe('true');
      req.flush([]);
    });
  });

  describe('approveCourse', () => {
    it('should PATCH /admin/courses/:id/approve', () => {
      service.approveCourse('c1').subscribe();
      const req = httpMock.expectOne(`${environment.apiUrl}/admin/courses/c1/approve`);
      expect(req.request.method).toBe('PATCH');
      req.flush({});
    });
  });

  describe('rejectCourse', () => {
    it('should PATCH /admin/courses/:id/reject', () => {
      service.rejectCourse('c1').subscribe();
      const req = httpMock.expectOne(`${environment.apiUrl}/admin/courses/c1/reject`);
      expect(req.request.method).toBe('PATCH');
      req.flush({});
    });
  });

  describe('getPendingCourses', () => {
    it('should GET /admin/courses/pending', () => {
      const mockPending: PendingCourse[] = [{ id: 'c1', title: 'Pending', slug: 'pending', description: 'desc', price: 0, status: 'PENDING', created_at: '2026-01-01' }];

      service.getPendingCourses().subscribe((courses) => expect(courses).toEqual(mockPending));
      const req = httpMock.expectOne(`${environment.apiUrl}/admin/courses/pending`);
      expect(req.request.method).toBe('GET');
      req.flush(mockPending);
    });
  });

  describe('getStats', () => {
    it('should GET /admin/stats', () => {
      const mockStats: AdminStats = { total_users: 100, users_by_role: [{ role: 'STUDENT', count: 80 }], published_courses: 10, monthly_revenue: 5000 };

      service.getStats().subscribe((stats) => expect(stats).toEqual(mockStats));
      const req = httpMock.expectOne(`${environment.apiUrl}/admin/stats`);
      expect(req.request.method).toBe('GET');
      req.flush(mockStats);
    });
  });
});
