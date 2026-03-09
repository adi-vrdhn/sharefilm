const fs = require('fs');
const path = require('path');

// Read the markdown file
const mdPath = path.join(__dirname, 'TECHNICAL_REPORT.md');
const markdown = fs.readFileSync(mdPath, 'utf8');

// Convert markdown to HTML
function markdownToHtml(md) {
  let html = md;
  
  // Headers
  html = html.replace(/^### (.*?)$/gm, '<h3>$1</h3>');
  html = html.replace(/^## (.*?)$/gm, '<h2>$1</h2>');
  html = html.replace(/^# (.*?)$/gm, '<h1>$1</h1>');
  
  // Bold and italic
  html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/__(.*?)__/g, '<strong>$1</strong>');
  html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');
  
  // Code blocks
  html = html.replace(/```([^`]*?)```/gs, '<pre><code>$1</code></pre>');
  
  // Inline code
  html = html.replace(/`([^`]+)`/g, '<code>$1</code>');
  
  // Links
  html = html.replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2">$1</a>');
  
  // Paragraphs
  html = html.replace(/\n\n/g, '</p><p>');
  html = '<p>' + html + '</p>';
  
  // Tables
  html = html.replace(/<p>\|.*?\n\|.*?<\/p>/gs, (match) => {
    const rows = match.replace(/<p>/g, '').replace(/<\/p>/g, '').split('\n');
    let table = '<table>';
    rows.forEach((row, i) => {
      if (!row.trim()) return;
      const cells = row.split('|').filter(c => c.trim());
      const isHeader = i === 0 || i === 1;
      table += '<tr>';
      cells.forEach(cell => {
        const tag = isHeader ? 'th' : 'td';
        table += `<${tag}>${cell.trim()}</${tag}>`;
      });
      table += '</tr>';
    });
    table += '</table>';
    return table;
  });
  
  return html;
}

const html = markdownToHtml(markdown);

const fullHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>FilmShare: Full-Stack Movie Recommendation Platform - Technical Report</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    html {
      font-size: 16px;
    }
    
    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      line-height: 1.6;
      color: #333;
      background: white;
      padding: 40px 60px;
      max-width: 1000px;
      margin: 0 auto;
    }
    
    h1 {
      color: #0066cc;
      border-bottom: 4px solid #0066cc;
      padding: 20px 0;
      margin: 40px 0 20px 0;
      font-size: 2.5rem;
      font-weight: 700;
    }
    
    h2 {
      color: #0066cc;
      margin: 35px 0 15px 0;
      font-size: 2rem;
      font-weight: 600;
      border-left: 5px solid #0066cc;
      padding-left: 15px;
    }
    
    h3 {
      color: #0080ff;
      margin: 25px 0 12px 0;
      font-size: 1.3rem;
      font-weight: 600;
    }
    
    p {
      margin: 12px 0;
      text-align: justify;
    }
    
    pre {
      background: #f5f5f5;
      border-left: 4px solid #0066cc;
      padding: 15px;
      margin: 15px 0;
      overflow-x: auto;
      border-radius: 4px;
      font-size: 0.9rem;
    }
    
    code {
      font-family: 'Courier New', monospace;
      background: #f5f5f5;
      padding: 2px 6px;
      border-radius: 3px;
      font-size: 0.95rem;
    }
    
    pre code {
      background: none;
      padding: 0;
      color: #333;
    }
    
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 20px 0;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    
    table th {
      background: #0066cc;
      color: white;
      padding: 12px;
      text-align: left;
      font-weight: 600;
    }
    
    table td {
      border: 1px solid #ddd;
      padding: 12px;
    }
    
    table tr:nth-child(even) {
      background: #f9f9f9;
    }
    
    table tr:hover {
      background: #f0f5ff;
    }
    
    ul, ol {
      margin: 15px 0 15px 40px;
    }
    
    li {
      margin: 8px 0;
    }
    
    a {
      color: #0066cc;
      text-decoration: none;
      border-bottom: 1px dotted #0066cc;
    }
    
    a:hover {
      background: #f0f5ff;
      border-bottom: 1px solid #0066cc;
    }
    
    em {
      font-style: italic;
      color: #555;
    }
    
    strong {
      font-weight: 700;
      color: #000;
    }
    
    blockquote {
      border-left: 5px solid #0066cc;
      padding-left: 15px;
      margin: 15px 0;
      color: #666;
      background: #f9f9f9;
      padding: 15px;
      border-radius: 4px;
    }
    
    hr {
      border: none;
      border-top: 3px solid #0066cc;
      margin: 40px 0;
    }
    
    @media print {
      body {
        padding: 20px;
      }
      
      h1, h2 {
        page-break-after: avoid;
      }
      
      pre {
        page-break-inside: avoid;
      }
      
      table {
        page-break-inside: avoid;
      }
    }
  </style>
</head>
<body>
  ${html}
  <hr>
  <p style="text-align: center; color: #999; margin-top: 60px; font-size: 0.9rem;">
    <strong>FilmShare Technical Report</strong> | Generated on March 4, 2026<br>
    This document contains proprietary technical information.
  </p>
</body>
</html>`;

const htmlPath = path.join(__dirname, 'TECHNICAL_REPORT.html');
fs.writeFileSync(htmlPath, fullHtml);
console.log('✅ Successfully converted TECHNICAL_REPORT.md to TECHNICAL_REPORT.html');
console.log('📄 File saved at:', htmlPath);
console.log('\n📌 To convert to PDF:');
console.log('   1. Open TECHNICAL_REPORT.html in your browser');
console.log('   2. Press Cmd+P (Mac) or Ctrl+P (Windows/Linux)');
console.log('   3. Select "Save as PDF"');
console.log('   4. Choose desired settings and save\n');
