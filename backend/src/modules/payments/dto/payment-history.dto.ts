import { Expose, Transform } from 'class-transformer';
import type { Payment } from 'src/common/entities/payments.entity';

export class PaymentHistoryItem {
  @Expose()
  id!: string;

  @Expose()
  amount!: string;

  @Expose()
  currency!: string;

  @Expose()
  payment_method?: string;

  @Expose()
  gateway_id!: string;

  @Expose()
  status!: string;

  @Expose()
  receipt_url?: string;

  @Expose()
  created_at!: Date;

  @Expose()
  @Transform(({ obj }) => (obj as Payment).course?.id ?? null)
  courseId?: string;

  @Expose()
  @Transform(({ obj }) => (obj as Payment).course?.title ?? null)
  courseTitle?: string;
}
