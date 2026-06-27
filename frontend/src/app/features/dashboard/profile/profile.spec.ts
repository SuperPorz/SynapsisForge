import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Profile } from './profile';
import { UsersService } from '../../../core/services/users.service';

describe('Profile', () => {
  let component: Profile;
  let fixture: ComponentFixture<Profile>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Profile],
      providers: [
        { provide: UsersService, useValue: { getProfile: vi.fn(() => ({ subscribe: vi.fn() })), updateProfile: vi.fn(() => ({ subscribe: vi.fn() })) } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(Profile);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
