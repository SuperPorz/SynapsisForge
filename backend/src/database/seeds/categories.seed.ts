import { DataSource } from 'typeorm';
import { Category } from '../../common/entities/categories.entity';

export async function seedCategories(ds: DataSource): Promise<Category[]> {
  const repo = ds.getRepository(Category);

  const categories = repo.create([
    {
      name: 'Web Development',
      slug: 'web-development',
      description: 'Frontend e backend web',
    },
    {
      name: 'Data Science',
      slug: 'data-science',
      description: 'Analisi dati e machine learning',
    },
    {
      name: 'UI/UX Design',
      slug: 'ui-ux-design',
      description: 'Design di interfacce e user experience',
    },
  ]);

  const saved = await repo.save(categories);
  console.log(`✅ ${saved.length} categorie create`);
  return saved;
}
