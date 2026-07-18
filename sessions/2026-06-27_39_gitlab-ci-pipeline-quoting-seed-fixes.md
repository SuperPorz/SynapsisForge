# Session 39 — GitLab CI/CD pipeline quoting, seed fixes, and deploy fixes

## Changes

### `.gitlab-ci.yml` — CI/CD pipeline fixes

1. **Removed `when: always`** from deploy-ec2 — deploy now depends on seed stage success
2. **seed-ec2 / deploy-ec2**: replaced 36 fragile `echo "KEY=$VAR" >>` lines with local `cat << EOF` heredoc + `scp` to EC2
3. **seed-ec2**: added PostgreSQL volume reset (`stop`, `rm`, `volume rm`) before seeding — ensures credentials from CI variables match fresh postgres container
4. **seed-ec2**: added `typeorm schema:sync -d dist/data-source.js` before seeder — fresh postgres volume has no tables
5. **`.env.production`**: `DB_HOST`, `MONGO_URI`, `REDIS_URL` now hardcoded to Docker service names (`postgres`, `mongodb://mongodb:...`, `redis://redis:...`) instead of CI variables that pointed to EC2 hostname (containers inside Docker network can't resolve EC2 hostname)
6. **deploy-ec2**: wrote `deploy.sh` locally and `scp` to EC2 — avoids quoting hell of inline SSH commands. Variables meant for remote execution (`$i`, `$(seq)`, `${BACKEND_IMAGE}`) properly escaped with `\$`

### `backend/src/database/shared/mongo-uri.util.ts`

- Changed `process.env.MONGO_AUTH_SOURCE ?? 'admin'` → `|| 'admin'` — `??` doesn't handle empty string (only null/undefined), causing `authSource=` with empty value in URI

### `backend/src/database/seeds/` (seed.ts, reset.ts, seed-mongo-only.ts)

- `import 'dotenv/config'` → explicit `dotenv.config({ path: '.env.development' })` — loads the correct env file on all platforms

### `backend/.env.development` (local only, gitignored)

- Added `DB_USERNAME`, `DB_PASSWORD`, `DB_DATABASE` (the expected variable names; code uses these, not `DB_USER`/`DB_PASS`/`DB_NAME`)
- Fixed `MONGO_AUTH_SOURCE` inline comment

## Problems encountered & solved

| Problem | Root cause | Fix |
|---------|-----------|-----|
| Seed: password auth failed | `echo "PASS=$PASS"` inside SSH quotes — special chars mangled | Heredoc locally + scp |
| Seed: relation "categories" does not exist | Fresh postgres volume has no tables; seed uses `synchronize: false` | Added `typeorm schema:sync` before seed |
| Seed: `authSource` specified with no value | `.env.production` had `MONGO_AUTH_SOURCE=` (empty string); code used `??` instead of `||` | Default `:-admin` in CI + `||` in code |
| Seed: `getaddrinfo EAI_AGAIN` for MongoDB | `MONGO_URI` used EC2 hostname; container can't resolve hostname from inside Docker network | Hardcoded `mongodb://mongodb:27017/mongo_synapsis` in `.env.production` |
| Deploy: `syntax error near unexpected token '2'` | Variables expanded locally (GitLab runner) instead of remotely (EC2) | Wrote deploy script locally + scp |
| Local: seed/reset can't find `.env.development` | `dotenv/config` loads `.env` (CWD), not `.env.development` | Explicit `dotenv.config({ path: '.env.development' })` |
| Local: wrong variable names in `.env.development` | `DB_USER` vs `DB_USERNAME`, etc. | Added correct names to `.env.development` |
