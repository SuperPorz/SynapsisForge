# Session 2026-06-24 (2) — Day 57: Cache manager in NestJS — config ✅

### Day 57 subtasks completed
- Installed `@nestjs/cache-manager@3.1.3`, `cache-manager@7.2.8`, `@keyv/redis@5.1.6`, `keyv@5.6.0` (with `--legacy-peer-deps` due to keyv@4 vs keyv@5 conflict)
- Configured `CacheModule.registerAsync({ isGlobal: true })` in AppModule with Redis URL from ConfigService (fallback `redis://localhost:6379`)
- Injected `CACHE_MANAGER` in CoursesService
- Cached `findAll()`, `findOne()`, and `findBySlug()` via `cacheManager.wrap()`
- Verified: Redis shows 2 cached keys with correct TTLs (290s / 594s remaining)
- `npm run build` passed clean

### Key decisions
- `isGlobal: true` on CacheModule to avoid importing in each feature module
- TTLs: 5 min for list queries, 10 min for course detail/slug
- `wrap()` pattern used for clean cache-miss-query-save flow

---

