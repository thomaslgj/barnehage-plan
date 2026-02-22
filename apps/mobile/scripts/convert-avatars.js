const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

// Import avatars from the source file
const { AVATAR_SVGS } = require('../src/lib/avatars.ts');

const outputDir = path.join(__dirname, '../assets/avatars');

// Create output directory if it doesn't exist
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

async function convertSVGtoPNG(svgString, outputPath, size = 128) {
  try {
    const buffer = Buffer.from(svgString);
    await sharp(buffer)
      .resize(size, size, {
        fit: 'contain',
        background: { r: 45, g: 37, b: 32, alpha: 1 } // #2d2520
      })
      .png()
      .toFile(outputPath);
    console.log(`✓ Converted: ${path.basename(outputPath)}`);
  } catch (error) {
    console.error(`✗ Failed to convert: ${path.basename(outputPath)}`, error.message);
  }
}

async function convertAll() {
  console.log('Converting avatar SVGs to PNGs...\n');

  for (const [id, svg] of Object.entries(AVATAR_SVGS)) {
    const outputPath = path.join(outputDir, `avatar-${id}.png`);
    await convertSVGtoPNG(svg, outputPath);
  }

  console.log('\n✅ Conversion complete!');
  console.log(`PNG files saved to: ${outputDir}`);
}

convertAll().catch(console.error);
