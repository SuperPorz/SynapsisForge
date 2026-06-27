import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PaymentHistory } from './payment-history';
import { PaymentsService } from '../../../core/services/payments.service';

describe('PaymentHistory', () => {
  let component: PaymentHistory;
  let fixture: ComponentFixture<PaymentHistory>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PaymentHistory],
      providers: [
        { provide: PaymentsService, useValue: { getHistory: vi.fn(() => ({ subscribe: vi.fn() })) } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(PaymentHistory);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
