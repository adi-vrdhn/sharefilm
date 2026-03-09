const http = require('http');
const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'TECHNICAL_REPORT.html');
const htmlContent = fs.readFileSync(filePath, 'utf8');

// Create a simple HTTP server to serve the file
const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
  res.end(htmlContent);
});

const PORT = 3000;
server.listen(PORT, () => {
  console.log(`\n📌 HTML Server Running!`);
  console.log(`🌐 Open your browser and go to: http://localhost:${PORT}`);
  console.log(`\n📄 To Save as PDF:`);
  console.log(`   1. Press Cmd+P (Mac) or Ctrl+P (Windows)`);
  console.log(`   2. Select "Save as PDF"`);
  console.log(`   3. Configure options:`);
  console.log(`      - Margins: Minimal (to save space)`);
  console.log(`      - Format: A4`);
  console.log(`      - Orientation: Portrait`);
  console.log(`   4. Click "Save"\n`);
  console.log(`Press Ctrl+C to stop the server\n`);
});
