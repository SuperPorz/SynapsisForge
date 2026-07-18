# Session 2026-06-25 (13) — Day 74: Single course purchase — backend ✅

### Completed
- **Day 74**: `POST /payments/checkout` endpoint with `gateway.transaction.sale()`
- **Day 74**: Payment entity already existed (no changes needed) — `PaymentsModule` now imports `TypeOrmModule.forFeature([Payment, Course, StudentProfile, Enrollment])` + `EnrollmentsModule`
- **Day 74**: `CheckoutDto` created (`courseId`, `nonce`, `amount`) with validation
- **Day 74**: `PaymentsService.checkout()` — pre-validates user/course/duplicate → Braintree `transaction.sale()` → creates Payment (COMPLETED/FAILED) → calls `EnrollmentsService.enroll()` which triggers `enrollment.created` event
- **Day 74**: Braintree errors handled: SDK exceptions, declined transactions, processor rejects — all create FAILED Payment record with descriptive message
- **Day 74**: `npx nest build` — clean
- **Day 74**: One-shot E2E test: login as alice → POST `/payments/checkout` with `fake-valid-nonce` → `success: true`, `transactionId: "aq5t1a4g"`, enrollment created ✅ → backend killed

### Key decisions
- `POST /payments/checkout` is **not** `@Public()` — requires JWT auth (unlike `client-token` which is public)
- Pre-checks (user profile, course published, no duplicate enrollment) run **before** Braintree call to avoid charging for invalid requests
- Uses `EnrollmentsService.enroll()` after payment creation — the payment check inside `enroll()` passes because the COMPLETED Payment was just created
- `gateway_id` column on Payment entity stores the Braintree transaction ID
- Test nonce `fake-valid-nonce` used for sandbox testing

