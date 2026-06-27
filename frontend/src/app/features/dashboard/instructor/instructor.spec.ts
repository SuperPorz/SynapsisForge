import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { Instructor } from './instructor';
import { CourseService } from '../../../core/services/courses.service';

describe('Instructor', () => {
  let component: Instructor;
  let fixture: ComponentFixture<Instructor>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Instructor],
      providers: [
        provideRouter([]),
        { provide: CourseService, useValue: { getMyCourses: vi.fn(() => ({ subscribe: vi.fn() })) } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(Instructor);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
