import { Component, inject, OnInit } from '@angular/core';
import { RouterLink, Router } from '@angular/router';
import { CurrencyPipe } from '@angular/common';
import { ToastService } from '../../core/services/toast.service';
import { CartService } from '../../core/services/cart.service';

@Component({
  selector: 'app-cart',
  imports: [RouterLink, CurrencyPipe],
  templateUrl: './cart.html',
  styleUrl: './cart.css',
})
export class Cart implements OnInit {
  cart = inject(CartService);
  private toast = inject(ToastService);
  router = inject(Router);

  ngOnInit() {
    this.cart.loadCart();
  }

  removeItem(courseId: string) {
    this.cart.removeItem(courseId).subscribe({
      next: () => this.toast.show('Removed from cart'),
    });
  }

  proceedToCheckout() {
    this.router.navigate(['/checkout']);
  }
}
