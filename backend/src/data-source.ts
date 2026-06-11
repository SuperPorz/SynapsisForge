// questo file serve per configurare la connessione al database e definire le entità che TypeORM deve gestire.
// Viene utilizzato da NestJS per creare il modulo di connessione al database e per eseguire le migrazioni.
import 'dotenv/config';
import { DataSource } from 'typeorm';
import { User } from './common/entities/users.entity';
import { Category } from './common/entities/categories.entity';
import { Course } from './common/entities/courses.entity';
import { Lesson } from './common/entities/lessons.entity';
import { Enrollment } from './common/entities/enrollments.entity';
import { Payment } from './common/entities/payments.entity';
import { Review } from './common/entities/reviews.entity';
import { Certificate } from './common/entities/certificate.entity';
import { InstructorProfile } from './common/entities/InstructorProfile.entity';
import { StudentProfile } from './common/entities/StudentProfile.entity';
import { Section } from './common/entities/section.entity';
import { UserProviders } from './common/entities/user_providers.entity';

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST ?? 'localhost',
  port: parseInt(process.env.DB_PORT ?? '5432', 10),
  username: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
  entities: [
    User,
    Category,
    Course,
    Lesson,
    Enrollment,
    Payment,
    Review,
    Certificate,
    InstructorProfile,
    StudentProfile,
    Section,
    UserProviders,
  ],
  migrations: ['src/database/migrations/*.ts'],
  synchronize: false,
});
