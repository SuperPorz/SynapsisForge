import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

// --- tipi annidati ---

@Schema({ _id: false }) // _id: false perché sono subdocument, non collezioni indipendenti
export class QuizOption {
  @Prop({ required: true })
  label!: string;

  @Prop({ required: true })
  text!: string;
}

@Schema({ _id: false })
export class QuizItem {
  @Prop({ required: true })
  question!: string;

  @Prop({ type: [QuizOption], default: [] })
  options!: QuizOption[];

  @Prop({ required: true })
  correctAnswer!: string; // corrisponde a QuizOption.label, es. "A", "B"
}

@Schema({ _id: false })
export class Attachment {
  @Prop({ required: true })
  name!: string;

  @Prop({ required: true })
  url!: string;

  @Prop({ required: true })
  type!: string; // es. "pdf", "zip"
}

// --- documento principale ---

export type LessonContentDocument = LessonContent & Document;

@Schema({ collection: 'lesson_contents', timestamps: true })
export class LessonContent {
  @Prop({ required: true, unique: true })
  lessonId!: string; // collega all'UUID di PostgreSQL

  @Prop({ required: true })
  videoUrl!: string;

  @Prop({ default: null })
  transcript!: string | null;

  @Prop({ type: [Attachment], default: [] })
  attachments!: Attachment[];

  @Prop({ type: [QuizItem], default: [] })
  quiz!: QuizItem[];
}

export const LessonContentSchema = SchemaFactory.createForClass(LessonContent);
