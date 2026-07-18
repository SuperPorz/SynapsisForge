# AGENTS.md — AI Agent Operations Manual

## 1. Project Identity

**SynapsisForge**: Online course platform.
- **Backend**: NestJS (TypeORM + PostgreSQL, Mongoose + MongoDB)
- **Frontend**: Angular 21 standalone components, Signals, Tailwind CSS 4
- **Auth**: JWT (access token via header, refresh via HttpOnly cookie)
- **Docker compose (full stack)**: 6 services defined in `infra/docker-compose-dev.yaml` — nginx (port 8080), frontend, backend (port 3000), PostgreSQL, MongoDB, Redis. ALL services run inside Docker.

## 2. Status

**Maintenance mode**. The platform is fully developed. Work is now limited to:
- Bug fixes
- New features as needed
- Security patches
- Dependency updates

There is no phased roadmap. Tasks are given directly by the user, not loaded from PLAN.md.

## 3. Constraints & Preferences

### Platform
- Certificate PDFs are generated client-side with jspdf (real layout, not placeholder)
- Dark/light theme defaults based on time of day (dark 20:00–06:00)
- All UI must be responsive — dashboard sidebar collapses on mobile
- No `tailwind.config.js/ts` — Tailwind v4 with `@theme` block only
- Color branding leans purple/violet (`fg-brand: #6366f1`)
- All UI text must be in English (no Italian)
- `extra/` folder in frontend is gitignored and never committed

### Environment
- **OS**: Windows 11. Git Bash (MSYS2) is the shell. Paths can use forward slashes. Native Windows commands (e.g. `taskkill`) require `//F` (double slash) instead of `/F`.
- **Docker compose (full stack)**: 6 services defined in `infra/docker-compose-dev.yaml` — nginx (port 8080), frontend, backend (port 3000), PostgreSQL, MongoDB, Redis. ALL services run inside Docker.
- **Frontend**: Access via `http://localhost:8080` (nginx reverse proxy). The frontend container runs nginx serving the production Angular build.
- **Backend**: NestJS runs inside the backend container on port 3000, exposed to host as `localhost:3000` for native tooling.
- **Development workflow**: The agent manages Docker lifecycle (start/stop/rebuild) as needed. After code changes, rebuild with `docker compose up -d --build` (not `restart`).

## 4. Agentic Files

The following files are called **"agentic files"**.
They exist **solely to manage the agentic workflow**.

| File | Role | Language |
|------|------|----------|
| `AGENTS.md` | Operations manual (this file) | **English** ✅ |
| `PLAN.md` | **Archived** — original phased plan, no longer used | English |
| `TODO.md` | **Archived** — no longer used for task tracking | English |
| `sessions/` | Directory of per-session log files. Each session gets its own `.md` file named `YYYY-MM-DD_N_desc.md`. Newest sessions are listed first via naming convention (descending date + number). | English |
| `MEMORY.md` | Persistent knowledge: architectural decisions, patterns, structural bugs discovered, test data, configuration quirks. Never rewritten — only extended. | English |
| `COMMANDS.md` | Quick-reference CLI commands for both projects | English |

## 5. Rules

### General

1. **ALL agentic files must be written in English**. No exceptions.
2. **`MEMORY.md` is never deleted or rewritten** — only extended via append.
3. **`sessions/`** — each session creates a new `.md` file (never deleted or rewritten).
4. **Commit policy**: NEVER commit without asking the user for explicit permission first. Always wait for feedback. (This applies to ALL files, including agentic files.)
5. **Pushing to any remote (GitHub/GitLab) is strictly forbidden without explicit user approval.** This includes `git push`, `git push --force`, and any deploy trigger.
6. **NEVER create a second AGENTS.md file.** The single agentic operations manual is `AGENTS.md` and it must never be duplicated under any name variant. If you believe a change is needed, propose it in chat and wait for explicit authorization before modifying.
7. **`PLAN.md` and `TODO.md` are archived.** Do not read, modify, or reference them in the workflow. They remain in the repo for historical reference only.

### Directives

- Tasks are given directly by the user — there is no PLAN/TODO loading cycle.
- Always log the session in `sessions/` with what was done.
- Extend `MEMORY.md` with any new structural knowledge at session end.
- Bug fixes and design decisions are logged in the session file and `MEMORY.md`.

