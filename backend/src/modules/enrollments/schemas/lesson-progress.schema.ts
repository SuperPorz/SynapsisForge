import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type LessonProgressDocument = HydratedDocument<LessonProgress>;

@Schema({ collection: 'lesson_progress' }) // Opzionale: definisce il nome della collezione
export class LessonProgress {
  @Prop({ required: true })
  enrollmentId!: string;

  @Prop({ required: true })
  lessonId!: string; // FK verso Lesson PostgreSQL

  @Prop({ default: Date.now })
  completedAt!: Date;
}

// Generazione dello schema fisico di Mongoose
// prettier-ignore
export const LessonProgressSchema = SchemaFactory.createForClass(LessonProgress);
