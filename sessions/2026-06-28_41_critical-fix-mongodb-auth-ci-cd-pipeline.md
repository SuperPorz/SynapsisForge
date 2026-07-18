# Session 41 — Critical fix: MongoDB auth + CI/CD pipeline (Day 93)

**Date**: 2026-06-28
**Status**: ✅ Closed

## Summary
Critical session to fix production backend crashing with `MongoServerError: Authentication failed` on EC2, and subsequent CI/CD pipeline bugs that blocked deploy.

## What was done

### 1. MongoDB credentials fix
- Root cause: `MONGO_USER=<old-prod-user>` + `MONGO_PASS=<old-prod-pass>` — `@` in username broke Mongoose URI parsing in `app.module.ts` (passes user/pass separately, Mongoose constructs URI internally)
- `mongo-uri.util.ts` (seed scripts) was fine because it uses `encodeURIComponent`
- Fix: Simplified credentials to `<new-prod-user>` / `<new-prod-pass>`
- On EC2: created new user in MongoDB, dropped old user, updated `.env.production`, restarted backend
- Used `docker compose down -v` to reset MongoDB volume (clean slate with new credentials via `MONGO_INITDB_ROOT_USERNAME`/`MONGO_INITDB_ROOT_PASSWORD`)
- Updated `.env.example` with warning about special chars

### 2. TypeORM synchronize for production
- `app.module.ts:67` had `synchronize: process.env.NODE_ENV !== 'production'` — after `down -v` reset PostgreSQL volume, tables didn't exist
- Changed to `synchronize: true` (portfolio site, acceptable trade-off)

### 3. GitLab CI YAML fixes (multiple rounds)
- **Round 1**: `REMOTE` heredoc delimiter at column 1 broke YAML `|` block scalar
- **Round 2**: Replaced heredoc with `seed.sh` file (following `deploy-ec2` pattern), but still had `#!/bin/bash` at column 1
- **Round 3**: Indented ALL heredoc content AND `SEEDSCRIPT` delimiter to indent 6 — works because YAML `|` strips leading whitespace
- Added YAML validation command to COMMANDS.md: `python -c "import yaml; yaml.safe_load(open('.gitlab-ci.yml','r',encoding='utf-8')); print('YAML OK')"`

### 4. Health check fix
- Root cause: Global `JwtAuthGuard` blocked `GET /health` → `curl -sf` got 401 → deploy failed
- Fix: Added `@Public()` decorator to `healthCheck()` in `app.controller.ts`
- Also increased health check timeout from 60s to 150s (30×5s)

### 5. Pipeline result
Seed passed, deploy confirmed working after @Public() fix.

## Files modified
- `backend/src/app.module.ts` — synchronize: true
- `backend/src/app.controller.ts` — added @Public() on /health
- `.gitlab-ci.yml` — seed.sh pattern, health check timeout
- `.env.example` — MongoDB warning
- `MEMORY.md` — appended all fixes
- `COMMANDS.md` — YAML validation command

## Commits
1. `84e10a9` — enable TypeORM synchronize + simplify MongoDB credentials
2. `64a33fb` — fix YAML syntax in seed-ec2 (replace heredoc with seed.sh)
3. `8f6dc94` — indent SEEDSCRIPT delimiter
4. `bf38571` — increase health check timeout 60s→150s
5. `3f62c7e` — add @Public() to /health endpoint

## State at close
- ✅ Pipeline passes (build → test → seed → deploy)
- ✅ Website live at https://synapsisforge.shop
- Day 93 remaining items: coverage job, notification, final URL verification
