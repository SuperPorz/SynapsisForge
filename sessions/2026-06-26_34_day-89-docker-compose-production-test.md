# Session 34 — Day 89: Docker Compose production + test

**Date**: 2026-06-26
**Phase**: 8 — AWS S3, Deploy & CI/CD GitLab (Days 83–94)
**Day**: 89 — Docker Compose production

---

## Summary

Tested the production Docker stack end-to-end. Found and fixed 3 issues.

## Bugs fixed

| Issue | Symptom | Fix | File |
|-------|---------|-----|------|
| Swagger UI blank in browser | nginx regex `~* \.(css\|js\|...)$` overrode prefix proxy locations | Added `^~` modifier to `/api/`, `/api/docs`, `/uploads/`, `/admin/queues` location blocks | `infra/nginx/nginx.conf` |
| `/api/courses` returned 400 | `ParsePositiveIntPipe` received `undefined` when no query params sent | Added `@DefaultValuePipe(1)` and `@DefaultValuePipe(10)` before `ParsePositiveIntPipe` | `backend/src/modules/courses/courses.controller.ts` |
| Swagger blank in production | Helmet CSP blocked inline scripts in `NODE_ENV=production` | Configured CSP directives to allow `'unsafe-inline'` and `'unsafe-eval'` for Swagger UI | `backend/src/main.ts` |

## Test results

| Test | Result |
|------|--------|
| All 5 containers healthy | ✅ |
| `curl http://localhost/` → 200 | ✅ |
| `curl http://localhost/api/courses` → 200 | ✅ |
| Swagger UI `/api/docs` in browser | ✅ |
| Static assets via nginx proxy | ✅ (`curl` 200, browser loads) |
| Direct backend `/api/docs/` assets | ✅ 200 |

## Notes

- nginx `^~` is essential for any prefix location that might be overridden by a regex location (CSS/JS assets)
- After all testing, prod stack stopped and dev stack restarted by user
