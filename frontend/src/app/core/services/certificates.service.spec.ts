import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { CertificatesService, UserCertificate, DownloadUrlResponse } from './certificates.service';
import { environment } from '../../../environments/environment';

describe('CertificatesService', () => {
  let service: CertificatesService;
  let httpMock: HttpTestingController;

  const mockCertificates: UserCertificate[] = [
    {
      id: 'cert1',
      issued_at: '2026-06-01T00:00:00Z',
      pdf_url: 'https://example.com/cert1.pdf',
      is_valid: true,
      certificate_code: 'CERT-001',
      courseTitle: 'Test Course',
      courseId: 'c1',
      s3_key: 'certificates/cert1.pdf',
    },
  ];

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(CertificatesService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('getMyCertificates', () => {
    it('should GET /certificates/my', () => {
      service.getMyCertificates().subscribe((certs) => expect(certs).toEqual(mockCertificates));
      const req = httpMock.expectOne(`${environment.apiUrl}/certificates/my`);
      expect(req.request.method).toBe('GET');
      req.flush(mockCertificates);
    });
  });

  describe('getDownloadUrl', () => {
    it('should GET /certificates/:id/download', () => {
      const mockResponse: DownloadUrlResponse = { downloadUrl: 'https://s3.example.com/cert1.pdf?signature=abc' };

      service.getDownloadUrl('cert1').subscribe((res) => expect(res).toEqual(mockResponse));
      const req = httpMock.expectOne(`${environment.apiUrl}/certificates/cert1/download`);
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });
  });
});
