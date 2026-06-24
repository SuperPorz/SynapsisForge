# Caching Strategy — SynapsisForge

## Overview

Redis is used as the primary cache store, backed by `@nestjs/cache-manager` + `keyv` + `@keyv/redis`.

## Key Naming Convention

All cache keys follow the pattern:

```
sf:{context}:{entity}:{identifier}
```

| Prefix | Purpose |
|--------|---------|
| `sf:cache:courses:list:*` | Paginated course list queries |
| `sf:cache:course:{id}` | Single course by UUID |
| `sf:cache:course:slug:{slug}` | Single course by slug |
| `sf:rate:throttle:*` | Rate limiter hit counters |
| `sf:rate:block:*` | Rate limiter blocked IPs |
| `sf:enrollment-count:{courseId}` | Enrollment counter (Pub/Sub) |
| `keyv::*` | Internal Keyv prefix (transparent) |

## TTL Strategy

| Cache Type | TTL |
|------------|-----|
| Course lists | 5 minutes (300s) |
| Course detail | 10 minutes (600s) |
| Rate limiter counters | dynamic (per-request TTL) |
| Enrollment counters | 24 hours (86400s) |
| Refresh tokens | matches JWT expiry |

## Eviction Policy

Configured in `infra/redis/redis.conf`:
- `maxmemory 256mb`
- `maxmemory-policy allkeys-lru`

## Invalidation

Invalidation is handled by `CacheService`:

- `invalidateCourse(id, slug?)` — deletes course detail + slug + all list caches
- `invalidateCourseList()` — deletes all list caches via SCAN pattern
- `invalidateByPattern(pattern)` — SCAN + DEL by glob pattern

When a course is updated/created:
1. `PUT /courses/:id` → calls `invalidateCourse()`
2. `POST /courses` → calls `invalidateCourseList()`
3. `DELETE /courses/:id` → calls `invalidateCourse()`

## Rate Limiting

Uses `@nestjs/throttler` with a custom `RedisThrottlerStorage`.

| Scope | Limit | Window |
|-------|-------|--------|
| Global (all endpoints) | 100 req | 60s |
| Auth endpoints | stricter via guard config | — |

Rate limit headers: `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset`

## Monitoring

- **RedisInsight** available at `http://localhost:5540`
- **Admin endpoint** `GET /admin/cache-stats` returns:
  - Hit rate (%)
  - Memory usage
  - Key count by prefix
  - Evicted keys
  - Connected clients
  - Uptime
  - Maxmemory policy

## Pub/Sub — Enrollment Counters

When a student enrolls, `RedisPubSubService` publishes to channel `sf:enrollments`.
A subscriber increments `sf:enrollment-count:{courseId}` with 24h TTL.
`CoursesService` reads this counter as a fast cache, falling back to SQL COUNT.

## Architecture Diagram

```
[Controller] → [Service] → [CacheService] → [Redis (via Keyv)]
                                ↓
                     [RedisPubSubService] → [Redis Pub/Sub]
                                ↓
                     [Enrollment counter cache]
```

## Running Locally

```bash
docker compose up -d redis
```

Redis runs on `localhost:6379`. RedisInsight on `localhost:5540`.

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `REDIS_URL` | `redis://localhost:6379` | Redis connection string |
