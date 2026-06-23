import { Component, inject, signal, ChangeDetectorRef } from '@angular/core';
import { Router, RouterLink, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { firstValueFrom } from 'rxjs';
import { CourseService, CreateCoursePayload, CreateLessonContentPayload } from '../../../../core/services/courses.service';

@Component({
  selector: 'app-course-wizard',
  imports: [RouterLink, FormsModule],
  templateUrl: './course-wizard.html',
  styleUrl: './course-wizard.css',
})
export class CourseWizard {
  private courseService = inject(CourseService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private cdr = inject(ChangeDetectorRef);

  step = signal(1);
  submitting = signal(false);
  saving = signal(false);
  error = signal<string | null>(null);

  courseId = signal<string | null>(null);
  isEdit = signal(false);

  categories = signal<{ id: string; name: string; slug: string }[]>([]);

  ngOnInit() {
    this.courseService.getCategories().subscribe({
      next: (cats) => this.categories.set(cats),
    });

    const editId = this.route.snapshot.paramMap.get('id');
    if (editId) {
      this.isEdit.set(true);
      this.courseId.set(editId);
      this.loadCourse(editId);
    }
  }

  private loadCourse(id: string) {
    this.courseService.getCourseById(id).subscribe({
      next: (course) => {
        Object.assign(this.step1Model, {
          title: course.title,
          slug: course.slug,
          description: course.description,
          price: course.price,
          category_id: course.category?.id ?? '',
          thumbnail_url: course.thumbnail_url,
        });
        if (course.sections) {
          const sections = course.sections.map((s) => ({
            title: s.title,
            order: s.order,
          }));
          this.sections.set(sections);
          this.sectionIds = course.sections.map((s) => s.id);
          const lessonsMap: Record<number, { title: string; order: number; duration_seconds: number }[]> = {};
          const contentsMap: Record<number, { videoUrl: string; quiz: { question: string; options: { label: string; text: string }[]; correctAnswer: string; explanation: string }[] }> = {};
          let globalIdx = 0;
          for (let si = 0; si < course.sections.length; si++) {
            const sec = course.sections[si];
            lessonsMap[si] = (sec.lessons || []).map((l) => ({
              title: l.title,
              order: l.order,
              duration_seconds: l.duration_seconds,
            }));
            for (let li = 0; li < (sec.lessons || []).length; li++) {
              contentsMap[globalIdx] = { videoUrl: '', quiz: [] };
              globalIdx++;
            }
          }
          this.lessons.set(lessonsMap);
          this.contents.set(contentsMap);
        }
        this.cdr.markForCheck();
      },
      error: () => this.error.set('Failed to load course.'),
    });
  }

  autoSlug() {
    this.step1Model.slug = this.step1Model.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  }

  step1Model: CreateCoursePayload = {
    title: '',
    slug: '',
    description: '',
    price: 0,
    category_id: '',
    thumbnail_url: '',
  };

  sections = signal<{ title: string; order: number }[]>([]);

  lessons = signal<
    Record<number, { title: string; order: number; duration_seconds: number }[]>
  >({});

  contents = signal<
    Record<
      number,
      {
        videoUrl: string;
        quiz: {
          question: string;
          options: { label: string; text: string }[];
          correctAnswer: string;
          explanation: string;
        }[];
      }
    >
  >({});

  sectionIds: string[] = [];
  lessonIds: string[] = [];

  get step1Valid() {
    const m = this.step1Model;
    return (
      m.title.trim() !== '' &&
      m.slug.trim() !== '' &&
      m.description.trim() !== '' &&
      m.category_id !== '' &&
      m.price >= 0
    );
  }

  get step2Valid() {
    const secs = this.sections();
    return secs.length > 0 && secs.every((s) => s.title.trim() !== '');
  }

  get allLessonsValid(): boolean {
    const lessonsMap = this.lessons();
    const secs = this.sections();
    for (let i = 0; i < secs.length; i++) {
      const sectionLessons = lessonsMap[i] || [];
      if (sectionLessons.length === 0) return false;
      if (sectionLessons.some((l) => l.title.trim() === '')) return false;
    }
    return true;
  }

  globalLessonIndex(sectionIndex: number, lessonIndex: number): number {
    const lessonsMap = this.lessons();
    let idx = 0;
    for (let si = 0; si < sectionIndex; si++) {
      idx += (lessonsMap[si] || []).length;
    }
    return idx + lessonIndex;
  }

  addSection() {
    this.sections.update((s) => [...s, { title: '', order: s.length + 1 }]);
  }

  removeSection(index: number) {
    this.sections.update((s) =>
      s
        .filter((_, i) => i !== index)
        .map((sec, i) => ({ ...sec, order: i + 1 })),
    );
    this.lessons.update((l) => {
      const updated: Record<
        number,
        { title: string; order: number; duration_seconds: number }[]
      > = {};
      for (let i = 0; i < this.sections().length; i++) {
        const oldIndex = i >= index ? i + 1 : i;
        updated[i] = l[oldIndex] || [];
      }
      return updated;
    });
  }

  sectionTitle(index: number, value: string) {
    this.sections.update((s) =>
      s.map((sec, i) => (i === index ? { ...sec, title: value } : sec)),
    );
  }

  addLesson(sectionIndex: number) {
    this.lessons.update((l) => {
      const current = l[sectionIndex] || [];
      return {
        ...l,
        [sectionIndex]: [
          ...current,
          { title: '', order: current.length + 1, duration_seconds: 600 },
        ],
      };
    });
  }

  removeLesson(sectionIndex: number, lessonIndex: number) {
    this.lessons.update((l) => {
      const current = (l[sectionIndex] || [])
        .filter((_, i) => i !== lessonIndex)
        .map((less, i) => ({ ...less, order: i + 1 }));
      return { ...l, [sectionIndex]: current };
    });
  }

  toNumber(v: string): number {
    return Number(v);
  }

  updateLesson(
    sectionIndex: number,
    lessonIndex: number,
    field: string,
    value: string | number,
  ) {
    this.lessons.update((l) => {
      const current = [...(l[sectionIndex] || [])];
      current[lessonIndex] = { ...current[lessonIndex], [field]: value };
      return { ...l, [sectionIndex]: current };
    });
  }

  addQuizItem(lessonIndex: number) {
    this.contents.update((c) => {
      const current = c[lessonIndex] || { videoUrl: '', quiz: [] };
      return {
        ...c,
        [lessonIndex]: {
          ...current,
          quiz: [
            ...current.quiz,
            {
              question: '',
              options: [
                { label: 'A', text: '' },
                { label: 'B', text: '' },
              ],
              correctAnswer: 'A',
              explanation: '',
            },
          ],
        },
      };
    });
  }

  removeQuizItem(lessonIndex: number, quizIndex: number) {
    this.contents.update((c) => {
      const current = c[lessonIndex];
      if (!current) return c;
      return {
        ...c,
        [lessonIndex]: {
          ...current,
          quiz: current.quiz.filter((_, i) => i !== quizIndex),
        },
      };
    });
  }

  updateQuizOption(
    lessonIndex: number,
    quizIndex: number,
    optionIndex: number,
    text: string,
  ) {
    this.contents.update((c) => {
      const current = c[lessonIndex];
      if (!current) return c;
      const quiz = [...current.quiz];
      quiz[quizIndex] = {
        ...quiz[quizIndex],
        options: quiz[quizIndex].options.map((o, i) =>
          i === optionIndex ? { ...o, text } : o,
        ),
      };
      return { ...c, [lessonIndex]: { ...current, quiz } };
    });
  }

  addQuizOption(lessonIndex: number, quizIndex: number) {
    this.contents.update((c) => {
      const current = c[lessonIndex];
      if (!current) return c;
      const quiz = [...current.quiz];
      const nextLabel = String.fromCharCode(
        65 + quiz[quizIndex].options.length,
      );
      quiz[quizIndex] = {
        ...quiz[quizIndex],
        options: [
          ...quiz[quizIndex].options,
          { label: nextLabel, text: '' },
        ],
      };
      return { ...c, [lessonIndex]: { ...current, quiz } };
    });
  }

  setVideoUrl(lessonIndex: number, url: string) {
    this.contents.update((c) => {
      const current = c[lessonIndex] || { videoUrl: '', quiz: [] };
      return { ...c, [lessonIndex]: { ...current, videoUrl: url } };
    });
  }

  async nextStep() {
    if (this.step() === 1) {
      if (!this.step1Valid) return;
      if (this.isEdit()) {
        this.step.set(2);
        return;
      }
      this.submitting.set(true);
      this.error.set(null);
      try {
        const course = await firstValueFrom(
          this.courseService.createCourse(this.step1Model),
        );
        this.courseId.set(course.id);
        this.submitting.set(false);
        this.step.set(2);
      } catch {
        this.error.set('Failed to create course. Please try again.');
        this.submitting.set(false);
      }
    } else if (this.step() === 2) {
      if (!this.step2Valid) return;
      if (this.isEdit()) {
        this.step.set(3);
        return;
      }
      this.submitting.set(true);
      this.error.set(null);
      const cid = this.courseId();
      if (!cid) return;
      try {
        const createdSections = await Promise.all(
          this.sections().map((sec) =>
            firstValueFrom(this.courseService.createSection(cid, sec)),
          ),
        );
        this.sectionIds = createdSections.map((s) => s.id);
        this.submitting.set(false);
        this.step.set(3);
      } catch {
        this.error.set('Failed to create sections. Please try again.');
        this.submitting.set(false);
      }
    } else if (this.step() === 3) {
      if (!this.allLessonsValid) return;
      if (this.isEdit()) {
        this.step.set(4);
        return;
      }
      this.submitting.set(true);
      this.error.set(null);
      const cid = this.courseId();
      if (!cid) return;
      try {
        const promises: Promise<{ id: string }>[] = [];
        const lessonsMap = this.lessons();
        for (let si = 0; si < this.sections().length; si++) {
          const sectionLessons = lessonsMap[si] || [];
          for (let li = 0; li < sectionLessons.length; li++) {
            promises.push(
              firstValueFrom(
                this.courseService.createLesson(cid, {
                  ...sectionLessons[li],
                  section_id: this.sectionIds[si],
                }),
              ) as Promise<{ id: string }>,
            );
          }
        }
        const lessonResults = await Promise.all(promises);
        this.lessonIds = lessonResults.map((r) => r.id);
        this.submitting.set(false);
        this.step.set(4);
      } catch {
        this.error.set('Failed to create lessons. Please try again.');
        this.submitting.set(false);
      }
    }
  }

  prevStep() {
    this.error.set(null);
    this.step.update((s) => Math.max(1, s - 1));
  }

  async publish(status: 'DRAFT' | 'PENDING') {
    const cid = this.courseId();
    if (!cid) return;
    this.saving.set(true);
    this.error.set(null);

    try {
      if (this.isEdit()) {
        await firstValueFrom(
          this.courseService.updateCourse(cid, {
            ...this.step1Model,
            status,
          }),
        );
      } else {
        if (status === 'PENDING') {
          await firstValueFrom(
            this.courseService.updateCourse(cid, { status: 'PENDING' }),
          );
        }
      }

      if (!this.isEdit()) {
        const lessonsMap = this.lessons();
        const contentPromises: Promise<unknown>[] = [];
        let globalIdx = 0;

        for (let si = 0; si < this.sections().length; si++) {
          const sectionLessons = lessonsMap[si] || [];
          for (let li = 0; li < sectionLessons.length; li++) {
            const lessonContent = this.contents()[globalIdx];
            if (lessonContent && lessonContent.videoUrl) {
              const payload: CreateLessonContentPayload = {
                videoUrl: lessonContent.videoUrl,
                quiz:
                  lessonContent.quiz.length > 0
                    ? lessonContent.quiz.map((q) => ({
                        ...q,
                        explanation: q.explanation || null,
                      }))
                    : undefined,
              };
              contentPromises.push(
                firstValueFrom(
                  this.courseService.createLessonContent(
                    cid,
                    this.lessonIds[globalIdx],
                    payload,
                  ),
                ),
              );
            }
            globalIdx++;
          }
        }

        await Promise.all(contentPromises);
      }

      this.saving.set(false);
      this.router.navigate(['/dashboard/instructor']);
    } catch {
      this.error.set('Failed to save course. Please try again.');
      this.saving.set(false);
    }
  }
}
