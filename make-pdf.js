#!/usr/bin/env node

const path = require('path');
const fs = require('fs');
const { execSync } = require('child_process');

const projectRoot = '/Users/aditya/Desktop/GITHUB AI/myproject';
const htmlFile = path.join(projectRoot, 'TECHNICAL_REPORT.html');
const pdfFile = path.join(projectRoot, 'TECHNICAL_REPORT.pdf');

console.log('\n╔═══════════════════════════════════════════════════════════╗');
console.log('║     FilmShare Technical Report - PDF Generator           ║');
console.log('╚═══════════════════════════════════════════════════════════╝\n');

if (!fs.existsSync(htmlFile)) {
  console.error('❌ HTML file not found at:', htmlFile);
  process.exit(1);
}

console.log('📄 Converting TECHNICAL_REPORT.html to PDF...\n');
console.log('⏳ This may take a moment...\n');

try {
  // Create PDF using html2pdf command
  execSync(`html2pdf ${htmlFile} -o ${pdfFile}`, {
    cwd: projectRoot,
    timeout: 60000
  });

  if (fs.existsSync(pdfFile)) {
    const stats = fs.statSync(pdfFile);
    const sizeMB = (stats.size / (1024 * 1024)).toFixed(2);
    const sizeKB = (stats.size / 1024).toFixed(0);

    console.log('✅ SUCCESS! PDF Created!\n');
    console.log('╔═══════════════════════════════════════════════════════════╗');
    console.log('║                    PDF REPORT READY                        ║');
    console.log('╚═══════════════════════════════════════════════════════════╝\n');
    
    console.log('📊 File Details:');
    console.log(`   Name:     TECHNICAL_REPORT.pdf`);
    console.log(`   Size:     ${sizeMB} MB (${sizeKB} KB)`);
    console.log(`   Pages:    ~22 (IEEE Research Paper)`);
    console.log(`   Location: ${pdfFile}\n`);
    
    console.log('✨ Your report is ready to:');
    console.log('   📧 Email to stakeholders');
    console.log('   👥 Share with investors');
    console.log('   🎓 Submit for academic review');
    console.log('   🖨️  Print for presentations');
    console.log('   💾 Archive for reference\n');
    
    console.log('═══════════════════════════════════════════════════════════\n');
  } else {
    throw new Error('PDF file was not created');
  }
} catch (error) {
  console.error('⚠️  Conversion method 1 failed, trying alternative...\n');
  
  // Fallback: try pandoc
  try {
    execSync(`pandoc ${htmlFile} -o ${pdfFile}`, {
      timeout: 60000
    });
    
    if (fs.existsSync(pdfFile)) {
      const sizeMB = (fs.statSync(pdfFile).size / (1024 * 1024)).toFixed(2);
      console.log('✅ PDF Created with Pandoc!\n');
      console.log(`📊 Size: ${sizeMB} MB`);
      console.log(`📍 Location: ${pdfFile}\n`);
    }
  } catch (e) {
    console.error('❌ PDF generation attempted but requires manual conversion.\n');
    console.log('💡 Use your browser instead (takes 30 seconds):\n');
    console.log('   1. Open TECHNICAL_REPORT.html in your browser');
    console.log('   2. Press Cmd+P (Mac) or Ctrl+P (Windows)');
    console.log('   3. Select "Save as PDF"');
    console.log('   4. Save as TECHNICAL_REPORT.pdf\n');
  }
}
