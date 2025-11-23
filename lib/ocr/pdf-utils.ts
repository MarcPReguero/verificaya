import { createCanvas } from 'canvas';
const pdfjsLib = require('pdfjs-dist/legacy/build/pdf.js');

// Explicitly set worker source to avoid fake worker issues
try {
    pdfjsLib.GlobalWorkerOptions.workerSrc = require.resolve('pdfjs-dist/legacy/build/pdf.worker.js');
} catch (e) {
    console.warn('Could not resolve pdf.worker.js, pdfjs-dist might fail if worker is needed.');
}

/**
 * Convert the first page of a PDF buffer to an image buffer (PNG)
 * @param pdfBuffer - The buffer of the PDF file
 * @returns Promise<Buffer> - The PNG image buffer
 */
export async function convertPdfToImage(pdfBuffer: Buffer): Promise<Buffer> {
    try {
        // Load the PDF document
        // We need to convert Buffer to Uint8Array for pdfjs
        const uint8Array = new Uint8Array(pdfBuffer);
        const loadingTask = pdfjsLib.getDocument({ data: uint8Array });
        const pdfDocument = await loadingTask.promise;

        if (pdfDocument.numPages === 0) {
            throw new Error('PDF has no pages');
        }

        // Get the first page
        const page = await pdfDocument.getPage(1);

        // Set scale for good resolution (2.0 is usually good for OCR)
        const scale = 2.0;
        const viewport = page.getViewport({ scale });

        // Create canvas
        const canvas = createCanvas(viewport.width, viewport.height);
        const context = canvas.getContext('2d');

        // Render page to canvas
        await page.render({
            canvasContext: context as any,
            viewport: viewport,
        } as any).promise;

        // Convert canvas to buffer
        const imageBuffer = canvas.toBuffer('image/png');

        return imageBuffer;

    } catch (error: any) {
        console.error('Error converting PDF to image:', error);
        throw new Error(`Failed to convert PDF to image: ${error.message}`);
    }
}


/**
 * Extract text from a PDF buffer using pdf2json
 * @param pdfBuffer - The buffer of the PDF file
 * @returns Promise<string> - The extracted text
 */
export async function extractTextFromPdf(pdfBuffer: Buffer): Promise<string> {
    // Strategy: Use pdf2json with a generous timeout
    console.log('Starting PDF text extraction with pdf2json...');
    try {
        return await new Promise<string>((resolve, reject) => {
            const timeout = setTimeout(() => {
                console.error('PDF extraction timed out');
                reject(new Error('PDF processing timed out after 30 seconds'));
            }, 30000); // 30s timeout

            try {
                console.log('Requiring pdf2json...');
                const PDFParser = require('pdf2json');
                const pdfParser = new PDFParser(null, 1); // 1 = text only

                pdfParser.on("pdfParser_dataError", (errData: any) => {
                    clearTimeout(timeout);
                    console.error('pdf2json dataError:', errData);
                    reject(new Error(errData.parserError));
                });

                pdfParser.on("pdfParser_dataReady", (pdfData: any) => {
                    clearTimeout(timeout);
                    console.log('pdf2json dataReady');
                    try {
                        const text = pdfParser.getRawTextContent();
                        console.log('Text extracted, length:', text.length);
                        resolve(text);
                    } catch (e) {
                        console.error('Error getting raw text content:', e);
                        reject(e);
                    }
                });

                console.log('Parsing buffer...');
                pdfParser.parseBuffer(pdfBuffer);
            } catch (error: any) {
                clearTimeout(timeout);
                console.error('Error initializing or parsing with pdf2json:', error);
                reject(error);
            }
        });
    } catch (error: any) {
        console.error('PDF extraction failed in catch block:', error);
        throw new Error(`Failed to extract text from PDF: ${error.message}`);
    }

}

