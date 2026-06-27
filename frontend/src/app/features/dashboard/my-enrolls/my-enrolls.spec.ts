import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { MyEnrolls } from './my-enrolls';
import { EnrollmentService } from '../../../core/services/enrollment.service';

describe('MyEnrolls', () => {
  let component: MyEnrolls;
  let fixture: ComponentFixture<MyEnrolls>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MyEnrolls],
      providers: [
        provideRouter([]),
        { provide: EnrollmentService, useValue: { getMyEnrollments: vi.fn(() => ({ subscribe: vi.fn() })), getMyActivity: vi.fn(() => ({ subscribe: vi.fn() })) } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(MyEnrolls);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
