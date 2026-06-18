/* eslint-disable */
import { getMongoUri } from '../shared/mongo-uri.util';
import mongoose from 'mongoose';
import { LessonContentSchema } from '../../modules/lessons/schemas/lesson-content.schema';
import { SeededLesson } from './sections.seed';

// ── Video pubblici di test (no auth, no S3 richiesto) ─────────────────────────
// Tutti MP4 direct-link, funzionano con USE_S3=false
const TEST_VIDEOS = [
  'https://test-videos.co.uk/vids/bigbuckbunny/mp4/h264/720/Big_Buck_Bunny_720_10s_1MB.mp4',
  'https://test-videos.co.uk/vids/bigbuckbunny/mp4/h264/720/Big_Buck_Bunny_720_10s_2MB.mp4',
  'https://test-videos.co.uk/vids/bigbuckbunny/mp4/h264/720/Big_Buck_Bunny_720_10s_5MB.mp4',
  'https://test-videos.co.uk/vids/bigbuckbunny/mp4/h264/720/Big_Buck_Bunny_720_10s_10MB.mp4',
  'https://test-videos.co.uk/vids/bigbuckbunny/mp4/h264/360/Big_Buck_Bunny_360_10s_1MB.mp4',
  'https://test-videos.co.uk/vids/jellyfish/mp4/h264/720/Jellyfish_720_10s_1MB.mp4',
  'https://test-videos.co.uk/vids/jellyfish/mp4/h264/720/Jellyfish_720_10s_2MB.mp4',
  'https://test-videos.co.uk/vids/jellyfish/mp4/h264/720/Jellyfish_720_10s_5MB.mp4',
  'https://test-videos.co.uk/vids/jellyfish/mp4/h264/360/Jellyfish_360_10s_1MB.mp4',
  'https://test-videos.co.uk/vids/jellyfish/mp4/h264/1080/Jellyfish_1080_10s_2MB.mp4',
];

// ── Transcript pool ───────────────────────────────────────────────────────────
const TRANSCRIPTS = [
  "Welcome to this lesson. In this video we'll cover the key concepts step by step, starting with the fundamentals before moving into practical examples.",
  "In this lesson we dive into the core topic. Pay close attention to the code examples — they illustrate patterns you'll use constantly in real projects.",
  "Today we'll build something concrete. Follow along with the code and pause whenever you need to. The goal is understanding, not speed.",
  'This lesson covers advanced techniques. If anything is unclear, re-watch the relevant section or drop a question in the course discussion.',
  null,
];

// ── Quiz pool per categoria (riutilizzato ciclicamente per lezione) ───────────
const QUIZZES: Record<
  string,
  {
    question: string;
    options: { label: string; text: string }[];
    correctAnswer: string;
  }[]
> = {
  'web-development': [
    {
      question: 'What does the useState hook return in React?',
      options: [
        { label: 'A', text: 'A single value' },
        { label: 'B', text: 'An array with a value and a setter function' },
        { label: 'C', text: 'An object with get and set methods' },
        { label: 'D', text: 'A Promise' },
      ],
      correctAnswer: 'B',
    },
    {
      question: 'Which HTTP method is idempotent and safe?',
      options: [
        { label: 'A', text: 'POST' },
        { label: 'B', text: 'PUT' },
        { label: 'C', text: 'GET' },
        { label: 'D', text: 'PATCH' },
      ],
      correctAnswer: 'C',
    },
  ],
  'data-science': [
    {
      question: 'Which Pandas method reads a CSV file?',
      options: [
        { label: 'A', text: 'pd.open_csv()' },
        { label: 'B', text: 'pd.read_csv()' },
        { label: 'C', text: 'pd.load_csv()' },
        { label: 'D', text: 'pd.import_csv()' },
      ],
      correctAnswer: 'B',
    },
    {
      question: 'What does a confusion matrix measure?',
      options: [
        { label: 'A', text: 'Model training speed' },
        { label: 'B', text: 'Classification performance' },
        { label: 'C', text: 'Feature importance' },
        { label: 'D', text: 'Dataset size' },
      ],
      correctAnswer: 'B',
    },
  ],
  'ui-ux-design': [
    {
      question: "What does 'affordance' mean in UX design?",
      options: [
        { label: 'A', text: 'The visual style of a button' },
        {
          label: 'B',
          text: 'A property that communicates how an element can be used',
        },
        { label: 'C', text: 'The cost of design tools' },
        { label: 'D', text: 'Accessibility compliance' },
      ],
      correctAnswer: 'B',
    },
    {
      question: 'What is the primary purpose of wireframing?',
      options: [
        { label: 'A', text: 'To define final colors and fonts' },
        {
          label: 'B',
          text: 'To define layout and structure without visual styling',
        },
        { label: 'C', text: 'To write frontend code' },
        { label: 'D', text: 'To test performance' },
      ],
      correctAnswer: 'B',
    },
  ],
  'mobile-development': [
    {
      question:
        'What is the main advantage of Flutter over native development?',
      options: [
        { label: 'A', text: 'Better performance than native' },
        { label: 'B', text: 'Single codebase for iOS and Android' },
        { label: 'C', text: 'No need for a compiler' },
        { label: 'D', text: 'Built-in backend support' },
      ],
      correctAnswer: 'B',
    },
    {
      question: 'What does the Expo managed workflow provide?',
      options: [
        { label: 'A', text: 'Access to all native modules' },
        {
          label: 'B',
          text: 'A simplified setup with OTA updates and build service',
        },
        { label: 'C', text: 'A desktop app framework' },
        { label: 'D', text: 'A CSS-in-JS library' },
      ],
      correctAnswer: 'B',
    },
  ],
  devops: [
    {
      question: 'What is the purpose of a Dockerfile?',
      options: [
        { label: 'A', text: 'To configure Kubernetes clusters' },
        {
          label: 'B',
          text: 'To define the instructions for building a Docker image',
        },
        { label: 'C', text: 'To manage environment variables' },
        { label: 'D', text: 'To write CI/CD pipelines' },
      ],
      correctAnswer: 'B',
    },
    {
      question: 'What does idempotency mean in infrastructure as code?',
      options: [
        { label: 'A', text: 'Running the code once produces errors' },
        {
          label: 'B',
          text: 'Running the code multiple times produces the same result',
        },
        { label: 'C', text: 'The code auto-scales resources' },
        { label: 'D', text: 'The infrastructure cannot be deleted' },
      ],
      correctAnswer: 'B',
    },
  ],
  cybersecurity: [
    {
      question: 'What is a SQL injection attack?',
      options: [
        {
          label: 'A',
          text: 'Injecting malicious SQL into input fields to manipulate a database',
        },
        { label: 'B', text: 'Overloading a server with SQL queries' },
        { label: 'C', text: 'Stealing SQL database backups' },
        { label: 'D', text: 'Encrypting SQL data at rest' },
      ],
      correctAnswer: 'A',
    },
    {
      question: 'What does XSS stand for?',
      options: [
        { label: 'A', text: 'Cross-Site Scripting' },
        { label: 'B', text: 'Cross-Server Security' },
        { label: 'C', text: 'Extended Security Schema' },
        { label: 'D', text: 'XML Style Sheets' },
      ],
      correctAnswer: 'A',
    },
  ],
};