### Test-driven feedback rule

When working on Angular frontend code, the agent must:
1. **Write or update unit tests** for every new/modified component or service.
2. Use these tests to get **autonomous feedback** on correctness without requiring a browser.
3. **Iterate until tests pass** before considering a task done.
4. Run `npm run test` (frontend) and `npm run build` (typecheck) as the minimum verification gate.

This ensures the agent can self-validate its own work.

## 6. Session workflow

1. Read `MEMORY.md` for context.
2. Execute the task given by the user.
3. After completing the task, run relevant lint/typecheck/test commands.
4. At session end, create a session file in `sessions/` (naming: `YYYY-MM-DD_N_desc.md`).
5. Extend `MEMORY.md` with any new structural knowledge.
6. Ask for commit (never commit alone).

## 7. Subagent Management

### 7.1 Handling blocked subagents

If a subagent does not return after a reasonable time:
1. **Diagnose**: use `/sessions` in the TUI to list all active sessions and their status.
2. **Navigate**: `Leader+Down` to enter the child (subagent) session, `Right` to cycle between children, `Up` to return to the parent.
3. **Unblock**: inside the subagent session, provide additional instructions to resolve the stall. Use `/compact` if context is too long.
4. **Fallback**: if the subagent is unrecoverable, start a new session with `/new` and reassign the task.

### 7.2 Recommended TUI attention config

To avoid missing subagent completion, enable in `tui.json`:
```json
{
  "attention": {
    "enabled": true,
    "notifications": true,
    "sound": true
  }
}
```

## 8. Key Decisions

See `MEMORY.md` → "Key architectural decisions".

## 9. Testing capabilities

The agent **can run CLI-based tests autonomously**. No browser-based visual testing is available.

| Area | Command | Tool | Notes |
|------|---------|------|-------|
| Frontend unit tests | `npm run test` (in `frontend/`) | Vitest (via `@angular/build:unit-test`) | Reads `tsconfig.spec.json` |
| Frontend typecheck | `npx ng build` (in `frontend/`) | Angular compiler + TypeScript | Validates templates too |
| Backend unit tests | `npm run test` (in `backend/`) | Jest | Config in `package.json` |
| Backend e2e tests | `npm run test:e2e` (in `backend/`) | Jest + Supertest | |
| Backend lint | `npm run lint` (in `backend/`) | ESLint | |
| Backend seed | `npm run db:seed:mongo` / `npm run db:seed` | ts-node | Requires running DB containers |

See `COMMANDS.md` for full command reference.

CI pipeline (GitHub Actions): `.github/workflows/ci.yml` — runs lint, test, coverage, and build on every `git push` to `main`.

## 10. Docker stack (dev)

The full stack runs via `docker compose -f infra/docker-compose-dev.yaml`. Six services:

| Service | Image | Port (host) | Purpose |
|---------|-------|-------------|---------|
| nginx | `nginx:alpine` | `8080:80` | Reverse proxy, entry point |
| frontend | custom (Dockerfile) | — | Angular production build served by nginx |
| backend | custom (Dockerfile) | `3000:3000` | NestJS API server |
| PostgreSQL 18 | `postgres:18-alpine` | `5432` | Relational DB |
| MongoDB | `mongo:latest` | `27017` | Document DB |
| Redis | `redis:alpine` | `6379` | Cache, sessions, queues |

DB credentials: `postgres_user` / `postgres_pass` / `pg_database` (PG), `mongo_user` / `mongo_pass` (Mongo, connection name `mongo_synapsis`). Redis has no auth.

## 11. Shell Commands & Tool Usage

### Environment
- **Shell**: Git Bash (MSYS2) on Windows 11. Paths work with forward slashes.
- **Native Windows commands**: Flags must use `//` prefix (e.g. `taskkill //F //PID 1234`), not `/`.
- **Long paths**: Use 8.3 naming or quotes if spaces are present.

### Best practices
- Always use non-interactive forms of commands.
- For docker: prefer `docker exec CONTAINER COMMAND` without `-it` flags.
- For redis: use `docker exec CONTAINER redis-cli COMMAND` (never interactive shell).
- Avoid piping to processes that keep stdout open (tail -f, watch, etc.).
- When checking service health, prefer one-shot commands: `redis-cli PING`, `curl -s --max-time 5`.

