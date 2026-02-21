
import { jsPDF } from 'jspdf';
import { createRequire } from 'module';

// Mock global for pdf-parse polyfill test
type Point2D = { x: number; y: number };
type PDFParserData = { parserError?: string };

function isPDFParserData(value: unknown): value is PDFParserData {
  return typeof value === 'object' && value !== null && 'parserError' in value;
}

if (typeof global.DOMMatrix === 'undefined') {
    (global as { DOMMatrix?: new () => { transformPoint(point: Point2D): Point2D } }).DOMMatrix = class DOMMatrix {
        a = 1; b = 0; c = 0; d = 1; e = 0; f = 0;
        constructor() { }
        transformPoint(point: Point2D): Point2D { return point; }
    };
}

async function extractTextFromPdf(pdfBuffer: Buffer): Promise<string> {
    const require = createRequire(import.meta.url);

    // Strategy 1: Try pdf2json
    try {
        console.log('Attempting Strategy 1: pdf2json');
        return await new Promise<string>((resolve, reject) => {
            const timeout = setTimeout(() => {
                reject(new Error('pdf2json timed out'));
            }, 0); // Force immediate timeout to test fallback

            try {
                const PDFParser = require('pdf2json');
                const pdfParser = new PDFParser(null, 1);

                pdfParser.on("pdfParser_dataError", (errData: unknown) => {
                    clearTimeout(timeout);
                    const message = isPDFParserData(errData) && typeof errData.parserError === 'string'
                        ? errData.parserError
                        : 'pdf2json parser error';
                    reject(new Error(message));
                });

                pdfParser.on("pdfParser_dataReady", () => {
                    clearTimeout(timeout);
                    try {
                        const text = pdfParser.getRawTextContent();
                        resolve(text);
                    } catch (_error) {
                        reject(_error);
                    }
                });

                pdfParser.parseBuffer(pdfBuffer);
            } catch (error: unknown) {
                clearTimeout(timeout);
                reject(error);
            }
        });
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        console.warn(`pdf2json failed (${message}), falling back to pdf-parse...`);
    }

    // Strategy 2: Fallback to pdf-parse
    try {
        console.log('Attempting Strategy 2: pdf-parse');
        let pdf = require('pdf-parse');
        if (pdf.default) {
            pdf = pdf.default;
        }
        const data = await pdf(pdfBuffer);
        return data.text;
    } catch (error: unknown) {
        console.error('All PDF extraction methods failed:', error);
        const message = error instanceof Error ? error.message : 'Unknown error';
        throw new Error(`Failed to extract text from PDF: ${message}`);
    }
}

async function test() {
    try {
        console.log('Generating PDF...');
        const doc = new jsPDF();
        doc.text('Hybrid Test Success', 10, 10);
        const buffer = Buffer.from(doc.output('arraybuffer'));

        console.log('Extracting text...');
        const text = await extractTextFromPdf(buffer);
        console.log('Final Result:', text);
    } catch (e) {
        console.error('Test Failed:', e);
    }
}

test();
