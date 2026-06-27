import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FeaturedCourses } from './featured-courses';
import { CourseService } from '../../../../core/services/courses.service';

describe('FeaturedCourses', () => {
  let component: FeaturedCourses;
  let fixture: ComponentFixture<FeaturedCourses>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FeaturedCourses],
      providers: [
        { provide: CourseService, useValue: { getCourses: vi.fn(() => ({ pipe: vi.fn(() => ({ subscribe: vi.fn() })) })) } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(FeaturedCourses);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
