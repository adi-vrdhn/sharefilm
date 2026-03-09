const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

(async () => {
  try {
    console.log('📄 Launching PDF converter...\n');
    
    const htmlFile = path.join(__dirname, 'TECHNICAL_REPORT.html');
    const pdfFile = path.join(__dirname, 'TECHNICAL_REPORT.pdf');
    
    // Check if html file exists
    if (!fs.existsSync(htmlFile)) {
      console.error('❌ HTML file not found!');
      process.exit(1);
    }

    const browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox']
    });

    const page = await browser.newPage();
    
    // Load the HTML file
    const htmlContent = fs.readFileSync(htmlFile, 'utf-8');
    await page.setContent(htmlContent, { waitUntil: 'networkidle2' });

    // Generate PDF with optimized settings
    await page.pdf({
      path: pdfFile,
      format: 'A4',
      margin: {
        top: '10mm',
        right: '10mm',
        bottom: '10mm',
        left: '10mm'
      },
      printBackground: true,
      displayHeaderFooter: false,
      preferCSSPageSize: true
    });

    await browser.close();

    if (fs.existsSync(pdfFile)) {
      const size = (fs.statSync(pdfFile).size / (1024 * 1024)).toFixed(2);
      console.log('✅ PDF Created Successfully!\n');
      console.log('📊 Report Details:');
      console.log(`   File Size: ${size} MB`);
      console.log(`   Format: A4 (22 pages)`);
      console.log(`   Location: ${pdfFile}\n`);
      console.log('✨ Ready to download and share!');
    }
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
})();
