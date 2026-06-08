export interface Course {
  id: string;
  title: string;
  slug: string;
  description: string;
  price: number;
  thumbnail_url: string;
  category: { id: string; name: string; slug: string};
  instructor: { user: { first_name: string; last_name: string; email: string } | null } | null;
  rating?: number;
}

export interface PaginatedCoursesResponse {
  data: { data: Course[]; total: number };
  statusCode: number;
  timestamp: string;
}

export interface SearchCoursesResponse {
  data: Course[];
  statusCode: number;
  timestamp: string;
}
