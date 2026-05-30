import { Component } from '@angular/core';

interface StatsType {
  id: number;
  label: string;
  value: string;
}

@Component({
  selector: 'app-stats',
  imports: [],
  templateUrl: './stats.html',
  styleUrl: './stats.css',
})
export class Stats {
  stats: StatsType[] = [
    {
      id: 1,
      label: 'available courses',
      value: '150+'
    },
    {
      id: 2,
      label: 'total students',
      value: '2.5M+'
    },
    {
      id: 3,
      label: 'covered disciplines',
      value: '20+'
    },
  ]
}
