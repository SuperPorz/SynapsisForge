import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { OAuthCallback } from './oauth-callback';
import { AuthService } from '../../../core/services/auth.service';

describe('OAuthCallback', () => {
  let component: OAuthCallback;
  let fixture: ComponentFixture<OAuthCallback>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [OAuthCallback],
      providers: [
        provideRouter([]),
        { provide: AuthService, useValue: { loginWithToken: vi.fn(() => ({ subscribe: vi.fn() })) } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(OAuthCallback);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
