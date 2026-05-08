# REST Test Files — Synapsis/SynapsisForge

## Struttura

```
rest-files/
├── _variables.rest       # Riferimento centralizzato di tutte le variabili
├── admin_req.rest
├── certificates_req.rest
├── course_req.rest
├── enroll_req.rest
├── lessons_req.rest
├── reviews_req.rest
├── users_req.rest
├── sync-ids.ts           # Script per aggiornare UUID dopo reset DB
└── README.md
```

## Flusso consigliato dopo reset del DB

1. Popola il DB con il tuo script di seed
2. Lancia lo script di sync:
   ```bash
   npm run sync-ids
   ```
3. Aggiorna manualmente i valori che lo script non riesce a recuperare
   automaticamente (enrollmentId, certificateId, reviewId, token JWT)

## Aggiungere a package.json

```json
"scripts": {
  "sync-ids": "ts-node scripts/sync-ids.ts"
},
"devDependencies": {
  "ts-node": "^10.9.2"
}
```

Poi sposta `sync-ids.ts` in `scripts/sync-ids.ts`.

## Variabili condivise

Il REST Client di VS Code **non supporta variabili cross-file**.
Ogni file `.rest` ridefinisce le proprie variabili nella sezione `### ... – variabili`.
Dopo `npm run sync-ids`, i placeholder vengono sostituiti con i valori reali
in tutti i file contemporaneamente.

## Quando AuthModule sarà pronto

Decommentare la sezione `Login` in `sync-ids.ts` per ottenere i token JWT
automaticamente. Il flusso diventerà:

1. Login admin → `ADMIN_JWT_TOKEN`
2. Login student → `STUDENT_JWT_TOKEN`  
3. Login instructor → `INSTRUCTOR_JWT_TOKEN`
4. Raccolta UUID tramite le API protette
5. Aggiornamento automatico di tutti i file `.rest`

## Fix applicati ai file originali

| File | Fix |
|---|---|
| `admin_req.rest` | Route corretta da `GET /admin` a `GET /admin/users` |
| `enroll_req.rest` | UUID placeholder `00000000-…` sostituiti con placeholder nominativi |
| `course_req.rest` | Aggiunto `Authorization` header su POST/PATCH/DELETE |
| `lessons_req.rest` | Aggiunto `Authorization` header su POST/PATCH |

## Moduli coperti

| File | Endpoint | Auth richiesta |
|---|---|---|
| `admin_req.rest` | GET /admin/users, PATCH approve/reject, GET stats | Admin JWT |
| `certificates_req.rest` | GET verify (pubblico), GET :id, PATCH revoke | Parziale |
| `course_req.rest` | GET (pubblici), POST/PATCH/DELETE | Instructor/Admin JWT |
| `enroll_req.rest` | POST enroll, PATCH progress | Student JWT |
| `lessons_req.rest` | GET/POST/PATCH content | Instructor JWT |
| `reviews_req.rest` | POST/PATCH/DELETE review | Student JWT |
| `users_req.rest` | GET /me, PATCH /me | Student JWT |
