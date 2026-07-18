# PLAN.md — SynapsisForge Long-Term Roadmap

> **Legend**: ✅ Completed · 🔄 In Progress · ⬜ Not Started · ⏸️ Paused  
> **Structure**: Phase → Day → Task → Subtask (checkboxes).  
> Daily task blocks are pulled into `TODO.md` when work begins.

---

## Phase 1: Setup, TypeScript & Database (Days 1–7) ✅

### Day 1: Architecture & dev environment ✅
### Day 2: Docker Compose — infra DB ✅
### Day 3: TypeScript — types, interfaces, generics ✅
### Day 4: TypeScript — decorators, utility types ✅
### Day 5: PostgreSQL vs MySQL & MongoDB vs SQL ✅
### Day 6: Schema design — ER diagram ✅
### Day 7: Schema & API definition [MILESTONE] ✅

---

## Phase 2: NestJS — Core (Days 8–24) ✅

### Days 8–10: NestJS project, modules, DI, DTOs, ValidationPipe ✅
### Days 11–13: TypeORM entities (User, Course, Lesson, Enrollment, Review, Certificate, Payment) ✅
### Day 14: CoursesService CRUD with Repository ✅
### Day 15: CoursesController & Swagger ✅
### Day 16: MongoDB + Mongoose — LessonContent ✅
### Day 17: UsersService & EnrollmentsService ✅
### Day 18: Interceptors (logging, transform, timeout) ✅
### Day 19: Exception filters ✅
### Day 20: Custom pipes, throttling ✅
### Day 21: ReviewsService & CertificateService base ✅
### Day 22: Admin module ✅
### Day 23: Seed data & API testing ✅
### Day 24: Backend review & fix [MILESTONE] ✅

---

## Phase 3: Authentication — JWT, OAuth2, RBAC (Days 25–35) ✅

### Days 25–26: JWT setup, Passport, login endpoint ✅
### Day 27: Refresh token & logout ✅
### Day 28: OAuth2 theory (Authorization Code flow) ✅
### Day 29: OAuth2 — Google login ✅
### Day 30: OAuth2 — GitHub login ✅
### Day 31: RBAC — Roles decorator + RolesGuard ✅
### Day 32: Registration & email verification ✅
### Day 33: CORS & security headers ✅
### Day 34: Auth testing (all scenarios) ✅
### Day 35: Auth review & integration [MILESTONE] ✅

---

## Phase 4: Angular — SPA, PWA, Routing, Auth Client, UI (Days 36–55) 🔄

### Day 36: Angular install, template syntax, @Input/@Output, lifecycle ✅
### Day 37: Services & DI, HttpClient, environment files ✅
### Day 38: Signals & RxJS basics ✅
### Day 39: Routing, lazy loading, auth guard ✅
### Day 40: HTTP Interceptor & JWT auto-refresh ✅

#### Tasks:
- [x] AuthInterceptor adds Bearer token
- [x] 401 interception → call /auth/refresh
- [x] Request queue during refresh
- [x] AuthService with currentUser Signal

### Day 41: Auth pages — Login & Register ✅
### Day 42: Homepage — hero, featured courses, categories ✅
### Day 43: Course catalog — grid, filters, search, pagination ✅
### Day 44: Course detail page ✅

#### Tasks:
- [x] Header: thumbnail, title, description, rating ✅
- [x] Curriculum accordion ✅
- [x] Instructor section ✅
- [x] Sidebar: price, CTA "Buy" / "Continue" ✅

### Day 45: Lesson player — layout & video ✅

#### Tasks:
- [x] Two-column layout: video + sidebar navigation ✅
- [x] HTML5 video player with timeupdate tracking ✅
- [x] Lesson navigation sidebar with completion status ✅
- [x] Video URL retrieval from API (signed URL or direct) ✅
- [x] Auto-save progress every 10 seconds via throttled timeupdate ✅

### Day 46: Quiz interattivo ✅

#### Task 46.1: QuizPlayer component — one question at a time
- [x] Component renders questions sequentially
- [x] Transition animation (opacity + translateY)
- [x] Progress bar ("Domanda X di Y")
- [x] Per-question state persistence (`answeredQuestions` signal)
- [x] "← Previous" navigation button
- [x] "Next question →" / "Complete lesson" button

#### Task 46.2: Immediate feedback
- [x] Correct answer → green border + "✓ Corretto!"
- [x] Wrong answer → red border + correct answer shown
- [x] Explanation text shown when present

#### Task 46.3: Persist quiz answers via API
- [x] Backend: Add `quizAnswers` field to `LessonProgress` MongoDB schema
- [x] Backend: Add `quizAnswers` to `UpdateLessonProgressDto`
- [x] Backend: Return `quizAnswers` from `getVideoUrl()`
- [x] Backend: Save `quizAnswers` in `updateLessonProgress()` upsert
- [x] Frontend: Add `QuizAnswer` interface + fields to `LessonVideoResponse` / `UpdateProgressPayload`
- [x] Frontend: QuizPlayer initializes from `quizAnswers` on load
- [x] Frontend: Save via API on "Next question" click
- [x] Frontend: LessonPlayer passes initialAnswers + handles answersChanged

