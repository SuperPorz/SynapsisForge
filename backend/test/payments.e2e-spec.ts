import { Test, TestingModule } from '@nestjs/testing';
import {
  ClassSerializerInterceptor,
  INestApplication,
  ValidationPipe,
} from '@nestjs/common';
import request from 'supertest';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Reflector } from '@nestjs/core';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { PaymentsController } from '../src/modules/payments/payments.controller';
import { PaymentsService } from '../src/modules/payments/payments.service';
import { Payment } from '../src/common/entities/payments.entity';
import { Course } from '../src/common/entities/courses.entity';
import { StudentProfile } from '../src/common/entities/student-profile.entity';
import { Enrollment } from '../src/common/entities/enrollments.entity';
import { CartItem } from '../src/common/entities/cart-item.entity';
import { User } from '../src/common/entities/users.entity';
import { TransformInterceptor } from '../src/common/interceptors/transform.interceptor';
import { LoggingInterceptor } from '../src/common/interceptors/loggin.interceptor';
import { TimeoutInterceptor } from '../src/common/interceptors/timeout.interceptor';
import { HttpExceptionFilter } from '../src/common/filters/http-exception.filter';
import { EnrollmentsService } from '../src/modules/enrollments/enrollments.service';
import type { NextFunction } from 'express';

const USER_ID = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';
const COURSE_ID = 'b1eebc99-9c0b-4ef8-bb6d-6bb9bd380a22';

const mockGateway = {
  clientToken: { generate: jest.fn() },
  webhookNotification: { parse: jest.fn() },
  transaction: { sale: jest.fn() },
  customer: { create: jest.fn() },
  paymentMethod: { create: jest.fn() },
  subscription: { create: jest.fn(), cancel: jest.fn() },
};

const mockCacheManager = { get: jest.fn(), set: jest.fn(), del: jest.fn() };
const mockEventEmitter = { emit: jest.fn() };
const mockEnrollmentsService = { enroll: jest.fn() };

const mockPaymentRepo = {
  findAndCount: jest.fn(),
  findOne: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
};
const mockCourseRepo = { findOne: jest.fn() };
const mockStudentProfileRepo = { findOne: jest.fn() };
const mockEnrollmentRepo = { findOne: jest.fn() };
const mockCartRepo = { delete: jest.fn() };
const mockUserRepo = { findOne: jest.fn(), save: jest.fn() };

