import { Component, input, output, signal, computed, effect } from '@angular/core';
import { QuizItem } from '../../../../core/models/course-model';
import { NgClass } from '@angular/common';

type AnswerState = 'unanswered' | 'correct' | 'wrong';

@Component({
  selector: 'app-quiz-player',
  standalone: true,
  imports: [NgClass],
  templateUrl: './quiz-player.html',
})
export class QuizPlayer {
  // ── input / output ────────────────────────────────────────────────────────
  quiz = input.required<QuizItem[]>();
  quizCompleted = output<void>();

  // ── state ─────────────────────────────────────────────────────────────────
  currentIndex = signal(0);
  selectedLabel = signal<string | null>(null);
  answerState = signal<AnswerState>('unanswered');
  animating = signal(false);

  // ── reset stato quando cambia il quiz (nuova lezione) ────────────────────
  constructor() {
    effect(() => {
      this.quiz(); // dipendenza: ogni volta che quiz cambia...
      this.currentIndex.set(0);
      this.selectedLabel.set(null);
      this.answerState.set('unanswered');
      this.animating.set(false);
    });
  }

  // ── derived ───────────────────────────────────────────────────────────────
  currentQuestion = computed(() => this.quiz()[this.currentIndex()]);
  isLast = computed(() => this.currentIndex() === this.quiz().length - 1);
  progress = computed(() => Math.round(((this.currentIndex() + 1) / this.quiz().length) * 100));

  // ── actions ───────────────────────────────────────────────────────────────
  selectAnswer(label: string): void {
    if (this.answerState() !== 'unanswered') return;
    this.selectedLabel.set(label);
    this.answerState.set(label === this.currentQuestion().correctAnswer ? 'correct' : 'wrong');
  }

  next(): void {
    if (this.answerState() === 'unanswered') return;

    if (this.isLast()) {
      this.quizCompleted.emit();
      return;
    }

    // animazione di uscita → avanza → animazione di entrata
    this.animating.set(true);
    setTimeout(() => {
      this.currentIndex.update((i) => i + 1);
      this.selectedLabel.set(null);
      this.answerState.set('unanswered');
      this.animating.set(false);
    }, 300);
  }

  // ── helpers template ──────────────────────────────────────────────────────
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
