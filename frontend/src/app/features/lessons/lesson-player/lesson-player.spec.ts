import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { Subject } from 'rxjs';
import { LessonPlayer } from './lesson-player';
import { LessonsService } from '../../../core/services/lessons.service';

describe('LessonPlayer', () => {
  let component: LessonPlayer;
  let fixture: ComponentFixture<LessonPlayer>;
  let paramMapSubject: Subject<any>;

  beforeEach(async () => {
    paramMapSubject = new Subject();
    await TestBed.configureTestingModule({
      imports: [LessonPlayer],
      providers: [
        provideRouter([]),
        { provide: LessonsService, useValue: {
          getVideoUrl: vi.fn(() => ({ pipe: vi.fn(() => ({ subscribe: vi.fn() })) })),
          updateProgress: vi.fn(() => ({ pipe: vi.fn(() => ({ subscribe: vi.fn() })) })),
        } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(LessonPlayer);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
