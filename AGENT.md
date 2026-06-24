# AGENT.md — AI Agent Operations Manual

## 1. Project Identity

**SynapsisForge**: Online course platform.
- **Backend**: NestJS (TypeORM + PostgreSQL, Mongoose + MongoDB)
- **Frontend**: Angular 21 standalone components, Signals, Tailwind CSS 4
- **Auth**: JWT (access token via header, refresh via HttpOnly cookie)
- **Dev databases**: Docker containers with PostgreSQL, MongoDB, Redis (always running)

## 2. Goal

Complete the remaining platform: Instructor dashboard (Day 48+), admin panels, polishing, and eventual deployment

## 3. Constraints & Preferences

- User starts frontend and backend manually in VSCode — agent must never start/stop/restart them
- Certificate PDFs are generated client-side with jspdf (real layout, not placeholder)
- Dark/light theme defaults based on time of day (dark 20:00–06:00)
- All UI must be responsive — dashboard sidebar collapses on mobile
- No `tailwind.config.js/ts` — Tailwind v4 with `@theme` block only
- frontend-design skill (`anthropics/skills@frontend-design`) installed globally
- Color branding leans purple/violet (`fg-brand: #6366f1`)
- **NEVER modify `progress_default.json`** — the user handles it manually
- All UI text must be in English (no Italian)
- `extra/` folder in frontend is gitignored and never committed

## 4. Agentic Files

The following files are called **"agentic files"**, **"files AGENTICI"** (uppercase for emphasis), or **"agent files"**.
They exist **solely to manage the agentic development workflow**.

### Purpose of each file

| File | Role | Language |
|------|------|----------|
| `AGENT.md` | Operations manual (this file) | **English** ✅ |
| `actual_plan.txt` | Immutable source of truth: phases, days, daily tasks (1:1 with the original roadmap). Never modified. | English |
| `PLAN.md` | Mirrors `actual_plan.txt` structure (phases → days → tasks). Contains ONLY development/design tasks. Bug fixes, temporary patches, and cleanup tasks are NEVER added here. | English |
| `TODO.md` | Micro-tasks for the current day's sprint. Pre-loaded from `PLAN.md` at the end of the previous session. When user declares work complete, completed items are moved to `SESSION_LOG.md` and the next day's micro-tasks are written in. | English |
| `SESSION_LOG.md` | Chronological log of each agent session. Contains ALL completed tasks (both dev tasks and bug fixes), discoveries, decisions made during the session. Prepended (newest first). | English |
| `MEMORY.md` | Persistent knowledge: architectural decisions, patterns, structural bugs discovered, test data, configuration quirks. Never rewritten — only extended. | English |
| `COMMANDS.md` | Quick-reference CLI commands for both projects | English |

**External companion files** (not "agentic files" but must be kept in sync):

| File | Role |
|------|------|
| `C:\Users\test\Desktop\WORK\SynapsisForge.plan\progress_default.json` | Progress tracker — each task key maps to PLAN.md tasks. **Must be updated whenever PLAN.md checkboxes change** (`false` → `true`). |

## 5. Rules

### General

1. **ALL agentic files must be written in English**. No exceptions.
2. The agent **must read `MEMORY.md`, `SESSION_LOG.md`, and `TODO.md` at the start of every session** to rebuild context.
3. **`MEMORY.md` is never deleted or rewritten** — only extended via append.
4. **`SESSION_LOG.md`** prepends a new dated block at each session without deleting previous logs.
5. **`PLAN.md`** is the master roadmap. Tasks are pulled from here into `TODO.md` on a daily basis.
6. **`TODO.md`** contains the active work block. When all items are done, the next block is pulled from `PLAN.md`.
7. During implementation, **`TODO.md`** may have finer-grained tasks than `PLAN.md` (more specific subtasks). The source of truth for completion is `PLAN.md`.
8. Changes to agentic files **are never committed** unless explicitly requested.
9. **Pushing to any remote (GitHub/GitLab) is strictly forbidden without explicit user approval.** This includes `git push`, `git push --force`, and any deploy trigger.
10. **Commit policy**: NEVER commit without asking the user for explicit permission first. Always wait for feedback.

### Golden rule — planning immutability

