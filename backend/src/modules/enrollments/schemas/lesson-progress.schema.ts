import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type LessonProgressDocument = HydratedDocument<LessonProgress>;

@Schema({ _id: false })
export class QuizAnswer {
  @Prop({ required: true })
  questionIndex!: number;

  @Prop({ required: true })
  selectedLabel!: string;

  @Prop({ required: true })
  correct!: boolean;
}

@Schema({ collection: 'lesson_progress' })
export class LessonProgress {
  @Prop({ required: true })
  enrollmentId!: string;

  @Prop({ required: true })
  lessonId!: string;

  @Prop({ default: Date.now })
  completedAt!: Date;

  @Prop({ type: Number, default: 0 })
  last_position_seconds!: number;

  @Prop({ type: Boolean, default: false })
  completed!: boolean;

  @Prop({ type: [QuizAnswer], default: [] })
  quizAnswers!: QuizAnswer[];
}

export const LessonProgressSchema =
  SchemaFactory.createForClass(LessonProgress);