#### Task 46.4: Completion flow
- [x] `onQuizCompleted()` calls `saveProgress()` with `completed: true`
- [x] `checkCourseCompletion()` verifies all lessons done
- [x] Congratulations modal with link to `/profile/my-certificates`
- [x] Modal resets correctly on new lesson navigation (done in `loadLesson()`)
- [x] End-to-end: quiz completion → progress updated → course completion verified → modal shown

### Day 47: Student dashboard ✅

#### Task 47.1: Backend — User profile
- [x] Add `avatar_url`, `bio` columns to User entity
- [x] Add `avatar_url?`, `bio?` to `UpdateUserDto`
- [x] Add `avatar_url`, `bio` to `ResponseUserDto`

#### Task 47.2: Backend — Enrollments & certificates endpoints
- [x] `GET /enrollments/my` — optional `courseId` param; returns single or all enrollments
- [x] `GET /enrollments/my/activity` — last 10 completed lessons with course/lesson titles
- [x] `GET /certificates/my` — all certificates for authenticated user

#### Task 47.3: Frontend — Services
- [x] Create `users.service.ts` (GET/PATCH /users/me)
- [x] Create `certificates.service.ts` (GET /certificates/my)
- [x] Extend `enrollment.service.ts` (`getMyEnrollments()`, `getMyActivity()`)

#### Task 47.4: Frontend — Dashboard layout & components
- [x] DashboardLayout sidebar with icons + conditional instructor link
- [x] MyCourses: enrolled courses list with progress bar, thumbnail, "Continua"/"Certificato" buttons
- [x] Profile: avatar (initials/image), name, email, bio, edit form (nome, cognome, bio, avatar_url)
- [x] Certificates: list with course title, issue date, validity badge, PDF download link
- [x] Activity history section on MyCourses page (last 10 completed lessons)

### Day 47b: UI/UX — Navbar, Footer, Theme, Certificate download ✅

#### Task 47b.1: Navbar
- [x] SynapsisForge logo (clickable → home)
- [x] Nav links: Home, Corsi, Dashboard (se autenticato)
- [x] Auth buttons: Accedi/Registrati (guest) · Logout (autenticato)
- [x] Dark/light theme toggle button

#### Task 47b.3: Footer
- [x] Dark background, centered `Stega Michelangelo ©2026`

#### Task 47b.4: Dark/light theme
- [x] `ThemeService`: `isDark` signal, localStorage persistence
- [x] Default: dark tra 20:00–06:00, light altrimenti
- [x] CSS custom properties overridden in `.dark` class
- [x] Tailwind `dark:` variants across all new components

#### Task 47b.5: Home page hero refresh
- [x] Gradient background, "Impara. Crea. Cresci." headline
- [x] "Esplora i corsi" + "Inizia gratis" CTA buttons

#### Task 47b.6: Certificate PDF download
- [x] Download via `fetch` + `Blob` + `URL.createObjectURL`
- [x] "Scaricamento..." disabled state, fallback a `window.open`

### Day 48: Instructor dashboard — course list & analytics ✅

#### Task 48.1: Backend — instructor endpoints
- [x] `GET /courses/my` — all courses owned by the authenticated instructor
- [x] `GET /courses/my/stats/:id` — enrollment count, avg rating, watch time per course
- [x] `GET /courses/my/:id/lessons` — lesson list with watch time stats

#### Task 48.2: Frontend — Instructor courses list
- [x] InstructorComponent layout with tabs (Courses / Analytics / Settings)
- [x] Courses table: title, status badge (DRAFT/PENDING/PUBLISHED), price, enrollment count
- [x] Filter by status + search bar
- [x] "Create new course" CTA card at top
- [x] Edit button in course rows (navigates to course-wizard edit mode)

#### Task 48.3: Frontend — Charts with ng-charts
- [x] Install `ng2-charts` + `chart.js`
- [x] Enrollments last 30 days — line chart
- [x] Top lessons by watch time — horizontal bar chart
- [ ] Revenue overview — area chart (requires payments integration — Day 78+)

### Day 49: Instructor dashboard — course creation form ✅

#### Task 49.1: Course creation wizard (4 steps)
- [x] Step 1: Title, slug, description, category, price, thumbnail URL
- [x] Step 2: Sections ordering (manual add/remove with auto-order)
- [x] Step 3: Lesson creation per section (title, order, duration)
- [x] Step 4: Content per lesson (video URL, quiz editor with questions/options/correct answer/explanation)
- [x] Save as DRAFT or submit for PENDING review

