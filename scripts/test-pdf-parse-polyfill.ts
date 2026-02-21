
import { jsPDF } from 'jspdf';
import { createRequire } from 'module';

type Point2D = { x: number; y: number };
// Polyfill DOMMatrix
if (typeof global.DOMMatrix === 'undefined') {
    (global as { DOMMatrix?: new () => { transformPoint(point: Point2D): Point2D } }).DOMMatrix = class DOMMatrix {
        a = 1; b = 0; c = 0; d = 1; e = 0; f = 0;
        constructor() { }
        transformPoint(point: Point2D): Point2D { return point; }
    };
}

async function test() {
    try {
        const doc = new jsPDF();
        doc.text('Hello PDF Parse', 10, 10);
        const buffer = Buffer.from(doc.output('arraybuffer'));

        const require = createRequire(import.meta.url);
        const pdf = require('pdf-parse');

        console.log('Parsing PDF...');
        const data = await pdf(buffer);
        console.log('Success:', data.text);
    } catch (e) {
        console.error('Error:', e);
    }
}

test();
