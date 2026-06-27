import { ComponentFixture, TestBed } from '@angular/core/testing';
import { QuizPlayer } from './quiz-player';
import { QuizItem } from '../../../../core/models/course-model';

describe('QuizPlayer', () => {
  let component: QuizPlayer;
  let fixture: ComponentFixture<QuizPlayer>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [QuizPlayer],
    }).compileComponents();

    fixture = TestBed.createComponent(QuizPlayer);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('quiz', [
      { question: 'Test?', options: [{ label: 'A', text: 'Yes' }, { label: 'B', text: 'No' }], correctAnswer: 'A' },
    ] as QuizItem[]);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
