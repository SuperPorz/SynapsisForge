import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { Subscription } from './subscription';
import { PaymentsService } from '../../core/services/payments.service';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/toast.service';

describe('Subscription', () => {
  let component: Subscription;
  let fixture: ComponentFixture<Subscription>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Subscription],
      providers: [
        provideRouter([]),
        { provide: PaymentsService, useValue: { getClientToken: vi.fn(() => ({ subscribe: vi.fn() })), subscribe: vi.fn(() => ({ subscribe: vi.fn() })) } },
        { provide: AuthService, useValue: { isLoggedIn: vi.fn(() => true), plan: vi.fn(() => 'FREE'), setPlan: vi.fn() } },
        { provide: ToastService, useValue: { show: vi.fn() } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(Subscription);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
