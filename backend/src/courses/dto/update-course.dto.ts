import { Status } from '../../orm/enum/courses.enum';

export class UpdateCourseDto {
  title?: string;
  slug?: string;
  description?: string;
  price?: number;
  status?: Status;
  thumbnail_url?: string;
}
