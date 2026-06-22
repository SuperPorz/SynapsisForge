import { Component, inject, OnInit, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { CertificatesService, UserCertificate } from '../../../core/services/certificates.service';
import { AuthService } from '../../../core/services/auth.service';
import { CertificatePdfService } from '../../../core/services/certificate-pdf.service';

@Component({
  selector: 'app-certificates',
  imports: [DatePipe, RouterLink],
  templateUrl: './certificates.html',
  styleUrl: './certificates.css',
})
export class Certificates implements OnInit {
  private certificatesService = inject(CertificatesService);
  private auth = inject(AuthService);
  private pdf = inject(CertificatePdfService);

  certificates = signal<UserCertificate[]>([]);
  loading = signal(true);
  downloading = signal<string | null>(null);

  ngOnInit(): void {
    this.certificatesService.getMyCertificates().subscribe({
      next: (data) => {
        this.certificates.set(data);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
      },
    });
  }

  download(cert: UserCertificate): void {
    this.downloading.set(cert.id);

    const user = this.auth.currentUser();
    const studentName =
      `${user?.email ?? 'Studente'}`;

    try {
      const blob = this.pdf.generate({
        studentName,
        courseTitle: cert.courseTitle,
        issuedAt: cert.issued_at,
        certificateCode: cert.certificate_code,
      });

      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `certificato-${cert.courseTitle.replace(/\s+/g, '-')}.pdf`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch {
      window.open(cert.pdf_url, '_blank');
    }

    this.downloading.set(null);
  }
}
