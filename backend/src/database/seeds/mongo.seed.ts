/* eslint-disable */
import { getMongoUri } from '../shared/mongo-uri.util';
import mongoose from 'mongoose';
import { LessonContentSchema } from '../../modules/lessons/schemas/lesson-content.schema';
import { SeededLesson } from './sections.seed';

// ── Singolo video di test ──────────────────────────────────────────────────────
// Tutte e 240 lezioni usano lo stesso video (1MB). Dopo ogni reset S3,
// reset.sh lo ricarica su S3 con la stessa s3Key.
const TEST_VIDEOS = [
  'https://test-videos.co.uk/vids/bigbuckbunny/mp4/h264/720/Big_Buck_Bunny_720_10s_1MB.mp4',
];

// ── Transcript pool ───────────────────────────────────────────────────────────
const TRANSCRIPTS = [
  "Welcome to this lesson. In this video we'll cover the key concepts step by step, starting with the fundamentals before moving into practical examples.",
  "In this lesson we dive into the core topic. Pay close attention to the code examples — they illustrate patterns you'll use constantly in real projects.",
  "Today we'll build something concrete. Follow along with the code and pause whenever you need to. The goal is understanding, not speed.",
  'This lesson covers advanced techniques. If anything is unclear, re-watch the relevant section or drop a question in the course discussion.',
  null,
];

// ── Quiz pool per categoria ────────────────────────────────────────────────────
// Ogni item include explanation: mostrata al frontend dopo la risposta
const QUIZZES: Record<
  string,
  {
    question: string;
    options: { label: string; text: string }[];
    correctAnswer: string;
    explanation: string;
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
      explanation:
        'useState returns a tuple [state, setState]. The first element is the current value, the second is the updater function. Destructuring makes it easy to name them: const [count, setCount] = useState(0).',
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
      explanation:
        'GET is both safe (no side effects) and idempotent (repeated calls return the same result). POST creates resources and is neither. PUT is idempotent but not safe since it modifies data.',
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
      explanation:
        'pd.read_csv() is the standard Pandas function for loading CSV files into a DataFrame. It accepts dozens of parameters to handle encoding, separators, headers, and date parsing.',
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
      explanation:
        'A confusion matrix shows true positives, false positives, true negatives, and false negatives for a classifier. From it you derive precision, recall, and F1 score — the core metrics for evaluating classification models.',
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
      explanation:
        'Affordance, coined by Don Norman, refers to the perceived and actual properties of an object that suggest how it should be used. A button that looks pressable has good affordance. Poor affordance leads to user confusion.',
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
      explanation:
        'Wireframes focus on information architecture and user flow, deliberately stripping away color and typography to avoid distracting from structural decisions. High-fidelity design comes later once layout is validated.',
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
      explanation:
        "Flutter's primary value proposition is write-once, run-everywhere: one Dart codebase targets iOS, Android, web, and desktop. Performance is close to native thanks to AOT compilation, but the true win is development velocity.",
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
      explanation:
        'The Expo managed workflow abstracts native build tooling, provides over-the-air JS updates via EAS Update, and offers a cloud build service. The tradeoff is limited native module access — for full control you eject to bare workflow.',
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
      explanation:
        'A Dockerfile is a text file with sequential instructions (FROM, RUN, COPY, CMD…) that Docker executes to build a layered image. Each instruction creates a new layer, enabling caching and efficient rebuilds.',
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
      explanation:
        'Idempotency guarantees that applying the same configuration repeatedly converges to the same desired state without side effects. Tools like Terraform and Ansible are built around this principle — apply once or a hundred times, the result is identical.',
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
      explanation:
        'SQL injection exploits unsanitized user input concatenated into SQL queries. Attackers can read, modify, or delete data and bypass authentication. Prevention: always use parameterized queries or an ORM — never string-concatenate user input into SQL.',
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
      explanation:
        'Cross-Site Scripting (XSS) allows attackers to inject malicious scripts into pages viewed by other users, stealing cookies, session tokens, or redirecting traffic. Prevention: escape output, use Content Security Policy, and sanitize HTML input.',
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

    const s3Key = `videos/${videoUrl.substring(videoUrl.lastIndexOf('/') + 1).toLowerCase().replace(/[^a-z0-9._-]/g, '_')}`;

    return {
      lessonId: lesson.id, // ← UUID reale da PostgreSQL
      videoUrl,
      s3Key,
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
