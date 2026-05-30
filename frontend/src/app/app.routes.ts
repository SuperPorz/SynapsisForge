import { Routes } from '@angular/router';
import { Login } from './features/auth/login/login';
import { Register } from './features/auth/register/register';
import { roleGuard } from './core/guards/role-guard';
import { authGuard } from './core/guards/auth-guard';
import { Home } from './features/home/home';

export const routes: Routes = [
  {
    path: '',
    component: Home,
  },
  {
    path: 'login',
    component: Login,
  },
  {
    path: 'register',
    component: Register,
  },

  {
    path: 'admin',
    loadComponent: () => import('./features/admin/admin').then((m) => m.Admin),
  },

  {
    path: 'courses',
    loadComponent: () =>
      import('./features/courses/course-list/course-list').then((m) => m.CourseList),
  },
  {
    path: 'courses/:id',
    loadComponent: () =>
      import('./features/courses/course-detail/course-detail').then((m) => m.CourseDetail),
  },

  /////////////////////// ROTTE DASHBOARD /////////////////////////////////

  {
    path: 'dashboard',
    loadComponent: () =>
      import('./features/dashboard/dashboard-layout/dashboard-layout').then(
        (m) => m.DashboardLayout,
      ),
    canActivate: [authGuard],
    children: [
      { path: '', redirectTo: 'my-courses', pathMatch: 'full' },
      {
        path: 'my-courses',
        loadComponent: () =>
          import('./features/dashboard/my-courses/my-courses').then(
            (m) => m.MyCourses,
          ),
      },
      {
        path: 'profile',
        loadComponent: () =>
          import('./features/dashboard/profile/profile').then((m) => m.Profile),
      },
      {
        path: 'certificates',
        loadComponent: () =>
          import('./features/dashboard/certificates/certificates').then(
            (m) => m.Certificates,
          ),
      },
      {
        path: 'instructor',
        canActivate: [roleGuard],
        data: { roles: ['instructor', 'admin'] },
        loadComponent: () =>
          import('./features/dashboard/instructor/instructor').then(
            (m) => m.Instructor,
          ),
      },
    ],
  },
];
