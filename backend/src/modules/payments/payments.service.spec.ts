import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { EventEmitter2 } from '@nestjs/event-emitter';
import type { Cache } from 'cache-manager';
import { PaymentsService } from './payments.service';
import { Payment } from 'src/common/entities/payments.entity';
import { Course } from 'src/common/entities/courses.entity';
import { StudentProfile } from 'src/common/entities/student-profile.entity';
import { Enrollment } from 'src/common/entities/enrollments.entity';
import { CartItem } from 'src/common/entities/cart-item.entity';
import { User } from 'src/common/entities/users.entity';
import { SubscriptionPlan } from 'src/common/entities/enum/users.enum';
import { EnrollmentsService } from '../enrollments/enrollments.service';

describe('PaymentsService', () => {
  let service: PaymentsService;

  const mockGateway = {
    webhookNotification: { parse: jest.fn() },
    clientToken: { generate: jest.fn() },
    transaction: { sale: jest.fn() },
    customer: { create: jest.fn() },
    paymentMethod: { create: jest.fn() },
    subscription: { create: jest.fn(), cancel: jest.fn() },
  };

  const mockCacheManager: jest.Mocked<Pick<Cache, 'get' | 'set' | 'del'>> = {
    get: jest.fn(),
    set: jest.fn(),
    del: jest.fn(),
  };

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

  const USER_ID = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';
  const COURSE_ID = 'b1eebc99-9c0b-4ef8-bb6d-6bb9bd380a22';

  const mockUser = {
    id: USER_ID,
    email: 'alice@example.com',
    first_name: 'Alice',
    last_name: 'Thompson',
    plan: SubscriptionPlan.FREE,
    subscription_id: null,
    subscription_status: null,
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
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

    service = module.get<PaymentsService>(PaymentsService);
  });

  describe('handleWebhook', () => {
    const signature = 'test_signature';
    const payload = 'test_payload';

    function mockNotification(kind: string, subscriptionId = 'sub_123') {
      mockGateway.webhookNotification.parse.mockReturnValue({
        kind,
        subject: {
          subscription: {
            id: subscriptionId,
            transactions: [{ id: 'tx_abc', amount: '29.99' }],
          },
        },
      });
    }

    it('should throw BadRequestException on invalid signature', async () => {
      mockGateway.webhookNotification.parse.mockImplementation(() => {
        throw new Error('bad sig');
      });

      await expect(service.handleWebhook(signature, payload)).rejects.toThrow(
        'Invalid webhook signature',
      );
    });

    it('should skip duplicate webhook via idempotency cache', async () => {
      mockNotification('subscription_charged_successfully');
      mockCacheManager.get.mockResolvedValue(true);

      const result = await service.handleWebhook(signature, payload);
      expect(result).toEqual({ received: true });
      expect(mockUserRepo.save).not.toHaveBeenCalled();
    });

    it('should handle subscription_charged_successfully — renew user plan and save payment', async () => {
      mockNotification('subscription_charged_successfully');
      mockCacheManager.get.mockResolvedValue(null);
      mockUserRepo.findOne.mockResolvedValue({
        ...mockUser,
        subscription_id: 'sub_123',
      });
      mockPaymentRepo.create.mockReturnValue({});
      mockPaymentRepo.save.mockResolvedValue({});

      await service.handleWebhook(signature, payload);

      expect(mockUserRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({
          plan: SubscriptionPlan.PREMIUM,
          subscription_status: 'active',
        }),
      );
      expect(mockPaymentRepo.save).toHaveBeenCalled();
    });

    it('should handle subscription_charged_unsuccessfully — emit charge_failed event', async () => {
      mockNotification('subscription_charged_unsuccessfully');
      mockCacheManager.get.mockResolvedValue(null);
      mockUserRepo.findOne.mockResolvedValue({
        ...mockUser,
        subscription_id: 'sub_123',
      });
      mockPaymentRepo.create.mockReturnValue({});
      mockPaymentRepo.save.mockResolvedValue({});

      await service.handleWebhook(signature, payload);

      expect(mockPaymentRepo.save).toHaveBeenCalled();
      expect(mockEventEmitter.emit).toHaveBeenCalledWith(
        'subscription.charge_failed',
        expect.objectContaining({
          userId: USER_ID,
          email: 'alice@example.com',
        }),
      );
    });

    it('should handle subscription_went_past_due — flag user', async () => {
      mockNotification('subscription_went_past_due');
      mockCacheManager.get.mockResolvedValue(null);
      mockUserRepo.findOne.mockResolvedValue({
        ...mockUser,
        subscription_id: 'sub_123',
      });

      await service.handleWebhook(signature, payload);

      expect(mockUserRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({ subscription_status: 'past_due' }),
      );
    });

    it('should handle subscription_canceled — downgrade user to FREE', async () => {
      mockNotification('subscription_canceled');
      mockCacheManager.get.mockResolvedValue(null);
      mockUserRepo.findOne.mockResolvedValue({
        ...mockUser,
        subscription_id: 'sub_123',
        plan: SubscriptionPlan.PREMIUM,
      });

      await service.handleWebhook(signature, payload);

      expect(mockUserRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({
          plan: SubscriptionPlan.FREE,
          subscription_id: null,
          subscription_status: null,
        }),
      );
    });

    it('should log and skip when no user found for subscription', async () => {
      mockNotification('subscription_canceled');
      mockCacheManager.get.mockResolvedValue(null);
      mockUserRepo.findOne.mockResolvedValue(null);

      await service.handleWebhook(signature, payload);
      expect(mockUserRepo.save).not.toHaveBeenCalled();
    });

    it('should log unhandled webhook kinds gracefully', async () => {
      mockNotification('check_dispute_opened');
      mockCacheManager.get.mockResolvedValue(null);

      const result = await service.handleWebhook(signature, payload);
      expect(result).toEqual({ received: true });
    });
  });

  describe('generateClientToken', () => {
    it('should return a client token', async () => {
      mockGateway.clientToken.generate.mockResolvedValue({
        clientToken: 'bt_token_abc',
      });

      const result = await service.generateClientToken();
      expect(result).toEqual({ clientToken: 'bt_token_abc' });
    });
  });

  describe('getSubscriptionStatus', () => {
    it('should return plan info for existing user', async () => {
      mockUserRepo.findOne.mockResolvedValue(mockUser);

      const result = await service.getSubscriptionStatus(USER_ID);
      expect(result).toEqual({
        plan: SubscriptionPlan.FREE,
        subscriptionId: null,
        isPremium: false,
      });
    });

    it('should throw NotFoundException for missing user', async () => {
      mockUserRepo.findOne.mockResolvedValue(null);

      await expect(service.getSubscriptionStatus(USER_ID)).rejects.toThrow(
        'User not found',
      );
    });
  });

  describe('cancelSubscription', () => {
    it('should cancel and downgrade user', async () => {
      const premiumUser = {
        ...mockUser,
        plan: SubscriptionPlan.PREMIUM,
        subscription_id: 'sub_123',
      };
      mockUserRepo.findOne.mockResolvedValue(premiumUser);
      mockGateway.subscription.cancel.mockResolvedValue({});

      const result = await service.cancelSubscription(USER_ID);
      expect(mockGateway.subscription.cancel).toHaveBeenCalledWith('sub_123');
      expect(mockUserRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({
          plan: SubscriptionPlan.FREE,
          subscription_id: null,
        }),
      );
      expect(result.success).toBe(true);
    });

    it('should throw BadRequestException if no active subscription', async () => {
      mockUserRepo.findOne.mockResolvedValue(mockUser);

      await expect(service.cancelSubscription(USER_ID)).rejects.toThrow(
        'No active premium subscription',
      );
    });
  });

  describe('getHistory', () => {
    it('should return paginated payment history', async () => {
      const mockRows = [
        {
          id: 'p1',
          amount: '29.99',
          currency: 'EUR',
          payment_method: 'credit_card',
          gateway_id: 'gw_1',
          status: 'COMPLETED',
          receipt_url: null,
          created_at: new Date(),
          course: { id: COURSE_ID, title: 'Test Course' },
        },
      ];
      mockPaymentRepo.findAndCount.mockResolvedValue([mockRows, 1]);

      const result = await service.getHistory(USER_ID, 1, 20);
      expect(result.total).toBe(1);
      expect(result.data[0].courseId).toBe(COURSE_ID);
      expect(result.data[0].courseTitle).toBe('Test Course');
    });
  });

  describe('subscribe', () => {
    const nonce = 'fake-nonce';
    const planId = 'monthly-plan';

    it('should throw NotFoundException if user not found', async () => {
      mockUserRepo.findOne.mockResolvedValue(null);

      await expect(
        service.subscribe(USER_ID, { nonce, planId }),
      ).rejects.toThrow('User not found');
    });

    it('should throw ConflictException if already premium', async () => {
      mockUserRepo.findOne.mockResolvedValue({
        ...mockUser,
        plan: SubscriptionPlan.PREMIUM,
        subscription_id: 'sub_123',
      });

      await expect(
        service.subscribe(USER_ID, { nonce, planId }),
      ).rejects.toThrow('already has an active premium subscription');
    });
  });

  describe('checkout', () => {
    const nonce = 'fake-nonce';
    const amount = 49.99;

    it('should throw BadRequestException if course not published', async () => {
      mockStudentProfileRepo.findOne.mockResolvedValue({ userId: USER_ID });
      mockCourseRepo.findOne.mockResolvedValue({
        id: COURSE_ID,
        status: 'DRAFT',
      });

      await expect(
        service.checkout(USER_ID, { courseId: COURSE_ID, nonce, amount }),
      ).rejects.toThrow('not available for purchase');
    });

    it('should throw ConflictException if already enrolled', async () => {
      mockStudentProfileRepo.findOne.mockResolvedValue({ userId: USER_ID });
      mockCourseRepo.findOne.mockResolvedValue({
        id: COURSE_ID,
        status: 'PUBLISHED',
      });
      mockEnrollmentRepo.findOne.mockResolvedValue({ id: 'enr_1' });

      await expect(
        service.checkout(USER_ID, { courseId: COURSE_ID, nonce, amount }),
      ).rejects.toThrow('Already enrolled');
    });
  });
});
