import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { toSignal } from '@angular/core/rxjs-interop';
import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration, ChartData } from 'chart.js';
import { CourseService, InstructorCourse, CourseStats, LessonStats } from '../../../core/services/courses.service';

@Component({
  selector: 'app-instructor',
  imports: [RouterLink, FormsModule, BaseChartDirective],
  templateUrl: './instructor.html',
  styleUrl: './instructor.css',
})
export class Instructor implements OnInit {
  private courseService = inject(CourseService);

  activeTab = signal<'courses' | 'analytics'>('courses');
  courses = signal<InstructorCourse[]>([]);
  selectedCourseId = signal<string | null>(null);
  courseStats = signal<CourseStats | null>(null);
  lessonStats = signal<LessonStats[]>([]);
  searchQuery = signal('');
  statusFilter = signal<string>('all');
  loading = signal(true);
  statsLoading = signal(false);

  filteredCourses = computed(() => {
    const all = this.courses();
    const q = this.searchQuery().toLowerCase();
    const status = this.statusFilter();

    return all.filter((c) => {
      if (status !== 'all' && c.status !== status) return false;
      if (q && !c.title.toLowerCase().includes(q)) return false;
      return true;
    });
  });

  isStarFilled(starIndex: number, rating: number | null): boolean {
    return starIndex <= Math.round(rating ?? 0);
  }

  statusBadgeClass(status: string): string {
    const base = 'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold';
    switch (status) {
      case 'PUBLISHED':
        return `${base} bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400`;
      case 'DRAFT':
        return `${base} bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300`;
      case 'PENDING':
        return `${base} bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400`;
      default:
        return `${base} bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300`;
    }
  }

  ngOnInit() {
    this.loadCourses();
  }

  loadCourses() {
    this.loading.set(true);
    this.courseService.getMyCourses().subscribe({
      next: (data) => {
        this.courses.set(data);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  clearSelection() {
    this.selectedCourseId.set(null);
    this.activeTab.set('courses');
  }

  selectCourse(courseId: string) {
    if (this.selectedCourseId() === courseId) return;
    this.selectedCourseId.set(courseId);
    this.statsLoading.set(true);
    this.activeTab.set('analytics');

    this.courseService.getCourseStats(courseId).subscribe({
      next: (stats) => {
        console.log('[Instructor] courseStats response:', stats);
        this.courseStats.set(stats);
        this.statsLoading.set(false);
      },
      error: (err) => {
        console.error('[Instructor] getCourseStats error:', err);
        this.statsLoading.set(false);
      },
    });

    this.courseService.getCourseLessonsWithStats(courseId).subscribe({
      next: (lessons) => {
        console.log('[Instructor] lessonStats response:', lessons);
        this.lessonStats.set(lessons);
      },
      error: (err) => console.error('[Instructor] getCourseLessonsWithStats error:', err),
    });
  }

  deleteCourse(course: InstructorCourse) {
    if (course.status === 'PUBLISHED') return;
    const confirmed = confirm(`Delete "${course.title}"? This action cannot be undone.`);
    if (!confirmed) return;
    this.courseService.deleteCourse(course.id).subscribe({
      next: () => {
        this.courses.update((list) => list.filter((c) => c.id !== course.id));
      },
      error: () => alert('Failed to delete course. Please try again.'),
    });
  }

  enrollmentsChartData = computed<ChartData<'line'>>(() => {
    const stats = this.courseStats();
    const base = Array.from({ length: 30 }, (_, i) => ({
      day: i + 1,
      enrollments: Math.floor((stats?.enrollmentCount ?? 0) * (i + 1) / 30),
    }));
    return {
      labels: base.map((d) => `Day ${d.day}`),
      datasets: [
        {
          label: 'Enrollments',
          data: base.map((d) => d.enrollments),
          borderColor: '#5A4B9F',
          backgroundColor: 'rgba(90, 75, 159, 0.1)',
          fill: true,
          tension: 0.4,
        },
      ],
    };
  });

  enrollmentsChartOptions: ChartConfiguration<'line'>['options'] = {
    responsive: true,
    plugins: {
      legend: { display: false },
    },
    scales: {
      x: {
        grid: { display: false },
      },
      y: {
        beginAtZero: true,
        grid: { color: 'rgba(0,0,0,0.06)' },
      },
    },
  };

  lessonsChartData = computed<ChartData<'bar'>>(() => {
    const lessons = this.lessonStats();
    return {
      labels: lessons.map((l) => l.lessonTitle),
      datasets: [
        {
          label: 'Watch time (seconds)',
          data: lessons.map((l) => l.totalWatchTimeSeconds),
          backgroundColor: '#5A4B9F',
          borderRadius: 4,
        },
      ],
    };
  });

  lessonsChartOptions: ChartConfiguration<'bar'>['options'] = {
    responsive: true,
    indexAxis: 'y',
    plugins: {
      legend: { display: false },
    },
    scales: {
      x: {
        beginAtZero: true,
        grid: { color: 'rgba(0,0,0,0.06)' },
      },
      y: {
        grid: { display: false },
      },
    },
  };
}
