import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

interface Category {
  id: number;
  label: string;
  slug: string;
}

@Component({
  selector: 'app-categories',
  imports: [RouterLink],
  templateUrl: './categories.html',
  styleUrl: './categories.css',
})
export class Categories {
  categories: Category[] = [
    {
      id: 1,
      label: 'Web Development',
      slug: 'web-development',
    },
    {
      id: 2,
      label: 'Data Science',
      slug: 'data-science',
    },
    {
      id: 3,
      label: 'UI/UX Design',
      slug: 'ui-ux-design',
    },
    {
      id: 4,
      label: 'Mobile Development',
      slug: 'mobile-development',
    },
  ];
}
