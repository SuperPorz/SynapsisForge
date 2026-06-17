/* eslint-disable */
import { DataSource } from 'typeorm';
import { Course } from '../../common/entities/courses.entity';
import { Section } from '../../common/entities/section.entity';
import { Lesson } from '../../common/entities/lessons.entity';
import { Status } from '../../common/entities/enum/courses.enum';

export interface SeededLesson {
  id: string;
  title: string;
  courseId: string;
  courseTitle: string;
}

// Template sezioni con lezioni realistiche per ogni categoria
// Ogni corso PUBLISHED riceve 3 sezioni; i titoli vengono usati verbatim.
// Sezione 1: 2 lezioni | Sezione 2: 3 lezioni | Sezione 3: 3 lezioni → 8 lezioni/corso

const SECTION_TEMPLATES: Record<string, { title: string; lessons: { title: string; duration_seconds: number }[] }[]> = {
  'web-development': [
    {
      title: 'Getting Started',
      lessons: [
        { title: 'Course Overview & Prerequisites', duration_seconds: 420 },
        { title: 'Setting Up the Development Environment', duration_seconds: 780 },
      ],
    },
    {
      title: 'Core Concepts',
      lessons: [
        { title: 'Fundamentals & Architecture', duration_seconds: 1200 },
        { title: 'Building Your First Feature', duration_seconds: 1500 },
        { title: 'State Management Patterns', duration_seconds: 1080 },
      ],
    },
    {
      title: 'Advanced Topics & Projects',
      lessons: [
        { title: 'Performance Optimization', duration_seconds: 1440 },
        { title: 'Testing & Best Practices', duration_seconds: 1320 },
        { title: 'Capstone Project', duration_seconds: 2100 },
      ],
    },
  ],
  'data-science': [
    {
      title: 'Introduction & Setup',
      lessons: [
        { title: 'What You Will Learn & Tools Overview', duration_seconds: 360 },
        { title: 'Installing Python, Jupyter, and Libraries', duration_seconds: 660 },
      ],
    },
    {
      title: 'Data Wrangling & Exploration',
      lessons: [
        { title: 'Loading and Cleaning Datasets', duration_seconds: 1380 },
        { title: 'Exploratory Data Analysis (EDA)', duration_seconds: 1560 },
        { title: 'Feature Engineering Techniques', duration_seconds: 1200 },
      ],
    },
    {
      title: 'Modeling & Deployment',
      lessons: [
        { title: 'Choosing and Training Models', duration_seconds: 1800 },
        { title: 'Evaluation Metrics & Cross-Validation', duration_seconds: 1260 },
        { title: 'Deploying Models with FastAPI', duration_seconds: 1680 },
      ],
    },
  ],
  'ui-ux-design': [
    {
      title: 'Design Foundations',
      lessons: [
        { title: 'Design Principles & Visual Hierarchy', duration_seconds: 540 },
        { title: 'Color Theory & Typography', duration_seconds: 720 },
      ],
    },
    {
      title: 'UX Process',
      lessons: [
        { title: 'User Research Methods', duration_seconds: 1200 },
        { title: 'Wireframing & Information Architecture', duration_seconds: 1080 },
        { title: 'Prototyping & User Testing', duration_seconds: 1380 },
      ],
    },
    {
      title: 'Delivery & Handoff',
      lessons: [
        { title: 'Design Systems & Component Libraries', duration_seconds: 1620 },
        { title: 'Developer Handoff with Figma', duration_seconds: 900 },
        { title: 'Portfolio Project: Full App Design', duration_seconds: 2400 },
      ],
    },
  ],
  'mobile-development': [
    {
      title: 'Mobile Development Basics',
      lessons: [
        { title: 'Mobile vs Web: Key Differences', duration_seconds: 480 },
        { title: 'Setting Up Emulators & Physical Devices', duration_seconds: 840 },
      ],
    },
    {
      title: 'Building Screens & Navigation',
      lessons: [
        { title: 'UI Components & Layouts', duration_seconds: 1320 },
        { title: 'Stack & Tab Navigation', duration_seconds: 1080 },
        { title: 'Fetching Data from APIs', duration_seconds: 1440 },
      ],
    },
    {
      title: 'Production & Publishing',
      lessons: [
        { title: 'State Management & Local Storage', duration_seconds: 1560 },
        { title: 'Push Notifications & Device APIs', duration_seconds: 1200 },
        { title: 'Publishing to App Store & Play Store', duration_seconds: 1800 },
      ],
    },
  ],
  'devops': [
    {
      title: 'DevOps Foundations',
      lessons: [
        { title: 'DevOps Culture & Principles', duration_seconds: 420 },
        { title: 'Version Control & Branching Strategies', duration_seconds: 780 },
      ],
    },
    {
      title: 'Containerization & Orchestration',
      lessons: [
        { title: 'Docker: Images, Containers & Volumes', duration_seconds: 1680 },
        { title: 'Docker Compose for Local Development', duration_seconds: 1200 },
        { title: 'Kubernetes: Pods, Services & Deployments', duration_seconds: 2100 },
      ],
    },
    {
      title: 'CI/CD & Cloud',
      lessons: [
        { title: 'Building Automated Pipelines', duration_seconds: 1560 },
        { title: 'Infrastructure as Code Basics', duration_seconds: 1440 },
        { title: 'Monitoring & Alerting in Production', duration_seconds: 1320 },
      ],
    },
  ],
  'cybersecurity': [
    {
      title: 'Security Mindset & Fundamentals',
      lessons: [
        { title: 'Threat Modeling & Attack Surfaces', duration_seconds: 600 },
        { title: 'Setting Up a Safe Lab Environment', duration_seconds: 900 },
      ],
    },
    {
      title: 'Attack Techniques',
      lessons: [
        { title: 'Reconnaissance & Information Gathering', duration_seconds: 1440 },
        { title: 'Exploitation Techniques & Payloads', duration_seconds: 1800 },
        { title: 'Post-Exploitation & Lateral Movement', duration_seconds: 1620 },
      ],
    },
    {
      title: 'Defense & Reporting',
      lessons: [
        { title: 'Hardening Systems & Networks', duration_seconds: 1380 },
        { title: 'Log Analysis & Incident Response', duration_seconds: 1260 },
        { title: 'Writing Professional Pentest Reports', duration_seconds: 1080 },
      ],
    },
  ],
};

