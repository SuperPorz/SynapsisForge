import { Component, inject, OnInit } from '@angular/core';
import { RouterLink, Router } from '@angular/router';
import { CurrencyPipe } from '@angular/common';
import { CartService } from '../../core/services/cart.service';

@Component({
  selector: 'app-cart',
  imports: [RouterLink, CurrencyPipe],
  templateUrl: './cart.html',
  styleUrl: './cart.css',
})
export class Cart implements OnInit {
  cart = inject(CartService);
  router = inject(Router);

  ngOnInit() {
    this.cart.loadCart();
  }

  removeItem(courseId: string) {
    this.cart.removeItem(courseId).subscribe();
  }

  proceedToCheckout() {
    this.router.navigate(['/checkout']);
  }
}