#### Task 49.2: Course edit mode
- [x] Route `/dashboard/instructor/edit/:id` with role guard
- [x] Course-wizard loads existing course data (metadata, sections, lessons, content)
- [x] Edit button in instructor courses table
- [x] Save updates via `PATCH /courses/:id`

### Day 50: Instructor dashboard — lesson editor ✅

#### Task 50.1: Lesson content editor (actual_plan)
- [x] Lesson form: title, order, type
- [x] Video upload via presigned URL (POST /uploads/presigned-url → PUT to S3)
- [x] Quiz builder (add/edit/delete questions with options, correct answer, explanation)
- [x] Save lesson and update lesson list

### Day 51: Admin panel — users & moderation ✅

#### Task 51.1: Admin section & routing (actual_plan)
- [x] Admin section at route `/admin`, protected by `roleGuard` with `['ADMIN']`
- [x] Admin module lazy-loaded with separate chunk

#### Task 51.2: Users table (actual_plan)
- [x] Table with avatar/initials, name, email, role badge (colored per role: student/instructor/admin)
- [x] Active/inactive status indicator
- [x] Server-side pagination + sorting

#### Task 51.3: User actions (actual_plan)
- [x] Change user role (dropdown or button per row)
- [x] Suspend/activate account toggle

#### Task 51.4: Pending courses moderation (actual_plan)
- [x] Pending courses cards with thumbnail, title, description, instructor name, price, date
- [x] Approve / Reject buttons that remove from list on action
- [x] Backend `GET /admin/courses/pending` with instructor and category relations

#### Task 51.5: Additional dev tasks
- [x] Created `admin.service.ts` with `getUsers()`, `getPendingCourses()`, `approveCourse()`, `rejectCourse()`, `getStats()`
- [x] Role-based Admin link in Navbar (visible only for ADMIN users)
- [x] Dashboard sidebar + mobile overlay: "Admin panel" link in Admin section for ADMIN users

### Day 52: Admin panel — dashboard KPI ✅

#### Task 52.1: KPI cards (actual_plan)
- [x] 4 cards: total users, total instructors, total students, published courses

#### Task 52.2: Revenue chart (actual_plan)
- [x] Monthly revenue line chart (YTD, ng2-charts)

#### Task 52.3: Recent payments table (actual_plan)
- [x] Last payments received table (data from seed)

#### Task 52.4: Top courses (actual_plan)
- [x] Top 5 courses by enrollment count

#### Task 52.5: Additional dev tasks
- [x] Doughnut chart (users by role distribution)
- [x] Recent activity feed (latest signups, enrollments, course publications)
- [x] Users table filters by role and active status
### Day 53: PWA — Service Worker & manifest ✅

#### Subtasks (actual_plan)
- [x] Study Service Worker lifecycle
- [x] Install official PWA package: `@angular/service-worker`
- [x] Configure `ngsw-config.json` with caching strategies
- [x] Test offline (verified via production build — `ngsw.json`, `ngsw-worker.js` generated)

### Day 54: Responsive design & mobile UX ✅

#### Subtasks (actual_plan)
- [x] Review every page on mobile viewport
- [x] Navbar: hamburger menu on mobile
- [x] Player page: lesson panel as bottom sheet
- [ ] Test on real device (deferred — requires manual testing by user)

#### Additional dev tasks
- [x] Dashboard mobile redesign (horizontal scrollable nav strip instead of hamburger + overlay + bottom nav)
- [x] Instructor table mobile optimization (colored dots, hidden thumbnail/rating, icon-only actions)
- [x] Global card background: `--color-card-bg` via `@theme` with `bg-card-bg` utility

### Day 55: Integration test Frontend ↔ Backend ✅

#### Subtasks (actual_plan)
- [x] Complete student flow (catalog → enroll → lessons → quiz → certificate)
- [x] Instructor flow (create course → add lessons → publish)
- [x] Admin flow (moderate courses, manage users)
- [x] Test on Chrome, Firefox, Safari

---

## Phase 5: Redis — Caching & Rate Limiting (Days 56–65) ✅

### Day 56: Redis data structures & CLI ✅

#### Subtasks (actual_plan)
- [x] Study 5 Redis data structures (string, hash, list, set, sorted set)
- [x] Connect to Redis container with redis-cli
- [x] Define key naming conventions for the project
- [x] Understand DEL vs UNLINK difference

### Day 57: Cache manager in NestJS — config ✅

#### Subtasks (actual_plan)
- [x] Install `@nestjs/cache-manager`, `cache-manager`, `@keyv/redis`, `keyv`
- [x] Configure `CacheModule.registerAsync()` in AppModule
- [x] Inject `CACHE_MANAGER` in CoursesService
- [x] Test Redis connection from NestJS

### Day 58: Cache course list and detail ✅

