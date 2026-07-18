# Session 33 — Day 88: Dockerize backend NestJS

**Date**: 2026-06-26
**Phase**: 8 — AWS S3, Deploy & CI/CD GitLab (Days 83–94)
**Day**: 88 — Dockerize backend NestJS

---

## Summary

Created Docker multi-stage builds for both backend and frontend, production docker-compose, and nginx reverse proxy.

## Files created

| File | Description |
|------|-------------|
| `backend/Dockerfile` | Multi-stage build: Node 22 Alpine builder (npm ci + nest build) + runner (production deps only) |
| `backend/.dockerignore` | Excludes node_modules, dist, .env, etc. |
| `frontend/Dockerfile` | Multi-stage build: Node 22 Alpine builder (Angular production build) + nginx:alpine runner |
| `frontend/.dockerignore` | Excludes node_modules, dist, etc. |
| `frontend/src/environments/environment.ts` | Production env with `apiUrl: '/api'` (served via nginx proxy) |
| `infra/docker-compose.prod.yml` | 5 services: backend, frontend (nginx), postgres, mongodb, redis |
| `infra/nginx/nginx.conf` | Reverse proxy: `/api` → backend:3000, SPA fallback, gzip, asset caching, uploads proxy |

## Files modified

| File | Change |
|------|--------|
| `backend/src/main.ts` | CORS origin reads from `CORS_ORIGIN` env var (supports comma-separated origins) |

## Build results

- `infra-backend:latest` — 578MB, runs `node dist/main`
- `infra-frontend:latest` — 95.6MB, nginx serves Angular static files

Both images verified working: backend runs Node, frontend has index.html in /usr/share/nginx/html.

## Notes

- Frontend build required `ENV NPM_CONFIG_LEGACY_PEER_DEPS=true` due to ng2-charts peer dependency on @angular/cdk
- nginx config is mounted as volume at runtime (not baked into image) for easier maintenance
- Backend build uses `npm ci --omit=dev` for the runner stage (418 prod deps vs 947 full)
- Angular build output (632 kB initial bundle) exceeds 500 kB budget — pre-existing warning
