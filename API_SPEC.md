# SynapsisForge — API Specification v1

Base URL: `/api/v1`

Auth: Bearer JWT (access token) dove indicato con 🔒
Role: ruolo minimo richiesto dove indicato

---

## Auth

### POST /auth/register
Registra un nuovo utente.
- **Body:** `{ username, email, password, first_name, last_name, birth, role }`
- **Response 201:** `{ id, email, role, created_at }`

### POST /auth/login
Login con email e password.
- **Body:** `{ email, password }`
- **Response 200:** `{ access_token }` + cookie HttpOnly `refresh_token`

### POST /auth/refresh
Emette un nuovo access token usando il refresh token nel cookie.
- **Response 200:** `{ access_token }`

### POST /auth/logout 🔒
Invalida il refresh token.
- **Response 204:** (no body)

---

## Users

### GET /users/me 🔒
Restituisce il profilo dell'utente autenticato.
- **Response 200:** `{ id, username, email, first_name, last_name, birth, role }`

### PATCH /users/me 🔒
Aggiorna il profilo dell'utente autenticato.
- **Body:** `{ username?, first_name?, last_name?, birth? }`
- **Response 200:** utente aggiornato

### GET /users/me/enrollments 🔒
Lista i corsi a cui lo studente è iscritto.
- **Response 200:** `[ { enrollment_id, course, progress_percent, start } ]`

### GET /users/me/courses 🔒 `[teacher]`
Lista i corsi creati dal teacher autenticato.
- **Response 200:** `[ { course_id, name, enrolled_count } ]`

---

## Courses

### GET /courses
Lista corsi con filtri e paginazione.
- **Query params:** `?category=design&filter=free|discounted&page=1&limit=20&search=marketing`
- **Response 200:** `{ data: [ course ], total, page, limit }`

### GET /courses/:id
Dettaglio singolo corso con lista lezioni.
- **Response 200:** `{ id, name, teacher, category, price, lessons: [ { id, title } ] }`

### POST /courses 🔒 `[teacher]`
Crea un nuovo corso.
- **Body:** `{ name, category, price, description? }`
- **Response 201:** corso creato

### PATCH /courses/:id 🔒 `[teacher, admin]`
Aggiorna un corso.
- **Body:** `{ name?, category?, price? }`
- **Response 200:** corso aggiornato

### DELETE /courses/:id 🔒 `[teacher, admin]`
Elimina un corso.
- **Response 204:** (no body)

---

## Lessons

### GET /courses/:courseId/lessons/:id 🔒
Dettaglio lezione con contenuto MongoDB (video, allegati, quiz).
- **Response 200:** `{ id, title, video_url, transcript, attachments, quiz, external_links }`

### POST /courses/:courseId/lessons 🔒 `[teacher]`
Aggiunge una lezione a un corso.
- **Body:** `{ title, video_url, transcript?, attachments?, quiz?, external_links? }`
- **Response 201:** lezione creata

### PATCH /courses/:courseId/lessons/:id 🔒 `[teacher]`
Aggiorna una lezione.
- **Body:** `{ title?, video_url?, transcript?, attachments?, quiz? }`
- **Response 200:** lezione aggiornata

### DELETE /courses/:courseId/lessons/:id 🔒 `[teacher, admin]`
Elimina una lezione.
- **Response 204:** (no body)

---

## Enrollments

### POST /enrollments 🔒 `[student]`
Iscrive lo studente a un corso (gratis o avvia pagamento).
- **Body:** `{ course_id }`
- **Response 201:** `{ enrollment_id, payment_id?, status }`

### PATCH /enrollments/:id/progress 🔒 `[student]`
Aggiorna il progresso dello studente su una lezione.
- **Body:** `{ lesson_id }`
- **Response 200:** `{ progress_percent }`

---

## Payments

### POST /payments/webhook
Webhook Stripe — conferma o fallimento pagamento.
- **Body:** payload Stripe (firma verificata server-side)
- **Response 200:** (no body)

### POST /enrollments/:id/refund 🔒 `[student, admin]`
Richiede un rimborso per un enrollment.
- **Response 200:** `{ payment_id, status: "refunded" }`

---

## Reviews

### POST /enrollments/:enrollmentId/reviews 🔒 `[student]`
Pubblica una recensione per un corso completato.
- **Body:** `{ rating_stars, review_text? }`
- **Response 201:** recensione creata

### PATCH /enrollments/:enrollmentId/reviews 🔒 `[student]`
Modifica la propria recensione.
- **Body:** `{ rating_stars?, review_text? }`
- **Response 200:** recensione aggiornata

### DELETE /enrollments/:enrollmentId/reviews 🔒 `[student, admin]`
Elimina una recensione.
- **Response 204:** (no body)

---

## Certificates

### GET /certificates/verify/:code
Verifica pubblica autenticità certificato tramite codice univoco.
- **Response 200:** `{ valid: true, student, course, issued_at }`

### GET /users/me/certificates 🔒
Lista i certificati conseguiti dallo studente autenticato.
- **Response 200:** `[ { certificate_code, course, grade, issued_at, pdf_url } ]`

---

## Admin

### GET /admin/users 🔒 `[admin]`
Lista tutti gli utenti con filtri.
- **Query params:** `?role=student&page=1`
- **Response 200:** `{ data: [ user ], total }`

### PATCH /admin/courses/:id/approve 🔒 `[admin]`
Approva o rifiuta un corso.
- **Body:** `{ approved: true|false }`
- **Response 200:** corso aggiornato

### GET /admin/stats 🔒 `[admin]`
Statistiche globali della piattaforma.
- **Response 200:** `{ total_users, total_courses, total_enrollments, revenue }`