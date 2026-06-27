import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { CourseWizard } from './course-wizard';
import { CourseService } from '../../../../core/services/courses.service';

describe('CourseWizard', () => {
  let component: CourseWizard;
  let fixture: ComponentFixture<CourseWizard>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CourseWizard],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        { provide: CourseService, useValue: {
          getCategories: vi.fn(() => ({ subscribe: vi.fn() })),
          getCourseById: vi.fn(() => ({ subscribe: vi.fn() })),
          createCourse: vi.fn(() => ({ subscribe: vi.fn() })),
          createSection: vi.fn(() => ({ subscribe: vi.fn() })),
          createLesson: vi.fn(() => ({ subscribe: vi.fn() })),
          updateCourse: vi.fn(() => ({ subscribe: vi.fn() })),
          createLessonContent: vi.fn(() => ({ subscribe: vi.fn() })),
        } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(CourseWizard);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
