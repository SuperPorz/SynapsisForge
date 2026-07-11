import { Component, inject, OnInit, signal } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { ThemeService } from '../../../core/services/theme.service';
import { CartService } from '../../../core/services/cart.service';
import { EnrollmentService } from '../../../core/services/enrollment.service';

@Component({
  selector: 'app-navbar',
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './navbar.html',
  styleUrl: './navbar.css',
})
export class Navbar implements OnInit {
  auth = inject(AuthService);
  theme = inject(ThemeService);
  cart = inject(CartService);
  enrollment = inject(EnrollmentService);
  _mobileMenuOpen = signal(false);

  ngOnInit() {
    if (this.auth.isLoggedIn()) {
      this.enrollment.loadEnrolledCourseIds();
    }
  }
}
