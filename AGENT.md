# AGENT.md — AI Agent Operations Manual

## 1. Project Identity

**SynapsisForge**: Online course platform.  
- **Backend**: NestJS (TypeORM + PostgreSQL, Mongoose + MongoDB)  
- **Frontend**: Angular 21 standalone components, Signals, Tailwind CSS 4  
- **Auth**: JWT (access token via header, refresh via HttpOnly cookie)  
- **Dev databases**: Docker containers with PostgreSQL, MongoDB, Redis (always running)

## 2. Agentic Files

The following files are called **"agentic files"**, **"files AGENTICI"** (uppercase for emphasis), or **"agent files"**.  
They exist **solely to manage the agentic development workflow**.

| File | Role | Language |
|------|------|----------|
| `AGENT.md` | Operations manual (this file) | **English** ✅ |
| `MEMORY.md` | Persistent memory: decisions, discoveries, patterns, technical notes | **English** |
| `SESSION_LOG.md` | Current session log: tasks done, in progress, blocked | **English** |
| `PLAN.md` | Long-term roadmap: phases, days, tasks, subtasks | **English** |
| `TODO.md` | Active daily task block pulled from PLAN.md | **English** |
| `COMMANDS.md` | Quick-reference CLI commands for both projects | **English** |

**External companion files** (not "agentic files" but must be kept in sync):

| File | Role |
|------|------|
| `C:\Users\test\Desktop\WORK\SynapsisForge.plan\progress_default.json` | Progress tracker — each task key maps to PLAN.md tasks. **Must be updated whenever PLAN.md checkboxes change** (`false` → `true`). |

### Rules for agentic files

1. **ALL agentic files must be written in English**. No exceptions.
2. The agent **must read `MEMORY.md`, `SESSION_LOG.md`, and `TODO.md` at the start of every session** to rebuild context.
3. **`MEMORY.md` is never deleted or rewritten** — only extended via append.
4. **`SESSION_LOG.md`** prepends a new dated block at each session without deleting previous logs.
5. **`PLAN.md`** is the master roadmap. Tasks are pulled from here into `TODO.md` on a daily basis.
6. **`TODO.md`** contains the active work block. When all items are done, the next block is pulled from `PLAN.md`.
7. During implementation, **`TODO.md`** may have finer-grained tasks than `PLAN.md` (more specific subtasks). The source of truth for completion is `PLAN.md`.
8. Changes to agentic files **are never committed** unless explicitly requested.

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

## 3. Workflow

1. **Read**: at session start, read `MEMORY.md`, `SESSION_LOG.md`, `TODO.md`.
2. **Analyze**: before writing code, study relevant PROGRESSO docs, `actual_plan.txt`, and involved files.
3. **Plan**: propose strategy in `SESSION_LOG.md` **before** making changes.
4. **Implement**: one task at a time; commit only on request.
5. **Verify**: after each task, run relevant lint/typecheck/test commands.
6. **Sync**: update `progress_default.json` when marking PLAN.md tasks done.
7. **Update**: update `SESSION_LOG.md` after each task; extend `MEMORY.md` if patterns, structural bugs, or important decisions are discovered.

## 4. Testing capabilities

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

## 5. Dev databases

Three Docker containers are always running in the background:

| Service | Port | Credentials |
|---------|------|-------------|
| PostgreSQL 18 | `5432` | `admin` / `qwerty` / `pg_database` |
| MongoDB | `27017` | `admin` / `qwerty` (connection name: `mongo_synapsis`) |
| Redis | `6379` | No auth (not yet integrated in code) |

Containers are defined in `infra/docker-compose.yaml`.

## 6. Relevant API endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/enrollments/:eid/lessons/:lid/video` | Video URL + quiz + progress + sections |
| PATCH | `/enrollments/:eid/lessons/:lid/progress` | Save lesson progress (position, completed, quizAnswers) |

## 7. Agent states

- 🟢 Ready: awaiting instructions
- 🔍 Analyzing: studying codebase
- ⚙️ Implementing: writing code
- 🧪 Verifying: running tests/lint
- 🔴 Blocked: needs clarification
