# Session 64 — Day 117: GitHub publication, Woodpecker CI, email cleanup (2026-06-29)

## Summary
Completed Day 117 tasks: synced repo to GitHub with selective infra, purged sensitive email from all git history, created Woodpecker CI setup.

## What was done

### GitHub sync (selective)
- Updated `github` branch to keep only: `infra/docker-compose-dev.yaml`, `infra/nginx/docker-nginx.conf`, `infra/redis/redis.conf`, `infra/.gitignore`
- Excluded: `.gitlab-ci.yml`, `infra/docker-compose.prod.yml`, `infra/nginx/nginx.conf`
- Pushed to `github/main` with force
- Updated AGENTS.md §14 with new selective sync flow

### Sensitive email removal
- Replaced `mikybeeh@hotmail.it` → `admin@example.com` in all 5 files (users.seed.ts, seed.ts, MEMORY.md, README.md)
- Ran `git filter-repo` to rewrite all 425 commits — email purged from entire history
- Force pushed to both GitLab (origin) and GitHub (github)

### Woodpecker CI
- Created `infra/docker-compose-woodpecker.yaml` — server + agent (v3), Docker socket passthrough
- Created `infra/woodpecker.env.example` — GitHub OAuth config template
- Created `.woodpecker/build.yml` — pipeline: install, lint, test for both backend and frontend
- Updated `infra/.gitignore` for `.env.woodpecker`

### Screenshots
- User added 5 screenshots: homepage.png, player.png, instructor-dashboard.png, admin-panel.png, checkout.png
- Committed to both branches

### User pending actions
- Make GitHub repo public + add topics (https://github.com/SuperPorz/SynapsisForge/settings)
- Re-protect GitLab main branch

## Files modified
- `PLAN.md` — Day 117 marked ✅, added additional dev tasks
- `TODO.md` — cleared, pre-loaded Day 118 (interview prep)
- `AGENTS.md` — §14 updated with selective infra sync
- `README.md` — admin email updated
- `MEMORY.md` — admin email updated (2 occurrences)
- `backend/src/database/seeds/users.seed.ts` — admin email changed
- `backend/src/database/seeds/seed.ts` — console log updated
- `infra/docker-compose-woodpecker.yaml` — created
- `infra/woodpecker.env.example` — created
- `infra/.gitignore` — added `.env.woodpecker`
- `.woodpecker/build.yml` — created
- `screenshots/*.png` — 5 images added by user

## Notes
- LinkedIn post and CV tasks skipped — user handles separately
- GitLab force push required temporary unprotect of main branch
- `gh` CLI not available — repo visibility and topics need manual web UI action
