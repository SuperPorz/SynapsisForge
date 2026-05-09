import mongoose from 'mongoose';
import { LessonContentSchema } from '../../modules/lessons/schemas/lesson-content.schema';
import { v4 as uuidv4 } from 'uuid';

const fakeLessons = [
  {
    lessonId: uuidv4(),
    videoUrl: 'https://cdn.example.com/nestjs-intro.mp4',
    transcript:
      'Benvenuti al corso NestJS. In questa lezione vedremo la struttura base del framework...',
    attachments: [
      {
        name: 'Slides Lezione 1',
        url: 'https://cdn.example.com/slides-01.pdf',
        type: 'pdf',
      },
      {
        name: 'Starter Kit',
        url: 'https://cdn.example.com/starter.zip',
        type: 'zip',
      },
    ],
    quiz: [
      {
        question: 'Cosa rappresenta un Module in NestJS?',
        options: [
          { label: 'A', text: 'Un singolo endpoint HTTP' },
          {
            label: 'B',
            text: 'Un blocco funzionale che raggruppa controller e provider',
          },
          { label: 'C', text: 'Un middleware globale' },
          { label: 'D', text: 'Un file di configurazione' },
        ],
        correctAnswer: 'B',
      },
    ],
  },
  {
    lessonId: uuidv4(),
    videoUrl: 'https://cdn.example.com/typeorm-entities.mp4',
    transcript:
      'In questa lezione definiamo le entity TypeORM e le relazioni tra tabelle...',
    attachments: [
      {
        name: 'Cheatsheet TypeORM',
        url: 'https://cdn.example.com/typeorm-cheat.pdf',
        type: 'pdf',
      },
    ],
    quiz: [
      {
        question:
          'Quale decorator definisce una chiave primaria UUID in TypeORM?',
        options: [
          { label: 'A', text: '@PrimaryColumn' },
          { label: 'B', text: '@PrimaryGeneratedColumn("uuid")' },
          { label: 'C', text: '@UuidColumn' },
          { label: 'D', text: '@Generated("uuid")' },
        ],
        correctAnswer: 'B',
      },
    ],
  },
  {
    lessonId: uuidv4(),
    videoUrl: 'https://cdn.example.com/react-hooks.mp4',
    transcript:
      'Gli hooks di React ci permettono di usare lo stato nei componenti funzionali...',
    attachments: [
      {
        name: 'Esempi Hooks',
        url: 'https://cdn.example.com/hooks-examples.zip',
        type: 'zip',
      },
    ],
    quiz: [
      {
        question: 'Quale hook usi per effetti collaterali in React?',
        options: [
          { label: 'A', text: 'useState' },
          { label: 'B', text: 'useContext' },
          { label: 'C', text: 'useEffect' },
          { label: 'D', text: 'useReducer' },
        ],
        correctAnswer: 'C',
      },
    ],
  },
  {
    lessonId: uuidv4(),
    videoUrl: 'https://cdn.example.com/python-pandas.mp4',
    transcript:
      'Pandas è la libreria fondamentale per la manipolazione di dati in Python...',
    attachments: [
      {
        name: 'Dataset Esempio',
        url: 'https://cdn.example.com/dataset.zip',
        type: 'zip',
      },
      {
        name: 'Notebook Lezione',
        url: 'https://cdn.example.com/pandas-notebook.pdf',
        type: 'pdf',
      },
    ],
    quiz: [
      {
        question: 'Come si legge un CSV con Pandas?',
        options: [
          { label: 'A', text: 'pandas.open_csv()' },
          { label: 'B', text: 'pd.read_csv()' },
          { label: 'C', text: 'pd.load("file.csv")' },
          { label: 'D', text: 'pandas.import_csv()' },
        ],
        correctAnswer: 'B',
      },
    ],
  },
  {
    lessonId: uuidv4(),
    videoUrl: 'https://cdn.example.com/figma-intro.mp4',
    transcript:
      'Figma è uno strumento di design collaborativo basato su browser...',
    attachments: [
      {
        name: 'Template Figma',
        url: 'https://cdn.example.com/figma-template.pdf',
        type: 'pdf',
      },
    ],
    quiz: [
      {
        question: 'Cosa sono i "Components" in Figma?',
        options: [
          { label: 'A', text: 'Plugin di terze parti' },
          {
            label: 'B',
            text: 'Elementi riutilizzabili con istanze sincronizzate',
          },
          { label: 'C', text: 'Pagine del progetto' },
          { label: 'D', text: 'Livelli di un frame' },
        ],
        correctAnswer: 'B',
      },
    ],
  },
];

export async function seedMongo(): Promise<void> {
  const uri = `mongodb://${process.env.MONGO_USER}:${process.env.MONGO_PASS}@localhost:27017/synapsis?authSource=${process.env.MONGO_AUTH_SOURCE ?? 'admin'}`;
  await mongoose.connect(uri);
  console.log('📦 MongoDB connesso');

  const LessonContent = mongoose.model('LessonContent', LessonContentSchema);

  // pulizia collection prima del seed
  await LessonContent.deleteMany({});

  await LessonContent.insertMany(fakeLessons);

  await mongoose.disconnect();
  console.log(`✅ ${fakeLessons.length} lesson content creati su MongoDB`);
}
