# Session 2026-06-24 — Day 56: Redis data structures & CLI ✅

### Day 56 subtasks completed
- Study 5 Redis data structures (string, hash, list, set, sorted set) — *already done pre-session*
- Connect to Redis container with redis-cli — `PONG` confirmed, server Redis 8.6.2, 0 keys
- Define key naming conventions for the project — format `sf:<namespace>:<entity>[:<id>][:<subfield>]`, 5 namespaces (cache, rate, session, lock, queue), documented in MEMORY.md
- Understand DEL vs UNLINK difference — *already done pre-session*

### Shell Commands Guidelines
- Added §11 to AGENTS.md: rules for non-interactive commands, docker/redis exec patterns, 10s timeout assumption, one-shot health checks

### Key decisions
- Redis key prefix: `sf` (SynapsisForge)
- All keys must have TTL except ephemeral queues
- Locks must use `SET NX PX` atomic pattern

---

