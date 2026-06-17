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
}

export interface UpdateProgressPayload {
  last_position_seconds: number;
  completed?: boolean;
}
