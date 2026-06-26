export interface Course {
  id: string;
  title: string;
  slug: string;
  description: string;
  price: number;
  thumbnail_url: string;
  category: { id: string; name: string; slug: string };
  instructor: { user: { first_name: string; last_name: string; email: string } | null } | null;
  rating?: number;
  sections?: Section[];
}

export interface PaginatedCoursesResponse {
  data: Course[];
  total: number;
}

export interface SearchCoursesResponse {
  data: Course[];
  total: number;
}

export interface Lesson {
  id: string;
  title: string;
  order: number;
  duration_seconds: number;
}

export interface Section {
  id: string;
  title: string;
  order: number;
  lessons: Lesson[];
}

export interface LessonVideoResponse {
  videoUrl: string;
  last_position_seconds: number;
  sections: Section[];
  completedLessonIds: string[];
  quiz: QuizItem[];
  quizAnswers: QuizAnswer[];
}

export interface UpdateProgressPayload {
  last_position_seconds: number;
  completed?: boolean;
  quizAnswers?: QuizAnswer[];
}

export interface QuizOption {
  label: string;
  text: string;
}

export interface QuizItem {
  question: string;
  options: QuizOption[];
  correctAnswer: string;
  explanation: string | null;
}

export interface QuizAnswer {
  questionIndex: number;
  selectedLabel: string;
  correct: boolean;
}

export interface PresignedUrlResponse {
  uploadUrl: string;
  key: string;
  publicUrl: string;
}

export interface LessonContentModel {
  videoUrl: string;
  s3Key: string;
  quiz: {
    question: string;
    options: { label: string; text: string }[];
    correctAnswer: string;
    explanation: string;
  }[];
}
