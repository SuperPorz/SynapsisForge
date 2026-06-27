import { Injectable, Logger } from '@nestjs/common';
import * as path from 'path';
import pdfMake from 'pdfmake';
import {
  getCertificateDefinition,
  CertificateData,
} from './templates/certificate.template';
import {
  getReceiptDefinition,
  ReceiptData,
} from './templates/receipt.template';

const pdfmakeDir = path.dirname(require.resolve('pdfmake/package.json'));
const robotoDir = path.join(pdfmakeDir, 'fonts', 'Roboto');

pdfMake.fonts = {
  Roboto: {
    normal: path.join(robotoDir, 'Roboto-Regular.ttf'),
    bold: path.join(robotoDir, 'Roboto-Medium.ttf'),
    italics: path.join(robotoDir, 'Roboto-Italic.ttf'),
    bolditalics: path.join(robotoDir, 'Roboto-MediumItalic.ttf'),
  },
};

pdfMake.setUrlAccessPolicy(() => false);
pdfMake.setLocalAccessPolicy((filePath: string) =>
  filePath.startsWith(robotoDir),
);

export type { CertificateData, ReceiptData };

@Injectable()
export class PdfService {
  private readonly logger = new Logger(PdfService.name);

  async generateReceipt(input: ReceiptData, outputPath: string): Promise<void> {
    const doc = pdfMake.createPdf(getReceiptDefinition(input));
    await doc.write(outputPath);
  }

  async generateCertificate(input: CertificateData): Promise<Buffer> {
    const doc = pdfMake.createPdf(getCertificateDefinition(input));
    return doc.getBuffer();
  }
}
