# Session 2026-06-26 (18) — Premium plan sync fix (plan in JWT) ✅

### Completed
- **Root cause fixed**: Added `plan` to `JwtPayload` and `generateTokens()` in backend `auth.service.ts`
- **Synchronous plan**: `buildUserFromToken()` now extracts `plan` from JWT and sets `_plan` signal synchronously (`payload.plan ?? 'FREE'` for old tokens)
- **`/subscribe` redirect**: `SubscriptionComponent.ngOnInit()` redirects premium users to `/dashboard/subscription`
- **Navbar**: Premium button uses `[routerLink]` conditional on `auth.plan()` — now works because plan is available synchronously
- **MEMORY.md**: updated with "Premium guard — resolved (2026-06-26)" section documenting the working solution
- Builds: both `npx nest build` and `npx ng build` pass clean

---

