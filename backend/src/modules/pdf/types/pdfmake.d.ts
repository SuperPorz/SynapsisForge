declare module 'pdfmake' {
  interface TDocumentDefinitions {
    pageSize?: string;
    pageOrientation?: 'portrait' | 'landscape';
    pageMargins?: number | [number, number, number, number];
    content: unknown[];
    styles?: Record<string, unknown>;
    defaultStyle?: {
      font?: string;
      fontSize?: number;
      bold?: boolean;
      color?: string;
      alignment?: 'left' | 'center' | 'right' | 'justify';
    };
    background?: unknown[];
    info?: {
      title?: string;
      author?: string;
      subject?: string;
      keywords?: string;
    };
  }

  interface OutputDocument {
    getBuffer(): Promise<Buffer>;
    getBase64(): Promise<string>;
    getDataUrl(): Promise<string>;
    getStream(): Promise<unknown>;
    write(filename: string): Promise<void>;
  }

  interface PdfMake {
    fonts: Record<string, Record<string, string>>;
    createPdf(
      docDefinition: TDocumentDefinitions,
      options?: {
        progressCallback?: (progress: number) => void;
        tableLayouts?: unknown;
      },
    ): OutputDocument;
    setUrlAccessPolicy(callback: (url: string) => boolean): void;
    setLocalAccessPolicy(callback: (path: string) => boolean): void;
  }

  declare const pdfMake: PdfMake;
  export default pdfMake;
}
