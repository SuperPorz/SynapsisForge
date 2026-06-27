import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { DashboardLayout } from './dashboard-layout';
import { AuthService } from '../../../core/services/auth.service';

describe('DashboardLayout', () => {
  let component: DashboardLayout;
  let fixture: ComponentFixture<DashboardLayout>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DashboardLayout],
      providers: [
        provideRouter([]),
        { provide: AuthService, useValue: { isLoggedIn: vi.fn(() => true), isAuthenticated: vi.fn(() => true), role: vi.fn(() => 'STUDENT'), currentUser: vi.fn(() => ({ name: 'Test' })) } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(DashboardLayout);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
