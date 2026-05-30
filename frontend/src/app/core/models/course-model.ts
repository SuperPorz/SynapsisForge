export interface Course {
  id: string;
  title: string;
  slug: string;
  price: number;
  thumbnail_url: string;
  instructor: {
    user: {
      first_name: string;
      last_name: string;
      email: string;
    };
  };
  category: string;
  rating?: number;
}