**Macro-tasks, phase structure, day assignments, and the multi-level hierarchy in `PLAN.md` must never be changed without explicit user approval.**
Subtasks within a day may be refined as needed during implementation (e.g., splitting a task into more specific subtasks in `TODO.md`).

### progress_default.json sync rule

`C:\Users\test\Desktop\WORK\SynapsisForge.plan\progress_default.json` is the binary progress tracker.
Whenever a task checkbox in `PLAN.md` transitions from unchecked (` `) to checked (`x`), the corresponding entry in `progress_default.json` must also change from `false` to `true`.

Task key format: `ph{phase}-task-{day}-{sequentialId}`
- Phase mapping: `ph0` = Phase 1, `ph1` = Phase 2, ..., `ph9` = Phase 10
- Each day has 4 sequential IDs (one per task slot)
- Example: Day 46 → keys `ph3-task-46-174` through `ph3-task-46-177`

The agent **must keep both files in sync** at all times.

### Test-driven feedback rule

When working on Angular frontend code, the agent must:
1. **Write or update unit tests** for every new/modified component or service.
2. Use these tests to get **autonomous feedback** on correctness without requiring a browser.
3. **Iterate until tests pass** before considering a task done.
4. Run `npm run test` (frontend) and `npm run build` (typecheck) as the minimum verification gate.

This ensures the agent can self-validate its own work.

## 6. Workflow

### Session lifecycle

1. **At session end (post-feedback)**: When user declares work complete, move completed TODO items to a new `SESSION_LOG.md` block. Update `PLAN.md` progress markers. Update `MEMORY.md` with any new structural knowledge. **Then pre-load `TODO.md`** with the next uncompleted day's micro-tasks (derived from its ~4 "Subtasks (actual_plan)" in `PLAN.md`).
2. **During session**: Work through `TODO.md`. Bug fixes discovered during work go directly to `SESSION_LOG.md` and `MEMORY.md` (if significant) — they are NOT added to `PLAN.md`.
3. **TODO confirmation flow**: When user says "procediamo con le prossime TODO", read the current content of `TODO.md`, show it in the chat, and ask for explicit confirmation before executing. Do NOT regenerate or modify `TODO.md` at this point — only show and wait.
4. **Safety check**: If at any point `TODO.md` is empty, inconsistent with `PLAN.md`, or otherwise problematic, do NOT modify anything. Ask the user for guidance.
5. **Significant dev tasks in PLAN**: If during TODO development you add important development work beyond the actual_plan subtasks, add them as additional subtasks under the relevant day in `PLAN.md` (with an "Additional dev tasks" sub-header). Bug fixes, temporary patches, and cleanup are NEVER added to `PLAN.md`.

### Operational steps

1. **Read**: at session start, read `MEMORY.md`, `SESSION_LOG.md`, `TODO.md`.
2. **Analyze**: before writing code, study relevant PROGRESSO docs, `actual_plan.txt`, and involved files.
3. **Plan**: propose strategy in `SESSION_LOG.md` **before** making changes.
4. **Implement**: one task at a time; commit only on request.
5. **Verify**: after each task, run relevant lint/typecheck/test commands.
6. **Sync**: update `progress_default.json` when marking PLAN.md tasks done.
7. **Update**: update `SESSION_LOG.md` after each task; extend `MEMORY.md` if patterns, structural bugs, or important decisions are discovered.

## 7. Tool Delegation & Subagent Management

### 7.1 Mandatory delegation

The primary agent must NEVER use tools directly (read, grep, glob, edit, write, bash, websearch, webfetch, question). All tool-based work MUST be delegated to subagents via the `task` tool.

Available subagents:
- `explore` — read-only code exploration (search code, find files, read contents). Use for research and analysis.
- `general` — full tool access for execution (edits, bash commands, writes). Use for implementation tasks.

### 7.2 Handling blocked subagents

If a subagent does not return after a reasonable time:
1. **Diagnose**: use `/sessions` in the TUI to list all active sessions and their status.
2. **Navigate**: `Leader+Down` to enter the child (subagent) session, `Right` to cycle between children, `Up` to return to the parent.
3. **Unblock**: inside the subagent session, provide additional instructions to resolve the stall. Use `/compact` if context is too long.
4. **Fallback**: if the subagent is unrecoverable, start a new session with `/new` and reassign the task.

### 7.3 Recommended TUI attention config

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

