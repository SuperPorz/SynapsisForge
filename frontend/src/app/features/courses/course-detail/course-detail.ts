import { Component, computed, DestroyRef, inject, signal } from '@angular/core';
import { CourseService } from '../../../core/services/courses.service';
import { ActivatedRoute } from '@angular/router';
import { Course, Lesson, Section } from '../../../core/models/course-model';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { switchMap } from 'rxjs';

@Component({
  selector: 'app-course-detail',
  imports: [],
  templateUrl: './course-detail.html',
  styleUrl: './course-detail.css',
})
export class CourseDetail {
  private route = inject(ActivatedRoute);
  private courseService = inject(CourseService);
  private destroyRef = inject(DestroyRef);

  course = signal<Course | null>(null);
  loading = signal(true);
  error = signal<string | null>(null);
  expandedSections = signal<Set<string>>(new Set());

  totalLessons = computed(() => {
    const sections = this.course()?.sections ?? [];
    return sections.reduce((total, section) => total + section.lessons.length, 0);
  });

  totalDuration = computed(() => {
    const sections = this.course()?.sections ?? [];
    return sections.reduce((total, section) => {
      const sectionDuration = section.lessons.reduce((sum, lesson) => sum + lesson.duration_seconds, 0);
      return total + sectionDuration;
    }, 0);
  });

  ngOnInit() { 
    /* fetch via route param perchè l'ID del corso è passato come parametro della route */
    this.route.params
    .pipe(
      switchMap((params) => this.courseService.getCourseById(params['id'])),
      takeUntilDestroyed(this.destroyRef)
    )
    .subscribe({
      next: (response) => {
        this.course.set(response.data);
        this.loading.set(false);
        console.log('Corso caricato:', response.data);
      },
      error: (err) => {
        this.error.set('Impossibile caricare i dettagli del corso.');
        this.loading.set(false);
      }
    });
  }

  toggleSection(id: string) {
    const current = this.expandedSections();
    const next = new Set(current); // ← nuovo riferimento
    next.has(id) ? next.delete(id) : next.add(id);
    this.expandedSections.set(next); // ← ora Angular rileva il cambiamento
  }

  isSectionExpanded(id: string): boolean { 
    /* lookup nel Set */
    return this.expandedSections().has(id);
  }

  formatDuration(seconds: number): string {
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);

    if (hours > 0 && mins > 0) return `${hours}h ${mins}min`;
    if (hours > 0) return `${hours}h 00min`;
    return `${mins} min`;
  }
}