describe('Payments (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [PaymentsController],
      providers: [
        PaymentsService,
        { provide: 'BRAINTREE_GATEWAY', useValue: mockGateway },
        { provide: getRepositoryToken(Payment), useValue: mockPaymentRepo },
        { provide: getRepositoryToken(Course), useValue: mockCourseRepo },
        {
          provide: getRepositoryToken(StudentProfile),
          useValue: mockStudentProfileRepo,
        },
        {
          provide: getRepositoryToken(Enrollment),
          useValue: mockEnrollmentRepo,
        },
        { provide: getRepositoryToken(CartItem), useValue: mockCartRepo },
        { provide: getRepositoryToken(User), useValue: mockUserRepo },
        { provide: CACHE_MANAGER, useValue: mockCacheManager },
        { provide: EnrollmentsService, useValue: mockEnrollmentsService },
        { provide: EventEmitter2, useValue: mockEventEmitter },
      ],
    }).compile();

    app = moduleFixture.createNestApplication();

    app.use((req: any, _res: Response, next: NextFunction) => {
      req.user = { id: USER_ID, email: 'alice@example.com' };
      next();
    });

    app.useGlobalInterceptors(
      new ClassSerializerInterceptor(app.get(Reflector)),
      new LoggingInterceptor(),
      new TimeoutInterceptor(),
      new TransformInterceptor(),
    );
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        transform: true,
        forbidNonWhitelisted: true,
      }),
    );
    app.useGlobalFilters(new HttpExceptionFilter());

    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ---------------------------------------------------------------------------
  // GET /payments/client-token
  // ---------------------------------------------------------------------------

  describe('GET /payments/client-token', () => {
    it('should return a client token', async () => {
      mockGateway.clientToken.generate.mockResolvedValue({
        clientToken: 'bt_token',
      });

      const res = await request(app.getHttpServer())
        .get('/payments/client-token')
        .expect(200);

      expect(res.body.data.clientToken).toBe('bt_token');
    });
  });

  // ---------------------------------------------------------------------------
  // POST /payments/webhook
  // ---------------------------------------------------------------------------

  describe('POST /payments/webhook', () => {
    it('should return 400 for invalid webhook signature', async () => {
      mockGateway.webhookNotification.parse.mockImplementation(() => {
        throw new Error('bad sig');
      });

      const res = await request(app.getHttpServer())
        .post('/payments/webhook')
        .send({ bt_signature: 'sig', bt_payload: 'payload' })
        .expect(400);

      expect(res.body.message).toContain('Invalid webhook signature');
    });

    it('should return 200 for valid webhook notification', async () => {
      mockGateway.webhookNotification.parse.mockReturnValue({
        kind: 'subscription_canceled',
        subject: { subscription: { id: 'sub_123' } },
      });
      mockCacheManager.get.mockResolvedValue(null);
      mockUserRepo.findOne.mockResolvedValue(null);

      const res = await request(app.getHttpServer())
        .post('/payments/webhook')
        .send({ bt_signature: 'sig', bt_payload: 'payload' })
        .expect(200);

      expect(res.body.data.received).toBe(true);
    });
  });

  // ---------------------------------------------------------------------------
  // POST /payments/checkout — ValidationPipe error codes
  // ---------------------------------------------------------------------------

  describe('POST /payments/checkout — validation errors', () => {
    it('should return 400 for empty payload', async () => {
      await request(app.getHttpServer())
        .post('/payments/checkout')
        .send({})
        .expect(400);
    });

    it('should return 400 for missing required fields', async () => {
      await request(app.getHttpServer())
        .post('/payments/checkout')
        .send({ courseId: COURSE_ID })
        .expect(400);
    });

    it('should return 400 for invalid nonce type', async () => {
      await request(app.getHttpServer())
        .post('/payments/checkout')
        .send({ courseId: COURSE_ID, nonce: 123, amount: 49.99 })
        .expect(400);
    });
  });

  // ---------------------------------------------------------------------------
  // POST /payments/subscribe — ValidationPipe error codes
  // ---------------------------------------------------------------------------

  describe('POST /payments/subscribe — validation errors', () => {
    it('should return 400 for empty payload', async () => {
      await request(app.getHttpServer())
        .post('/payments/subscribe')
        .send({})
        .expect(400);
    });

    it('should return 400 for missing planId', async () => {
      await request(app.getHttpServer())
        .post('/payments/subscribe')
        .send({ nonce: 'fake-nonce' })
        .expect(400);
    });
  });

  // ---------------------------------------------------------------------------
  // GET /payments/subscription/status — error codes
  // ---------------------------------------------------------------------------

  describe('GET /payments/subscription/status', () => {
    it('should return 404 when user not found', async () => {
      mockUserRepo.findOne.mockResolvedValue(null);

      await request(app.getHttpServer())
        .get('/payments/subscription/status')
        .expect(404);
    });
  });

  // ---------------------------------------------------------------------------
  // POST /payments/subscription/cancel — error codes
  // ---------------------------------------------------------------------------

  describe('POST /payments/subscription/cancel', () => {
    it('should return 400 when no active subscription', async () => {
      mockUserRepo.findOne.mockResolvedValue({
        id: USER_ID,
        plan: 'FREE',
        subscription_id: null,
      });

      await request(app.getHttpServer())
        .post('/payments/subscription/cancel')
        .expect(400);
    });

    it('should return 404 when user not found', async () => {
      mockUserRepo.findOne.mockResolvedValue(null);

      await request(app.getHttpServer())
        .post('/payments/subscription/cancel')
        .expect(404);
    });
  });

  // ---------------------------------------------------------------------------
  // GET /payments/history
  // ---------------------------------------------------------------------------

  describe('GET /payments/history', () => {
    it('should return 200 with empty history', async () => {
      mockPaymentRepo.findAndCount.mockResolvedValue([[], 0]);

      const res = await request(app.getHttpServer())
        .get('/payments/history')
        .expect(200);

      expect(res.body.data.data).toEqual([]);
      expect(res.body.data.total).toBe(0);
    });

    it('should return 200 with paginated data', async () => {
      const mockRow = {
        id: 'p1',
        amount: '29.99',
        currency: 'EUR',
        payment_method: 'credit_card',
        gateway_id: 'gw_1',
        status: 'COMPLETED',
        receipt_url: null,
        created_at: new Date(),
        course: { id: COURSE_ID, title: 'Test Course' },
      };
      mockPaymentRepo.findAndCount.mockResolvedValue([[mockRow], 1]);

      const res = await request(app.getHttpServer())
        .get('/payments/history')
        .query({ page: 1, limit: 10 })
        .expect(200);

      expect(res.body.data.data).toHaveLength(1);
      expect(res.body.data.data[0].id).toBe('p1');
      expect(res.body.data.data[0].amount).toBe('29.99');
    });
  });

  // ---------------------------------------------------------------------------
  // 404 on unknown routes
  // ---------------------------------------------------------------------------

  describe('404 handling', () => {
    it('should return 404 for unknown payment route', async () => {
      await request(app.getHttpServer())
        .post('/payments/unknown')
        .send({})
        .expect(404);
    });

    it('should handle invalid page param gracefully', async () => {
      mockPaymentRepo.findAndCount.mockResolvedValue([[], 0]);

      const res = await request(app.getHttpServer())
        .get('/payments/history')
        .query({ page: 'abc' })
        .expect(200);

      expect(res.body.data.data).toEqual([]);
    });
  });

  // ---------------------------------------------------------------------------
  // POST /payments/checkout — 404/409 from service
  // ---------------------------------------------------------------------------

  describe('POST /payments/checkout — service errors', () => {
    const checkoutPayload = {
      courseId: COURSE_ID,
      nonce: 'fake-nonce',
      amount: 49.99,
    };

    it('should return 404 when course not found', async () => {
      mockStudentProfileRepo.findOne.mockResolvedValue({ userId: USER_ID });
      mockCourseRepo.findOne.mockResolvedValue(null);

      await request(app.getHttpServer())
        .post('/payments/checkout')
        .set('Authorization', 'Bearer test')
        .send(checkoutPayload)
        .expect(404);
    });

    it('should return 409 when already enrolled', async () => {
      mockStudentProfileRepo.findOne.mockResolvedValue({ userId: USER_ID });
      mockCourseRepo.findOne.mockResolvedValue({
        id: COURSE_ID,
        status: 'PUBLISHED',
      });
      mockEnrollmentRepo.findOne.mockResolvedValue({ id: 'enr_1' });

      await request(app.getHttpServer())
        .post('/payments/checkout')
        .set('Authorization', 'Bearer test')
        .send(checkoutPayload)
        .expect(409);
    });

    it('should return 400 when course is not published', async () => {
      mockStudentProfileRepo.findOne.mockResolvedValue({ userId: USER_ID });
      mockCourseRepo.findOne.mockResolvedValue({
        id: COURSE_ID,
        status: 'DRAFT',
      });

      await request(app.getHttpServer())
        .post('/payments/checkout')
        .set('Authorization', 'Bearer test')
        .send(checkoutPayload)
        .expect(400);
    });
  });

  // ---------------------------------------------------------------------------
  // POST /payments/subscribe — 400 conflict
  // ---------------------------------------------------------------------------

  describe('POST /payments/subscribe — service errors', () => {
    const subscribePayload = { nonce: 'fake-nonce', planId: 'monthly' };

    it('should return 409 when already premium', async () => {
      mockUserRepo.findOne.mockResolvedValue({
        id: USER_ID,
        plan: 'PREMIUM',
        subscription_id: 'sub_123',
      });

      await request(app.getHttpServer())
        .post('/payments/subscribe')
        .set('Authorization', 'Bearer test')
        .send(subscribePayload)
        .expect(409);
    });

    it('should return 404 when user not found', async () => {
      mockUserRepo.findOne.mockResolvedValue(null);

      await request(app.getHttpServer())
        .post('/payments/subscribe')
        .set('Authorization', 'Bearer test')
        .send(subscribePayload)
        .expect(404);
    });
  });
});
