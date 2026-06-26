import { Component, inject, OnInit, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { CertificatesService, UserCertificate } from '../../../core/services/certificates.service';

@Component({
  selector: 'app-certificates',
  imports: [DatePipe, RouterLink],
  templateUrl: './certificates.html',
  styleUrl: './certificates.css',
})
export class Certificates implements OnInit {
  private certificatesService = inject(CertificatesService);

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

    if (cert.s3_key) {
      this.certificatesService.getDownloadUrl(cert.id).subscribe({
        next: (res) => {
          const link = document.createElement('a');
          link.href = res.downloadUrl;
          link.download = `certificate-${cert.courseTitle.replace(/\s+/g, '-')}.pdf`;
          link.click();
          this.downloading.set(null);
        },
        error: () => {
          this.downloading.set(null);
        },
      });
    } else if (cert.pdf_url) {
      const link = document.createElement('a');
      link.href = cert.pdf_url;
      link.download = `certificate-${cert.courseTitle.replace(/\s+/g, '-')}.pdf`;
      link.click();
      this.downloading.set(null);
    }
  }
}