function randomElement<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function getCategoryFromCourseTitle(courseTitle: string): string {
  const title = courseTitle.toLowerCase();
  if (
    title.includes('react') ||
    title.includes('nest') ||
    title.includes('angular') ||
    title.includes('next') ||
    title.includes('vue') ||
    title.includes('css') ||
    title.includes('graphql') ||
    title.includes('testing') ||
    title.includes('rust') ||
    title.includes('blockchain') ||
    title.includes('go for') ||
    title.includes('javascript')
  )
    return 'web-development';
  if (
    title.includes('python') ||
    title.includes('machine learning') ||
    title.includes('deep learning') ||
    title.includes('sql') ||
    title.includes('d3') ||
    title.includes('statistic') ||
    title.includes('data') ||
    title.includes('ai-assisted')
  )
    return 'data-science';
  if (
    title.includes('figma') ||
    title.includes('ux') ||
    title.includes('design system') ||
    title.includes('motion') ||
    title.includes('ui/ux') ||
    title.includes('uikit')
  )
    return 'ui-ux-design';
  if (
    title.includes('flutter') ||
    title.includes('react native') ||
    title.includes('swift') ||
    title.includes('kotlin') ||
    title.includes('ios') ||
    title.includes('android')
  )
    return 'mobile-development';
  if (
    title.includes('docker') ||
    title.includes('ci/cd') ||
    title.includes('terraform') ||
    title.includes('linux') ||
    title.includes('devops')
  )
    return 'devops';
  if (
    title.includes('hacking') ||
    title.includes('owasp') ||
    title.includes('network security') ||
    title.includes('cryptography') ||
    title.includes('security')
  )
    return 'cybersecurity';
  return 'web-development';
}

export async function seedMongo(seededLessons: SeededLesson[]): Promise<void> {
  const uri = getMongoUri();

  await mongoose.connect(uri);
  console.log('  📦 MongoDB connected');

  const LessonContent = mongoose.model('LessonContent', LessonContentSchema);

  // Pulizia completa prima del seed
  await LessonContent.deleteMany({});

  const docs = seededLessons.map((lesson, index) => {
    const categoryKey = getCategoryFromCourseTitle(lesson.courseTitle);
    const quizPool = QUIZZES[categoryKey] ?? QUIZZES['web-development'];
    const quiz = [quizPool[index % quizPool.length]];
    const videoUrl = TEST_VIDEOS[index % TEST_VIDEOS.length];
    const transcript = TRANSCRIPTS[index % TRANSCRIPTS.length];

    return {
      lessonId: lesson.id, // ← UUID reale da PostgreSQL
      videoUrl,
      s3Key: `videos/placeholder.mp4`, // placeholder finché S3 non è configurato
      transcript,
      attachments: [],
      quiz,
    };
  });

  await LessonContent.insertMany(docs);

  await mongoose.disconnect();
  console.log(
    `  ✅ ${docs.length} lesson_contents created on MongoDB (real UUIDs from PG)`,
  );
}
