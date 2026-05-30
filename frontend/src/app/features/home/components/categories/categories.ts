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
      label: 'web-development',
      slug: 'web',
    },
    {
      id: 2,
      label: 'python',
      slug: 'py',
    },
    {
      id: 3,
      label: 'angular',
      slug: 'ng',
    },
  ];
}
