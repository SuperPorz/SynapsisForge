import { Component, EventEmitter, Input, Output } from '@angular/core';

export interface Account {
  role: string;
  email: string;
  password: string;
  badge: string;
}

@Component({
  selector: 'app-test-credentials',
  imports: [],
  templateUrl: './test-credentials.html',
  styleUrl: './test-credentials.css',
})
export class TestCredentials {
  @Input() showUseButton = false;
  @Output() useAccount = new EventEmitter<Account>();

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
