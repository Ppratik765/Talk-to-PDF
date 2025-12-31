import { NextRequest, NextResponse } from 'next/server';
import { embedAndStoreDocs } from '@/lib/vector-store';
// @ts-ignore
import PDFParser from 'pdf2json';
import mammoth from 'mammoth';
import { parseOfficeAsync } from 'officeparser';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const fileName = file.name.toLowerCase();
    let text = '';

    console.log(`Processing file: ${fileName}`);

    if (fileName.endsWith('.pdf')) {
      text = await new Promise<string>((resolve, reject) => {
        const pdfParser = new PDFParser(null, true);
        pdfParser.on("pdfParser_dataError", (errData: any) => reject(errData.parserError));
        pdfParser.on("pdfParser_dataReady", (pdfData: any) => {
          let extractedText = '';
          pdfData.Pages.forEach((page: any) => {
            page.Texts.forEach((textObj: any) => {
              textObj.R.forEach((run: any) => {
                // FIX: Safe decoding to prevent URI Malformed crashes
                try {
                  extractedText += decodeURIComponent(run.T) + ' ';
                } catch (e) {
                  // If decoding fails, just use the raw text
                  extractedText += run.T + ' ';
                }
              });
            });
          });
          resolve(extractedText);
        });
        pdfParser.parseBuffer(buffer);
      });
    } 
    else if (fileName.endsWith('.docx')) {
      const result = await mammoth.extractRawText({ buffer });
      text = result.value;
    } 
    else if (fileName.endsWith('.pptx')) {
      try {
        text = await parseOfficeAsync(buffer);
      } catch (err) {
        console.error("PPTX Error", err);
        return NextResponse.json({ error: 'Failed to parse PPTX' }, { status: 500 });
      }
    } 
    else {
      return NextResponse.json({ error: 'Unsupported file format' }, { status: 400 });
    }

    // Clean and Chunk
    const cleanedText = text.replace(/\s+/g, ' ').trim();
    const chunks = cleanedText.match(/[\s\S]{1,1000}/g) || [];

    await embedAndStoreDocs(chunks, file.name);

    return NextResponse.json({ success: true, fileName: file.name });
  } catch (error) {
    console.error("Ingest Error:", error);
    return NextResponse.json({ error: 'Failed to process file' }, { status: 500 });
  }
}