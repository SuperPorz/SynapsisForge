import { Component, inject, OnInit, DestroyRef, ChangeDetectorRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CourseService } from '../../../../core/services/courses.service';
import { Course } from '../../../../core/models/course-model';
import { CourseCard } from '../../../../shared/components/course-card/course-card';
import { FEATURED_COURSES_LIMIT } from '../../../../core/costants/pagination';

@Component({
  selector: 'app-featured-courses',
  imports: [CourseCard],
  templateUrl: './featured-courses.html',
  styleUrl: './featured-courses.css',
})
export class FeaturedCourses implements OnInit {
  courses: Course[] = [];
  isLoading = true;
  error: string | null = null;

  private coursesService = inject(CourseService);
  private destroyRef = inject(DestroyRef);
  private changeDetectorRef = inject(ChangeDetectorRef);

  ngOnInit(): void {
    this.coursesService
      .getCourses({ featured: true, page: 1, limit: FEATURED_COURSES_LIMIT })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          this.courses = response.data;
          this.isLoading = false;
          this.changeDetectorRef.detectChanges();
        },
        error: (err) => {
          console.error(err);
          this.error = 'Impossibile caricare i corsi in evidenza.';
          this.isLoading = false;
          this.changeDetectorRef.detectChanges();
        },
      });
  }
}