- `jspdf@4.2.1` for client-side PDF generation
- Certificate PDF: double border, indigo bars, student name, course title, release date, code
- Dashboard sidebar: `w-64` on desktop, bottom tab bar on mobile, hamburger + overlay for menu
- All templates use only: standard Tailwind utilities + `@theme` custom properties (`bg-fg-brand`, `text-heading`, `text-fg-muted`, `bg-surface`, `bg-surface-alt`)
- No more `bg-page`, `border-default`, `rounded-base`, `shadow-xs`, `bg-neutral-*`, `accent-brand`, `text-muted`, `text-body`, `text-fg-yellow` — all replaced with proper Tailwind classes
- `GET /courses` is the single multi-filter endpoint (supports q, category, minPrice, maxPrice, featured, page, limit)
- Category buttons: `dark:text-indigo-200` on `dark:bg-brand-softer` for readability
- Profile button in navbar: `text-fg-brand` with `hover:bg-fg-brand hover:text-white`

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

## 11. Shell Commands Guidelines

- Always use non-interactive forms of commands.
- For docker: prefer `docker exec CONTAINER COMMAND` without `-it` flags.
- For redis: use `docker exec CONTAINER redis-cli COMMAND` (never interactive shell).
- After any bash tool call, do NOT wait indefinitely — if a command takes more than 10 seconds and produces no output, assume it succeeded and proceed.
- Avoid piping to processes that keep stdout open (tail -f, watch, etc.).
- When checking service health, prefer one-shot commands: `redis-cli PING`, `curl -s --max-time 5`.

## 12. Service management

**CRITICAL: Never start, stop, or restart the Angular dev server or NestJS backend.**

The user always manages both services manually from their VSCode terminal:
- **Frontend**: `http://localhost:4200` (ng serve)
- **Backend**: `http://localhost:3000` (nest start --watch)

To verify a service is running, check its port:
```bash
curl -s -o /dev/null -w "%{http_code}" http://localhost:4200  # → 200 if running
curl -s -o /dev/null -w "%{http_code}" http://localhost:3000  # → 401 (no auth) if running
```

If a service is down, **ask the user** to start it rather than attempting to start it yourself.

## 13. Relevant API endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/enrollments/:eid/lessons/:lid/video` | Video URL + quiz + progress + sections |
| PATCH | `/enrollments/:eid/lessons/:lid/progress` | Save lesson progress (position, completed, quizAnswers) |

## 14. Relevant Files

- `actual_plan.txt`: Full roadmap (phases, days, tasks)
- `PLAN.md`: Tracked progress with detailed subtasks
- `TODO.md`: Current day's micro-tasks
- `MEMORY.md`: Persistent architectural knowledge
- `SESSION_LOG.md`: Session-by-session log
- `frontend/src/styles.css`: Tailwind v4 `@theme` + `.dark` CSS custom property overrides
- `frontend/src/app/core/services/certificate-pdf.service.ts`: jspdf certificate generator
- `frontend/src/app/core/services/theme.service.ts`: Dark/light mode with time-of-day detection
- `frontend/src/app/features/dashboard/dashboard-layout/`: Responsive sidebar + mobile bottom nav
- `frontend/src/app/shared/components/course-card/`: Restyled rating badge with dark mode contrast
- `frontend/src/app/features/courses/course-list/`: Multi-filter endpoint integration + English
- `frontend/src/app/features/courses/course-detail/`: Restyled with theme vars + English
- `frontend/src/app/features/auth/`: Login/register restyled + English
- `frontend/src/app/features/home/`: Hero auth-aware, categories link to filtered courses
- `frontend/src/app/features/dashboard/`: All sub-pages with dark mode + English
- `frontend/src/app/shared/components/navbar/`: Profile button + English + logo image
- `frontend/src/app/features/lessons/lesson-player/`: English translations
- `backend/src/modules/courses/courses.controller.ts`: Multi-filter GET /courses
- `backend/src/modules/courses/courses.service.ts`: findAll() with query builder + multi-filter
- `frontend/.gitignore`: Added `/extra`

## 15. Agent states

- 🟢 Ready: awaiting instructions
- 🔍 Analyzing: studying codebase
- ⚙️ Implementing: writing code
- 🧪 Verifying: running tests/lint
- 🔴 Blocked: needs clarification
