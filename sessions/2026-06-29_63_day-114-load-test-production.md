# Session 63 — Day 114: Load test on production (2026-06-29)

## Summary
Completed all Day 114 load testing tasks: ran autocannon against production (`https://synapsisforge.shop`), verified rate limiter behavior, created documentation.

## What was done

### Load tests (autocannon)
- **GET /courses**: P50=43ms, P99=174ms, 0 errors (under 60 req/min limit)
- **POST /auth/login**: P50=140ms, P99=378ms, 0 errors (under 10 req/min limit)
- **GET /courses/slug/:slug** (cached): P50=48ms, P99=171ms, 0 errors

### Rate limiter verification
- Auth (10/min): 1/120 success, 119 blocked (429) ✅
- Public (60/min): 60/60 success, then 60/60 blocked (429) ✅
- `Retry-After` header present on 429 responses ✅
- `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset` on success ✅
- No 5xx errors under any load ✅

### Documentation
- Created `docs/LOAD_TESTING.md` — full methodology, results table, rate limiter verification, setup guide
- Updated `README.md` Testing table with link to load testing doc

### Notes
- EC2 `docker stats` not captured (no SSH key available)
- Cached vs uncached comparison not possible from single IP due to rate limiting
- Tests originally ran against local Docker stack, corrected to production at user's request

## Files modified
- `docs/LOAD_TESTING.md` — created, full load test report
- `README.md` — added load testing row to Testing table
- `PLAN.md` — Day 114 marked ✅
- `TODO.md` — cleared, pre-loaded Day 117 (LinkedIn & GitHub publication)
