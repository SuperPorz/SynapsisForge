# SynapsisForge

> Enterprise-oriented full-stack e-learning platform designed to showcase advanced software engineering, backend architecture, frontend engineering, authentication systems, cloud integrations, and DevOps workflows.

## Overview

**SynapsisForge** is a modern Learning Management System (LMS) built using a scalable, production-inspired architecture based on:

* **Frontend:** Angular 18 + TailwindCSS + PWA
* **Backend:** NestJS + TypeScript
* **Databases:** PostgreSQL + MongoDB + Redis
* **Authentication:** JWT + OAuth2 + RBAC
* **Infrastructure:** Docker + AWS + CI/CD
* **Payments:** Braintree / PayPal

The project was conceived as a large-scale portfolio application focused on:

* scalable backend architecture
* modular monolith patterns
* secure authentication systems
* distributed services
* cloud-native integrations
* production-grade engineering practices
* advanced frontend architecture

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
* Swagger / OpenAPI

## Databases

* PostgreSQL
* MongoDB
* Redis
* BullMQ

## Infrastructure & DevOps

* Docker & Docker Compose
* AWS S3
* GitLab CI/CD
* Nginx (planned)
* HTTPS & Security Headers

## Authentication & Payments

* JWT Access / Refresh Tokens
* Google OAuth2
* GitHub OAuth2
* RBAC Authorization
* Braintree
* PayPal

---

# Core Features

## Authentication System

* JWT authentication with refresh token rotation
* OAuth2 login via Google and GitHub
* Role-Based Access Control (Student / Instructor / Admin)
* Email verification workflow
* Password reset flow
* Secure HttpOnly cookie handling

## Learning Platform

* Course catalog with advanced filtering
* Course creation dashboard
* Video lesson management
* Interactive quizzes
* Progress tracking
* Certificate generation
* Reviews & ratings system

## Student Dashboard

* Enrolled courses overview
* Learning progress monitoring
* Activity history
* Certificate management

## Instructor Dashboard

* Course management system
* Analytics dashboard
* Lesson editor
* Quiz builder
* Media upload workflows

## Admin Panel

* User management
* Course moderation
* Revenue analytics
* Platform-wide statistics

## Progressive Web App

* Offline support
* Service Worker caching
* Installable app experience
* Mobile-first responsive design

---

# Architecture

```txt
Angular SPA / PWA
        │
        ▼
NestJS REST API
        │
 ┌───────────────┬───────────────┬───────────────┐
 ▼               ▼               ▼
PostgreSQL     MongoDB         Redis
(Relational)   (Lesson Data)   (Cache / Jobs)
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
* flexible learning structures

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
* DTO validation
* Global validation pipes
* Exception filters
* Helmet security headers
* CORS restrictions
* Rate limiting
* RBAC Guards

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
* End-to-end testing
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
cd SynapsisForge
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

Swagger documentation will be available at:

```txt
/api/docs
```

---

# Learning Goals

This project was designed to strengthen advanced skills in:

* enterprise backend architecture
* Angular ecosystem engineering
* authentication & authorization systems
* relational vs NoSQL database design
* scalable REST APIs
* cloud integrations
* DevOps workflows
* production-grade application development

---

# Status

🚧 Work in Progress

---

# License

MIT License

---

# Author

Michelangelo Stega (SuperPorz) — aspiring full-stack software developer.