export async function seedSections(
  ds: DataSource,
  courses: Course[],
): Promise<SeededLesson[]> {
  const sectionRepo = ds.getRepository(Section);
  const lessonRepo = ds.getRepository(Lesson);

  const publishedCourses = courses.filter((c) => c.status === Status.PUBLISHED);
  const allSeededLessons: SeededLesson[] = [];

  for (const course of publishedCourses) {
    // Resolve category slug from the course relation
    const categorySlug: string = (course.category as any)?.slug ?? 'web-development';
    const templates = SECTION_TEMPLATES[categorySlug] ?? SECTION_TEMPLATES['web-development'];

    for (let si = 0; si < templates.length; si++) {
      const tmpl = templates[si];

      const section = await sectionRepo.save(
        sectionRepo.create({
          title: tmpl.title,
          order: si + 1,
          course,
        }),
      );

      for (let li = 0; li < tmpl.lessons.length; li++) {
        const lessonDef = tmpl.lessons[li];
        const lesson = await lessonRepo.save(
          lessonRepo.create({
            title: lessonDef.title,
            order: li + 1,
            duration_seconds: lessonDef.duration_seconds,
            content_id: `placeholder-${course.id}-s${si + 1}-l${li + 1}`,
            course,
            section,
          }),
        );

        allSeededLessons.push({
          id: lesson.id,
          title: lesson.title,
          courseId: course.id,
          courseTitle: course.title,
        });
      }
    }

    console.log(`  ✅ "${course.title}" → 3 sections, 8 lessons`);
  }

  console.log(`  ✅ Total lessons seeded: ${allSeededLessons.length}`);
  return allSeededLessons;
}
