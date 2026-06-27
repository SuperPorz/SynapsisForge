import { Routes } from '@angular/router';
import { Login } from './features/auth/login/login';
import { Register } from './features/auth/register/register';
import { OAuthCallback } from './features/auth/oauth-callback/oauth-callback';
import { VerifyEmail } from './features/auth/verify-email/verify-email';
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
    path: 'oauth-callback',
    component: OAuthCallback,
  },
  {
    path: 'verify-email/:token',
    component: VerifyEmail,
  },

  {
    path: 'admin',
    canActivate: [roleGuard],
    data: { roles: ['ADMIN'] },
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
  {
    path: 'cart',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/cart/cart').then((m) => m.Cart),
  },
  {
    path: 'checkout',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/checkout/checkout').then((m) => m.Checkout),
  },
  {
    path: 'checkout/:courseId',
    loadComponent: () =>
      import('./features/checkout/checkout').then((m) => m.Checkout),
  },
  {
    path: 'subscribe',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/subscription/subscription').then((m) => m.Subscription),
  },
  {
    path: 'enrollments/:enrollmentId/lessons/:lessonId',
  canActivate: [authGuard],
  loadComponent: () =>
    import('./features/lessons/lesson-player/lesson-player').then(
      (m) => m.LessonPlayer,
    ),
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
      { path: '', redirectTo: 'my-enrolls', pathMatch: 'full' },
      {
        path: 'my-enrolls',
        loadComponent: () =>
          import('./features/dashboard/my-enrolls/my-enrolls').then(
            (m) => m.MyEnrolls,
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
        path: 'subscription',
        loadComponent: () =>
          import('./features/dashboard/subscription-status/subscription-status').then(
            (m) => m.SubscriptionStatus,
          ),
      },
      {
        path: 'payment-history',
        loadComponent: () =>
          import('./features/dashboard/payment-history/payment-history').then(
            (m) => m.PaymentHistory,
          ),
      },
      {
        path: 'instructor',
        canActivate: [roleGuard],
        data: { roles: ['INSTRUCTOR', 'ADMIN'] },
        loadComponent: () =>
          import('./features/dashboard/instructor/instructor').then(
            (m) => m.Instructor,
          ),
      },
      {
        path: 'instructor/new',
        canActivate: [roleGuard],
        data: { roles: ['INSTRUCTOR', 'ADMIN'] },
        loadComponent: () =>
          import('./features/dashboard/instructor/course-wizard/course-wizard').then(
            (m) => m.CourseWizard,
          ),
      },
      {
        path: 'instructor/edit/:id',
        canActivate: [roleGuard],
        data: { roles: ['INSTRUCTOR', 'ADMIN'] },
        loadComponent: () =>
          import('./features/dashboard/instructor/course-wizard/course-wizard').then(
            (m) => m.CourseWizard,
          ),
      },
    ],
  },
];
