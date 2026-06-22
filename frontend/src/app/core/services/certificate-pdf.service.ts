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

    // ── Border ──────────────────────────────────────────────────────
    doc.setDrawColor(99, 102, 241);
    doc.setLineWidth(2);
    doc.rect(10, 10, pw - 20, ph - 20);
    doc.setDrawColor(224, 231, 255);
    doc.setLineWidth(0.5);
    doc.rect(13, 13, pw - 26, ph - 26);

    // ── Decorative top bar ──────────────────────────────────────────
    doc.setFillColor(99, 102, 241);
    doc.rect(10, 10, pw - 20, 6, 'F');

    // ── Title ───────────────────────────────────────────────────────
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(36);
    doc.setTextColor(99, 102, 241);
    doc.text('CERTIFICATO DI COMPLETAMENTO', pw / 2, 55, { align: 'center' });

    // ── Subtitle ────────────────────────────────────────────────────
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(14);
    doc.setTextColor(107, 114, 128);
    doc.text('Questo certificato è rilasciato a', pw / 2, 75, { align: 'center' });

    // ── Student name ────────────────────────────────────────────────
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(28);
    doc.setTextColor(31, 41, 55);
    doc.text(data.studentName, pw / 2, 95, { align: 'center' });

    // ── Course info ─────────────────────────────────────────────────
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(14);
    doc.setTextColor(107, 114, 128);
    doc.text('per aver completato con successo il corso', pw / 2, 115, { align: 'center' });

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(22);
    doc.setTextColor(99, 102, 241);
    doc.text(data.courseTitle, pw / 2, 135, { align: 'center' });

    // ── Date ────────────────────────────────────────────────────────
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(11);
    doc.setTextColor(156, 163, 175);
    const d = new Date(data.issuedAt);
    const dateStr = d.toLocaleDateString('it-IT', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
    doc.text(`Rilasciato il ${dateStr}`, pw / 2, 160, { align: 'center' });

    // ── Certificate code ────────────────────────────────────────────
    doc.setFontSize(8);
    doc.setTextColor(209, 213, 219);
    doc.text(`Codice certificato: ${data.certificateCode}`, pw / 2, ph - 25, {
      align: 'center',
    });

    // ── Decorative bottom bar ───────────────────────────────────────
    doc.setFillColor(99, 102, 241);
    doc.rect(10, ph - 10, pw - 20, 6, 'F');

    return doc.output('blob');
  }
}
