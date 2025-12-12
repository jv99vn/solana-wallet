import { copyFileSync, mkdirSync, existsSync, readFileSync, writeFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = resolve(__dirname, '..');
const distDir = resolve(rootDir, 'dist');
const publicDir = resolve(rootDir, 'public');

console.log('Building extension...');

// Ensure dist directory exists
if (!existsSync(distDir)) {
  mkdirSync(distDir, { recursive: true });
}

// Copy manifest.json
const manifestPath = resolve(publicDir, 'manifest.json');
if (existsSync(manifestPath)) {
  copyFileSync(manifestPath, resolve(distDir, 'manifest.json'));
  console.log('✓ Copied manifest.json');
}

// Copy icons
const iconsDir = resolve(publicDir, 'icons');
const distIconsDir = resolve(distDir, 'icons');

if (!existsSync(distIconsDir)) {
  mkdirSync(distIconsDir, { recursive: true });
}

['icon16.png', 'icon32.png', 'icon48.png', 'icon128.png'].forEach((icon) => {
  const srcPath = resolve(iconsDir, icon);
  if (existsSync(srcPath)) {
    copyFileSync(srcPath, resolve(distIconsDir, icon));
    console.log(`✓ Copied ${icon}`);
  }
});

// Update HTML files to use correct paths
['popup.html', 'options.html'].forEach((htmlFile) => {
  const htmlPath = resolve(distDir, htmlFile);
  if (existsSync(htmlPath)) {
    let content = readFileSync(htmlPath, 'utf-8');
    // Fix paths for extension
    content = content.replace(/\/src\//g, './assets/');
    content = content.replace(/type="module"/g, '');
    writeFileSync(htmlPath, content);
    console.log(`✓ Updated ${htmlFile}`);
  }
});

console.log('\n✓ Extension build complete!');
console.log('\nTo load the extension:');
console.log('1. Open Chrome and go to chrome://extensions');
console.log('2. Enable "Developer mode"');
console.log('3. Click "Load unpacked" and select the dist folder');
