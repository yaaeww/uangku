const express = require('express');
const bodyParser = require('body-parser');
const Tesseract = require('tesseract.js');
const app = express();
const port = 3002;

// Use a single persistent worker for maximum speed
let worker = null;

async function initWorker() {
    console.log('Initializing Tesseract worker...');
    worker = await Tesseract.createWorker('ind+eng');
    console.log('Worker ready.');
}

app.use(bodyParser.raw({ type: 'image/*', limit: '10mb' }));

app.post('/ocr', async (req, res) => {
    if (!worker) {
        return res.status(503).send('Worker not initialized');
    }

    try {
        const { data: { text } } = await worker.recognize(req.body);
        res.send(text);
    } catch (err) {
        console.error('OCR Error:', err);
        res.status(500).send(err.message);
    }
});

app.get('/health', (req, res) => {
    res.send(worker ? 'ready' : 'initializing');
});

initWorker().then(() => {
    app.listen(port, () => {
        console.log(`OCR Service listening at http://localhost:${port}`);
    });
});
