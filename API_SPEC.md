# SynapsisForge — API Specification v2

Base URL: `/api/v1`

Auth: Bearer JWT (access token) dove indicato con 🔒
Role: ruolo minimo richiesto dove indicato con 🎭

---

## Auth

### POST /auth/register
Registra un nuovo utente.
- **Body:** `{ email, password, first_name, last_name, birth_date, country, role }`
- **Response 201:** `{ id, email, role, created_at }`

### GET /auth/verify-email/:token
Attiva l'account dopo la registrazione via email.
- **Response 200:** `{ message: "Account verified" }`

### POST /auth/login
Login con email e password.
- **Body:** `{ email, password }`
- **Response 200:** `{ access_token }` + cookie HttpOnly `refresh_token`

### POST /auth/refresh
Emette un nuovo access token usando il refresh token nel cookie.
- **Response 200:** `{ access_token }`

### POST /auth/logout 🔒
Invalida il refresh token (Redis o DB).
- **Response 204:** (no body)

### POST /auth/password/reset
Invia email con token per il reset della password.
- **Body:** `{ email }`
- **Response 200:** `{ message: "Reset email sent" }`

### POST /auth/password/confirm
Aggiorna la password usando il token ricevuto via email.
- **Body:** `{ token, new_password }`
- **Response 200:** `{ message: "Password updated" }`

### GET /auth/google
Redirect al flusso OAuth2 Google.
- **Response 302:** redirect a Google

### GET /auth/google/callback
Callback Google — crea utente se non esiste, emette token.
- **Response 200:** `{ access_token }` + cookie HttpOnly `refresh_token`

### GET /auth/github
Redirect al flusso OAuth2 GitHub.
- **Response 302:** redirect a GitHub

### GET /auth/github/callback
Callback GitHub — crea utente se non esiste, gestisce email assente.
- **Response 200:** `{ access_token }` + cookie HttpOnly `refresh_token`

---

## Users

### GET /users/me 🔒
Restituisce il profilo dell'utente autenticato.
- **Response 200:** `{ id, email, first_name, last_name, birth_date, country, role, created_at }`

### PATCH /users/me 🔒
Aggiorna il profilo dell'utente autenticato.
- **Body:** `{ first_name?, last_name?, birth_date?, country? }`
- **Response 200:** utente aggiornato

### GET /users/me/enrollments 🔒
Lista i corsi a cui lo studente è iscritto.
- **Response 200:** `[ { enrollment_id, course, progress_percent, enrolled_at, completed_at } ]`

### GET /users/me/courses 🔒 🎭 `[instructor]`
Lista i corsi creati dall'instructor autenticato.
- **Response 200:** `[ { course_id, title, status, enrolled_count, created_at } ]`

### GET /users/me/certificates 🔒 🎭 `[student]`
Lista i certificati conseguiti dallo studente autenticato.
- **Response 200:** `[ { certificate_id, course, issued_at, pdf_url } ]`

---

## Courses

### GET /courses
Lista corsi con filtri e paginazione. Endpoint pubblico.
- **Query params:** `?category=design&status=published&minPrice=0&maxPrice=100&page=1&limit=20&search=marketing`
- **Response 200:** `{ data: [ course ], total, page, limit }`

### GET /courses/:id
Dettaglio singolo corso con lista lezioni. Endpoint pubblico.
- **Response 200:** `{ id, title, slug, description, price, status, thumbnail_url, instructor, category, lessons: [ { id, title, order, duration_seconds } ], created_at }`

### POST /courses 🔒 🎭 `[instructor]`
Crea un nuovo corso (status iniziale: DRAFT).
- **Body:** `{ title, description, price, category_id, thumbnail_url? }`
- **Response 201:** corso creato

### PATCH /courses/:id 🔒 🎭 `[instructor, admin]`
Aggiorna un corso. L'instructor può modificare solo i propri corsi.
- **Body:** `{ title?, description?, price?, category_id?, thumbnail_url?, status? }`
- **Response 200:** corso aggiornato

### DELETE /courses/:id 🔒 🎭 `[instructor, admin]`
Soft delete del corso.
- **Response 204:** (no body)

---

## Lessons

### GET /courses/:courseId/lessons/:id 🔒
Dettaglio lezione con contenuto MongoDB (video, allegati, quiz). Richiede iscrizione attiva.
- **Response 200:** `{ id, title, order, duration_seconds, video_url, transcript, attachments, quiz, external_links }`

### POST /courses/:courseId/lessons 🔒 🎭 `[instructor]`
Aggiunge una lezione a un corso.
- **Body:** `{ title, order, duration_seconds, video_url?, transcript?, attachments?, quiz?, external_links? }`
- **Response 201:** lezione creata

### PATCH /courses/:courseId/lessons/:id 🔒 🎭 `[instructor]`
Aggiorna una lezione.
- **Body:** `{ title?, order?, duration_seconds?, video_url?, transcript?, attachments?, quiz?, external_links? }`
- **Response 200:** lezione aggiornata

### DELETE /courses/:courseId/lessons/:id 🔒 🎭 `[instructor, admin]`
Elimina una lezione.
- **Response 204:** (no body)

