export interface CertificateData {
  studentName: string;
  courseTitle: string;
  issuedAt: Date;
  certificateCode: string;
}

export function getCertificateDefinition(data: CertificateData) {
  const dateStr = data.issuedAt.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return {
    pageSize: 'A4' as const,
    pageOrientation: 'landscape' as const,
    pageMargins: [40, 40, 40, 40] as [number, number, number, number],
    background: [
      {
        canvas: [
          { type: 'rect', x: 10, y: 10, w: 822, h: 575, lineWidth: 2, strokeColor: '#6366f1' },
          { type: 'rect', x: 13, y: 13, w: 816, h: 569, lineWidth: 0.5, strokeColor: '#e0e7ff' },
          { type: 'rect', x: 10, y: 10, w: 822, h: 6, color: '#6366f1' },
          { type: 'rect', x: 10, y: 579, w: 822, h: 6, color: '#6366f1' },
        ],
      },
    ],
    content: [
      { text: 'CERTIFICATE OF COMPLETION', alignment: 'center', fontSize: 34, bold: true, color: '#6366f1', margin: [0, 60, 0, 0] },
      { text: 'This certificate is awarded to', alignment: 'center', fontSize: 14, margin: [0, 35, 0, 0] },
      { text: data.studentName, alignment: 'center', fontSize: 30, bold: true, margin: [0, 25, 0, 0] },
      { text: 'for successfully completing the course', alignment: 'center', fontSize: 14, margin: [0, 25, 0, 0] },
      { text: data.courseTitle, alignment: 'center', fontSize: 24, bold: true, color: '#6366f1', margin: [0, 25, 0, 0] },
      {
        canvas: [
          { type: 'line', x1: 0, y1: 0, x2: 120, y2: 0, lineWidth: 1, lineColor: '#d1d5db' },
        ],
        alignment: 'center',
        margin: [0, 30, 0, 0],
      },
      { text: `Issued on ${dateStr}`, alignment: 'center', fontSize: 11, margin: [0, 15, 0, 0] },
      { text: `Code: ${data.certificateCode}`, alignment: 'center', fontSize: 8, margin: [0, 80, 0, 0] },
    ],
  };
}
