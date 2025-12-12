// This script generates placeholder icons for development
// In production, you should replace these with proper PNG icons

import { writeFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const iconsDir = resolve(__dirname, '..', 'public', 'icons');

// Simple 1x1 transparent PNG as placeholder
// In production, replace with actual icons
const sizes = [16, 32, 48, 128];

// Create a simple SVG and note that proper PNG icons should be created
const createSvgIcon = (size) => `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${size}" height="${size}" viewBox="0 0 128 128" fill="none" xmlns="http://www.w3.org/2000/svg">
<rect width="128" height="128" rx="24" fill="url(#gradient)"/>
<path d="M96 40H32C29.791 40 28 41.791 28 44V84C28 86.209 29.791 88 32 88H96C98.209 88 100 86.209 100 84V44C100 41.791 98.209 40 96 40Z" stroke="white" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>
<path d="M64 72C68.4183 72 72 68.4183 72 64C72 59.5817 68.4183 56 64 56C59.5817 56 56 59.5817 56 64C56 68.4183 59.5817 72 64 72Z" stroke="white" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>
<defs>
<linearGradient id="gradient" x1="0" y1="0" x2="128" y2="128" gradientUnits="userSpaceOnUse">
<stop stop-color="#9945FF"/>
<stop offset="1" stop-color="#14F195"/>
</linearGradient>
</defs>
</svg>`;

console.log('Note: This creates SVG placeholders.');
console.log('For production, create proper PNG icons using a graphics tool.');
console.log('');

sizes.forEach(size => {
  const svg = createSvgIcon(size);
  const filename = `icon${size}.svg`;
  writeFileSync(resolve(iconsDir, filename), svg);
  console.log(`Created ${filename}`);
});

console.log('');
console.log('To create PNG icons:');
console.log('1. Use a tool like Inkscape, Figma, or an online converter');
console.log('2. Export SVGs as PNG at 16x16, 32x32, 48x48, and 128x128');
console.log('3. Name them icon16.png, icon32.png, icon48.png, icon128.png');
