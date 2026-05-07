import { DataSource, DeepPartial } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from '../../common/entities/users.entity';
import { InstructorProfile } from '../../common/entities/InstructorProfile.entity';
import { StudentProfile } from '../../common/entities/StudentProfile.entity';
import { UserRole, Country } from '../../common/entities/enum/users.enum';

export async function seedUsers(ds: DataSource): Promise<{
  instructors: InstructorProfile[];
  students: StudentProfile[];
}> {
  const userRepo = ds.getRepository(User);
  const instructorRepo = ds.getRepository(InstructorProfile);
  const studentRepo = ds.getRepository(StudentProfile);

  const hash = await bcrypt.hash('Password123!', 10);

  // ── Instructors ──────────────────────────────────────────
  const instructorData: DeepPartial<User>[] = [
    {
      email: 'marco.rossi@example.com',
      password: hash,
      first_name: 'Marco',
      last_name: 'Rossi',
      birth_date: new Date('1985-03-15'),
      country: Country.ITALY,
      role: UserRole.INSTRUCTOR,
    },
    {
      email: 'giulia.bianchi@example.com',
      password: hash,
      first_name: 'Giulia',
      last_name: 'Bianchi',
      birth_date: new Date('1990-07-22'),
      country: Country.ITALY,
      role: UserRole.INSTRUCTOR,
    },
  ];

  const instructorUsers = await userRepo.save(userRepo.create(instructorData));

  const instructors = await instructorRepo.save(
    instructorUsers.map((u) =>
      instructorRepo.create({ userId: u.id, user: u }),
    ),
  );

  // ── Students ─────────────────────────────────────────────
  const studentData: DeepPartial<User>[] = [
    {
      email: 'student1@example.com',
      password: hash,
      first_name: 'Luca',
      last_name: 'Verdi',
      birth_date: new Date('2000-01-10'),
      country: Country.ITALY,
      role: UserRole.STUDENT,
    },
    {
      email: 'student2@example.com',
      password: hash,
      first_name: 'Sara',
      last_name: 'Neri',
      birth_date: new Date('1999-05-20'),
      country: Country.ITALY,
      role: UserRole.STUDENT,
    },
    {
      email: 'student3@example.com',
      password: hash,
      first_name: 'Paolo',
      last_name: 'Conti',
      birth_date: new Date('2001-08-30'),
      country: Country.ITALY,
      role: UserRole.STUDENT,
    },
    {
      email: 'student4@example.com',
      password: hash,
      first_name: 'Anna',
      last_name: 'Russo',
      birth_date: new Date('1998-11-15'),
      country: Country.ITALY,
      role: UserRole.STUDENT,
    },
    {
      email: 'student5@example.com',
      password: hash,
      first_name: 'Davide',
      last_name: 'Gallo',
      birth_date: new Date('2002-03-25'),
      country: Country.ITALY,
      role: UserRole.STUDENT,
    },
    {
      email: 'student6@example.com',
      password: hash,
      first_name: 'Chiara',
      last_name: 'Ferrara',
      birth_date: new Date('1997-09-05'),
      country: Country.ITALY,
      role: UserRole.STUDENT,
    },
    {
      email: 'student7@example.com',
      password: hash,
      first_name: 'Matteo',
      last_name: 'Ricci',
      birth_date: new Date('2000-12-18'),
      country: Country.ITALY,
      role: UserRole.STUDENT,
    },
    {
      email: 'student8@example.com',
      password: hash,
      first_name: 'Elena',
      last_name: 'Marino',
      birth_date: new Date('1999-04-08'),
      country: Country.ITALY,
      role: UserRole.STUDENT,
    },
    {
      email: 'student9@example.com',
      password: hash,
      first_name: 'Roberto',
      last_name: 'Costa',
      birth_date: new Date('2001-07-14'),
      country: Country.ITALY,
      role: UserRole.STUDENT,
    },
    {
      email: 'student10@example.com',
      password: hash,
      first_name: 'Valentina',
      last_name: 'Esposito',
      birth_date: new Date('1998-02-28'),
      country: Country.ITALY,
      role: UserRole.STUDENT,
    },
  ];

  const studentUsers = await userRepo.save(userRepo.create(studentData));

  const students = await studentRepo.save(
    studentUsers.map((u) => studentRepo.create({ userId: u.id, user: u })),
  );

  console.log(
    `✅ ${instructors.length} instructor e ${students.length} student creati`,
  );
  return { instructors, students };
}
