const Tesseract = require('tesseract.js');
const path = require('path');

const imagePath = process.argv[2];
if (!imagePath) {
    console.error('Usage: node ocr-worker.js <imagePath>');
    process.exit(1);
}

// Ensure path is absolute if possible
const absolutePath = path.isAbsolute(imagePath) ? imagePath : path.resolve(process.cwd(), imagePath);

Tesseract.recognize(
    absolutePath,
    'ind+eng', // Using Indonesian + English
    { 
        logger: m => {
            // Silence logger to stdout but could be used for debugging to stderr
            if (m.status === 'recognizing text') {
                // console.error(`Progress: ${Math.round(m.progress * 100)}%`);
            }
        } 
    }
).then(({ data: { text } }) => {
    // Output the raw text to stdout for Go to capture
    process.stdout.write(text);
    process.exit(0);
}).catch(err => {
    console.error('OCR Error:', err);
    process.exit(1);
});
