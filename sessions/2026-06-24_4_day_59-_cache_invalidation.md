# Session 2026-06-24 (4) — Day 59: Cache invalidation ✅

### Day 59 subtasks completed
- Created `CacheService` (`modules/cache/cache.service.ts`) with:
  - `get/set/del` — thin wrappers around cache-manager
  - `invalidateByPattern(pattern)` — Redis SCAN + bulk delete via cache-manager
  - `invalidateCourse(id, slug?)` — deletes course detail + slug + all list cache keys
  - `invalidateCourseList()` — deletes all `sf:cache:courses:list:*` keys
- Created `CacheModule` (`@Global()`) — imported in AppModule
- Integrated invalidation in `CoursesService`: `create()`, `update()`, `delete()`, `restore()`, section CRUD all call `cacheService.invalidateCourse()`
- Verified: cache hit 5.95ms → after invalidation → cache miss 32.63ms ✅

### Redis client notes
- `@keyv/redis@5` uses `@redis/client` (Node Redis v4), not `ioredis`
- SCAN returns `{ cursor, keys }` object (not array tuple like ioredis)
- Client needs explicit `.connect()` before first use

---

