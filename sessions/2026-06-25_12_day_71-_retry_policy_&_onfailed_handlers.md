# Session 2026-06-25 (12) — Day 71: Retry policy & onFailed handlers ✅

### Completed
- **Day 71 [MILESTONE]**: Retry policy per queue (email/certificate: 3 tries exponential; maintenance: 1 try)
- **Day 71**: `@OnWorkerEvent('failed')` added to all 4 processors (test, email, certificate, maintenance)
- **Day 71**: Complete BullMQ architecture documented in MEMORY.md (queues, processors, cron jobs, event flows, test endpoints)
- **Day 71**: One-shot verification — all queues respond, `user.registered` event fires correctly
- Phase 6 BullMQ (Days 66–71) marked ✅ in PLAN.md

### Key decisions
- Exponential backoff base delay: 2000ms (email/certificate retries at ~2s, ~4s, ~8s)
- `@OnWorkerEvent('failed')` decorator from `@nestjs/bullmq` — logs job ID, name, attemptsMade, and error message
- `removeOnComplete: 100` and `removeOnFail: 50` preserved as per-queue defaultJobOptions

