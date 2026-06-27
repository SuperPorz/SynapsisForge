import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { Checkout } from './checkout';
import { CourseService } from '../../core/services/courses.service';
import { CartService } from '../../core/services/cart.service';
import { PaymentsService } from '../../core/services/payments.service';
import { ToastService } from '../../core/services/toast.service';

describe('Checkout', () => {
  let component: Checkout;
  let fixture: ComponentFixture<Checkout>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Checkout],
      providers: [
        provideRouter([]),
        { provide: CourseService, useValue: { getCourseById: vi.fn(() => ({ subscribe: vi.fn() })) } },
        { provide: CartService, useValue: {
          loadCart: vi.fn(),
          items: Object.assign(vi.fn(() => []), { update: vi.fn() }),
          total: Object.assign(vi.fn(() => 0), { update: vi.fn() }),
          count: { update: vi.fn() },
          courseIds: { update: vi.fn() },
          checkout: vi.fn(() => ({ subscribe: vi.fn() })),
        } },
        { provide: PaymentsService, useValue: { getClientToken: vi.fn(() => ({ subscribe: vi.fn() })), processCheckout: vi.fn(() => ({ subscribe: vi.fn() })) } },
        { provide: ToastService, useValue: { show: vi.fn() } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(Checkout);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
