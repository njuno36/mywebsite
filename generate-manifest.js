#!/usr/bin/env node

/**
 * Generate manifest.json for the gallery
 * Run this script whenever you add new images to images/arch/
 * Usage: node generate-manifest.js
 */

const fs = require('fs');
const path = require('path');

const archDir = path.join(__dirname, 'images', 'arch');
const manifestPath = path.join(archDir, 'manifest.json');

const supportedExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];

try {
  const files = fs.readdirSync(archDir).filter((file) => {
    const ext = path.extname(file).toLowerCase();
    return supportedExtensions.includes(ext) && !file.startsWith('.');
  });

  const images = files.map((file) => ({
    src: `images/arch/${file}`,
    alt: file.replace(/\.[^.]+$/, '').replace(/_/g, ' '),
  }));

  fs.writeFileSync(manifestPath, JSON.stringify(images, null, 2));
  console.log(`✓ Generated manifest.json with ${images.length} images`);
} catch (error) {
  console.error('Error generating manifest:', error);
  process.exit(1);
}
