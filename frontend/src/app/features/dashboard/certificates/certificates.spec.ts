import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { Certificates } from './certificates';
import { CertificatesService } from '../../../core/services/certificates.service';

describe('Certificates', () => {
  let component: Certificates;
  let fixture: ComponentFixture<Certificates>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Certificates],
      providers: [
        provideRouter([]),
        { provide: CertificatesService, useValue: { getMyCertificates: vi.fn(() => ({ subscribe: vi.fn() })), getDownloadUrl: vi.fn(() => ({ subscribe: vi.fn() })) } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(Certificates);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
