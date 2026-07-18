# Session 66 — Swagger 404 fix & UI cleanup

**Date:** 2026-06-30

## Work done (out-of-flow)

### Bug fix: Swagger UI returning 404

**Root cause:** Production nginx (external to Docker, on EC2 host) proxies `/api/` → `http://localhost:3000/` stripping the `/api` prefix. Swagger was configured at `api/docs`, so the backend received `/docs/` and returned 404.

**Fix:**
- `backend/src/main.ts`: Changed `SwaggerModule.setup('api/docs', ...)` → `SwaggerModule.setup('docs', ...)`
- `infra/nginx/docker-nginx.conf` & `infra/nginx/nginx.conf`: Added `rewrite ^/api/docs(.*)$ /docs$1 break;` in the `/api/docs` location block
- `frontend/proxy.conf.json`: Added `pathRewrite` for `ng serve` dev mode

### UI cleanup
- `frontend/src/app/features/home/home.html`: Removed leftover `<p>ciao</p>` testing element
- `frontend/src/app/shared/components/footer/footer.html`: Removed "API Docs" link (duplicated from hero CTA), renamed "Terms" → "Terms & Conditions"
