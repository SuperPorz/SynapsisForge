# SynapsisForge

> Enterprise-oriented full-stack e-learning platform designed to showcase advanced software engineering, backend architecture, frontend engineering, authentication systems, cloud integrations, and DevOps workflows.

[![CI/CD](https://img.shields.io/badge/CI%2FCD-GitLab-orange?logo=gitlab)](https://gitlab.com/SuperPorz/synapsisforge)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Angular](https://img.shields.io/badge/Angular-21-DD0031?logo=angular)](https://angular.dev)
[![NestJS](https://img.shields.io/badge/NestJS-11-E0234E?logo=nestjs)](https://nestjs.com)

**Live**: [https://synapsisforge.shop](https://synapsisforge.shop)  
**API**: `https://synapsisforge.shop/api`  
**Swagger**: `https://synapsisforge.shop/api/docs`  
**Bull Board**: `https://synapsisforge.shop/admin/queues` (admin only)

---

## Screenshots

| Page | Preview |
|------|---------|
| 🏠 **Homepage** — course catalog with search and filters | `screenshots/homepage.png` |
| 📖 **Course player** — video lesson with sidebar navigation and progress | `screenshots/player.png` |
| 📊 **Instructor dashboard** — analytics, enrollments over time | `screenshots/instructor-dashboard.png` |
| 🛡️ **Admin panel** — user management, platform KPIs | `screenshots/admin-panel.png` |
| 🛒 **Checkout** — Braintree Drop-in payment UI | `screenshots/checkout.png` |

> **Note**: Screenshots are stored in the `screenshots/` directory. Live demo at [synapsisforge.shop](https://synapsisforge.shop).

---

## Architecture

SynapsisForge follows a **modular monolith** pattern with a clear separation of concerns across four main layers:

```txt
┌─────────────────────────────────────────────────────────────┐
│                     Angular SPA / PWA                        │
│  Standalone components · Signals · Tailwind CSS 4            │
│  @angular/service-worker · ng2-charts                        │
│  Braintree Drop-in UI · jspdf (legacy)                       │
└─────────┬───────────────────────────────────────────────────┘
          │ HTTP (REST) · JWT Bearer · TransformInterceptor
          ▼
┌─────────────────────────────────────────────────────────────┐
│                NestJS REST API (modular monolith)             │
│  AuthModule · UsersModule · CoursesModule · LessonsModule     │
│  EnrollmentsModule · PaymentsModule · CertificatesModule      │
│  AdminModule · S3Module · CacheModule · QueuesModule          │
│  MailModule · PdfModule                                       │
│  Guards (JwtAuth · Roles · Throttler) · Interceptors · Pipes  │
└──────┬──────────┬──────────────┬─────────────────────────────┘
       │          │              │
       ▼          ▼              ▼
┌──────────┐ ┌──────────┐ ┌────────────┐
│PostgreSQL│ │ MongoDB  │ │   Redis     │
│ TypeORM  │ │ Mongoose │ │ Cache · Jobs│
│ Relational│ │ Lesson   │ │ Rate Limit  │
│ data     │ │ Content  │ │ Refresh Tkn │
│          │ │ Quizzes  │ │ Pub/Sub     │
└──────────┘ └──────────┘ └────────────┘
       │                              
       ▼                              
┌─────────────────────────────────────┐
│        AWS S3 (two buckets)          │
│  synapsisforge-media · synapsisforge-│
│  private (certificates, protected)   │
└─────────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────┐
│   Braintree / PayPal (payments)      │
│  Transactions · Subscriptions ·      │
│  Webhooks · Receipts                 │
└─────────────────────────────────────┘
```

### Key design decisions

| Decision | Rationale |
|----------|-----------|
| PostgreSQL for relational data | Users, courses, enrollments, payments, certificates — strongly relational with ACID guarantees |
| MongoDB for lesson content | Flexible schema for quizzes, video metadata, progress documents — no joins needed |
| Redis for caching & jobs | In-memory performance for course list/detail caching, rate limiting, refresh tokens, BullMQ queues |
| AWS S3 for media storage | Scalable, cost-effective object storage with presigned URL security |
| Braintree for payments | Single SDK for credit card + PayPal + subscription management |
| BullMQ for async jobs | Redis-backed reliable queueing with retry, scheduling, and monitoring via Bull Board |
| JWT + HttpOnly cookies | Access token in `Authorization` header, refresh token in HttpOnly cookie (XSS-safe); automatic rotation on refresh |
| Angular Signals + zoneless | Modern change detection without Zone.js — smaller bundles, better runtime performance |
| Tailwind CSS 4 `@theme` | CSS-first configuration via `@import "tailwindcss"` — no `tailwind.config.js` needed |
| Modular monolith (NestJS) | Single deployable with clear module boundaries (Auth, Courses, Payments, etc.) — easier DX than microservices at this scale |

---

## Tech Stack

### Frontend

- **Angular 21** — standalone components, Signals, zoneless change detection
- **Tailwind CSS 4** — `@theme` block, no config file
- **@angular/service-worker** — PWA with `ngsw-config.json`
- **ng2-charts + chart.js** — analytics dashboards
- **Braintree Drop-in** — payment UI
- **RxJS** — reactive HTTP and state management

### Backend

- **NestJS** — modular monolith with Guards, Interceptors, Pipes, Filters
- **TypeORM** — PostgreSQL entities and migrations
- **Mongoose** — MongoDB schemas for lesson content and progress
- **Passport.js** — JWT + OAuth2 (Google, GitHub) strategies
- **@nestjs/bullmq** — background job processing
- **@nestjs/throttler** — Redis-backed rate limiting
- **@nestjs/cache-manager + Keyv + Redis** — response caching
- **@aws-sdk/client-s3 + s3-request-presigner** — S3 integration
- **braintree** — payment gateway SDK
- **Nodemailer + Handlebars** — email notifications

### Databases

- **PostgreSQL 18** — Docker container (port 5432)
- **MongoDB 8** — Docker container (port 27017)
- **Redis 7** — Docker container (port 6379)

### Infrastructure & DevOps

- **Docker & Docker Compose** — multi-container orchestration
- **AWS S3** — media and certificate storage
- **Nginx** — reverse proxy with SSL termination
- **Let's Encrypt / Certbot** — HTTPS certificates
- **GitLab CI/CD** — build → test → seed → deploy pipeline
- **EC2 t2.medium** — Ubuntu production server

---

## Core Features

### Authentication System

- JWT authentication with access token (header) and refresh token (HttpOnly cookie)
- OAuth2 login via Google and GitHub
- Role-Based Access Control: `STUDENT` / `INSTRUCTOR` / `ADMIN`
- Email verification workflow
- Password reset flow

### Learning Platform

- Course catalog with advanced filtering (category, price range, search)
- Course creation wizard (sections, lessons, quizzes)
- Video lesson player with progress tracking (auto-save every 10s)
- Interactive quizzes with immediate feedback and persistence
- Certificate generation (server-side PDF, stored on S3)
- Reviews and ratings system (1-5 stars)

### Student Dashboard

- Enrolled courses with progress tracking
- Activity history (last 10 completed lessons)
- Certificate management and download
- Payment history with receipt PDFs
- Profile editing (avatar, bio)
- Subscription management (Premium plan)

### Instructor Dashboard

- Course management (create, edit, publish)
- Analytics: enrollments over time, watch time per lesson
- Lesson editor with video upload (presigned S3 URL)
- Quiz builder
- Revenue overview

### Admin Panel

- Platform KPIs (users, courses, revenue charts)
- User management (role change, suspend/activate)
- Course moderation (approve / reject pending courses)
- Bull Board for job queue monitoring

### Payments (Braintree)

- Single course purchase (credit card + PayPal)
- Shopping cart with multi-item checkout
- Monthly subscription (Premium plan)
- Webhook handling (charge success, failure, past due, cancel)
- Receipt PDF generation via BullMQ
- Payment history with pagination

### Redis Integration

- Course list/detail caching (5-10 min TTL)
- Rate limiting (differentiated per endpoint)
- Refresh token storage
- BullMQ job queues (email, certificates, receipts, maintenance)
- Pub/Sub enrollment counters
- Cache invalidation via `CacheService`

---

## Prerequisites

### Development

| Tool | Version | Notes |
|------|---------|-------|
| Node.js | 22+ | Required for both frontend and backend |
| npm | 10+ | Comes with Node.js |
| Docker | 24+ | For PostgreSQL, MongoDB, Redis containers |
| Git | 2.40+ | Version control |
| AWS CLI | 2.x | Only if managing S3 buckets |

### Environment variables (backend)

Copy `backend/.env.example` to `backend/.env` and fill in:

```
# Database
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=admin
DB_PASSWORD=qwerty
DB_DATABASE=pg_database

MONGODB_URI=mongodb://admin:qwerty@localhost:27017/mongo_synapsis
REDIS_URL=redis://localhost:6379

# JWT
JWT_ACCESS_SECRET=your-access-secret
JWT_REFRESH_SECRET=your-refresh-secret
JWT_ACCESS_EXPIRES_IN=2h
JWT_REFRESH_EXPIRES_IN=7d

# AWS S3 (optional — USE_S3=false for local dev)
USE_S3=false
AWS_REGION=eu-south-1
AWS_ACCESS_KEY_ID=your-key
AWS_SECRET_ACCESS_KEY=your-secret
S3_MEDIA_BUCKET=synapsisforge-media
S3_PRIVATE_BUCKET=synapsisforge-private

# Braintree (sandbox)
BRAINTREE_ENVIRONMENT=sandbox
BRAINTREE_MERCHANT_ID=your-merchant-id
BRAINTREE_PUBLIC_KEY=your-public-key
BRAINTREE_PRIVATE_KEY=your-private-key

# Email (SMTP)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email
SMTP_PASS=your-app-password
```

### Docker containers

Three containers are always required for development:

```bash
docker compose -f infra/docker-compose.yaml up -d
```

| Service | Port | Credentials |
|---------|------|-------------|
| PostgreSQL 18 | 5432 | `admin` / `qwerty` / `pg_database` |
| MongoDB 8 | 27017 | `admin` / `qwerty` (connection: `mongo_synapsis`) |
| Redis 7 | 6379 | No auth |

---

## Deployment

### Architecture (production)

```txt
                         User
                          │
                          ▼
                  ┌───────────────┐
                  │   Cloudflare   │
                  │  DNS → EC2 IP  │
                  └───────┬───────┘
                          │ HTTPS (443)
                          ▼
                  ┌───────────────┐
                  │    Nginx       │
                  │ Reverse Proxy  │
                  │ SSL (Certbot)  │
                  └───┬───────┬───┘
                      │       │
              /api/*  │       │  /* (static)
                      ▼       ▼
              ┌──────────┐ ┌──────────┐
              │  NestJS   │ │  Angular │
              │  :3000    │ │  (nginx  │
              │           │ │  serves) │
              └──┬────┬───┘ └──────────┘
                 │    │
          ┌──────┘    └──────┐
          ▼                   ▼
   ┌──────────┐        ┌──────────┐
   │PostgreSQL│        │ MongoDB  │
   │    :5432 │        │  :27017  │
   └──────────┘        └──────────┘
          │
          ▼
   ┌──────────┐
   │  Redis   │
   │  :6379   │
   └──────────┘
```

### Docker images

- **Backend**: `infra-backend:latest` — Node 22 Alpine, multi-stage build (builder → runner), 578MB
- **Frontend**: `infra-frontend:latest` — Node 22 Alpine builder + nginx:alpine, 95.6MB

### Production server (EC2)

1. SSH into EC2 instance
2. Clone the repository
3. Create `.env.production` with production values
4. Run:
```bash
docker compose -f docker-compose.prod.yml up -d
```

### CI/CD pipeline (GitLab)

The `.gitlab-ci.yml` defines 4 stages:

```
build → test → seed → deploy
```

- **build**: Builds Docker images and pushes to GitLab registry
- **test**: Runs `npm run test:cov` on backend
- **seed**: SSH to EC2, pulls images, resets DB volumes, runs schema sync + seeder
- **deploy**: SSH to EC2, runs `docker compose up -d` with production compose file

Pipeline runs on every push to `main`. The `deploy` stage only runs if all previous stages succeed.

**CI/CD variables required**:
- `EC2_HOST`, `EC2_USER`, `EC2_SSH_KEY` — SSH connection
- `DOCKER_COMPOSE_PROD` — base64-encoded production compose file
- `ENV_PRODUCTION` — base64-encoded `.env.production`
- `CI_REGISTRY_IMAGE` — auto-populated by GitLab

### HTTPS

SSL certificate managed via Certbot + Let's Encrypt on EC2, auto-renewal via cron.

---

## Demo Accounts

All accounts share the same password: `Password123!`

| Role | Email | Purpose |
|------|-------|---------|
| 🧑‍🏫 Student | `alice@example.com` | Browse courses, enroll, take quizzes, view certificates |
| 🧑‍🏫 Student | `bob@example.com` | Same as Alice (alternative account) |
| 👨‍🏫 Instructor | `mike@example.com` | Create and manage courses, view analytics |
| 👨‍🏫 Instructor | `jessica@example.com` | Same as Mike (alternative account) |
| 🛡️ Admin | `admin@example.com` | Full admin access: user management, course moderation, Bull Board |

### Key test data

- **Machine Learning course** (UUID: `01b236bc-7456-4380-80bc-0c47fd7566bf`)
  - Alice is enrolled and partially completed
  - Enrollment UUID: `163eb40f-d8ff-4abf-b50a-6672b052cdd2`
- **Braintree test nonce**: `fake-valid-nonce`
- **Braintree test cards**: `4111111111111111` (Visa), `4000111111111115` (declined)

---

## Quick Start (Local Development)

### 1. Clone and install

```bash
git clone https://github.com/SuperPorz/SynapsisForge.git
cd SynapsisForge

# Backend
cd backend && npm install && cd ..

# Frontend
cd frontend && npm install && cd ..
```

### 2. Start infrastructure

```bash
docker compose -f infra/docker-compose.yaml up -d
```

### 3. Seed database

```bash
cd backend && npm run db:seed && cd ..
```

### 4. Start services

```bash
# Backend (terminal 1)
cd backend && npm run start:dev

# Frontend (terminal 2)
cd frontend && ng serve
```

Backend: `http://localhost:3000`  
Frontend: `http://localhost:4200`  
Swagger: `http://localhost:3000/api/docs`

---

## Redis Caching Strategy

Full documentation: [`backend/docs/CACHING.md`](backend/docs/CACHING.md)

| Layer | Technology | TTL | Purpose |
|-------|-----------|-----|---------|
| Course lists | Redis (Keyv) | 5 min | Paginated course queries |
| Course detail | Redis (Keyv) | 10 min | Single course by ID/slug |
| Rate limiting | Redis (custom store) | window-based | Per-endpoint throttling |
| Refresh tokens | Redis (Keyv) | matches JWT | Session storage |
| Enrollment counters | Redis Pub/Sub | persistent | Real-time count via Pub/Sub + SQL fallback |

### Performance Benchmark

Results from `autocannon` (30s, 10 concurrent connections, local environment).

**`GET /courses?page=1&limit=10`**

| Metric | Without Cache | With Cache |
|--------|:------------:|:----------:|
| Avg Latency | 8.26 ms | 8.12 ms |
| Avg Req/s | 1,145 | 1,166 |

**`GET /courses/slug/:slug`**

| Metric | Without Cache | With Cache |
|--------|:------------:|:----------:|
| Avg Latency | 3.88 ms | 3.87 ms |
| Avg Req/s | 2,304 | 2,310 |

---

## API Documentation

Swagger is available at:
- Development: `http://localhost:3000/api/docs`
- Production: `https://synapsisforge.shop/api/docs`

---

## Project Structure

```bash
SynapsisForge/
├── backend/                # NestJS REST API
│   ├── src/
│   │   ├── common/         # Entities, DTOs, decorators, guards
│   │   └── modules/        # Feature modules (auth, courses, payments, etc.)
│   ├── uploads/            # Local file storage (dev only)
│   └── package.json
├── frontend/               # Angular SPA
│   ├── src/
│   │   ├── app/
│   │   │   ├── core/       # Services, guards, interceptors
│   │   │   ├── features/   # Pages and feature components
│   │   │   └── shared/     # Shared components, pipes, directives
│   │   └── environments/   # Environment configs
│   └── package.json
├── screenshots/            # Screenshot gallery images
├── infra/                  # Infrastructure
│   ├── docker-compose.yaml # Dev containers (PG, Mongo, Redis)
│   ├── nginx/              # Nginx reverse proxy config
│   └── redis/              # Custom Redis config
├── .gitlab-ci.yml          # CI/CD pipeline
└── README.md
```

---

## Security

- JWT authentication with access/refresh token rotation
- Password hashing with bcrypt
- Helmet security headers with custom CSP for Swagger
- CORS restrictions
- Rate limiting (Redis-backed, differentiated per endpoint)
- RBAC guards on all protected endpoints
- Input validation with class-validator pipes
- Presigned S3 URLs (no public bucket access)

---

## Testing

| Area | Command | Tool |
|------|---------|------|
| Backend unit tests | `npm run test` (in `backend/`) | Jest |
| Backend e2e tests | `npm run test:e2e` (in `backend/`) | Jest + Supertest |
| Frontend unit tests | `npm run test` (in `frontend/`) | Vitest |
| Frontend build check | `npx ng build` (in `frontend/`) | Angular compiler |
| Backend lint | `npm run lint` (in `backend/`) | ESLint |

---

## Learning Goals

This project was designed to strengthen advanced skills in:

- Enterprise backend architecture (NestJS modular monolith)
- Angular ecosystem engineering (standalone, Signals, zoneless)
- Authentication & authorization systems (JWT, OAuth2, RBAC)
- Relational vs NoSQL database design (PostgreSQL + MongoDB)
- Caching and performance optimization (Redis)
- Background job processing (BullMQ)
- Cloud object storage (AWS S3)
- Payment gateway integration (Braintree)
- Containerization and orchestration (Docker)
- CI/CD pipeline automation (GitLab)
- SSL/HTTPS configuration (Let's Encrypt, Nginx)

---

## License

MIT License

---

## Author

**Michelangelo Stega** (SuperPorz) — aspiring full-stack software developer.

- GitHub: [@SuperPorz](https://github.com/SuperPorz)
- LinkedIn: [michelangelo-stega](https://linkedin.com/in/michelangelo-stega)
