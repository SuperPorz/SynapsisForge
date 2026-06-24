# AGENT.md — AI Agent Operations Manual

## 1. Project Identity

**SynapsisForge**: Online course platform.
- **Backend**: NestJS (TypeORM + PostgreSQL, Mongoose + MongoDB)
- **Frontend**: Angular 21 standalone components, Signals, Tailwind CSS 4
- **Auth**: JWT (access token via header, refresh via HttpOnly cookie)
- **Dev databases**: Docker containers with PostgreSQL, MongoDB, Redis (always running)

## 2. Goal

Complete the SynapsisForge platform phase by phase following `PLAN.md`. The current phase and day are tracked in `TODO.md`.

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
- **Docker**: Three containers always running (PostgreSQL, MongoDB, Redis). Defined in `infra/docker-compose.yaml`.
- **Services**: The user manually starts Angular dev server (`localhost:4200`) and NestJS backend (`localhost:3000`) in VSCode. Do NOT start/stop them for normal development.
- **One-shot test exception**: For quick verification (e.g. curl an endpoint after a change), you may temporarily start the backend with `npx nest start &`, wait for `Nest application successfully started`, run the test, then **kill the process immediately** with `taskkill //F //PID <pid>`. Never leave services running after the test.

## 4. Agentic Files

The following files are called **"agentic files"**, **"files AGENTICI"** (uppercase for emphasis), or **"agent files"**.
They exist **solely to manage the agentic development workflow**.

### Purpose of each file

| File | Role | Language |
|------|------|----------|
| `AGENT.md` | Operations manual (this file) | **English** ✅ |
| `actual_plan.txt` | Immutable source of truth: phases, days, daily tasks (1:1 with the original roadmap). Never modified. | English |
| `PLAN.md` | Mirrors `actual_plan.txt` structure (phases → days → tasks). Contains ONLY development/design tasks. Bug fixes, temporary patches, and cleanup tasks are NEVER added here. | English |
| `TODO.md` | Micro-tasks for the current day's sprint. Pre-loaded from `PLAN.md` at end-flow (expanded via §6.4). Completed items are removed at end-flow; only pending items remain during execution. | English |
| `SESSION_LOG.md` | Chronological log of each agent session. Contains ALL completed tasks (both dev tasks and bug fixes), discoveries, decisions made during the session. Prepended (newest first). | English |
| `MEMORY.md` | Persistent knowledge: architectural decisions, patterns, structural bugs discovered, test data, configuration quirks. Never rewritten — only extended. | English |
| `COMMANDS.md` | Quick-reference CLI commands for both projects | English |

## 5. Rules

### General

1. **ALL agentic files must be written in English**. No exceptions.
2. **`MEMORY.md` is never deleted or rewritten** — only extended via append.
3. **`SESSION_LOG.md`** prepends a new dated block at each session without deleting previous logs.
4. **Commit policy**: NEVER commit without asking the user for explicit permission first. Always wait for feedback. (This applies to ALL files, including agentic files — you may modify them during the workflow lifecycle, but committing requires permission.)
5. **Pushing to any remote (GitHub/GitLab) is strictly forbidden without explicit user approval.** This includes `git push`, `git push --force`, and any deploy trigger.
6. **NEVER create a second AGENT.md or AGENTS.md file.** The single agentic operations manual is `AGENT.md` and it must never be duplicated under any name variant. If you believe a change is needed, propose it in chat and wait for explicit authorization before modifying.

### Refusal rules

When the user asks something that conflicts with the defined workflow, apply these rules in order:

1. **Plan modification** (Golden rule): If the user asks to change macro-tasks, phase structure, day assignments, or the multi-level hierarchy in `PLAN.md` without explicit approval, refuse and cite the Golden rule. Propose the change as a discussion instead.
2. **Out-of-flow work**: If the user asks to work on something unrelated to the current TODO, ask: "This deviates from the current TODO flow. Proceed anyway?" If confirmed, execute but log the deviation in `SESSION_LOG.md`.
3. **Ambiguous command**: If the user gives an instruction that doesn't match any entry point (§6.1) and isn't clearly a direct request, ask for clarification before acting.

### Golden rule — planning immutability

**Macro-tasks, phase structure, day assignments, and the multi-level hierarchy in `PLAN.md` must never be changed without explicit user approval.**
Subtasks within a day may be refined as needed during implementation (e.g., splitting a task into more specific subtasks in `TODO.md`).

### Test-driven feedback rule

When working on Angular frontend code, the agent must:
1. **Write or update unit tests** for every new/modified component or service.
2. Use these tests to get **autonomous feedback** on correctness without requiring a browser.
3. **Iterate until tests pass** before considering a task done.
4. Run `npm run test` (frontend) and `npm run build` (typecheck) as the minimum verification gate.

This ensures the agent can self-validate its own work.

## 6. Workflow

### 6.1 Entry points

Two verbal triggers map to distinct lifecycle phases:

| User says… | Meaning | Action |
|------------|---------|--------|
| "procedi con TODO", "procediamo", "procedi" | Start session / continue working | Run **Start-flow** (§6.2) |
| "sessione chiusa", "lavoro completato", "TODO completate", "fine della sessione" | Close session | Run **End-flow** (§6.3) |

**Mid-session guard**: If the agent is already executing TODO items, the "procedi" trigger is ignored (no-op). It is only meaningful at session boundaries.

### 6.2 Start-flow ("procedi con TODO")

1. **Read** `TODO.md`, `SESSION_LOG.md`, `MEMORY.md`.
2. **Check if TODO is empty**:
   - If **empty** → jump to step 4 (load next day).
   - If **not empty** → check each item against `SESSION_LOG.md` and `MEMORY.md` to see if already completed in a prior session.
