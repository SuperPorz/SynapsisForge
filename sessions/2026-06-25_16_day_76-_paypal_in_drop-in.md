# Session 2026-06-25 (16) — Day 76: PayPal in Drop-in ✅

### Completed
- **PayPal Drop-in config**: Added `paypal: { flow: 'checkout', amount, currency: 'EUR' }` to Drop-in options in `checkout.ts`
- **Payment method tracking**: Added `payment_method` column (`varchar(50)`, nullable) to Payment entity — populated from Braintree's `transaction.paymentInstrumentType` (saves `credit_card`, `paypal_account`, etc.)
- **Backend**: Both `checkout()` and `cartCheckout()` now extract payment method from Braintree response and save it
- **Bug fix**: PayPal was failing with `ppxo_no_token_passed_to_payment` / `422` — root cause: `flow: 'checkout'` requires `amount` + `currency` in PayPal options, which were missing
- Verified: checkout with `fake-valid-nonce` produces `payment_method = 'credit_card'`
- User tested real PayPal sandbox flow successfully (sofia.esposito → enrollment created for "Motion Design with Framer")

### Key decisions
- PayPal `amount` and `currency` are passed at Drop-in init time (derived from course price or cart total)
- Payment method is stored as a free-form string (not enum) to accommodate future Braintree payment types

