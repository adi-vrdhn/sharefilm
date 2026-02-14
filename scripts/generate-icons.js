#!/usr/bin/env node

/**
 * Generate PWA icons from SVG
 * Requires: sharp npm package (npm install sharp)
 * Usage: node scripts/generate-icons.js
 */

const fs = require('fs');
const path = require('path');

async function generateIcons() {
  try {
    const sharp = require('sharp');
    
    const iconsDir = path.join(__dirname, '../client/public/icons');
    if (!fs.existsSync(iconsDir)) {
      fs.mkdirSync(iconsDir, { recursive: true });
    }

    // Convert 192x192 icon
    console.log('Generating 192x192 icon...');
    await sharp(path.join(iconsDir, 'icon-192.svg'))
      .png()
      .toFile(path.join(iconsDir, 'icon-192x192.png'));
    console.log('✓ icon-192x192.png created');

    // Convert 512x512 icon
    console.log('Generating 512x512 icon...');
    await sharp(path.join(iconsDir, 'icon-512.svg'))
      .png()
      .toFile(path.join(iconsDir, 'icon-512x512.png'));
    console.log('✓ icon-512x512.png created');

    // Create screenshot placeholders
    console.log('Generating screenshot placeholders...');
    
    // 540x720 screenshot (narrow/mobile)
    await sharp(path.join(iconsDir, 'icon-192.svg'))
      .resize(540, 720, { fit: 'contain', background: { r: 11, g: 13, b: 16 } })
      .png()
      .toFile(path.join(iconsDir, 'screenshot-540.png'));
    console.log('✓ screenshot-540.png created');

    // 1280x720 screenshot (wide/desktop)
    await sharp(path.join(iconsDir, 'icon-512.svg'))
      .resize(1280, 720, { fit: 'contain', background: { r: 11, g: 13, b: 16 } })
      .png()
      .toFile(path.join(iconsDir, 'screenshot-1280.png'));
    console.log('✓ screenshot-1280.png created');

    console.log('\n✓ All icons generated successfully!');
  } catch (error) {
    if (error.code === 'MODULE_NOT_FOUND') {
      console.error('Error: sharp package not found.');
      console.error('Install it with: npm install --save-dev sharp');
      process.exit(1);
    } else {
      console.error('Error generating icons:', error);
      process.exit(1);
    }
  }
}

generateIcons();
