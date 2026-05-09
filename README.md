# SynapsisForge

> Full-stack e-learning platform progettata per dimostrare competenze avanzate in backend architecture, frontend engineering, authentication systems, cloud integration e DevOps.

## Overview

**SynapsisForge** è una piattaforma LMS (Learning Management System) moderna costruita con un’architettura enterprise-oriented basata su:

* **Frontend:** Angular 18 + Tailwind + PWA
* **Backend:** NestJS + TypeScript
* **Database:** PostgreSQL + MongoDB + Redis
* **Authentication:** JWT + OAuth2 + RBAC
* **Cloud & Infrastructure:** AWS S3 + Docker + CI/CD
* **Payments:** Braintree / PayPal

Il progetto nasce come portfolio project avanzato con focus su:

* clean architecture
* modular backend design
* scalable APIs
* authentication flows
* distributed services
* production-ready patterns

---

# Tech Stack

## Frontend

* Angular 18
* TypeScript
* TailwindCSS
* Angular Signals
* RxJS
* Angular PWA
* Angular Material
* ng-charts

## Backend

* NestJS
* Node.js 20
* TypeScript
* TypeORM
* Mongoose
* Passport.js
* JWT Authentication
* Swagger/OpenAPI

## Databases

* PostgreSQL
* MongoDB
* Redis
* BullMQ

## DevOps & Cloud

* Docker & Docker Compose
* AWS S3
* GitLab CI/CD
* Nginx (planned)
* HTTPS / Security Headers

## Payments & Auth

* Braintree
* PayPal
* OAuth2 Google
* OAuth2 GitHub
* RBAC Authorization

---

# Core Features

## Authentication System

* JWT Access & Refresh Tokens
* OAuth2 Login (Google/GitHub)
* Role-Based Access Control (Student / Instructor / Admin)
* Email verification
* Password reset flow
* Secure HttpOnly cookies

## Course Platform

* Course catalog with filters & search
* Course creation dashboard
* Video lessons
* Interactive quizzes
* Progress tracking
* Certificates generation
* Reviews & ratings

## Student Dashboard

* Enrolled courses
* Progress monitoring
* Course history
* Certificates section

## Instructor Dashboard

* Course management
* Analytics dashboard
* Lesson builder
* Quiz editor
* Video upload flow

## Admin Panel

* User management
* Course moderation
* Revenue analytics
* Global platform statistics

## PWA Support

* Offline support
* Service Worker caching
* Installable web app
* Mobile-first experience

---

# Architecture

```txt
Angular SPA/PWA
       │
       ▼
NestJS REST API
       │
 ┌───────────────┬───────────────┬───────────────┐
 ▼               ▼               ▼
PostgreSQL     MongoDB         Redis
(Relational)   (Lesson Data)   (Cache/Jobs)
       │
       ▼
AWS S3 Storage
       │
       ▼
Braintree / PayPal
```

---

# Database Strategy

## PostgreSQL

Used for:

* users
* courses
* enrollments
* payments
* certificates
* reviews
* categories

## MongoDB

Used for:

* lesson content
* quizzes
* transcripts
* flexible media structures

## Redis

Used for:

* caching
* queues
* background jobs
* throttling
* session-related workflows

---

# Security

* JWT authentication
* Refresh token rotation
* Password hashing with bcrypt
* Global validation pipes
* Helmet security headers
* CORS restrictions
* Rate limiting
* RBAC Guards
* DTO validation
* Exception filters

---

# Project Structure

```bash
SynapsisForge/
│
├── backend/
│   ├── src/
│   ├── modules/
│   ├── auth/
│   ├── users/
│   ├── courses/
│   └── ...
│
├── frontend/
│   ├── src/
│   ├── app/
│   ├── pages/
│   ├── shared/
│   └── ...
│
├── infra/
│   ├── docker-compose.yml
│   └── ...
│
└── docs/
    ├── API_SPEC.md
    └── architecture/
```

---

# Planned Features

* Signed AWS S3 URLs
* Background processing with BullMQ
* Video transcoding pipeline
* Real-time notifications
* Advanced analytics
* Dockerized production deployment
* CI/CD automation
* E2E testing
* Monitoring & logging stack

---

# Development Roadmap

| Phase | Description                    |
| ----- | ------------------------------ |
| 01    | Setup, TypeScript & Databases  |
| 02    | NestJS Core Architecture       |
| 03    | Authentication & RBAC          |
| 04    | Angular Frontend & PWA         |
| 05    | Payments Integration           |
| 06    | Redis & Background Jobs        |
| 07    | AWS S3 & Upload System         |
| 08    | Security & Optimization        |
| 09    | Docker & CI/CD                 |
| 10    | Testing & Production Readiness |

---

# Getting Started

## Prerequisites

* Node.js 20+
* Docker
* PostgreSQL
* MongoDB
* Redis

---

## Clone Repository

```bash
git clone https://github.com/SuperPorz/SynapsisForge.git
cd synapsisforge
```

---

## Install Dependencies

### Backend

```bash
cd backend
npm install
```

### Frontend

```bash
cd frontend
npm install
```

---

## Run Infrastructure

```bash
docker-compose up -d
```

---

## Start Backend

```bash
npm run start:dev
```

---

## Start Frontend

```bash
ng serve
```

---

# API Documentation

Swagger documentation available at:

```txt
/api/docs
```

---

# Learning Goals

Questo progetto è stato progettato per consolidare competenze avanzate in:

* enterprise backend architecture
* Angular ecosystem
* authentication & authorization
* relational vs NoSQL design
* scalable APIs
* cloud integrations
* DevOps workflows
* production-grade application design

---

# Status

🚧 Work in Progress

---

# License

MIT License

---

# Author

Miguel — aspiring full-stack software developer.
