# Session 38 — Remove entrypoint.sh, fix browser compose

**Date**: 2026-06-27
**State**: ✅ Complete

## Summary

### 1. Removed entrypoint.sh (unnecessary complexity)

The previous session added `backend/entrypoint.sh` with DB wait-loops + auto-seeding, and changed `backend/Dockerfile` from `CMD ["node", "dist/main"]` to `ENTRYPOINT ["./entrypoint.sh"]`.

**Problem**: Production `docker-compose.prod.yml` doesn't use an entrypoint — it relies on:
- Docker Compose health checks (`depends_on: condition: service_healthy`) for DB readiness
- A separate `seeder` service for database seeding

The entrypoint script was redundant and added unnecessary startup complexity.

**Fix**:
- Reverted `backend/Dockerfile` back to `CMD ["node", "dist/main"]`
- Deleted `backend/entrypoint.sh`

### 2. Updated browser testing compose

- Replaced Chrome with Opera in `infra/docker-compose.browsers.yaml`
- Updated VNC port mapping comment to reflect Opera on 5901

## Files

| File | Change |
|------|--------|
| `backend/Dockerfile` | Removed `RUN apk add curl`, `COPY entrypoint.sh`, `RUN chmod +x`, `ENTRYPOINT` — back to `CMD ["node", "dist/main"]` |
| `backend/entrypoint.sh` | Deleted |
| `infra/docker-compose.browsers.yaml` | `chrome` service → `opera`, updated header comments |
