//prettier-ignore
import { Component, OnInit, DestroyRef, inject, signal, computed, } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { debounceTime, distinctUntilChanged, switchMap, tap } from 'rxjs/operators';
import { of } from 'rxjs';
import { CourseCard } from '../../../shared/components/course-card/course-card';
import { CourseService } from '../../../core/services/courses.service';
import { Course } from '../../../core/models/course-model';

interface FilterState {
  category: string | null;
  level: string | null;
  priceRange: string | null;
  search: string;
  page: number;
}

interface LevelOption {
  value: string;
  label: string;
}

interface PriceRangeOption {
  value: string;
  label: string;
}

const ITEMS_PER_PAGE = 9;

const LEVELS: LevelOption[] = [
  { value: 'all', label: 'All levels' },
  { value: 'beginner', label: 'Beginner' },
  { value: 'intermediate', label: 'Intermediate' },
  { value: 'advanced', label: 'Advanced' },
];

const PRICE_RANGES: PriceRangeOption[] = [
  { value: 'all', label: 'All prices' },
  { value: '0-30', label: 'Under $30' },
  { value: '30-60', label: '$30 to $60' },
  { value: '60+', label: 'Over $60' },
];

@Component({
  selector: 'app-course-list',
  imports: [CourseCard, ReactiveFormsModule],
  templateUrl: './course-list.html',
  styleUrl: './course-list.css',
})
export class CourseList implements OnInit {
  private coursesService = inject(CourseService);
  private destroyRef = inject(DestroyRef);

  courses = signal<Course[]>([]);
  total = signal(0);
  categories = signal([] as { id: string; name: string }[]);

  isLoading = signal(true);
  isSearching = signal(false);
  error = signal<string | null>(null);

  filters = signal<FilterState>({
    category: null,
    level: null,
    priceRange: null,
    search: '',
    page: 1,
  });

  searchControl = new FormControl('');

  levels = LEVELS;
  priceRanges = PRICE_RANGES;

  currentPage = computed(() => this.filters().page);
  totalPages = computed(() => Math.ceil(this.total() / ITEMS_PER_PAGE));
  visiblePages = computed(() => {
    const current = this.currentPage();
    const total = this.totalPages();

    if (total <= 7) {
      return Array.from({ length: total }, (_, i) => i + 1);
    }

    const pages: number[] = [1];

    if (current > 3) pages.push(-1);

    const start = Math.max(2, current - 1);
    const end = Math.min(total - 1, current + 1);
    for (let i = start; i <= end; i++) pages.push(i);

    if (current < total - 2) pages.push(-1);

    pages.push(total);
    return pages;
  });

  ngOnInit(): void {
    this.loadCategories();
    this.loadCourses();
    this.initSearchDebounce();
  }

  private loadCategories(): void {
    this.coursesService
      .getCategories()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          this.categories.set(response);
        },
        error: (err) => {
          console.error(err);
          this.error.set('Failed to load categories. Please try again later.');
        },
      });
  }

  private loadCourses(): void {
    const { category, priceRange, search, page } = this.filters();
    const parsedRange = priceRange ? this.parsePriceRange(priceRange) : {};

    this.isLoading.set(true);
    this.error.set(null);

    this.coursesService
      .getCourses({
        category: category ?? undefined,
        page,
        limit: ITEMS_PER_PAGE,
        q: search || undefined,
        minPrice: parsedRange.min,
        maxPrice: parsedRange.max,
      })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          this.courses.set(response.data);
          this.total.set(response.total);
          this.isLoading.set(false);
        },
        error: (err) => {
          console.error(err);
          this.error.set('Failed to load courses. Please try again later.');
          this.isLoading.set(false);
        },
      });
  }

  private initSearchDebounce(): void | null {
    this.searchControl.valueChanges
      .pipe(
        debounceTime(300),
        distinctUntilChanged(),
        tap((value) => {
          this.filters.update((f) => ({ ...f, search: value ?? '', page: 1 }));
          this.isSearching.set(true);
        }),
        switchMap(() => {
          this.loadCourses();
          this.isSearching.set(false);
          return of(null);
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe();
  }

  private parsePriceRange(range: string): { min?: number; max?: number } {
    if (range === 'all') return {};
    if (range.endsWith('+')) {
      return { min: parseInt(range.slice(0, -1), 10) };
    }
    const [min, max] = range.split('-').map((v) => parseInt(v, 10));
    return { min, max };
  }

  onCategoryChange(categoryId: string): void {
    const isSame = this.filters().category === categoryId;
    this.filters.update((f) => ({
      ...f,
      category: isSame ? null : categoryId,
      page: 1,
    }));
    this.loadCourses();
  }

  onLevelChange(level: string): void {
    this.filters.update((f) => ({
      ...f,
      level: level === 'all' ? null : level,
      page: 1,
    }));
  }

  onPriceChange(range: string): void {
    this.filters.update((f) => ({
      ...f,
      priceRange: range === 'all' ? null : range,
      page: 1,
    }));
    this.loadCourses();
  }

  goToPage(page: number): void {
    if (page < 1 || page > this.totalPages() || page === this.currentPage()) return;
    this.filters.update((f) => ({ ...f, page }));
    this.loadCourses();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  clearSearch(): void {
    this.searchControl.setValue('');
    this.filters.update((f) => ({ ...f, search: '', page: 1 }));
    this.loadCourses();
  }

  resetFilters(): void {
    this.searchControl.setValue('');
    this.filters.set({ category: null, level: null, priceRange: null, search: '', page: 1 });
    this.loadCourses();
  }

  isCategoryActive(categoryId: string): boolean {
    return this.filters().category === categoryId;
  }

  isLevelActive(level: string): boolean {
    return (this.filters().level ?? 'all') === level;
  }

  isPriceActive(range: string): boolean {
    return (this.filters().priceRange ?? 'all') === range;
  }
}