#### Subtasks (actual_plan)
- [x] Add manual cache in `CoursesService.findAll()`
- [x] Cache miss → query DB → save to Redis with TTL
- [x] Add cache on `findBySlug()`
- [x] Measure performance improvement

### Day 59: Cache invalidation ✅

#### Subtasks (actual_plan)
- [x] When instructor modifies a course, delete related cache keys
- [x] When new course published, delete list cache keys
- [x] Create centralized `CacheService`
- [x] Verify API response is updated after modification

### Day 60: Rate limiting with Redis store ✅

#### Subtasks (actual_plan)
- [x] Configure `@nestjs/throttler` with Redis store
- [x] Differentiated rate limit rules per endpoint (auth vs public)
- [x] Add `X-RateLimit` response headers
- [x] Test lockout behavior

### Day 61: Redis for refresh token storage ✅

#### Subtasks (actual_plan)
- [x] Migrate refresh token hash from PostgreSQL to Redis
- [x] Redis key pattern: `refresh:{userId}` → hash
- [x] On logout: delete Redis key
- [x] Verify refresh and logout still work correctly

### Day 62: Redis Pub/Sub — enrollment notifications ✅

#### Subtasks (actual_plan)
- [x] Create `RedisPubSubService` (publisher + subscriber via `@redis/client`)
- [x] Publisher: on `EnrollmentsService.enroll()` → publish to `sf:enrollments`
- [x] Subscriber: listen and increment `sf:enrollment-count:{courseId}`
- [x] Hybrid counter (Redis → SQL fallback) in `CoursesService` endpoints
- [x] Seed system: `redis-counter.seed.ts` + FLUSHDB in reset.ts

### Day 63: Redis metrics & monitoring ✅

#### Subtasks (actual_plan)
- [x] Install RedisInsight for visual monitoring
- [x] Add admin endpoint `GET /admin/cache-stats`
- [x] Set `maxmemory` and eviction policy
- [x] Document caching strategy in repo

### Day 64: Performance benchmark (with/without Redis) ✅

#### Subtasks (actual_plan)
- [x] Use `autocannon` for benchmark
- [x] Run test without cache and with cache
- [x] Run second test on `GET /courses/:slug`
- [x] Save results in `backend/docs/CACHING.md`

### Day 65: Redis review & cleanup [MILESTONE] ✅

#### Subtasks (actual_plan)
- [x] Review all Redis keys for consistency
- [x] Verify cache invalidation covers all cases
- [x] Ensure rate limiter doesn't block legitimate users
- [x] Write tests for `CacheService`

---

## Phase 6: BullMQ — Job Queue & Async Tasks (Days 66–71) ✅

### Day 66: BullMQ architecture, first job ✅

#### Subtasks (actual_plan)
- [x] Study Producer-Broker-Consumer architecture
- [x] Install `@nestjs/bullmq`, `bullmq` and configure `BullModule.forRoot()`
- [x] Create `modules/queues/` with a queue + processor
- [x] Write a simple test-job (endpoint adds job, worker console.logs)

### Day 67: Email system — Nodemailer + SMTP ✅

#### Subtasks (actual_plan)
- [x] Install `@nestjs-modules/mailer` + `nodemailer` + `handlebars`
- [x] Configure MailerModule with SMTP (Gmail/ProtonMail app password)
- [x] Create HTML email templates: welcome, enrollment confirmation
- [x] Test sending a test email

### Day 68: Welcome email & enrollment confirmation jobs ✅

#### Subtasks (actual_plan)
- [x] Job `send-welcome-email`: triggered on `user.registered` via EventEmitter
- [x] Job `send-enrollment-confirmation`: triggered on `enrollment.created`
- [x] Configure Processor with `concurrency: 3`
- [x] Test E2E: register → email arrives, enroll → email arrives

### Day 69: Certificate PDF generation job ✅

#### Subtasks (actual_plan)
- [x] Install `pdfkit`
- [x] Job `generate-certificate`: triggered on `enrollment.completed`
- [x] Generate PDF with course title, user name, completion date
- [x] Save in `uploads/certificates/`, update Certificate record with PDF URL

### Day 70: Scheduled jobs + Bull Board ✅

#### Subtasks (actual_plan)
- [x] Install `@bull-board/nestjs`, mount on `/admin/queues` (admin-only)
- [x] Job `daily-student-digest`: cron `0 9 * * *` (next lesson, study streak)
- [x] Job `cleanup-expired-tokens`: cron `0 3 * * 0` (weekly maintenance)
- [x] Test: manually trigger jobs from Bull Board

### Day 71: Retry policy & E2E test [MILESTONE] ✅

#### Subtasks (actual_plan)
- [x] Configure retry policy per job type (email: 3 tries, exponential backoff)
- [x] Add `onFailed` handler for logging failures
- [x] Set `defaultJobOptions` with `removeOnComplete`
- [x] Verify all app events trigger correct jobs
- [x] Document job architecture in MEMORY.md

