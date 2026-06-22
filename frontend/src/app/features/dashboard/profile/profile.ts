import { Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DatePipe } from '@angular/common';
import { UsersService, UserProfile, UpdateUserPayload } from '../../../core/services/users.service';

@Component({
  selector: 'app-profile',
  imports: [FormsModule, DatePipe],
  templateUrl: './profile.html',
  styleUrl: './profile.css',
})
export class Profile implements OnInit {
  private usersService = inject(UsersService);

  profile = signal<UserProfile | null>(null);
  editing = signal(false);
  saving = signal(false);

  editForm: UpdateUserPayload = {};

  ngOnInit(): void {
    this.loadProfile();
  }

  loadProfile(): void {
    this.usersService.getProfile().subscribe((data) => {
      this.profile.set(data);
    });
  }

  startEditing(): void {
    const p = this.profile();
    if (!p) return;
    this.editForm = {
      first_name: p.first_name,
      last_name: p.last_name,
      bio: p.bio ?? '',
      avatar_url: p.avatar_url ?? '',
    };
    this.editing.set(true);
  }

  cancelEditing(): void {
    this.editing.set(false);
    this.editForm = {};
  }

  saveProfile(): void {
    this.saving.set(true);
    this.usersService.updateProfile(this.editForm).subscribe({
      next: (updated) => {
        this.profile.set(updated);
        this.editing.set(false);
        this.saving.set(false);
      },
      error: () => {
        this.saving.set(false);
      },
    });
  }
}
