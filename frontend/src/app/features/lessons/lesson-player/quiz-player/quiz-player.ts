import { Component, input, output, signal, computed, effect, untracked, ChangeDetectionStrategy } from '@angular/core';
import { NgClass } from '@angular/common';
import { QuizItem, QuizAnswer } from '../../../../core/models/course-model';

type AnswerState = 'unanswered' | 'correct' | 'wrong';

@Component({
  selector: 'app-quiz-player',
  standalone: true,
  imports: [NgClass],
  templateUrl: './quiz-player.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class QuizPlayer {
  quiz = input.required<QuizItem[]>();
  initialAnswers = input<QuizAnswer[]>([]);
  quizCompleted = output<void>();
  answersChanged = output<QuizAnswer[]>();

  currentIndex = signal(0);
  answeredQuestions = signal<Record<number, QuizAnswer>>({});
  selectedLabel = signal<string | null>(null);
  answerState = signal<AnswerState>('unanswered');
  animating = signal(false);

  constructor() {
    effect(() => {
      this.quiz();
      const saved = untracked(() => this.initialAnswers());
      this.currentIndex.set(0);
      this.answeredQuestions.set(this.indexAnswers(saved));
      this.restoreCurrentQuestion();
      this.animating.set(false);
    });
  }

  private indexAnswers(answers: QuizAnswer[]): Record<number, QuizAnswer> {
    const map: Record<number, QuizAnswer> = {};
    for (const a of answers) {
      map[a.questionIndex] = a;
    }
    return map;
  }

  private restoreCurrentQuestion(): void {
    const existing = this.answeredQuestions()[this.currentIndex()];
    if (existing) {
      this.selectedLabel.set(existing.selectedLabel);
      this.answerState.set(existing.correct ? 'correct' : 'wrong');
    } else {
      this.selectedLabel.set(null);
      this.answerState.set('unanswered');
    }
  }

  currentQuestion = computed(() => this.quiz()[this.currentIndex()]);
  isLast = computed(() => this.currentIndex() === this.quiz().length - 1);
  isFirst = computed(() => this.currentIndex() === 0);
  progress = computed(() => Math.round(((this.currentIndex() + 1) / this.quiz().length) * 100));

  selectAnswer(label: string): void {
    if (this.answerState() !== 'unanswered') return;
    const q = this.currentQuestion();
    if (!q) return;
    const correct = label === q.correctAnswer;
    const answer: QuizAnswer = {
      questionIndex: this.currentIndex(),
      selectedLabel: label,
      correct,
    };
    this.answeredQuestions.update((aq) => ({ ...aq, [this.currentIndex()]: answer }));
    this.selectedLabel.set(label);
    this.answerState.set(correct ? 'correct' : 'wrong');
    this.emitAnswers();
  }

  private emitAnswers(): void {
    const all = Object.values(this.answeredQuestions())
      .sort((a, b) => a.questionIndex - b.questionIndex);
    this.answersChanged.emit(all);
  }

  next(): void {
    if (this.answerState() === 'unanswered') return;
    this.emitAnswers();
    if (this.isLast()) {
      this.quizCompleted.emit();
      return;
    }
    this.animating.set(true);
    setTimeout(() => {
      this.currentIndex.update((i) => i + 1);
      this.restoreCurrentQuestion();
      this.animating.set(false);
    }, 300);
  }

  prev(): void {
    if (this.isFirst()) return;
    this.emitAnswers();
    this.animating.set(true);
    setTimeout(() => {
      this.currentIndex.update((i) => i - 1);
      this.restoreCurrentQuestion();
      this.animating.set(false);
    }, 300);
  }

  optionClass(label: string): string {
    const state = this.answerState();
    const selected = this.selectedLabel();
    const correct = this.currentQuestion().correctAnswer;

    if (state === 'unanswered') {
      return 'border-gray-200 hover:border-fg-brand hover:bg-surface cursor-pointer';
    }
    if (label === correct) {
      return 'border-green-500 bg-green-50 text-green-800';
    }
    if (label === selected && state === 'wrong') {
      return 'border-red-400 bg-red-50 text-red-800';
    }
    return 'border-gray-200 text-fg-muted opacity-60';
  }
}