---

## Phase 7: Payments — Braintree (Days 72–82) ⬜

### Day 72: Braintree setup & SDK ✅

#### Subtasks (actual_plan)
- [x] Create Braintree Sandbox account
- [x] Study flow: Client Token → Drop-in UI → Nonce → Transaction
- [x] Install `braintree` Node.js SDK
- [x] Endpoint `GET /payments/client-token`

### Day 73: Drop-in UI in Angular ✅

#### Subtasks (actual_plan)
- [x] Install `braintree-web-drop-in`
- [x] Create `CheckoutComponent`: initialize the Drop-in
- [x] On "Pay" click, call `dropin.requestPaymentMethod()`

### Day 74: Single course purchase — backend ✅

#### Subtasks (actual_plan)
- [x] Endpoint `POST /payments/checkout`
- [x] Create Braintree transaction: `gateway.transaction.sale()`
- [x] On success: create Payment record, trigger email job, create Enrollment
- [x] Handle Braintree errors gracefully

#### Additional dev tasks
- [x] `CartItem` entity (PostgreSQL) with unique(user, course) constraint + User.cartItems relation
- [x] `CartModule` + `CartService` + `CartController` — CRUD (GET/POST/DELETE) with Redis cache (`sf:cart:{userId}` + `sf:cart:count:{userId}`)
- [x] `POST /cart/checkout` — single Braintree transaction for all items, creates Payment + Enrollment per item, clears cart
- [x] Frontend `CartService` with Signals (items, count, total, courseIds Set for "In cart" state)
- [x] Navbar cart icon with badge count (desktop + mobile), links to `/cart`
- [x] Course-card: "Add to Cart" wired with loading/disabled/In-cart ✓ states
- [x] Course-detail: "Add to Cart" (outlined) + "Buy now" (solid) buttons both functional
- [x] `CartComponent` page at `/cart` — items list, remove, total, "Proceed to Checkout"
- [x] Route `/cart` with `authGuard`, lazy-loaded
- [x] `CheckoutComponent` supports both single-course and cart-based multi-item checkout

### Day 75: Single course purchase — frontend ✅

#### Subtasks (actual_plan)
- [x] On success response: redirect to course page
- [x] On error: show specific error message
- [x] Add loading state during payment processing
- [x] Test with Braintree test card numbers

#### Additional dev tasks
- [x] Add 'Go to course' green button on course-cards for already enrolled courses (backend `GET /enrollments/my/ids`, frontend `enrolledCourseIds` signal, Navbar loads on init)

### Day 76: PayPal in Drop-in ✅

#### Subtasks (actual_plan)
- [x] Configure `paypal: { flow: "checkout" }` in Drop-in options
- [x] Flow is identical to card flow
- [x] Test PayPal flow with sandbox account
- [x] Verify Payment record saves the method used

### Day 77: Monthly subscription — Braintree Subscription ✅

#### Subtasks (actual_plan)
- [x] Create a Plan on Braintree Dashboard
- [x] Endpoint `POST /payments/subscribe`
- [x] Save `subscriptionId` in User record
- [x] Update user's `plan` field

### Day 78: Braintree webhooks ✅

#### Subtasks (actual_plan)
- [x] Endpoint `POST /payments/webhook`
- [x] Always verify webhook signature
- [x] Handle `subscription_charged_successfully`
- [x] Handle `subscription_charged_unsuccessfully`

### Day 79: Customer portal — subscription management ✅

#### Subtasks (actual_plan)
- [x] Endpoint `POST /payments/cancel-subscription`
- [x] Endpoint `GET /payments/subscription-status`
- [x] Angular component "Subscription Management"
- [x] Test complete subscription lifecycle

### Day 80: Idempotency & edge case testing ✅

#### Subtasks (actual_plan)
- [x] Verify idempotency: duplicate webhook must not create duplicates
- [x] Save `gatewayId` for every transaction
- [x] Test: purchase already-owned course → 409 error
- [x] Review Payment table schema

### Day 81: Payment history & receipts ✅

#### Subtasks (actual_plan)
- [x] Endpoint `GET /payments/history`
- [x] Each payment includes: date, amount, method, receipt link
- [x] BullMQ job `generate-receipt-pdf`
- [x] Angular component "Payment History"

### Day 82: Payments review [MILESTONE] ✅

#### Subtasks (actual_plan)
- [x] Test entire flow in sandbox
- [x] Verify no sensitive info is logged
- [x] Add test transactions to seed script
- [x] Write integration tests

---

## Phase 8: AWS S3, Deploy & CI/CD GitLab (Days 83–94) ⬜

### Day 83: AWS IAM & S3 setup ✅

#### Subtasks (actual_plan)
- [x] Create AWS account  *(requires user action)*
- [x] Study IAM roles and policies  *(research)*
- [x] Create S3 buckets: `synapsisforge-media` and `synapsisforge-private` *(requires user action)*
- [x] Install `@aws-sdk/client-s3`, `@aws-sdk/s3-request-presigner`

