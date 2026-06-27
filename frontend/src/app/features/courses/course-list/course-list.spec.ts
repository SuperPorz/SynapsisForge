import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { CourseList } from './course-list';
import { CourseService } from '../../../core/services/courses.service';

describe('CourseList', () => {
  let component: CourseList;
  let fixture: ComponentFixture<CourseList>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CourseList],
      providers: [
        provideRouter([]),
        { provide: CourseService, useValue: {
          getCourses: vi.fn(() => ({ pipe: vi.fn(() => ({ subscribe: vi.fn() })) })),
          getCategories: vi.fn(() => ({ pipe: vi.fn(() => ({ subscribe: vi.fn() })) })),
        } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(CourseList);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
