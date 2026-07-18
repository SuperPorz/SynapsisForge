# Session 2026-06-25 (14) — Full shopping cart (cart_items, Redis cache, frontend CartService/Component/Checkout) ✅

### Completed
- **CartItem entity**: PostgreSQL `cart_items` table with unique(user, course), `User.cartItems` relation
- **CartModule + CartService + CartController**: CRUD endpoints (`GET /cart`, `POST /cart`, `DELETE /cart/:courseId`, `DELETE /cart`, `GET /cart/count`)
- **Redis cache**: `sf:cart:{userId}` (cart JSON, 1h TTL) + `sf:cart:count:{userId}` (badge number, 1h TTL). Invalidated on every mutation.
- **Cart checkout**: `POST /cart/checkout` — validates all items (published, no duplicates, total match), single `gateway.transaction.sale()`, creates Payment + Enrollment per item via `PaymentsService.cartCheckout()`, clears cart on success.
- **Frontend CartService**: Signals (`items`, `total`, `count`, `courseIds` Set), methods (`loadCart()`, `addItem()`, `removeItem()`, `clearCart()`, `checkout()`, `isInCart()`)
- **Navbar cart icon**: SVG cart with red badge count, visible on desktop + mobile, links to `/cart`. Calls `cart.loadCart()` on `ngOnInit`.
- **Course-card**: "Add to Cart" button wired with `(click)`. Shows "In cart ✓" (green, disabled) when already in cart via `cart.isInCart()`.
- **Course-detail**: Two buttons — "Add to Cart" (outlined) + "Buy now" (solid). Buy now adds to cart then navigates to `/cart`.
- **CartComponent page** at `/cart`: items with thumbnails, remove button, order summary with total, "Proceed to Checkout" button, empty state with "Browse courses".
- **Route `/cart`**: lazy-loaded with `authGuard`.
- **CheckoutComponent update**: supports both single-course (`courseId` param) and cart-based (no param) checkout modes. Cart mode shows item summary + total, single Braintree transaction, success message.
- **Both `ng build` and `npx nest build` pass clean**
- **One-shot test**: full cart lifecycle (add 2 items, get count, remove 1, checkout → `success:true`, `transactionId`, enrollment created) ✅

### Key decisions
- **Hybrid Redis + PostgreSQL**: PG is source of truth, Redis caches cart JSON + count with 1h TTL, invalidated on mutations
- **Single Braintree tx for cart**: one `transaction.sale()` for the total, then split into N Payment records + N Enrollment records internally — reduces Braintree fees
- **`POST /cart/checkout`** is the cart checkout endpoint (vs `POST /payments/checkout` for single-course)
- **`CartService` frontend uses `courseIds` Set** for O(1) lookup of "is in cart" status
- **"Add to Cart" ≠ "Buy now"**: Add to cart just adds; Buy now adds + navigates to cart
- Course-detail uses `addToCart()` for the outlined button, `buyNow()` for the solid button

