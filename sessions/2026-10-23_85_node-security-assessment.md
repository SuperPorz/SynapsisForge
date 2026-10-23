# Node.js security assessment

2026-10-23 — Inspected Dockerfiles and AWS deployment configuration: backend runtime and frontend builder use floating `node:22-alpine`; the production frontend runs nginx. SSH access is pending the host, username, local private-key path and trusted host fingerprint. No remote changes or deployment performed.

2026-10-23 — SSH access succeeded using the supplied environment configuration and a temporary in-memory SSH agent, with strict host verification enabled and no credentials displayed. All five production containers are running; database/cache health checks pass. Backend reports Node.js v22.23.1. Baseline checks subsequently passed for `/health`, `/docs`, `/courses` and the frontend; unauthenticated `/` correctly returned 401.

2026-10-23 — OpenCVE and the official October Node.js advisory identify Node.js 22.23.4 as the patched release, including the Brotli decoder flaw and bundled Undici 6.29.1. Pinned local Dockerfiles to 22.23.4. Preparing a digest-pinned runtime-only image preserving deployed application artifacts, isolated native-module tests, rollback image and protected database backups; no production restart yet. Independent review requires backup because the deployed application enables TypeORM schema synchronization and queue registration at startup.

2026-10-23 — Candidate runtime/native checks passed and complete application content/metadata manifests match the deployed image. Protected PostgreSQL/MongoDB archives passed listing/compression checks; baseline read-only application smoke checks passed, including public HTTPS. Remote Dockerfiles are pinned for future builds. Final restart review found and prompted correction of nginx DNS handling during rollback; the corrected script passed independent review.

2026-10-23 — Backend-only security deployment passed acceptance: schema, app environment, upload volume and unrelated container identities unchanged; public API/frontend/proxy/HTTPS checks passed. Direct PostgreSQL/MongoDB/Redis connectivity passed, with no startup errors, OOM or restarts during the observed interval. Final independent evidence review passed for the scoped runtime patch, with no blocking findings. Rollback materials retained; operational details and scope limitations are in MEMORY.md.

2026-10-23 — User authorized commit/push with CI skipped and deferred development dependency updates. Read-only disk diagnosis identified MongoDB's unrotated container log as the main space consumer; no cleanup performed. Detailed findings are in MEMORY.md.

Sources: https://app.opencve.io/cve/CVE-2026-111497 and https://nodejs.org/en/blog/vulnerability/october-2026-security-releases. The current GitHub workflow includes destructive database reseeding and must not be used unchanged for a runtime-only security update.
