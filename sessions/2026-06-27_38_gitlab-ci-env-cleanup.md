# Session 38 — Day 92: GitLab CI/CD + Env cleanup

**Date**: 2026-06-27

## Completed

### GitLab CI/CD
- Reviewed existing GitLab remote (`origin` → gitlab.com/superporz1/SynapsisForge) — repo already created, code pushed
- Replaced placeholder `.gitlab-ci.yml` with full pipeline: build (Docker), test (lint + unit), deploy (SSH EC2)
- Deploy job: `git pull` on EC2, creates `.env.production` from CI variables, `docker compose pull && up -d`
- All 40 CI/CD variables configured on GitLab project (by user)

### Env files cleanup
- Moved env files from `backend/` + `infra/` to project root
- Created root `.env.example` (merged backend + compose vars, no real data)
- Created root `.gitignore`
- Deleted tracked `backend/.env.example` and `infra/.env.compose.example` from git
- Updated `docker-compose.yaml`/`.prod.yml` `env_file` paths
- Updated `CORS_ORIGIN` from hardcoded to variable

### DB var names standardized
- Renamed `DB_USER` → `DB_USERNAME`, `DB_PASS` → `DB_PASSWORD`, `DB_NAME` → `DB_DATABASE` everywhere
- Updated: `app.module.ts`, `data-source.ts`, `reset.ts`, `sync-ids.ts`, `env.d.ts`, compose files

### MongoDB credentials aligned with PostgreSQL
- MongoDB user/pass changed to match PostgreSQL credentials across all env files (repo + EC2)

## Pending (next session)
- Push code to GitLab `main` and verify pipeline runs
- After deploy: verify MongoDB container recreates with new credentials
