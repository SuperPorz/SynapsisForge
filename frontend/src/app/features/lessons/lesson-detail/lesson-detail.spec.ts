import { ComponentFixture, TestBed } from '@angular/core/testing';
import { LessonDetail } from './lesson-detail';

describe('LessonDetail', () => {
  let component: LessonDetail;
  let fixture: ComponentFixture<LessonDetail>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LessonDetail],
    }).compileComponents();

    fixture = TestBed.createComponent(LessonDetail);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
