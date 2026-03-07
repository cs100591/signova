// Type declarations for pdf-parse-fork
declare module 'pdf-parse-fork' {
  interface PDFParseResult {
    text: string;
    numpages: number;
    info: any;
    version: string;
    metadata: any;
  }

  function pdf(buffer: Buffer, options?: any): Promise<PDFParseResult>;
  
  export = pdf;
}
