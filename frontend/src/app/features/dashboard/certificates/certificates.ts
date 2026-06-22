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
}
