import { Expose, Transform } from 'class-transformer';

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
  @Transform(({ obj }) => obj.course?.id ?? null)
  courseId?: string;

  @Expose()
  @Transform(({ obj }) => obj.course?.title ?? null)
  courseTitle?: string;
}
