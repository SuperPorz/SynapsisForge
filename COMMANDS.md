# COMMANDS.md — Quick-reference CLI commands

> Both `frontend/` and `backend/` have their own `package.json`.  
> Run commands from the respective directory.

---

## Docker (full stack dev — run from repo root or `infra/`)

The entire app runs inside Docker via `infra/docker-compose-dev.yaml` (6 services).

### Lifecycle

| Command | Action | Run from |
|---------|--------|----------|
| `docker compose -f infra/docker-compose-dev.yaml up -d` | Start all services (no rebuild) | repo root |
| `docker compose -f infra/docker-compose-dev.yaml up -d --build` | Rebuild images + start | repo root |
| `docker compose -f infra/docker-compose-dev.yaml down` | Stop and remove containers | repo root |
| `docker compose -f infra/docker-compose-dev.yaml down -v` | Stop + remove volumes (⚠️ destroys DB data) | repo root |

### Rebuild after code changes (CORRECT way)

```bash
docker compose -f infra/docker-compose-dev.yaml down
docker compose -f infra/docker-compose-dev.yaml up -d --build
```

**NEVER use `docker compose restart`** — it keeps old containers with stale code.

### Verify running status

| URL | Expected | What it tests |
|-----|----------|---------------|
| `http://localhost:8080` | `200` | Frontend (via nginx) |
| `http://localhost:8080/api/docs/` | `200` | Swagger UI (via nginx → backend) |
| `http://localhost:3000/api/docs` | `200` | Backend Swagger (direct, no auth) |
| `http://localhost:3000` | `401` | Backend API (no auth → expected) |

### Container health

| Command | Action |
|---------|--------|
| `docker compose -f infra/docker-compose-dev.yaml ps` | Show container status |
| `docker compose -f infra/docker-compose-dev.yaml logs backend` | Tail backend logs |
| `docker compose -f infra/docker-compose-dev.yaml logs nginx` | Tail nginx logs |
| `docker compose -f infra/docker-compose-dev.yaml logs frontend` | Tail frontend logs |

## Frontend (`cd frontend`)

| Command | Action |
|---------|--------|
| `npm start` / `ng serve` | Start dev server (default `http://localhost:4200`) |
| `npm run build` / `ng build` | Typecheck + production build |
| `npm run test` / `ng test` | Run Vitest unit tests |
| `ng build --configuration development` | Dev build (no optimization, faster) |

> Note: When using Docker, frontend runs as a production build inside the container.
> Use `ng serve` natively only if you need hot-reload during UI work.

## Backend (`cd backend`)

| Command | Action |
|---------|--------|
| `npm run build` | Compile NestJS |
| `npm run test` | Run Jest unit tests |
| `npm run test:watch` | Run Jest in watch mode |
| `npm run test:cov` | Run Jest with coverage report |
| `npm run test:e2e` | Run end-to-end tests (Supertest) |
| `npm run lint` | ESLint with `--fix` |

> Note: When using Docker, backend runs compiled `dist/main` inside the container.
> Use `npm run start:dev` natively only if you need watch-mode debugging.

## Database seed (`cd backend`)

| Command | Action |
|---------|--------|
| `npm run db:seed` | Full seed (PostgreSQL + MongoDB) |
| `npm run db:seed:mongo` | Seed MongoDB only (quiz, explanations) |
| `npm run db:reset` | Reset and re-seed everything |
| `npm run sync-ids` | Synchronize UUIDs between PG and Mongo |

## GitHub mirror branch

Il branch `github` ha la storia ripulita (force push su GitHub). Mantiene solo infra di sviluppo.

```bash
git checkout github
git merge main
git rm --cached .gitlab-ci.yml
git rm --cached infra/docker-compose.prod.yml
git rm --cached infra/nginx/nginx.conf
git commit -m "sync from main"
git push github github:main --force
git checkout main
```

## Validazione YAML

```bash
python -c "import yaml; yaml.safe_load(open('.gitlab-ci.yml','r',encoding='utf-8')); print('YAML OK')"
```

## Useful one-liners

| Command | Action |
|---------|--------|
| `npx ng build` (from `frontend/`) | Standalone typecheck + build (without installing Angular CLI globally) |
| `npx typeorm` (from `backend/`) | TypeORM CLI (e.g., migrations) |
