# Load Testing — SynapsisForge

> **Date**: 2026-06-29
> **Target**: `https://synapsisforge.shop` (production — EC2 t2.medium, Docker Compose)
> **Tool**: [autocannon](https://github.com/mcollina/autocannon) v7

---

## Methodology

- Tests run from a local machine (Windows 11) against the production server.
- **Rate limits** are in place: auth routes 10 req/min, public routes 60 req/min, default 100 req/min.
- All tests use a single connection with controlled request rate to stay under the rate limit where noted.
- High-rate tests intentionally exceed rate limits to verify throttling behavior.
- No SSH access available to capture `docker stats` on EC2 during tests.

---

## Results Summary

| Endpoint | Rate | P50 | P97.5 | P99 | Avg | Max | Req | 2xx | 4xx |
|----------|------|-----|-------|-----|-----|-----|-----|-----|-----|
| `GET /courses` | 1 r/s (under 60/min) | 43 ms | 164 ms | 174 ms | 54.55 ms | 181 ms | 16 | 16 | 0 |
| `POST /auth/login` | 1 r/s (within 10/min) | 140 ms | 355 ms | 378 ms | 147.65 ms | 400 ms | 9 | 9 | 0 |
| `GET /courses/slug/:slug` (cached) | 1 r/s (under 60/min) | 48 ms | 150 ms | 171 ms | 53.13 ms | 185 ms | 16 | 16 | 0 |
| `POST /auth/login` (rate test) | 2 r/s (120/min) | 35 ms | 178 ms | 304 ms | 46.09 ms | 387 ms | 122 | 1 | 119 |
| `GET /courses` (rate test) | 2 r/s (120/min) | 31 ms | 100 ms | 115 ms | 36.34 ms | 152 ms | 122 | 60 | 60 |

---

## Detailed Results

### 1. GET /api/courses?limit=10 — baseline (under rate limit)

```bash
autocannon -c 1 -r 1 -d 15 https://synapsisforge.shop/api/courses?limit=10
```

| Metric | Value |
|--------|-------|
| P50    | 43 ms |
| P97.5  | 164 ms |
| P99    | 174 ms |
| Avg    | 54.55 ms |
| Max    | 181 ms |
| 200    | 16/16 (100%) |

### 2. POST /api/auth/login — with valid credentials (under rate limit)

```bash
autocannon -c 1 -r 1 -d 8 -m POST -H "Content-Type: application/json" \
  -b '{"email":"alice@example.com","password":"Password123!"}' \
  https://synapsisforge.shop/api/auth/login
```

| Metric | Value |
|--------|-------|
| P50    | 140 ms |
| P97.5  | 355 ms |
| P99    | 378 ms |
| Avg    | 147.65 ms |
| Max    | 400 ms |
| 201    | 9/9 (100%) |

- Auth endpoint is slower than public GET due to bcrypt password hashing + JWT signing.

### 3. GET /api/courses/slug/:slug — cache-warmed (under rate limit)

```bash
# Cache pre-warmed with 3 requests
autocannon -c 1 -r 1 -d 15 \
  https://synapsisforge.shop/api/courses/slug/testing-javascript-apps
```

| Metric | Value |
|--------|-------|
| P50    | 48 ms |
| P97.5  | 150 ms |
| P99    | 171 ms |
| Avg    | 53.13 ms |
| Max    | 185 ms |
| 200    | 16/16 (100%) |

- Cache hit performance is similar to the list endpoint (~53 ms vs ~55 ms).
- Cached vs uncached comparison not possible from a single IP due to rate limiting (cache-miss requests also consume the rate limit budget).

---

## Rate Limiter Verification

### Auth endpoint (limit: 10 req/min)

```bash
autocannon -c 1 -r 2 -d 60 -m POST -H "Content-Type: application/json" \
  -b '{"email":"alice@example.com","password":"Password123!"}' \
  https://synapsisforge.shop/api/auth/login
```

- **120 requests sent** over 60 seconds (2 r/s)
- **1 success (201)**, **119 rate-limited (429)**
- ✅ Rate limiter blocks ~99% of excess traffic after the 10/min window is consumed.

### Public endpoint (limit: 60 req/min)

```bash
autocannon -c 1 -r 2 -d 60 https://synapsisforge.shop/api/courses?limit=10
```

- **120 requests sent** over 60 seconds (2 r/s)
- **60 success (200)**, **60 rate-limited (429)**
- ✅ Rate limiter allows exactly ~60 requests/min then blocks excess.

### Rate Limiter Headers

| Header | Auth (success) | Auth (429) | Public (success) | Public (429) |
|--------|----------------|------------|------------------|---------------|
| `Retry-After` | — | ✅ (seconds remaining) | — | ✅ |
| `X-RateLimit-Limit` | ✅ | — | ✅ (60) | — |
| `X-RateLimit-Remaining` | ✅ | — | ✅ | — |
| `X-RateLimit-Reset` | ✅ | — | ✅ | — |

---

## Observations

- **P50 latency**: 43–48 ms for public GET endpoints, 140 ms for auth (bcrypt).
- **P99 latency**: 171–174 ms for public GET, 378 ms for auth.
- **No 5xx errors** under any test — server remains stable.
- **Rate limiter** is effective: tight throttling on auth (10/min) and generous but firm throttling on public endpoints (60/min).
- **Retry-After header** is present on 429 responses, enabling client-side backoff.
- **EC2 monitoring**: SSH access not available during this session — no `docker stats` or `htop` data captured.

---

## Setup

Install autocannon:

```bash
npm install -g autocannon
```

Run a custom test:

```bash
autocannon -c 1 -r 1 -d 15 https://synapsisforge.shop/api/courses?limit=10
```

Flags:
- `-c N` — concurrent connections
- `-r N` — requests per second (rate limit)
- `-d N` — duration in seconds
- `-m METHOD` — HTTP method (default GET)
- `-b 'BODY'` — request body (for POST)
- `-H 'Header: Value'` — custom header
