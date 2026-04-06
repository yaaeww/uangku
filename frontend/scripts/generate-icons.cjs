const Jimp = require('jimp');
const path = require('path');

const input = 'C:\\Users\\Ihya\\.gemini\\antigravity\\brain\\34fcd5e4-818b-4a40-bb7b-42c482c0c83c\\media__1774371316093.png';
const outputDir = path.join(__dirname, '..', 'public');

async function generate() {
  try {
    const img = await Jimp.read(input);
    await img.clone().resize(192, 192).writeAsync(path.join(outputDir, 'pwa-192x192.png'));
    await img.clone().resize(512, 512).writeAsync(path.join(outputDir, 'pwa-512x512.png'));
    console.log('Icons generated!');
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
}

generate();
