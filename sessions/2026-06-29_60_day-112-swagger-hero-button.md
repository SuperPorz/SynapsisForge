# Session 60 — Day 112: Swagger hero button (2026-06-29)

## Summary
Added "API Docs" button to home hero, fixed 404/504 caused by Angular service worker intercepting `/api/docs/` navigation.

## What was done
- Added `<a href="/api/docs/" target="_blank">API Docs</a>` button to home hero (hero.html:18-20), styled with border + fg-brand colors
- Added `navigationUrls` with `!/api/docs/**` to `ngsw-config.json` to prevent the Angular service worker from intercepting Swagger URL navigations (which caused Angular router → 404)
- Simplified `ApiDocs` component: removed `environment` dependency, always use `window.location.origin + '/api/docs/'` (works in both Docker dev and production)
- Rebuilt frontend Docker image and restarted container

## Files modified
- `frontend/src/app/features/home/components/hero/hero.html` — added API Docs button
- `frontend/ngsw-config.json` — added navigationUrls exclusion for /api/docs/**
- `frontend/src/app/features/api-docs/api-docs.ts` — simplified swaggerUrl, removed unused environment import