### Timeout & anti-loop
- Always pass an explicit `timeout` parameter to the bash tool:
  - Quick checks (curl, ls, echo): 10–15s
  - Builds/installs (npm install, nest build): 60–120s
- If a tool call produces no output after a reasonable time, do NOT retry — move forward or re-evaluate.
- Prefer **batch operations**: read multiple files in parallel, run multiple independent commands in one call.
- Avoid sequential read/grep calls where a single batch would suffice — this prevents tool-loop patterns.

## 12. Service management

The agent manages the full Docker compose stack. Commands run from `infra/` directory.

### Start / rebuild after code changes
```bash
docker compose -f infra/docker-compose-dev.yaml down
docker compose -f infra/docker-compose-dev.yaml up -d --build
```

**CRITICAL**: Always use `down` then `up -d --build`. NEVER use `docker compose restart` — it does NOT recreate containers with new images, causing stale code to run (bug storico).

### Verify running services
```bash
curl -s -o /dev/null -w "%{http_code}" http://localhost:8080  # frontend → 200
curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/api/docs  # backend Swagger → 200
curl -s -o /dev/null -w "%{http_code}" http://localhost:3000  # backend API → 401 (no auth)
```

### Check container health
```bash
docker compose -f infra/docker-compose-dev.yaml ps
docker compose -f infra/docker-compose-dev.yaml logs backend  # tail backend logs
```

## 13. Project Structure (agentic files only)

| File | Role |
|------|------|
| `PLAN.md` | **Archived** — original phased plan |
| `TODO.md` | **Archived** — no longer used |
| `MEMORY.md` | Persistent architectural knowledge |
| `sessions/` | Directory of per-session log files |
| `COMMANDS.md` | CLI command reference |
| `AGENTS.md` | This file — operations manual |

For backend and frontend source structure, explore the codebase as needed. Key source locations evolve over time and are tracked in `MEMORY.md`.

## 14. GitHub mirror maintenance

### Purpose
The repo has two remotes with different visibility:
- **GitLab** (`origin`): private — contains everything (`.gitlab-ci.yml`, `infra/`)
- **GitHub** (`github`): public — full mirror of `main`, no filtering

The `github` branch was eliminated (2026-06-30). The repo was re-created on GitHub and `main` pushed directly. Now both remotes share the same git history.

### Sync flow (after commits on main)

```bash
git push github main
```

No force push, no rebase, no separate branch. The `.gitlab-ci.yml` and `infra/nginx/nginx.conf` files are visible in git history (old commits) on GitHub but removed from tracking at the tip.

### When to sync
- After every session close that modified tracked code
- OR when the user explicitly asks for a GitHub update
- Never automatically — always ask for confirmation

### Remote overview

| Remote | URL | Visibility | Purpose |
|--------|-----|-----------|---------|
| `origin` | `gitlab.com/superporz1/SynapsisForge` | Private | Full repo — GitLab CI/CD |
| `github` | `github.com/SuperPorz/SynapsisForge` | Public | CI/CD + deploy via GitHub Actions |

## 15. GitHub Actions CI

- **Pipeline file**: `.github/workflows/ci.yml`
- **Trigger**: automatic on `git push` to `main` or PR to `main`
- **Pipeline stages**: Build Docker images → Test (lint, unit, coverage) → Seed EC2 → Deploy EC2
- **Secrets**: stored in GitHub Encrypted Secrets (`https://github.com/SuperPorz/SynapsisForge/settings/secrets/actions`)
- **Docker Hub images**: `michelangelostega/synapsisforge-backend`, `michelangelostega/synapsisforge-frontend` (tagged with `${{ github.sha }}` + `latest`)
- **SSH deploy**: uses `webfactory/ssh-agent` + SSH private key to connect to EC2

### Dev workflow with GitHub Actions
1. Push changes to `main` (GitLab) — full repo
2. Sync `main` → GitHub (see §14) — `git push github main`
3. Monitor pipeline at `https://github.com/SuperPorz/SynapsisForge/actions`

## 16. Agent states

- 🟢 Ready: awaiting instructions
- 🔍 Analyzing: studying codebase
- ⚙️ Implementing: writing code
- 🧪 Verifying: running tests/lint
- 🔴 Blocked: needs clarification
