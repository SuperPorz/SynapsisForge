# Session 67 — GitHub sync restructure & CI fix

**Date:** 2026-06-30

## Summary

Restructured GitHub mirror from filtered `github` branch (filter-repo history) to direct `main` push. Created `.env.test`, migrated all secrets, fixed CI Docker login timing issue.

## Work done

### GitHub repo migration
- Deleted old GitHub repo (had `github` branch with rewritten filter-repo history)
- Created new empty GitHub repo `SuperPorz/SynapsisForge`
- Pushed local `main` directly (`git push github main`) — linear, no force push
- No more `github` branch, no more rebase/force-push sync flow

### `.env.test`
- Created in project root with all CI env vars
- Known prod values filled in, sensitive fields left empty
- Exact alphabetical order matching CI variable list

### Secrets migration
- Installed `gh` CLI (v2.95.0) via winget
- Authenticated with GitHub (`SuperPorz` account)
- Migrated all 40 secrets from `.env.production` to GitHub Actions Secrets via `gh secret set`
- Handled multiline SSH_PRIVATE_KEY via stdin pipe

### CI fix
- Docker login failing with "Username and password required" — root cause: workflow triggered by push before secrets were set
- Re-run with secrets present fixed the issue

### Verification
- Full CI pipeline green (all 9 jobs: lint, build, test, coverage, seed-ec2, deploy-ec2)
- Deploy succeeded — old version was browser cache (Ctrl+Shift+R fixed it)

### Other
- Confirmed footer/home changes from commit `4fabee7` already present: no `<p>ciao</p>`, no "API Docs", "Terms & Conditions" already correct

## Files modified
- `.env.test` — created with all CI env vars (prod known values + empty sensitve fields)
- `AGENTS.md` — §14 rewritten: removed `github` branch sync flow, replaced with direct push workflow
- `MEMORY.md` — appended GitHub sync restructure entry

## Key Decisions
- Accepted that `.gitlab-ci.yml` and `infra/nginx/nginx.conf` are visible in git history on GitHub (not in working tree tip)
- Secrets migrated from `.env.production` (single source of truth for all env vars)
- Web UI for GitHub repo management (create/delete) requires user action
