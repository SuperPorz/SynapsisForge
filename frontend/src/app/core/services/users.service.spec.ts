import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { UsersService, UserProfile } from './users.service';
import { environment } from '../../../environments/environment';

describe('UsersService', () => {
  let service: UsersService;
  let httpMock: HttpTestingController;

  const mockProfile: UserProfile = {
    id: 'u1',
    email: 'test@synapsis.com',
    first_name: 'John',
    last_name: 'Doe',
    role: 'STUDENT',
    createdAt: '2026-01-01T00:00:00Z',
    avatar_url: null,
    bio: null,
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(UsersService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('getProfile', () => {
    it('should GET /users/me', () => {
      service.getProfile().subscribe((profile) => expect(profile).toEqual(mockProfile));
      const req = httpMock.expectOne(`${environment.apiUrl}/users/me`);
      expect(req.request.method).toBe('GET');
      req.flush(mockProfile);
    });
  });

  describe('updateProfile', () => {
    it('should PATCH /users/me with payload', () => {
      const payload = { first_name: 'Jane', bio: 'New bio' };

      service.updateProfile(payload).subscribe((profile) => expect(profile).toEqual(mockProfile));
      const req = httpMock.expectOne(`${environment.apiUrl}/users/me`);
      expect(req.request.method).toBe('PATCH');
      expect(req.request.body).toEqual(payload);
      req.flush(mockProfile);
    });
  });
});
