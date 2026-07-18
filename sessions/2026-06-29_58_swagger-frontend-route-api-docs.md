# Session 58 — Swagger frontend route + Docker rebuild (2026-06-29)

## Summary
- Added frontend route `/api-docs` with component that opens Swagger UI in new tab
- Added `/api/docs` proxy in `proxy.conf.json` (works after `ng serve` restart)
- Added "API Docs" link in footer (with `RouterLink` import)
- Fixed footer.spec.ts to provide `provideRouter([])` for `RouterLink` dep
- All 155 tests pass, build OK
- Rebuilt Docker images (`synapsis-backend:latest`, `synapsis-frontend:latest`) and restarted containers
- Verified: frontend 200, backend health OK, Swagger UI 200 at `localhost:8080/api/docs/`

## Files changed
- `frontend/src/app/features/api-docs/api-docs.ts` — new component
- `frontend/src/app/app.routes.ts` — added `/api-docs` lazy route
- `frontend/src/app/shared/components/footer/footer.ts` — added `RouterLink` import
- `frontend/src/app/shared/components/footer/footer.html` — added API Docs link
- `frontend/src/app/shared/components/footer/footer.spec.ts` — added `provideRouter([])` provider
- `frontend/proxy.conf.json` — added `/api/docs` proxy config
