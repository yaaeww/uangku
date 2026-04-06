import sharp from 'sharp';

const input = 'C:\\Users\\Ihya\\.gemini\\antigravity\\brain\\34fcd5e4-818b-4a40-bb7b-42c482c0c83c\\media__1774371316093.png';
const outputDir = 'public';

async function generate() {
  try {
    await sharp(input).resize(192, 192).toFile(`${outputDir}/pwa-192x192.png`);
    await sharp(input).resize(512, 512).toFile(`${outputDir}/pwa-512x512.png`);
    console.log('Icons generated successfully!');
  } catch (err) {
    console.error('Error generating icons:', err);
  }
}

generate();
