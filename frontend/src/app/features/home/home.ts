import { Component } from '@angular/core';
import { Stats } from './components/stats/stats';
import { Hero } from './components/hero/hero';
import { FeaturedCourses } from './components/featured-courses/featured-courses';
import { Categories } from './components/categories/categories';
import { TechStack } from './components/tech-stack/tech-stack';

@Component({
  selector: 'app-home',
  imports: [Categories, FeaturedCourses, Hero, Stats, TechStack],
  templateUrl: './home.html',
  styleUrl: './home.css',
})
export class Home {}