3. **Dispatch**:
   - **All items are already completed** → go to step 4 (load next day).
   - **Some items completed + some pending (mixed state)** → leave completed items in TODO (they will be cleaned up by End-flow). Execute the pending items now (step 5).
   - **All items are pending** → execute them now (step 5).
4. **Load next day from PLAN**:
   a. Find in `PLAN.md` the first day marked ⬜ (not yet started).
   b. Read its ~4 "Subtasks (actual_plan)".
   c. **Expand** each subtask into 2–4 actionable checkbox items (see §6.4 Expansion rule).
   d. Write the expanded items into `TODO.md`.
   e. Show the new TODO in chat and **ask for confirmation** before executing.
5. **Execute**: work through TODO items one by one. During execution:
   - Bug fixes → log in `SESSION_LOG.md` and `MEMORY.md`; do NOT add to `PLAN.md`.
   - Significant new dev tasks beyond PLAN subtasks → add as "Additional dev tasks" in `PLAN.md` under the current day.
   - After each item, run relevant lint/typecheck/test commands.

### 6.3 End-flow ("sessione chiusa" / "TODO completate")

1. **Review** which TODO items are completed (across any session — check `SESSION_LOG.md` if unsure).
2. **Update PLAN.md**:
   - Mark the corresponding day's subtasks as `[x]`.
   - Change the day header from ⬜ to ✅.
3. **Remove** all completed items from `TODO.md` entirely.
4. **Prepend** a new dated block to `SESSION_LOG.md` with the session summary.
5. **Extend** `MEMORY.md` with any new structural knowledge.
6. **Pre-load next day**:
   a. Find in `PLAN.md` the first day still marked ⬜.
   b. Read its ~4 "Subtasks (actual_plan)".
   c. **Expand** each subtask into 2–4 actionable items (see §6.4).
   d. Write expanded items into `TODO.md`.
   (No confirmation needed — the new TODO will be visible at next session start.)

### 6.4 Expansion rule (PLAN subtask → TODO items)

Convert each PLAN subtask into concrete, single-action checkboxes:

- Each checkbox must correspond to **one file to create/modify**, **one command to run**, or **one test/verification to perform**.
- If in doubt, err on the side of more granularity (2–4 items per PLAN subtask).

**Examples:**

| PLAN subtask | Expanded TODO items |
|---|---|
| `Install @nestjs/bullmq + bullmq` | `[ ] npm install @nestjs/bullmq bullmq` `[ ] Verify packages in package.json` |
| `Create modules/queues/ with queue + processor` | `[ ] Create queues.module.ts with BullModule.forRootAsync + registerQueue` `[ ] Create queues.processor.ts with WorkerHost` `[ ] Create queues.controller.ts with GET endpoints` `[ ] Import QueuesModule in AppModule` `[ ] Build and verify` |
| `Configure MailerModule with SMTP` | `[ ] Install @nestjs-modules/mailer nodemailer handlebars` `[ ] Add SMTP config to MailerModule (Gmail app password)` `[ ] Add SMTP env vars to .env` |

### 6.5 Safety checks

- If `TODO.md` is empty during a start-flow and no next ⬜ day exists in `PLAN.md`, ask the user for guidance.
- If `TODO.md` content is inconsistent with `PLAN.md` (e.g. wrong day number), ask before modifying.
- Never create agentic files (`AGENT.md`, `AGENTS.md`, `SESSION_LOG.md`, `TODO.md`, `MEMORY.md`, `PLAN.md`) without explicit user permission — propose changes in chat first.

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

## 10. Dev databases

Three Docker containers are always running in the background:

| Service | Port | Credentials |
|---------|------|-------------|
| PostgreSQL 18 | `5432` | `admin` / `qwerty` / `pg_database` |
| MongoDB | `27017` | `admin` / `qwerty` (connection name: `mongo_synapsis`) |
| Redis | `6379` | No auth (integrated: caching, rate limiting, refresh tokens, Pub/Sub enrollment counters, monitoring via RedisInsight) |

Containers are defined in `infra/docker-compose.yaml`.

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

The user starts Angular dev server and NestJS backend manually in VSCode:
- **Frontend**: `http://localhost:4200` (ng serve)
- **Backend**: `http://localhost:3000` (nest start --watch)

To verify a service is running, check its port:
```bash
curl -s -o /dev/null -w "%{http_code}" http://localhost:4200  # → 200 if running
curl -s -o /dev/null -w "%{http_code}" http://localhost:3000  # → 401 (no auth) if running
```

If a service is down for normal development, **ask the user** to start it.
For one-shot test verification, see §3 (Environment → One-shot test exception).

## 13. Project Structure (agentic files only)

| File | Role |
|------|------|
| `actual_plan.txt` | Immutable roadmap (never modified) |
| `PLAN.md` | Tracked progress, phases → days → subtasks |
| `TODO.md` | Current day's micro-tasks |
| `MEMORY.md` | Persistent architectural knowledge |
| `SESSION_LOG.md` | Session-by-session log |
| `COMMANDS.md` | CLI command reference |
| `AGENT.md` | This file — operations manual |

For backend and frontend source structure, explore the codebase as needed. Key source locations evolve across phases and are tracked in `MEMORY.md`.

## 14. Agent states

- 🟢 Ready: awaiting instructions
- 🔍 Analyzing: studying codebase
- ⚙️ Implementing: writing code
- 🧪 Verifying: running tests/lint
- 🔴 Blocked: needs clarification
