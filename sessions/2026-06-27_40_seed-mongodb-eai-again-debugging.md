# Session 40 — Seed MongoDB EAI_AGAIN debugging (Day 93)

**Date**: 2026-06-27
**State**: 🔴 Still failing — `docker run` fix pushed pending pipeline

## Problem

`getaddrinfo EAI_AGAIN 1990_superporz` during `seed-ec2` GitLab CI job, persisting across 4+ pipeline runs despite multiple attempted fixes.

## Attempted fixes that FAILED

1. **Session 39**: Hardcoded `MONGO_URI=mongodb://mongodb:27017/mongo_synapsis` in `.gitlab-ci.yml` heredoc → Still failed (same error)
2. **Session 40 Fix 1**: Added `docker pull` before seeder → Still failed
3. **Session 40 Fix 2**: Added `MONGO_URI: ${MONGO_URI}` to seeder's `environment:` in `docker-compose.prod.yml` → PROBABLY MADE THINGS WORSE by exposing to host shell env override
4. **Session 40 Fix 2 v2**: Hardcoded `MONGO_URI: mongodb://mongodb:27017/mongo_synapsis` (no `${}` substitution) in `docker-compose.prod.yml` → Not applied to EC2 yet (compose file updated by deploy stage, not seed stage)
5. **Session 40 Fix 3**: Guarded `dotenv.config()` with `NODE_ENV !== 'production'` → Still failed
6. **Session 40 Fix 4**: Added `-e MONGO_URI=...` to `docker compose run` command → Still failed! (Docker Compose `-e` flag apparently doesn't override `env_file:`, or host env leaks through)
7. **Session 40 Fix 5**: Added `node -e` diagnostic to print MONGO_URI from container → Syntax error: inner double quotes broke SSH quoting, `$MONGO_URI` expanded by local shell

## Current approach

Switched from `docker compose run` to raw `docker run --env-file ... -e MONGO_URI=...`:

```bash
docker run --rm --network infra_default \
  --env-file ~/SynapsisForge/.env.production \
  -e MONGO_URI=mongodb://mongodb:27017/mongo_synapsis \
  michelangelostega/synapsisforge-backend:latest \
  node dist/database/seeds/seed.js
```

This bypasses ALL Docker Compose env processing:
- No `environment:` section → no `${VAR}` substitution
- No `env_file:` → no path resolution issues
- No `--env-file` for compose → no substitution
- Only Docker Engine `--env-file` + `-e` override (well-defined priority)

Diagnostic also added: `grep '^MONGO_URI='` on the file + `node -e` (using single quotes to avoid inner quote breakage).

## Key learnings

1. `docker compose run -e` does NOT reliably override `env_file:` values (at least not in the version on EC2)
2. Shell env vars on EC2 host may leak into Docker Compose variable substitution
3. `env_file: ../.env.production` path resolution may load wrong file (`~/.env.production` instead of `~/SynapsisForge/.env.production`)
4. Inside SSH double-quoted strings: use `\"` for inner double quotes, or switch to single quotes for `node -e` arguments
5. The `node -e 'console.log("MONGO_URI=" + process.env.MONGO_URI)'` pattern works: no `$` means no shell expansion, single quotes inside outer double quotes keep shell safe
