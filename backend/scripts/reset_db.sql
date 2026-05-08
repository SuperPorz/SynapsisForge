-- reset_db_explicit.sql
-- Versione esplicita senza CASCADE: ogni tabella svuotata nell'ordine
-- corretto rispetto alle FK (foglie prima, radici dopo).

-- per usarlo, nella cLCI digita: npm run reset-db

BEGIN;

-- Foglie (nessuno dipende da loro)
TRUNCATE TABLE certificates     RESTART IDENTITY;
TRUNCATE TABLE reviews          RESTART IDENTITY;
TRUNCATE TABLE payments         RESTART IDENTITY;

-- Dipendono da enrollments e courses/profiles
TRUNCATE TABLE enrollments      RESTART IDENTITY;

-- Dipendono da courses e instructor_profiles/categories
TRUNCATE TABLE lessons          RESTART IDENTITY;
TRUNCATE TABLE courses          RESTART IDENTITY;

-- Dipendono da users
TRUNCATE TABLE instructor_profiles RESTART IDENTITY;
TRUNCATE TABLE student_profiles    RESTART IDENTITY;

-- Radici
TRUNCATE TABLE users            RESTART IDENTITY;
TRUNCATE TABLE categories       RESTART IDENTITY;

COMMIT;