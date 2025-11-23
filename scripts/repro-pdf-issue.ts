
import { extractTextFromPdf } from '../lib/ocr/pdf-utils';
import { jsPDF } from 'jspdf';

async function test() {
    console.log('Starting test...');
    try {
        const doc = new jsPDF();
        doc.text('Hello World', 10, 10);
        const buffer = Buffer.from(doc.output('arraybuffer'));

        console.log('Buffer created, size:', buffer.length);

        const text = await extractTextFromPdf(buffer);
        console.log('Extracted text:', text);
    } catch (e) {
        console.error('Test failed:', e);
    }
}

test();