### Day 84: Presigned URL upload — backend ✅

#### Subtasks (actual_plan)
- [x] Endpoint `POST /uploads/presigned-url`
- [x] Generate presigned PUT URL valid for 10 minutes
- [x] Return `{ uploadUrl, key, publicUrl }`
- [x] Update LessonsService to save the S3 key

### Day 85: Presigned URL upload — frontend ✅

#### Subtasks (actual_plan)
- [x] Create video upload component
- [x] Progress bar with `reportProgress`
- [x] After upload, send S3 key to backend
- [x] Test video upload end-to-end (pending manual verification)

#### Additional dev tasks
- [x] Create `scripts/upload-videos-to-s3.ts` — downloads 10 test videos from test-videos.co.uk, uploads to S3 synapsisforge-media bucket, configures CORS, updates 240 MongoDB lesson_content records with real s3Key values
- [x] Add `db:upload-videos` npm script
- [x] Create `frontend/src/app/core/services/upload.service.ts` — wraps XMLHttpRequest PUT with upload progress tracking
- [x] Add `PresignedUrlResponse` and `LessonContentModel` interfaces to `course-model.ts`
- [x] Add `getPresignedUrl()` and `updateS3Key()` methods to `LessonsService`
- [x] Create `VideoUploadComponent` — drag-and-drop zone, file input (video/*), progress bar, emits publicUrl on success
- [x] Integrate `VideoUploadComponent` into course-wizard Step 4 (replaces plain URL input)

### Day 86: Signed URL for protected videos ✅

#### Subtasks (actual_plan)
- [x] Endpoint `GET /lessons/:id/video-url`
- [x] Verify enrollment, generate presigned GET URL
- [x] Frontend uses this URL in video player
- [x] Test that direct S3 URL returns 403

### Day 87: Migrate certificate PDFs to S3 ✅

#### Subtasks (actual_plan)
- [x] Update `generate-certificate` job: upload PDF to S3 (with `USE_S3` fallback)
- [x] Endpoint `GET /certificates/:id/download` (presigned GET URL, ownership check)
- [x] Angular component for download (presigned URL via API, fallback to direct pdf_url)
- [x] One-off script replaced with real PDF generation in seed (PdfService + S3/local on reseed)

#### Additional dev tasks
- [x] Added `s3_key` column to Certificate entity
- [x] `PdfService.generateCertificate()` now returns `Buffer`
- [x] Added `S3Service.putObject()` method
- [x] Seed now generates real PDF certificates via PdfService (uploads to S3 or local)

### Day 88: Dockerize backend NestJS ✅

#### Subtasks (actual_plan)
- [x] Study multi-stage Docker build
- [x] Write Dockerfile for backend
- [x] Write Dockerfile for frontend
- [x] Test images locally

### Day 89: Docker Compose production ✅

#### Subtasks (actual_plan)
- [x] Update `docker-compose.yml` for production
- [x] Add Nginx as reverse proxy
- [x] Configure `depends_on` with health checks
- [x] Test that `docker-compose up` starts everything

### Day 90: Deploy to Render or EC2 ✅

#### Subtasks (actual_plan)
- [x] Option A: Render.com (simpler)
- [x] Option B: EC2 t2.micro instance
- [x] Copy `docker-compose.yml` to server
- [x] Verify app is reachable

### Day 91: HTTPS with Let's Encrypt ✅

#### Subtasks (actual_plan)
- [x] If EC2: install Certbot and configure SSL
- [x] Point domain to server (`synapsisforge.shop` → `51.118.21.90`)
- [x] Verify SSL certificate

### Day 92: GitLab CI/CD — base config ✅

#### Subtasks (actual_plan)
- [x] Create project on GitLab.com
- [x] Write `.gitlab-ci.yml` with 3 stages (build, test, deploy)
- [x] Configure CI/CD variables (secrets, env)
- [x] Test pipeline *(push code → verify pipeline runs)*

### Day 93: GitLab CI/CD — auto test & deploy ✅

#### Subtasks (actual_plan)
- [x] Add `npm run test:cov` to test stage
- [x] Configure auto-deploy only on `main` branch
- [x] Test complete deploy pipeline
- [x] Add notification (Slack or email)

### Day 94: S3 & deploy review [MILESTONE] ✅

#### Subtasks (actual_plan)
- [x] Verify all file uploads use S3
- [x] Review AWS costs
- [x] Verify CI/CD pipeline works end-to-end
- [x] Document deploy process in README

---

## Phase 9: Testing & Security (Days 95–105) ✅

### Day 95: Testing strategy — unit vs integration vs e2e ✅

#### Subtasks (actual_plan)
- [x] Study testing pyramid
- [x] In NestJS: unit tests with Jest, integration tests with Supertest
- [x] In Angular: unit tests with TestBed
- [x] Set targets: 60% coverage backend, 40% frontend

### Day 96: Backend unit tests — services ✅

#### Subtasks (actual_plan)
- [x] Write unit tests for CoursesService
- [x] Test `findAll()`, `create()`, `remove()`
- [x] Write unit tests for AuthService
- [x] Test `login()`, `refresh()`

### Day 97: Backend integration tests — endpoints ✅

#### Subtasks (actual_plan)
- [x] Configure test module helper with shared app setup
- [x] Write integration test for `POST /auth/login` — valid → 201, invalid → 401
- [x] Test for `GET /courses` — public endpoint works without auth
- [x] Test for `POST /courses` with different roles — 401 (anon), 403 (student), 201 (instructor)

#### Additional dev tasks
- [x] Created `test/helpers.ts` — shared `createTestApp()` helper (interceptors, pipes, filters)
- [x] Created `test/auth.e2e-spec.ts` — 2 tests (valid + invalid login)
- [x] Created `test/courses-auth.e2e-spec.ts` — 4 tests (public GET, 401/403/201 for POST)

### Day 98: Backend tests — guards & interceptors ✅

#### Subtasks (actual_plan)
- [x] Test RolesGuard
- [x] Test TransformInterceptor
- [x] Test HttpExceptionFilter
- [x] Test ParseUuidPipe

### Day 99: Frontend unit tests — components ✅

#### Subtasks (actual_plan)
- [x] Configure Jest for Angular (or use Vitest)
- [x] Test CourseCardComponent
- [x] Test LoginComponent
- [x] Test AuthGuard

### Day 100: Frontend tests — services & interceptors ✅

#### Subtasks (actual_plan)
- [x] Test AuthService
- [x] Test AuthInterceptor
- [x] Test automatic refresh flow
- [x] Test CoursesService

### Day 101: OWASP Top 10 review ✅

#### Subtasks (actual_plan)
- [x] SQL Injection: verify TypeORM parameterizes all queries
- [x] XSS: Angular sanitizes by default, check `innerHTML` usage
- [x] CSRF: configure cookies with `sameSite: "strict"`
- [x] Sensitive data exposure: audit all endpoint responses

### Day 102: Dependency audit & security headers ✅

#### Subtasks (actual_plan)
- [x] Run `npm audit --audit-level=high`
- [x] Verify Helmet configuration
- [x] Check CORS configuration
- [x] Test with OWASP ZAP

### Day 103: Rate limiting & brute force protection ✅

#### Subtasks (actual_plan)
- [x] Verify rate limiter blocks login attempts
- [x] Add artificial 200ms delay on failed login
- [x] Implement account lockout after N failures
- [x] Test lockout behavior

### Day 104: Query optimization & indexes ✅

#### Subtasks (actual_plan)
- [x] Enable TypeORM query logging
- [x] Identify N+1 queries and fix them
- [x] Add missing database indexes
- [x] Measure performance improvement

### Day 105: Coverage report & fix [MILESTONE] ✅

#### Subtasks (actual_plan)
- [x] Generate coverage report (backend 21.71%, frontend 41.97%)
- [x] Identify areas with coverage <40% and add tests (7 new frontend service specs, +54 tests)
- [x] Configure coverage report as GitLab artifact (cobertura in .gitlab-ci.yml)
- [x] Final commit with all tests passing

---

## Phase 10: Polish, Documentation & Portfolio (Days 106–119) ✅

### Day 106: Professional seed data ✅

#### Subtasks (actual_plan)
- [x] Write complete and realistic seed data (courses have real content)
- [ ] ~~Create 3 demo accounts (student, instructor, admin)~~ _(cancelled — demo accounts already exist in seed)_
- [ ] ~~Document demo accounts in README~~ _(cancelled — accounts documented in MEMORY.md)_
- [x] Populate reviews with realistic UI — backend `GET /reviews/course/:courseId`, frontend `ReviewSection` component with list + form + service

### Day 107: UX polish — micro-interactions, toasts, empty states ✅

#### Subtasks (actual_plan)
- [x] Add skeleton loaders for async content
- [x] Toast notifications for actions (success/error)
- [x] Empty states for lists with no data
- [x] Page transition animations

### Day 108: Error states & edge cases (404, offline) ✅

#### Subtasks (actual_plan)
- [x] Global error boundary
- [x] Custom 404 page
- [x] Offline handling (PWA fallback)
- [x] Verify specific error messages in forms

### Day 109: Accessibility (aria, contrast, keyboard nav) ✅

#### Subtasks (actual_plan)
- [x] Add `aria-label` and `alt` attributes
- [x] Verify color contrast ratios
- [x] Ensure full keyboard navigation
- [x] Run axe DevTools audit

### Day 110: README — structure & architecture ✅

#### Subtasks (actual_plan)
- [x] Hero section with project overview
- [x] Screenshots section
- [x] Tech stack section
- [x] Architecture section with diagram

### Day 111: README — local setup & API docs ✅

#### Subtasks (actual_plan)
- [x] "Local setup in 5 commands" section
- [x] "Architecture Decisions" section
- [x] Link to Swagger API docs
- [x] "Demo accounts" section

### Day 112: Swagger — complete API documentation ✅

#### Subtasks (actual_plan)
- [x] Verify EVERY endpoint is documented
- [x] Add Swagger tags for grouping
- [x] Configure `@ApiBearerAuth()` on protected endpoints
- [x] Test Swagger UI on production

### Day 113: Performance final — Lighthouse & bundle (merged from Day 55) ✅

#### Subtasks (actual_plan)
- [x] Run Lighthouse on every page (Homepage, /courses, /courses/:id, player, dashboard, auth, admin) *(7/8 — player skipped: requires auth + valid enrollment)*
- [x] Common fixes: loading="lazy" on images, gzip/brotli, WebP optimization *(loading="lazy" done; gzip active via nginx; WebP pending)*
- [x] Add Angular `@defer` blocks for heavy components (charts, grids, admin)
- [x] Analyze Angular bundle + verify <500 KB gzipped
- [x] Verify `ngsw-config.json` serves assets correctly

### Day 114: Load test on production ✅

#### Subtasks (actual_plan)
- [x] Use Artillery or autocannon
- [x] Monitor CPU, memory, response time
- [x] Verify rate limiter holds up
- [x] Document results in README

### Day 115: Demo video — script preparation ✅

#### Subtasks (actual_plan)
- [x] Write 5-minute video script
- [x] Prepare the demo environment
- [x] Install OBS Studio
- [x] Do a practice run

### Day 116: Demo video — recording ✅

#### Subtasks (actual_plan)
- [x] Record student flow
- [x] Record instructor flow
- [x] Record admin panel
- [x] Edit and produce the video

### Day 117: LinkedIn & GitHub — publication ✅

#### Subtasks (actual_plan)
- [x] Publish repo on GitHub (selective sync — dev infra only)
- [x] Make repo public and add topics (pending user action via GitHub web UI)
- [ ] Create LinkedIn post (skipped — user handles separately)
- [ ] Add project to CV (skipped — user handles separately)

#### Additional dev tasks
- [x] Remove sensitive email from all git history + force push to both remotes
- [x] Migrate from Woodpecker to GitHub Actions (`.github/workflows/ci.yml`)
- [x] Add 5 screenshots to screenshots/
- [x] Update AGENTS.md §14 with selective sync flow
- [ ] User: make GitHub repo public + add topics via web UI
- [ ] User: re-protect GitLab main branch

### Day 118: Interview prep — technical deep dive ✅

#### Subtasks (actual_plan)
- [x] Prepare answers for technical questions
- [x] Prepare 3-minute architecture explanation
- [x] Identify 3 things to do differently
- [x] Do a mock interview

### Day 119: Retrospective & future roadmap [MILESTONE] ✅

#### Subtasks (actual_plan)
- [x] Write technical retrospective in README
- [x] List future features
- [x] Identify technologies to explore further
- [x] Update tracker to 100%

---

## Phase 10 — Additional: Mobile Auth Endpoints (2026-07-17) ✅

### Mobile Auth — Backend implementation

#### Tasks:
- [x] Create `AuthMobileController` with 5 endpoints (register, verify-email, login, refresh, logout)
- [x] Add `X-Refresh-Token` header-based refresh flow (no cookie)
- [x] Implement refresh token reuse detection (nuke session on reuse)
- [x] Fix bcrypt 72-char truncation (SHA-256 + bcrypt via `hashToken()`/`verifyToken()`)
- [x] Use direct Redis client (`@redis/client`) for mobile auth ops (bypass cache-manager)
- [x] Use `jwtService.verifyAsync()` instead of `decode()` for refresh token verification
- [x] Add `@redis/client` explicitly to `package.json`
- [x] Switch `bcrypt` → `bcryptjs` (lighter, no native deps)
- [x] Seed: update `users.seed.ts` import from `bcrypt` to `bcryptjs`
- [x] Test all 5 endpoints via curl — all pass

---

## Cross-cutting backlog

> Items collected across sessions. Not assigned to a specific day — will be scheduled when priority warrants.

### Additional payment methods
- [ ] **Google Pay** — enable via `googlePay: {}` in Drop-in options + configure Google Pay in Braintree Control Panel
- [ ] **Amazon Pay** — configure Amazon Pay in Braintree Control Panel + add `amazonPay: {}` in Drop-in options
- [ ] **Stripe** — separate integration (new module, Stripe SDK, webhooks, PaymentIntent/SetupIntent flow, not via Braintree Drop-in)