### GET /lessons/:id/video-url 🔒
Genera un presigned GET URL S3 per il video della lezione. Verifica che l'utente sia iscritto.
- **Response 200:** `{ video_url, expires_in }`

---

## Enrollments

### POST /enrollments 🔒 🎭 `[student]`
Iscrive lo studente a un corso. Richiede pagamento COMPLETED per corsi a pagamento.
- **Body:** `{ course_id }`
- **Response 201:** `{ enrollment_id, course_id, progress_percent, enrolled_at }`

### PATCH /enrollments/:id/progress 🔒 🎭 `[student]`
Marca una lezione come completata e ricalcola il progress_percent.
- **Body:** `{ lesson_id }`
- **Response 200:** `{ enrollment_id, progress_percent, completed_at }`

### POST /enrollments/:id/refund 🔒 🎭 `[student, admin]`
Richiede un rimborso per un enrollment.
- **Response 200:** `{ payment_id, status: "refunded" }`

---

## Payments

### GET /payments/client-token 🔒
Genera un client token Braintree per inizializzare il Drop-in UI.
- **Response 200:** `{ client_token }`

### POST /payments/checkout 🔒 🎭 `[student]`
Crea una transazione Braintree per l'acquisto di un corso.
- **Body:** `{ course_id, payment_method_nonce }`
- **Response 201:** `{ payment_id, status, amount, currency }`

### POST /payments/subscribe 🔒 🎭 `[student]`
Crea un abbonamento mensile Braintree.
- **Body:** `{ payment_method_nonce, plan_id }`
- **Response 201:** `{ subscription_id, status }`

### GET /payments/subscription-status 🔒
Restituisce lo stato dell'abbonamento dell'utente autenticato.
- **Response 200:** `{ subscription_id, status, next_billing_date }`

### POST /payments/cancel-subscription 🔒
Cancella l'abbonamento attivo.
- **Response 200:** `{ message: "Subscription cancelled" }`

### GET /payments/history 🔒
Storico pagamenti dell'utente autenticato.
- **Response 200:** `[ { payment_id, course, amount, currency, status, created_at } ]`

### POST /payments/webhook
Webhook Braintree — gestisce eventi di pagamento (firma verificata server-side).
- **Body:** payload Braintree
- **Response 200:** (no body)

---

## Reviews

### POST /enrollments/:enrollmentId/reviews 🔒 🎭 `[student]`
Pubblica una recensione. Lo studente deve essere iscritto al corso.
- **Body:** `{ rating, comment? }`
- **Response 201:** recensione creata

### PATCH /enrollments/:enrollmentId/reviews 🔒 🎭 `[student]`
Modifica la propria recensione.
- **Body:** `{ rating?, comment? }`
- **Response 200:** recensione aggiornata

### DELETE /enrollments/:enrollmentId/reviews 🔒 🎭 `[student, admin]`
Elimina una recensione.
- **Response 204:** (no body)

---

## Certificates

### GET /certificates/verify/:id
Verifica pubblica autenticità di un certificato tramite ID.
- **Response 200:** `{ valid: true, student, course, issued_at }`

### GET /certificates/:id/download 🔒
Genera un presigned GET URL S3 per il download del PDF del certificato.
- **Response 200:** `{ download_url, expires_in }`

---

## Uploads

### POST /uploads/presigned-url 🔒 🎭 `[instructor]`
Genera un presigned PUT URL S3 per l'upload di un video lezione.
- **Body:** `{ filename, content_type }`
- **Response 200:** `{ upload_url, key, public_url, expires_in }`

---

## Admin

### GET /admin/users 🔒 🎭 `[admin]`
Lista tutti gli utenti con filtri e paginazione.
- **Query params:** `?role=student&page=1&limit=20`
- **Response 200:** `{ data: [ user ], total }`

### PATCH /admin/users/:id/role 🔒 🎭 `[admin]`
Cambia il ruolo di un utente.
- **Body:** `{ role }`
- **Response 200:** utente aggiornato

### PATCH /admin/courses/:id/approve 🔒 🎭 `[admin]`
Approva o rifiuta un corso (imposta status PUBLISHED o REJECTED).
- **Body:** `{ approved: true | false }`
- **Response 200:** corso aggiornato

### GET /admin/stats 🔒 🎭 `[admin]`
Statistiche globali della piattaforma.
- **Response 200:** `{ total_users, total_courses, total_enrollments, revenue }`

### GET /admin/cache-stats 🔒 🎭 `[admin]`
Metriche Redis (hit rate, chiavi attive, memoria).
- **Response 200:** `{ hit_rate, active_keys, memory_used }`

### GET /admin/jobs/stats 🔒 🎭 `[admin]`
Statistiche code BullMQ (pending, active, completed, failed).
- **Response 200:** `{ queues: [ { name, pending, active, completed, failed } ] }`

### POST /admin/jobs/weekly-report 🔒 🎭 `[admin]`
Trigger manuale del report settimanale instructor.
- **Response 202:** `{ message: "Job queued" }`