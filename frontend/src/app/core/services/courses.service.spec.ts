import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { CourseService } from './courses.service';
import { environment } from '../../../environments/environment';
import { Course, PaginatedCoursesResponse } from '../models/course-model';
import { Category } from '../models/category-model';

describe('CourseService', () => {
  let service: CourseService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(CourseService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('getCourseById', () => {
    it('should GET /courses/:id', () => {
      const mock = { id: '1', title: 'Test' } as Course;

      service.getCourseById('1').subscribe((c) => expect(c).toEqual(mock));
      const req = httpMock.expectOne(`${environment.apiUrl}/courses/1`);
      expect(req.request.method).toBe('GET');
      req.flush(mock);
    });
  });

  describe('getCourses', () => {
    it('should GET /courses with pagination params', () => {
      const mock: PaginatedCoursesResponse = { data: [], total: 0 };

      service.getCourses({ page: 1, limit: 10, featured: true, category: 'dev', q: 'angular' }).subscribe();
      const req = httpMock.expectOne(
        (r) => r.url === `${environment.apiUrl}/courses` && r.method === 'GET',
      );
      expect(req.request.params.get('page')).toBe('1');
      expect(req.request.params.get('limit')).toBe('10');
      expect(req.request.params.get('featured')).toBe('true');
      expect(req.request.params.get('category')).toBe('dev');
      expect(req.request.params.get('q')).toBe('angular');
      req.flush(mock);
    });

    it('should omit optional params when undefined', () => {
      service.getCourses({ page: 1, limit: 20 }).subscribe();
      const req = httpMock.expectOne(
        (r) => r.url === `${environment.apiUrl}/courses` && r.method === 'GET',
      );
      expect(req.request.params.has('featured')).toBe(false);
      expect(req.request.params.has('category')).toBe(false);
      expect(req.request.params.has('q')).toBe(false);
      expect(req.request.params.has('minPrice')).toBe(false);
      expect(req.request.params.has('maxPrice')).toBe(false);
      req.flush({ data: [], total: 0 });
    });
  });

  describe('searchFilter', () => {
    it('should GET /courses/search/filter with params', () => {
      service.searchFilter({ q: 'angular', minPrice: 0, maxPrice: 100 }).subscribe();
      const req = httpMock.expectOne(
        (r) => r.url === `${environment.apiUrl}/courses/search/filter` && r.method === 'GET',
      );
      expect(req.request.params.get('q')).toBe('angular');
      expect(req.request.params.get('minPrice')).toBe('0');
      expect(req.request.params.get('maxPrice')).toBe('100');
      req.flush({ data: [], total: 0 });
    });
  });

  describe('search', () => {
    it('should GET /courses/search?q=...', () => {
      service.search('angular').subscribe();
      const req = httpMock.expectOne(`${environment.apiUrl}/courses/search?q=angular`);
      expect(req.request.method).toBe('GET');
      req.flush({ data: [], total: 0 });
    });
  });

  describe('getCategories', () => {
    it('should GET /courses/categories', () => {
      const mock: Category[] = [{ id: '1', name: 'Dev', slug: 'dev', description: '' }];

      service.getCategories().subscribe((c) => expect(c).toEqual(mock));
      const req = httpMock.expectOne(`${environment.apiUrl}/courses/categories`);
      expect(req.request.method).toBe('GET');
      req.flush(mock);
    });
  });

  describe('getMyCourses', () => {
    it('should GET /courses/my', () => {
      service.getMyCourses().subscribe();
      const req = httpMock.expectOne(`${environment.apiUrl}/courses/my`);
      expect(req.request.method).toBe('GET');
      req.flush([]);
    });
  });

  describe('getCourseStats', () => {
    it('should GET /courses/my/stats/:id', () => {
      service.getCourseStats('c1').subscribe();
      const req = httpMock.expectOne(`${environment.apiUrl}/courses/my/stats/c1`);
      expect(req.request.method).toBe('GET');
      req.flush({});
    });
  });

  describe('getCourseLessonsWithStats', () => {
    it('should GET /courses/my/:id/lessons', () => {
      service.getCourseLessonsWithStats('c1').subscribe();
      const req = httpMock.expectOne(`${environment.apiUrl}/courses/my/c1/lessons`);
      expect(req.request.method).toBe('GET');
      req.flush([]);
    });
  });

  describe('createCourse', () => {
    it('should POST /courses', () => {
      const payload = {
        title: 'New',
        slug: 'new',
        description: 'desc',
        price: 10,
        category_id: 'cat1',
        thumbnail_url: 'thumb.jpg',
      };

      service.createCourse(payload).subscribe();
      const req = httpMock.expectOne(`${environment.apiUrl}/courses`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(payload);
      req.flush({});
    });
  });

  describe('updateCourse', () => {
    it('should PATCH /courses/:id', () => {
      service.updateCourse('c1', { title: 'Updated' }).subscribe();
      const req = httpMock.expectOne(`${environment.apiUrl}/courses/c1`);
      expect(req.request.method).toBe('PATCH');
      expect(req.request.body).toEqual({ title: 'Updated' });
      req.flush({});
    });
  });

  describe('createSection', () => {
    it('should POST /courses/:id/sections', () => {
      service.createSection('c1', { title: 'Section 1' }).subscribe();
      const req = httpMock.expectOne(`${environment.apiUrl}/courses/c1/sections`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({ title: 'Section 1' });
      req.flush({});
    });
  });

  describe('updateSection', () => {
    it('should PATCH /courses/:id/sections/:sectionId', () => {
      service.updateSection('c1', 's1', { title: 'Updated' }).subscribe();
      const req = httpMock.expectOne(`${environment.apiUrl}/courses/c1/sections/s1`);
      expect(req.request.method).toBe('PATCH');
      expect(req.request.body).toEqual({ title: 'Updated' });
      req.flush({});
    });
  });

  describe('deleteSection', () => {
    it('should DELETE /courses/:id/sections/:sectionId', () => {
      service.deleteSection('c1', 's1').subscribe();
      const req = httpMock.expectOne(`${environment.apiUrl}/courses/c1/sections/s1`);
      expect(req.request.method).toBe('DELETE');
      req.flush(null);
    });
  });

  describe('reorderSections', () => {
    it('should PATCH /courses/:id/sections/reorder', () => {
      service.reorderSections('c1', ['s1', 's2']).subscribe();
      const req = httpMock.expectOne(`${environment.apiUrl}/courses/c1/sections/reorder`);
      expect(req.request.method).toBe('PATCH');
      expect(req.request.body).toEqual({ sectionIds: ['s1', 's2'] });
      req.flush([]);
    });
  });

  describe('createLesson', () => {
    it('should POST /courses/:id/lessons', () => {
      service.createLesson('c1', { title: 'Lesson 1', order: 1 }).subscribe();
      const req = httpMock.expectOne(`${environment.apiUrl}/courses/c1/lessons`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({ title: 'Lesson 1', order: 1 });
      req.flush({});
    });
  });

  describe('updateLesson', () => {
    it('should PATCH /courses/:id/lessons/:lessonId', () => {
      service.updateLesson('c1', 'l1', { title: 'Updated' }).subscribe();
      const req = httpMock.expectOne(`${environment.apiUrl}/courses/c1/lessons/l1`);
      expect(req.request.method).toBe('PATCH');
      expect(req.request.body).toEqual({ title: 'Updated' });
      req.flush({});
    });
  });

  describe('deleteLesson', () => {
    it('should DELETE /courses/:id/lessons/:lessonId', () => {
      service.deleteLesson('c1', 'l1').subscribe();
      const req = httpMock.expectOne(`${environment.apiUrl}/courses/c1/lessons/l1`);
      expect(req.request.method).toBe('DELETE');
      req.flush(null);
    });
  });

  describe('createLessonContent', () => {
    it('should POST /courses/:id/lessons/:lessonId/content', () => {
      const payload = { videoUrl: 'vid.mp4' };
      service.createLessonContent('c1', 'l1', payload).subscribe();
      const req = httpMock.expectOne(`${environment.apiUrl}/courses/c1/lessons/l1/content`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(payload);
      req.flush({});
    });
  });

  describe('updateLessonContent', () => {
    it('should PATCH /courses/:id/lessons/:lessonId/content', () => {
      service.updateLessonContent('c1', 'l1', { videoUrl: 'new.mp4' }).subscribe();
      const req = httpMock.expectOne(`${environment.apiUrl}/courses/c1/lessons/l1/content`);
      expect(req.request.method).toBe('PATCH');
      expect(req.request.body).toEqual({ videoUrl: 'new.mp4' });
      req.flush({});
    });
  });

  describe('deleteCourse', () => {
    it('should DELETE /courses/:id', () => {
      service.deleteCourse('c1').subscribe((res) => expect(res).toEqual({ message: 'Deleted' }));
      const req = httpMock.expectOne(`${environment.apiUrl}/courses/c1`);
      expect(req.request.method).toBe('DELETE');
      req.flush({ message: 'Deleted' });
    });
  });
});
