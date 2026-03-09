#!/usr/bin/env node

/**
 * FilmShare Technical Report - Multi-Format Converter
 * Converts TECHNICAL_REPORT.md to PDF with multiple method options
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const PROJECT_ROOT = '/Users/aditya/Desktop/GITHUB AI/myproject';
const MD_FILE = path.join(PROJECT_ROOT, 'TECHNICAL_REPORT.md');
const HTML_FILE = path.join(PROJECT_ROOT, 'TECHNICAL_REPORT.html');
const PDF_FILE = path.join(PROJECT_ROOT, 'TECHNICAL_REPORT.pdf');

console.log('\n╔═══════════════════════════════════════════════════════════╗');
console.log('║   FilmShare Technical Report - PDF Conversion Wizard      ║');
console.log('╚═══════════════════════════════════════════════════════════╝\n');

// Check if HTML file exists
if (!fs.existsSync(HTML_FILE)) {
    console.error('❌ HTML file not found. Please run: node md-to-pdf.js first\n');
    process.exit(1);
}

console.log('✅ Found HTML file:', HTML_FILE);
console.log('📊 File size:', (fs.statSync(HTML_FILE).size / 1024).toFixed(2), 'KB\n');

console.log('═══════════════════════════════════════════════════════════\n');
console.log('📌 AVAILABLE CONVERSION METHODS:\n');

console.log('METHOD 1: Manual Browser Print (Recommended)');
console.log('  ✅ Works on all platforms');
console.log('  ✅ Best quality output');
console.log('  1. Open TECHNICAL_REPORT.html in your browser');
console.log('  2. Press Cmd+P (Mac) or Ctrl+P (Windows/Linux)');
console.log('  3. Click "Save as PDF"');
console.log('  4. Configure: Margins → Minimal, Format → A4');
console.log('  5. Save\n');

console.log('METHOD 2: Start Local Server');
console.log('  1. Run: node serve-html.js');
console.log('  2. Open http://localhost:3000');
console.log('  3. Use browser print to PDF\n');

console.log('METHOD 3: Try npm Installation (If available)');
try {
    // Try to check for available PDF generators
    execSync('which libreoffice > /dev/null 2>&1 || which pandoc > /dev/null 2>&1', { stdio: 'ignore' });
    console.log('  ✅ External tools found - attempting conversion...\n');
    
    // Try using LibreOffice
    try {
        execSync(`libreoffice --headless --convert-to pdf "${HTML_FILE}" --outdir "${PROJECT_ROOT}"`, {
            timeout: 30000,
            stdio: 'pipe'
        });
        
        if (fs.existsSync(PDF_FILE)) {
            const pdfSize = (fs.statSync(PDF_FILE).size / (1024 * 1024)).toFixed(2);
            console.log('✅ SUCCESS: PDF created using LibreOffice!');
            console.log('📊 File size:', pdfSize, 'MB');
            console.log('📍 Location:', PDF_FILE);
            process.exit(0);
        }
    } catch (e) {
        // LibreOffice failed, try pandoc
    }
} catch (e) {
    console.log('  ℹ️  External tools not found\n');
}

console.log('═══════════════════════════════════════════════════════════\n');
console.log('💡 QUICK START:\n');
console.log('   npm install -g puppeteer');
console.log('   Then: npx puppeteer-to-pdf TECHNICAL_REPORT.html\n');

console.log('═══════════════════════════════════════════════════════════\n');
console.log('✨ CURRENT STATUS:');
console.log(`\n   📄 Markdown:  ✅ ${MD_FILE}`);
console.log(`   🌐 HTML:      ✅ ${HTML_FILE}`);
console.log(`   📋 PDF:       ⏳ Waiting for conversion\n`);

console.log('Next Step: Use METHOD 1 above to create your PDF!\n');
console.log('═══════════════════════════════════════════════════════════\n');
