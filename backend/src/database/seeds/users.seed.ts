import { DataSource } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { User } from '../../common/entities/users.entity';
import { InstructorProfile } from '../../common/entities/instructor-profile.entity';
import { StudentProfile } from '../../common/entities/student-profile.entity';
import { UserRole, Country } from '../../common/entities/enum/users.enum';

export interface SeededUsers {
  instructorProfiles: InstructorProfile[];
  studentProfiles: StudentProfile[];
}

// ── User definitions ──────────────────────────────────────────────────────────
// isVerified: true  → email confermata, può fare tutto
// isVerified: false → email non confermata, testa il flusso di verifica
//
// Admin credentials are configurable via DEMO_ADMIN_EMAIL / DEMO_ADMIN_PASSWORD
// (default admin@example.com / Password123!). Set these in .env.development
// locally and as GitHub Secrets in production.

const DEMO_ADMIN_EMAIL = process.env.DEMO_ADMIN_EMAIL || 'admin@example.com';

const INSTRUCTORS = [
  {
    email: 'james.carter@synapsis.dev',
    first_name: 'James',
    last_name: 'Carter',
    birth_date: new Date('1982-04-14'),
    country: Country.USA,
    role: UserRole.INSTRUCTOR,
    isVerified: true,
  },
  {
    email: 'sofia.esposito@synapsis.dev',
    first_name: 'Sofia',
    last_name: 'Esposito',
    birth_date: new Date('1988-09-22'),
    country: Country.ITALY,
    role: UserRole.INSTRUCTOR,
    isVerified: true,
  },
  {
    email: 'marco.weber@synapsis.dev',
    first_name: 'Marco',
    last_name: 'Weber',
    birth_date: new Date('1985-03-30'),
    country: Country.GERMANY,
    role: UserRole.INSTRUCTOR,
    isVerified: true,
  },
  {
    // Instructor non verificato — testa il flusso di verifica
    email: 'claire.dupont@synapsis.dev',
    first_name: 'Claire',
    last_name: 'Dupont',
    birth_date: new Date('1991-07-17'),
    country: Country.FRANCE,
    role: UserRole.INSTRUCTOR,
    isVerified: false,
  },
];

const STUDENTS = [
  // ── Verificati ────────────────────────────────────────────────────────────
  {
    email: 'alice@example.com',
    first_name: 'Alice',
    last_name: 'Thompson',
    birth_date: new Date('1999-06-10'),
    country: Country.UK,
    role: UserRole.STUDENT,
    isVerified: true,
  },
  {
    email: 'bob@example.com',
    first_name: 'Bob',
    last_name: 'Müller',
    birth_date: new Date('2000-02-28'),
    country: Country.GERMANY,
    role: UserRole.STUDENT,
    isVerified: true,
  },
  {
    email: 'chiara@example.com',
    first_name: 'Chiara',
    last_name: 'Marino',
    birth_date: new Date('1998-11-03'),
    country: Country.ITALY,
    role: UserRole.STUDENT,
    isVerified: true,
  },
  {
    email: 'john@example.com',
    first_name: 'John',
    last_name: 'Rivera',
    birth_date: new Date('1995-08-19'),
    country: Country.USA,
    role: UserRole.STUDENT,
    isVerified: true,
  },
  {
    email: 'priya@example.com',
    first_name: 'Priya',
    last_name: 'Sharma',
    birth_date: new Date('2001-01-25'),
    country: Country.ITALY,
    role: UserRole.STUDENT,
    isVerified: true,
  },
  {
    email: 'luca@example.com',
    first_name: 'Luca',
    last_name: 'Conti',
    birth_date: new Date('1997-05-07'),
    country: Country.ITALY,
    role: UserRole.STUDENT,
    isVerified: true,
  },
  {
    email: 'emma@example.com',
    first_name: 'Emma',
    last_name: 'Larsson',
    birth_date: new Date('2002-09-14'),
    country: Country.FRANCE,
    role: UserRole.STUDENT,
    isVerified: true,
  },
  {
    email: 'carlos@example.com',
    first_name: 'Carlos',
    last_name: 'Navarro',
    birth_date: new Date('1996-12-01'),
    country: Country.SPAIN,
    role: UserRole.STUDENT,
    isVerified: true,
  },
  // ── Non verificati — testano il flusso di verifica email ─────────────────
  {
    email: 'unverified1@example.com',
    first_name: 'Tom',
    last_name: 'Unverified',
    birth_date: new Date('2000-06-06'),
    country: Country.USA,
    role: UserRole.STUDENT,
    isVerified: false,
  },
  {
    email: 'unverified2@example.com',
    first_name: 'Nina',
    last_name: 'Pending',
    birth_date: new Date('1999-03-15'),
    country: Country.GERMANY,
    role: UserRole.STUDENT,
    isVerified: false,
  },
];

export async function seedUsers(ds: DataSource): Promise<SeededUsers> {
  const userRepo = ds.getRepository(User);
  const instructorRepo = ds.getRepository(InstructorProfile);
  const studentRepo = ds.getRepository(StudentProfile);

  const hash = await bcrypt.hash('Password123!', 10);
  const DEMO_ADMIN_PASSWORD = process.env.DEMO_ADMIN_PASSWORD || 'Password123!';
  const adminHash = DEMO_ADMIN_PASSWORD === 'Password123!'
    ? hash
    : await bcrypt.hash(DEMO_ADMIN_PASSWORD, 10);

  // ── Admin (configurable via DEMO_ADMIN_EMAIL / DEMO_ADMIN_PASSWORD) ───────
  const adminUser = await userRepo.save(
    userRepo.create({
      email: DEMO_ADMIN_EMAIL,
      first_name: 'Admin',
      last_name: 'User',
      birth_date: new Date('1995-01-01'),
      country: Country.ITALY,
      role: UserRole.ADMIN,
      isVerified: true,
      password: adminHash,
      is_active: true,
    }),
  );
  await studentRepo.save(
    studentRepo.create({ userId: adminUser.id, user: adminUser }),
  );
  console.log(`  ✅ admin: ${DEMO_ADMIN_EMAIL}`);

  // ── Instructors + profiles ────────────────────────────────────────────────
  const instructorProfiles: InstructorProfile[] = [];
  for (const data of INSTRUCTORS) {
    const user = await userRepo.save(
      userRepo.create({ ...data, password: hash, is_active: true }),
    );
    const profile = await instructorRepo.save(
      instructorRepo.create({ userId: user.id, user }),
    );
    instructorProfiles.push(profile);
    // Create StudentProfile so instructors can purchase courses
    await studentRepo.save(studentRepo.create({ userId: user.id, user }));
    const tag = data.isVerified ? '✅' : '⚠️ (unverified)';
    console.log(`  ${tag} instructor: ${data.email}`);
  }

  // ── Students + profiles ───────────────────────────────────────────────────
  const studentProfiles: StudentProfile[] = [];
  for (const data of STUDENTS) {
    const user = await userRepo.save(
      userRepo.create({ ...data, password: hash, is_active: true }),
    );
    const profile = await studentRepo.save(
      studentRepo.create({ userId: user.id, user }),
    );
    studentProfiles.push(profile);
    const tag = data.isVerified ? '✅' : '⚠️ (unverified)';
    console.log(`  ${tag} student: ${data.email}`);
  }

  return { instructorProfiles, studentProfiles };
}
