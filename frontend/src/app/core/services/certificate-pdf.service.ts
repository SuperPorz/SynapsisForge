import { Injectable } from '@angular/core';
import { jsPDF } from 'jspdf';

export interface CertificateData {
  studentName: string;
  courseTitle: string;
  issuedAt: string;
  certificateCode: string;
}

@Injectable({ providedIn: 'root' })
export class CertificatePdfService {
  generate(data: CertificateData): Blob {
    const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
    const pw = doc.internal.pageSize.getWidth();
    const ph = doc.internal.pageSize.getHeight();

    doc.setDrawColor(99, 102, 241);
    doc.setLineWidth(2);
    doc.rect(10, 10, pw - 20, ph - 20);
    doc.setDrawColor(224, 231, 255);
    doc.setLineWidth(0.5);
    doc.rect(13, 13, pw - 26, ph - 26);

    doc.setFillColor(99, 102, 241);
    doc.rect(10, 10, pw - 20, 6, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(36);
    doc.setTextColor(99, 102, 241);
    doc.text('CERTIFICATE OF COMPLETION', pw / 2, 55, { align: 'center' });

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(14);
    doc.setTextColor(107, 114, 128);
    doc.text('This certificate is awarded to', pw / 2, 75, { align: 'center' });

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(28);
    doc.setTextColor(31, 41, 55);
    doc.text(data.studentName, pw / 2, 95, { align: 'center' });

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(14);
    doc.setTextColor(107, 114, 128);
    doc.text('for successfully completing the course', pw / 2, 115, { align: 'center' });

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(22);
    doc.setTextColor(99, 102, 241);
    doc.text(data.courseTitle, pw / 2, 135, { align: 'center' });

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(11);
    doc.setTextColor(156, 163, 175);
    const d = new Date(data.issuedAt);
    const dateStr = d.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
    doc.text(`Issued on ${dateStr}`, pw / 2, 160, { align: 'center' });

    doc.setFontSize(8);
    doc.setTextColor(209, 213, 219);
    doc.text(`Certificate code: ${data.certificateCode}`, pw / 2, ph - 25, {
      align: 'center',
    });

    doc.setFillColor(99, 102, 241);
    doc.rect(10, ph - 10, pw - 20, 6, 'F');

    return doc.output('blob');
  }
}
