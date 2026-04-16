CREATE TYPE "Role" AS ENUM (
  'guest',
  'teacher',
  'student',
  'admin'
);

CREATE TYPE "PaymentStatus" AS ENUM (
  'pending',
  'completed',
  'failed',
  'refunded'
);

CREATE TYPE "Category" AS ENUM (
  'business_entrepreneurship',
  'technology_software',
  'datascience_ai',
  'personal_development',
  'design',
  'creative_arts',
  'marketing_sales',
  'health_fitness',
  'language_learning',
  'academics_teaching',
  'lifestyle_hobbies'
);

CREATE TABLE "users" (
  "id" integer PRIMARY KEY,
  "username" varchar,
  "email" varchar UNIQUE,
  "password" varchar,
  "first_name" varchar,
  "last_name" varchar,
  "birth" date,
  "role" "Role",
  "created_at" timestamp
);

CREATE TABLE "courses" (
  "id" integer PRIMARY KEY,
  "name" varchar,
  "teacher_id" int,
  "price" float,
  "category" "Category",
  "created_at" timestamp
);

CREATE TABLE "lessons" (
  "id" integer PRIMARY KEY,
  "course_id" int,
  "title" varchar,
  "created_at" timestamp,
  "videoURL" varchar,
  "mongo_content_id" varchar
);

CREATE TABLE "enrollments" (
  "id" integer PRIMARY KEY,
  "course_id" int,
  "student_id" int,
  "payment_id" int,
  "start" date,
  "end" date,
  "progress_percent" int DEFAULT 0
);

CREATE TABLE "reviews" (
  "id" integer PRIMARY KEY,
  "enrollment_id" int,
  "student_id" int,
  "review_text" varchar,
  "rating_stars" int
);

CREATE TABLE "certificates" (
  "id" integer PRIMARY KEY,
  "enrollment_id" int,
  "certificate_code" varchar UNIQUE,
  "grade" int,
  "issued_at" timestamp,
  "expires_at" timestamp,
  "pdf_url" varchar
);

CREATE TABLE "payments" (
  "id" integer PRIMARY KEY,
  "student_id" int,
  "created_at" timestamp,
  "price" float,
  "status" "PaymentStatus" DEFAULT 'pending',
  "gateway_id" varchar
);

ALTER TABLE "courses" ADD FOREIGN KEY ("teacher_id") REFERENCES "users" ("id") DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "lessons" ADD FOREIGN KEY ("course_id") REFERENCES "courses" ("id") DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "enrollments" ADD FOREIGN KEY ("course_id") REFERENCES "courses" ("id") DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "enrollments" ADD FOREIGN KEY ("student_id") REFERENCES "users" ("id") DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "enrollments" ADD FOREIGN KEY ("payment_id") REFERENCES "payments" ("id") DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "reviews" ADD FOREIGN KEY ("enrollment_id") REFERENCES "enrollments" ("id") DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "reviews" ADD FOREIGN KEY ("student_id") REFERENCES "users" ("id") DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "certificates" ADD FOREIGN KEY ("enrollment_id") REFERENCES "enrollments" ("id") DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "payments" ADD FOREIGN KEY ("student_id") REFERENCES "users" ("id") DEFERRABLE INITIALLY IMMEDIATE;
