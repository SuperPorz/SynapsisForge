import { Component } from '@angular/core';

interface TechItem {
  id: number;
  name: string;
  icon: string;
}

@Component({
  selector: 'app-tech-stack',
  imports: [],
  templateUrl: './tech-stack.html',
  styleUrl: './tech-stack.css',
})
export class TechStack {
  techs: TechItem[] = [
    { id: 1, name: 'Angular', icon: 'icons/angular.svg' },
    { id: 2, name: 'NestJS', icon: 'icons/nestjs.svg' },
    { id: 3, name: 'TypeScript', icon: 'icons/typescript.svg' },
    { id: 4, name: 'PostgreSQL', icon: 'icons/postgresql.svg' },
    { id: 5, name: 'MongoDB', icon: 'icons/mongodb.svg' },
    { id: 6, name: 'Redis', icon: 'icons/redis.svg' },
    { id: 7, name: 'Docker', icon: 'icons/docker.svg' },
    { id: 8, name: 'Tailwind CSS', icon: 'icons/tailwindcss.svg' },
    { id: 9, name: 'Node.js', icon: 'icons/nodedotjs.svg' },
    { id: 10, name: 'TypeORM', icon: 'icons/typeorm.svg' },
    { id: 11, name: 'Mongoose', icon: 'icons/mongoose.svg' },
    { id: 12, name: 'PayPal', icon: 'icons/paypal.svg' },
    { id: 13, name: 'Braintree', icon: 'icons/braintree.svg' },
    { id: 14, name: 'OpenCode', icon: 'icons/opencode.svg' },
    { id: 15, name: 'AWS', icon: 'icons/amazonwebservices.svg' },
    { id: 16, name: 'BullMQ', icon: 'icons/bullmq.svg' },
    { id: 17, name: 'OpenAuth', icon: 'icons/openauth.svg' },
    { id: 18, name: 'JWT', icon: 'icons/jsonwebtokens.svg' },
    { id: 19, name: 'GitHub', icon: 'icons/github.svg' },
    { id: 20, name: 'GitLab', icon: 'icons/gitlab.svg' },
  ];

  get duplicatedTechs(): TechItem[] {
    return [...this.techs, ...this.techs];
  }
}
