# Session 57 — Day 111: README — local setup & API docs

**Date**: 2026-06-29

## Summary
Completed Day 111 README enhancements: consolidated Quick Start into a 5-command copy-paste block, expanded Architecture Decisions with ADR-style prose, enhanced Swagger section with tag table, and updated Demo Accounts with seed prerequisites + UUIDs.

## Work Done
- **Quick Start — 5 commands flow**: Replaced multi-step section with a single copy-paste block (`clone`, `npm install`, `docker compose up`, `cp .env.example`, `npm run db:seed`) plus note about credential configuration
- **Architecture Decisions**: Standalone section with detailed ADRs for modular monolith, PostgreSQL+MongoDB dual DB, Redis for 4 roles (caching, rate limiting, sessions, queues). Added external reference links
- **Swagger section**: URLs now clickable links; added 8-row table describing what each Swagger tag covers (Auth, Courses, Enrollments, Payments, Cart, Certificates, Admin, Uploads)
- **Demo Accounts**: Added seed prerequisite callout, corrected instructor emails to match seed (`james.carter@synapsis.dev` etc.), added UUID table for ML course + enrollments, moved Braintree test data to sub-section, added `docker exec` command for fresh UUIDs after reseed

## Files Modified
- `README.md`

## Verification
- No build/test needed (markdown-only changes)

## Next Day Pre-loaded
- Day 112: Swagger — complete API documentation (expanded into TODO.md)
