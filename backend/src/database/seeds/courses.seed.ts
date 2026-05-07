import { DataSource } from 'typeorm';
import { Course } from '../../common/entities/courses.entity';
import { Category } from '../../common/entities/categories.entity';
import { InstructorProfile } from '../../common/entities/InstructorProfile.entity';
import { Status } from '../../common/entities/enum/courses.enum';

export async function seedCourses(
  ds: DataSource,
  categories: Category[],
  instructors: InstructorProfile[],
): Promise<Course[]> {
  const repo = ds.getRepository(Course);

  const [webDev, dataScience, design] = categories;
  const [marco, giulia] = instructors;

  const courses = repo.create([
    {
      title: 'NestJS dalla A alla Z',
      slug: 'nestjs-a-z',
      description: 'Corso completo su NestJS',
      price: 49.99,
      status: Status.PUBLISHED,
      thumbnail_url: 'https://placeholder.com/nest.jpg',
      instructor: marco,
      category: webDev,
    },
    {
      title: 'React Avanzato',
      slug: 'react-avanzato',
      description: 'Hooks, context e performance',
      price: 39.99,
      status: Status.PUBLISHED,
      thumbnail_url: 'https://placeholder.com/react.jpg',
      instructor: marco,
      category: webDev,
    },
    {
      title: 'Python per Data Science',
      slug: 'python-data-science',
      description: 'Pandas, NumPy e visualizzazione',
      price: 59.99,
      status: Status.PENDING,
      thumbnail_url: 'https://placeholder.com/python.jpg',
      instructor: giulia,
      category: dataScience,
    },
    {
      title: 'Figma Masterclass',
      slug: 'figma-masterclass',
      description: 'Design professionale con Figma',
      price: 29.99,
      status: Status.PENDING,
      thumbnail_url: 'https://placeholder.com/figma.jpg',
      instructor: giulia,
      category: design,
    },
    {
      title: 'TypeScript Fondamentali',
      slug: 'typescript-fondamentali',
      description: 'Tipi, generics e utility types',
      price: 34.99,
      status: Status.DRAFT,
      thumbnail_url: 'https://placeholder.com/ts.jpg',
      instructor: marco,
      category: webDev,
    },
  ]);

  const saved = await repo.save(courses);
  console.log(`✅ ${saved.length} corsi creati`);
  return saved;
}
