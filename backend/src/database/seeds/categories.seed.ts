/* eslint-disable */
import { DataSource } from 'typeorm';
import { Category } from '../../common/entities/categories.entity';

export interface SeededCategory {
  id: string;
  name: string;
  slug: string;
}

const CATEGORIES = [
  {
    name: 'Web Development',
    slug: 'web-development',
    description: 'Frontend, backend, and fullstack web development',
  },
  {
    name: 'Data Science',
    slug: 'data-science',
    description: 'Data analysis, machine learning, and statistics',
  },
  {
    name: 'UI/UX Design',
    slug: 'ui-ux-design',
    description: 'Interface design and user experience principles',
  },
  {
    name: 'Mobile Development',
    slug: 'mobile-development',
    description: 'iOS and Android app development',
  },
  {
    name: 'DevOps',
    slug: 'devops',
    description: 'CI/CD, containerization, and cloud infrastructure',
  },
  {
    name: 'Cybersecurity',
    slug: 'cybersecurity',
    description: 'Information security and penetration testing',
  },
];

export async function seedCategories(ds: DataSource): Promise<SeededCategory[]> {
  const repo = ds.getRepository(Category);

  const entities = repo.create(CATEGORIES);
  const saved = await repo.save(entities);

  console.log(`  ✅ ${saved.length} categories`);
  return saved.map((c) => ({ id: c.id, name: c.name, slug: c.slug! }));
}
