//prettier-ignore
import { Component, OnInit, DestroyRef, inject, signal, computed, } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { debounceTime, distinctUntilChanged, switchMap, tap } from 'rxjs/operators';
import { of } from 'rxjs';
import { CourseCard } from '../../../shared/components/course-card/course-card';
import { CourseService } from '../../../core/services/courses.service';
import { Course } from '../../../core/models/course-model';

// ── Tipi locali ──────────────────────────────────────────────────
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

// ── Costanti ─────────────────────────────────────────────────────
const ITEMS_PER_PAGE = 9;

const LEVELS: LevelOption[] = [
  { value: 'all', label: 'Tutti i livelli' },
  { value: 'beginner', label: 'Principiante' },
  { value: 'intermediate', label: 'Intermedio' },
  { value: 'advanced', label: 'Avanzato' },
];

const PRICE_RANGES: PriceRangeOption[] = [
  { value: 'all', label: 'Tutti i prezzi' },
  { value: '0-30', label: 'Sotto $30' },
  { value: '30-60', label: 'Da $30 a $60' },
  { value: '60+', label: 'Oltre $60' },
];

@Component({
  selector: 'app-course-list',
  imports: [CourseCard, ReactiveFormsModule],
  templateUrl: './course-list.html',
  styleUrl: './course-list.css',
})
export class CourseList implements OnInit {
  // ── Dipendenze ────────────────────────────────────────────────
  private coursesService = inject(CourseService);
  private destroyRef = inject(DestroyRef);

  // ── Dati ──────────────────────────────────────────────────────
  courses = signal<Course[]>([]);
  total = signal(0);
  categories = signal([] as { id: string; name: string }[]);

  // ── UI state ──────────────────────────────────────────────────
  isLoading = signal(true);
  isSearching = signal(false);
  error = signal<string | null>(null);

  // ── Filtri ────────────────────────────────────────────────────
  filters = signal<FilterState>({
    category: null,
    level: null,
    priceRange: null,
    search: '',
    page: 1,
  });

  searchControl = new FormControl('');

  // ── Opzioni statiche per il template ─────────────────────────
  levels = LEVELS;
  priceRanges = PRICE_RANGES;

  // ── Paginazione (computed) ────────────────────────────────────
  currentPage = computed(() => this.filters().page);
  totalPages = computed(() => Math.ceil(this.total() / ITEMS_PER_PAGE));
  visiblePages = computed(() => {
    const current = this.currentPage();
    const total = this.totalPages();

    if (total <= 7) {
      return Array.from({ length: total }, (_, i) => i + 1);
    }

    const pages: number[] = [1];

    if (current > 3) pages.push(-1); // ellipsis sinistra

    const start = Math.max(2, current - 1);
    const end = Math.min(total - 1, current + 1);
    for (let i = start; i <= end; i++) pages.push(i);

    if (current < total - 2) pages.push(-1); // ellipsis destra

    pages.push(total);
    return pages;
  });

  // ── Lifecycle ─────────────────────────────────────────────────
  ngOnInit(): void {
    this.loadCategories();
    this.loadCourses();
    this.initSearchDebounce();
  }

  // ── Caricamento categorie ─────────────────────────────────────
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
          this.error.set('Impossibile caricare le categorie. Riprova più tardi.');
        },
      });
  }

  // ── Caricamento corsi ─────────────────────────────────────────
  private loadCourses(): void {
    const { category, page } = this.filters();

    this.isLoading.set(true);
    this.error.set(null);

    this.coursesService
      .getCourses({ category: this.filters().category ?? undefined, page, limit: ITEMS_PER_PAGE })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          this.courses.set(response.data);
          this.total.set(response.total);
          this.isLoading.set(false);
        },
        error: (err) => {
          console.error(err);
          this.error.set('Impossibile caricare i corsi. Riprova più tardi.');
          this.isLoading.set(false);
        },
      });
  }

  // ── Debounce ricerca ──────────────────────────────────────────
  private initSearchDebounce(): void | null {
    this.searchControl.valueChanges
      .pipe(
        debounceTime(300),
        distinctUntilChanged(),
        switchMap((value) => {
          if (!value) {
            this.loadCourses();
            this.isSearching.set(false);
            return of(null);
          } else {
            this.isSearching.set(true);
            this.filters.update((f) => ({ ...f, search: value ?? '', page: 1 }));
            return this.coursesService.search(value);
          }
        }),
        tap((response) => {
          if (response) {
            // response è SearchCoursesResponse
            this.isSearching.set(false);
            this.courses.set(response.data);
          }
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe();
  }

  // ── Handlers filtri ───────────────────────────────────────────
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
    // loadCourses() quando il backend supporterà il filtro livello
  }

  onPriceChange(range: string): void {
    if (range === 'all') {
      this.filters.update((f) => ({ ...f, priceRange: null, page: 1 }));
      this.loadCourses();
    } else {
      const parsed_range = this.parsePriceRange(range);
      this.filters.update((f) => ({ ...f, priceRange: range, page: 1 }));
      this.isLoading.set(true);
      this.coursesService
        .searchFilter({ minPrice: parsed_range.min, maxPrice: parsed_range.max })
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: (response) => {
            this.courses.set(response.data);
            this.total.set(response.total);
            this.isLoading.set(false);
          },
          error: (err) => {
            console.error(err);
            this.error.set('Impossibile applicare il filtro prezzo. Riprova più tardi.');
            this.isLoading.set(false);
          },
        });
    }
  }

  // ── Paginazione ───────────────────────────────────────────────
  goToPage(page: number): void {
    if (page < 1 || page > this.totalPages() || page === this.currentPage()) return;
    this.filters.update((f) => ({ ...f, page }));
    this.loadCourses();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // ── Reset ─────────────────────────────────────────────────────
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

  // ── Helpers template ──────────────────────────────────────────
  isCategoryActive(categoryId: string): boolean {
    return this.filters().category === categoryId;
  }

  isLevelActive(level: string): boolean {
    return (this.filters().level ?? 'all') === level;
  }

  isPriceActive(range: string): boolean {
    return (this.filters().priceRange ?? 'all') === range;
  }

  // ── parsing price range ───────────────────────────────────────────────
  parsePriceRange(range: string): { min?: number; max?: number } {
    if (range === 'all') return {};
    if (range.endsWith('+')) {
      return { min: parseInt(range.slice(0, -1), 10) };
    }
    const [min, max] = range.split('-').map((v) => parseInt(v, 10));
    return { min, max };
  }
}
