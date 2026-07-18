# Session 35 — CSS rendering fix: missing .postcssrc.json in Docker build

**Date**: 2026-06-27
**Phase**: 8 — AWS S3, Deploy & CI/CD GitLab (Days 83–94)
**Type**: Bug fix (out-of-flow) + Day 90 deploy completion

---

## Summary

Site at http://51.118.21.90/ rendered as plain unstyled HTML — no cards, no buttons, text all on the left.

## Root cause

`frontend/Dockerfile` did not copy `.postcssrc.json` into the builder stage:

```dockerfile
COPY angular.json tsconfig*.json ./
# ⚠️ .postcssrc.json was missing
```

Without it, Angular's Vite-based build had no `@tailwindcss/postcss` PostCSS plugin configured. The `@import "tailwindcss"` in `styles.css` resolved to plain CSS imports from `node_modules/tailwindcss/` (theme + reset only), but the JIT engine never ran. Result: **zero utility classes** generated (`.flex`, `.grid`, `.p-4`, etc.).

| Metric | Broken build | Fixed build |
|--------|-------------|-------------|
| CSS file size | 22 KB | 56 KB |
| Utility classes | ❌ absent | ✅ present |

## Fix

Added `.postcssrc.json` to the COPY command in `frontend/Dockerfile`:

```dockerfile
COPY angular.json tsconfig*.json .postcssrc.json ./
```

## Build & deploy

- Rebuilt and pushed image to Docker Hub: `michelangelostega/synapsisforge-frontend:latest`
- On EC2: `docker compose -f docker-compose.prod.yml pull frontend && docker compose -f docker-compose.prod.yml up -d frontend`

## Verification

- `docker exec infra-frontend-1 wc -c /usr/share/nginx/html/styles-KT2AW4CZ.css` → 56208 bytes ✅
- `curl -s http://localhost/ | grep -o 'styles-[^"]*.css'` → `styles-KT2AW4CZ.css` ✅

---

## Day 90 completed

All Day 90 tasks (EC2 deploy) were confirmed complete: site running at http://51.118.21.90/, all containers healthy. Marked as ✅ in PLAN.md.
