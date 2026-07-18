# Session 2026-06-26 (17) — Days 77–79: Subscription & Management ✅

### Completed
- **Day 77 — Braintree subscription**:
  - Created `SubscriptionPlan` enum (FREE/PREMIUM)
  - Added `subscription_id` + `plan` columns to User entity
  - Created `SubscribeDto` + `POST /payments/subscribe` (`gateway.subscription.create()`)
  - Server-side vaulting: `customer.create()` → `paymentMethod.create()` → `subscription.create({ paymentMethodToken })`
  - Created frontend `SubscriptionComponent` (`/subscribe`) with Drop-in, nav link "Premium" button
  - Wire: `post /payments/client-token/vault` (authenticated, with customerId) → Drop-in vault mode
- **Day 79 — Subscription management** (anticipated):
  - Backend: `GET /payments/subscription/status` + `POST /payments/subscription/cancel`
  - Frontend: `SubscriptionStatus` component at `/dashboard/subscription` with plan display, cancel button
  - Cancel message: "retain access until end of billing period" with showcase-portfolio disclaimer
  - Sidebar link "Subscription" in Student block + mobile nav chip
  - AuthService: added `plan` signal with `setPlan()` method
  - Course-card: shows "Included" badge for premium users instead of price
  - Course-detail: shows "Included with Premium" box + "Start learning" enroll button for premium users
- **Tests**: User tested full subscription lifecycle (subscribe → courses show "Included" → cancel → reverts to FREE)

### Fixes & decisions
- `fake-valid-nonce` doesn't work for `subscription.create()` — need vaulted nonce or payment method token
- Solution: create Braintree customer + vault payment method server-side before subscription
- `POST /payments/client-token/vault` failed because user UUID is not a Braintree customer ID
- Final approach: `customer.create()` → `paymentMethod.create()` → `subscription.create({ paymentMethodToken })` — no vaulting needed client-side
- `card: { vault: { vault: true } }` in Drop-in requires customer ID in client token; removed in favor of server-side vaulting
- `auth.plan()` signal added to AuthService for reactive premium state across components

