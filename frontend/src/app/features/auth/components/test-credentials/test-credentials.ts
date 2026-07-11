import { Component, Input } from '@angular/core';
import { RouterLink } from '@angular/router';

interface Account {
  role: string;
  email: string;
  password: string;
  badge: string;
}

@Component({
  selector: 'app-test-credentials',
  imports: [RouterLink],
  templateUrl: './test-credentials.html',
  styleUrl: './test-credentials.css',
})
export class TestCredentials {
  @Input() showUseButton = false;

  accounts: Account[] = [
    {
      role: 'Admin',
      email: 'admin@example.com',
      password: 'Password123!',
      badge: 'ADMIN',
    },
    {
      role: 'Instructor',
      email: 'james.carter@synapsis.dev',
      password: 'Password123!',
      badge: 'INSTRUCTOR',
    },
    {
      role: 'Student',
      email: 'alice@example.com',
      password: 'Password123!',
      badge: 'STUDENT',
    },
  ];
}
