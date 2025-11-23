
import { jsPDF } from 'jspdf';
import { createRequire } from 'module';

// Mock global for pdf-parse polyfill test
if (typeof global.DOMMatrix === 'undefined') {
    (global as any).DOMMatrix = class DOMMatrix {
        a = 1; b = 0; c = 0; d = 1; e = 0; f = 0;
        constructor() { }
        transformPoint(point: any) { return point; }
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

                pdfParser.on("pdfParser_dataError", (errData: any) => {
                    clearTimeout(timeout);
                    reject(new Error(errData.parserError));
                });

                pdfParser.on("pdfParser_dataReady", (pdfData: any) => {
                    clearTimeout(timeout);
                    try {
                        const text = pdfParser.getRawTextContent();
                        resolve(text);
                    } catch (e) {
                        reject(e);
                    }
                });

                pdfParser.parseBuffer(pdfBuffer);
            } catch (error: any) {
                clearTimeout(timeout);
                reject(error);
            }
        });
    } catch (error: any) {
        console.warn(`pdf2json failed (${error.message}), falling back to pdf-parse...`);
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
    } catch (error: any) {
        console.error('All PDF extraction methods failed:', error);
        throw new Error(`Failed to extract text from PDF: ${error.message}`);
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
