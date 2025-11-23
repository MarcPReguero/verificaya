
const pdf = require('pdf-parse');
const fs = require('fs');
const { jsPDF } = require('jspdf');

// Polyfill DOMMatrix
if (typeof global.DOMMatrix === 'undefined') {
    global.DOMMatrix = class DOMMatrix {
        constructor() { this.a = 1; this.b = 0; this.c = 0; this.d = 1; this.e = 0; this.f = 0; }
        transformPoint(point) { return point; }
    };
}

async function test() {
    try {
        console.log('Generating PDF...');
        const doc = new jsPDF();
        doc.text('Hello PDF Parse CJS', 10, 10);
        const buffer = Buffer.from(doc.output('arraybuffer'));

        console.log('Parsing PDF...');
        const data = await pdf(buffer);
        console.log('Success:', data.text);
    } catch (e) {
        console.error('Error:', e);
    }
}

test();
