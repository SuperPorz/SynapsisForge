export interface CreateLessonContentDto {
  lessonId: number;
  videoUrl: string;
  transcript?: string | null;
  attachments?: { name: string; url: string; type: string }[];
  // prettier-ignore
  quiz?: { question: string; options: { label: string; text: string }[]; correctAnswer: string }[];
}
