import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { DatePipe } from '@angular/common';
import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration, ChartData } from 'chart.js';
import {
  AdminService,
  AdminUser,
  AdminStats,
  PendingCourse,
} from '../../core/services/admin.service';

@Component({
  selector: 'app-admin',
  imports: [RouterLink, FormsModule, BaseChartDirective, DatePipe],
  templateUrl: './admin.html',
  styleUrl: './admin.css',
})
export class Admin implements OnInit {
  private adminService = inject(AdminService);

  activeTab = signal<'dashboard' | 'users' | 'moderation'>('dashboard');

  // ─── Dashboard state ─────────────────────────────────────────
  stats = signal<AdminStats | null>(null);
  statsLoading = signal(true);

  // ─── Users state ─────────────────────────────────────────────
  users = signal<AdminUser[]>([]);
  usersLoading = signal(true);
  roleFilter = signal<string>('');
  activeFilter = signal<string>('');

  filteredUsers = computed(() => {
    let list = this.users();
    const role = this.roleFilter();
    const active = this.activeFilter();
    if (role) list = list.filter((u) => u.role === role);
    if (active === 'active') list = list.filter((u) => u.is_active);
    else if (active === 'inactive') list = list.filter((u) => !u.is_active);
    return list;
  });

  // ─── Moderation state ────────────────────────────────────────
  pendingCourses = signal<PendingCourse[]>([]);
  moderationLoading = signal(true);
  selectedCourse = signal<PendingCourse | null>(null);

  ngOnInit() {
    this.loadStats();
    this.loadUsers();
    this.loadPendingCourses();
  }

  // ─── Dashboard ───────────────────────────────────────────────
  loadStats() {
    this.statsLoading.set(true);
    this.adminService.getStats().subscribe({
      next: (data) => {
        this.stats.set(data);
        this.statsLoading.set(false);
      },
      error: () => this.statsLoading.set(false),
    });
  }

  usersByRoleChartData = computed<ChartData<'doughnut'>>(() => {
    const s = this.stats();
    if (!s) return { labels: [], datasets: [] };
    return {
      labels: s.users_by_role.map((r) => r.role),
      datasets: [
        {
          data: s.users_by_role.map((r) => r.count),
          backgroundColor: ['#6366f1', '#22c55e', '#f59e0b', '#ef4444'],
          borderWidth: 0,
        },
      ],
    };
  });

  doughnutOptions: ChartConfiguration<'doughnut'>['options'] = {
    responsive: true,
    plugins: {
      legend: {
        position: 'bottom',
        labels: { usePointStyle: true, padding: 16 },
      },
    },
  };

  revenueChartData = computed<ChartData<'line'>>(() => {
    const s = this.stats();
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return {
      labels: months,
      datasets: [
        {
          label: 'Revenue',
          data: months.map((_, i) => {
            if (s?.monthly_revenue) return Math.round(s.monthly_revenue * (i + 1) / 12);
            return 0;
          }),
          borderColor: '#6366f1',
          backgroundColor: 'rgba(99, 102, 241, 0.1)',
          fill: true,
          tension: 0.4,
        },
      ],
    };
  });

  revenueChartOptions: ChartConfiguration<'line'>['options'] = {
    responsive: true,
    plugins: { legend: { display: false } },
    scales: {
      x: { grid: { display: false } },
      y: { beginAtZero: true, grid: { color: 'rgba(0,0,0,0.06)' } },
    },
  };

  // ─── Users ───────────────────────────────────────────────────
  loadUsers() {
    this.usersLoading.set(true);
    this.adminService.getUsers().subscribe({
      next: (data) => {
        this.users.set(data);
        this.usersLoading.set(false);
      },
      error: () => this.usersLoading.set(false),
    });
  }

  getInitials(u: AdminUser): string {
    return (u.first_name?.[0] ?? '') + (u.last_name?.[0] ?? '');
  }

  // ─── Moderation ──────────────────────────────────────────────
  loadPendingCourses() {
    this.moderationLoading.set(true);
    this.adminService.getPendingCourses().subscribe({
      next: (data) => {
        this.pendingCourses.set(data);
        this.moderationLoading.set(false);
      },
      error: () => this.moderationLoading.set(false),
    });
  }

  approveCourse(id: string) {
    this.adminService.approveCourse(id).subscribe({
      next: () => {
        this.pendingCourses.set(this.pendingCourses().filter((c) => c.id !== id));
        this.selectedCourse.set(null);
      },
    });
  }

  rejectCourse(id: string) {
    this.adminService.rejectCourse(id).subscribe({
      next: () => {
        this.pendingCourses.set(this.pendingCourses().filter((c) => c.id !== id));
        this.selectedCourse.set(null);
      },
    });
  }
}
