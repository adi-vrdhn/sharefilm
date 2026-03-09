const fs = require('fs');
const path = require('path');

// Install required package
const { spawn } = require('child_process');

const projectPath = '/Users/aditya/Desktop/GITHUB AI/myproject';
const htmlFile = path.join(projectPath, 'TECHNICAL_REPORT.html');
const pdfFile = path.join(projectPath, 'TECHNICAL_REPORT.pdf');

console.log('🚀 Installing PDF converter...\n');

const npm = spawn('npm', ['install', '-g', 'html-pdf-node'], {
  cwd: projectPath,
  stdio: 'inherit'
});

npm.on('close', (code) => {
  if (code === 0) {
    console.log('\n✅ Converter installed! Converting HTML to PDF...\n');
    
    const converter = spawn('npx', ['html-pdf-node', '-i', htmlFile, '-o', pdfFile], {
      cwd: projectPath,
      stdio: 'inherit'
    });

    converter.on('close', (converterCode) => {
      if (converterCode === 0 && fs.existsSync(pdfFile)) {
        const size = (fs.statSync(pdfFile).size / (1024 * 1024)).toFixed(2);
        console.log('\n✅ PDF Created Successfully!');
        console.log(`📊 Size: ${size} MB`);
        console.log(`📍 Path: ${pdfFile}`);
      } else {
        console.log('\n⚠️  Conversion completed, checking file...');
      }
    });
  }
});
