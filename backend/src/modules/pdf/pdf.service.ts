import { Injectable, Logger } from '@nestjs/common';
import PDFDocument from 'pdfkit';
import * as fs from 'fs';
import * as path from 'path';

export interface GenerateReceiptInput {
  paymentId: string;
  transactionId: string;
  amount: number;
  currency: string;
  paymentMethod: string | null;
  createdAt: Date;
  customerName: string;
  courseTitle: string | null;
}

export interface GenerateCertificateInput {
  studentName: string;
  courseTitle: string;
  issuedAt: Date;
  certificateCode: string;
}

@Injectable()
export class PdfService {
  private readonly logger = new Logger(PdfService.name);

  generateReceipt(
    input: GenerateReceiptInput,
    outputPath: string,
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({
        layout: 'portrait',
        size: 'A4',
        margin: 40,
      });
      const stream = fs.createWriteStream(outputPath);

      stream.on('finish', () => resolve());
      stream.on('error', reject);

      doc.pipe(stream);

      // Header
      doc.font('Helvetica-Bold').fontSize(24).fillColor('#6366f1');
      doc.text('SynapsisForge', { align: 'center' });

      doc.font('Helvetica').fontSize(10).fillColor('#6b7280');
      doc.text('Payment Receipt', { align: 'center' });
      doc.moveDown(2);

      // Divider
      doc.moveTo(40, doc.y).lineTo(552, doc.y).strokeColor('#e5e7eb').stroke();
      doc.moveDown(1);

      const leftX = 40;
      const rightX = 320;
      const labelStyle = { font: 'Helvetica-Bold', size: 10, color: '#374151' };
      const valueStyle = { font: 'Helvetica', size: 10, color: '#6b7280' };

      const fieldY = (y: number, label: string, value: string) => {
        doc
          .font('Helvetica-Bold')
          .fontSize(10)
          .fillColor('#374151')
          .text(label, leftX, y);
        doc
          .font('Helvetica')
          .fontSize(10)
          .fillColor('#6b7280')
          .text(value, rightX, y);
      };

      let y = doc.y + 5;
      fieldY(y, 'Transaction ID:', input.transactionId);
      y += 18;
      fieldY(
        y,
        'Date:',
        input.createdAt.toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        }),
      );
      y += 18;
      fieldY(y, 'Customer:', input.customerName);
      y += 18;
      fieldY(y, 'Amount:', `${input.currency} ${input.amount.toFixed(2)}`);
      y += 18;
      fieldY(y, 'Payment method:', input.paymentMethod ?? 'Unknown');
      y += 18;
      if (input.courseTitle) {
        fieldY(y, 'Course:', input.courseTitle);
        y += 18;
      }

      // Divider
      y += 8;
      doc.moveTo(40, y).lineTo(552, y).strokeColor('#e5e7eb').stroke();
      doc.moveDown(1);

      // Footer
      doc.font('Helvetica').fontSize(8).fillColor('#9ca3af');
      doc.text(`Receipt ID: ${input.paymentId}`, { align: 'center' });
      doc.text('Thank you for your purchase!', { align: 'center' });

      doc.end();
    });
  }

  generateCertificate(
    input: GenerateCertificateInput,
  ): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({
        layout: 'landscape',
        size: 'A4',
        margin: 0,
      });
      const chunks: Buffer[] = [];
      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      const pw = doc.page.width;
      const ph = doc.page.height;
      const cx = pw / 2;

      // Outer border (indigo)
      doc
        .rect(10, 10, pw - 20, ph - 20)
        .lineWidth(2)
        .stroke('#6366f1');

      // Inner border (lighter indigo)
      doc
        .rect(13, 13, pw - 26, ph - 26)
        .lineWidth(0.5)
        .stroke('#e0e7ff');

      // Top bar (indigo)
      doc.rect(10, 10, pw - 20, 6).fill('#6366f1');

      // Bottom bar (indigo)
      doc.rect(10, ph - 10, pw - 20, 6).fill('#6366f1');

      let y = 65;

      // Title
      doc.font('Helvetica-Bold').fontSize(34).fillColor('#6366f1');
      doc.text('CERTIFICATE OF COMPLETION', cx, y, { align: 'center' });
      y += 50;

      // Subtitle
      doc.font('Helvetica').fontSize(14).fillColor('#6b7280');
      doc.text('This certificate is awarded to', cx, y, { align: 'center' });
      y += 35;

      // Student name
      doc.font('Helvetica-Bold').fontSize(30).fillColor('#1f2937');
      doc.text(input.studentName, cx, y, { align: 'center' });
      y += 45;

      // Description
      doc.font('Helvetica').fontSize(14).fillColor('#6b7280');
      doc.text('for successfully completing the course', cx, y, { align: 'center' });
      y += 35;

      // Course title
      doc.font('Helvetica-Bold').fontSize(24).fillColor('#6366f1');
      doc.text(input.courseTitle, cx, y, { align: 'center' });
      y += 45;

      // Decorative divider
      doc
        .moveTo(cx - 60, y)
        .lineTo(cx + 60, y)
        .strokeColor('#e0e7ff')
        .stroke();
      y += 20;

      // Issue date
      doc.font('Helvetica').fontSize(11).fillColor('#9ca3af');
      const dateStr = input.issuedAt.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
      doc.text(`Issued on ${dateStr}`, cx, y, { align: 'center' });

      // Certificate code at bottom
      doc.fontSize(8).fillColor('#d1d5db');
      doc.text(`Certificate code: ${input.certificateCode}`, cx, ph - 25, {
        align: 'center',
      });

      doc.end();
    });
  }
}
