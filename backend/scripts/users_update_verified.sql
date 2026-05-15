-- 1. michelangelo.stega.bo@gmail.com → verified + instructor
UPDATE users
SET "isVerified" = true, role = 'INSTRUCTOR'
WHERE email = 'michelangelo.stega.bo@gmail.com';

INSERT INTO instructor_profiles ("userId")
SELECT id FROM users WHERE email = 'michelangelo.stega.bo@gmail.com'
ON CONFLICT DO NOTHING;

-- 2. admin@example.com → verified + student
UPDATE users
SET "isVerified" = true, role = 'STUDENT'
WHERE email = 'admin@example.com';

INSERT INTO student_profiles ("userId")
SELECT id FROM users WHERE email = 'admin@example.com'

-- 3. alice dupont
UPDATE users
SET "isVerified" = true, role = 'STUDENT'
WHERE email = 'alice@example.com';
ON CONFLICT DO NOTHING;