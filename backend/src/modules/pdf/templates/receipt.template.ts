export interface ReceiptData {
  paymentId: string;
  transactionId: string;
  amount: number;
  currency: string;
  paymentMethod: string | null;
  createdAt: Date;
  customerName: string;
  courseTitle: string | null;
}

export function getReceiptDefinition(data: ReceiptData) {
  const dateStr = data.createdAt.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  return {
    pageSize: 'A4' as const,
    pageOrientation: 'portrait' as const,
    pageMargins: [40, 40, 40, 40] as [number, number, number, number],
    info: {
      title: `Receipt-${data.paymentId}`,
      author: 'SynapsisForge',
      subject: 'Payment Receipt',
    },
    content: [
      {
        text: 'SynapsisForge',
        alignment: 'center',
        fontSize: 24,
        bold: true,
        color: '#6366f1',
      },
      {
        text: 'Payment Receipt',
        alignment: 'center',
        fontSize: 10,
        color: '#6b7280',
        margin: [0, 4, 0, 0],
      },
      {
        canvas: [
          {
            type: 'line',
            x1: 0,
            y1: 0,
            x2: 515,
            y2: 0,
            lineWidth: 1,
            lineColor: '#e5e7eb',
          },
        ],
        margin: [0, 20, 0, 0],
      },
      {
        table: {
          widths: ['30%', '*'],
          body: [
            [
              {
                text: 'Transaction ID:',
                bold: true,
                fontSize: 10,
                color: '#374151',
              },
              { text: data.transactionId, fontSize: 10, color: '#6b7280' },
            ],
            [
              { text: 'Date:', bold: true, fontSize: 10, color: '#374151' },
              { text: dateStr, fontSize: 10, color: '#6b7280' },
            ],
            [
              { text: 'Customer:', bold: true, fontSize: 10, color: '#374151' },
              { text: data.customerName, fontSize: 10, color: '#6b7280' },
            ],
            [
              { text: 'Amount:', bold: true, fontSize: 10, color: '#374151' },
              {
                text: `${data.currency} ${data.amount.toFixed(2)}`,
                fontSize: 10,
                color: '#6b7280',
              },
            ],
            [
              {
                text: 'Payment method:',
                bold: true,
                fontSize: 10,
                color: '#374151',
              },
              {
                text: data.paymentMethod ?? 'Unknown',
                fontSize: 10,
                color: '#6b7280',
              },
            ],
            ...(data.courseTitle
              ? [
                  [
                    {
                      text: 'Course:',
                      bold: true,
                      fontSize: 10,
                      color: '#374151',
                    },
                    { text: data.courseTitle, fontSize: 10, color: '#6b7280' },
                  ],
                ]
              : []),
          ],
        },
        layout: 'noBorders',
        margin: [0, 15, 0, 0],
      },
      {
        canvas: [
          {
            type: 'line',
            x1: 0,
            y1: 0,
            x2: 515,
            y2: 0,
            lineWidth: 1,
            lineColor: '#e5e7eb',
          },
        ],
        margin: [0, 20, 0, 0],
      },
      {
        text: `Receipt ID: ${data.paymentId}`,
        alignment: 'center',
        fontSize: 8,
        color: '#9ca3af',
        margin: [0, 10, 0, 0],
      },
      {
        text: 'Thank you for your purchase!',
        alignment: 'center',
        fontSize: 8,
        color: '#9ca3af',
        margin: [0, 2, 0, 0],
      },
    ],
  };
}
