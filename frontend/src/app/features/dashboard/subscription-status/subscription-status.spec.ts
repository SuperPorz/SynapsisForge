import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { SubscriptionStatus } from './subscription-status';
import { PaymentsService } from '../../../core/services/payments.service';
import { AuthService } from '../../../core/services/auth.service';
import { ToastService } from '../../../core/services/toast.service';

describe('SubscriptionStatus', () => {
  let component: SubscriptionStatus;
  let fixture: ComponentFixture<SubscriptionStatus>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SubscriptionStatus],
      providers: [
        provideRouter([]),
        { provide: PaymentsService, useValue: { getSubscriptionStatus: vi.fn(() => ({ subscribe: vi.fn() })) } },
        { provide: AuthService, useValue: { isLoggedIn: vi.fn(() => true) } },
        { provide: ToastService, useValue: { show: vi.fn() } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(SubscriptionStatus);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
