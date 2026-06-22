import { Component, inject, OnInit, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { CertificatesService, UserCertificate } from '../../../core/services/certificates.service';

@Component({
  selector: 'app-certificates',
  imports: [DatePipe, RouterLink],
  templateUrl: './certificates.html',
  styleUrl: './certificates.css',
})
export class Certificates implements OnInit {
  private certificatesService = inject(CertificatesService);
  private http = inject(HttpClient);

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
    this.http.get(cert.pdf_url, { responseType: 'blob' }).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `certificato-${cert.courseTitle.replace(/\s+/g, '-')}.pdf`;
        a.click();
        window.URL.revokeObjectURL(url);
        this.downloading.set(null);
      },
      error: () => {
        window.open(cert.pdf_url, '_blank');
        this.downloading.set(null);
      },
    });
  }
}
