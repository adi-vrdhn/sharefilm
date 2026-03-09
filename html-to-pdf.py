#!/usr/bin/env python3

from weasyprint import HTML, CSS
import os
from pathlib import Path

# Set up paths
project_root = Path('/Users/aditya/Desktop/GITHUB AI/myproject')
html_file = project_root / 'TECHNICAL_REPORT.html'
pdf_file = project_root / 'TECHNICAL_REPORT.pdf'

# Check if HTML file exists
if not html_file.exists():
    print(f"❌ HTML file not found: {html_file}")
    exit(1)

# Convert HTML to PDF
try:
    print(f"📄 Converting {html_file.name} to PDF...")
    HTML(string=open(html_file).read()).write_pdf(
        str(pdf_file),
        optimize_size=['shapes', 'images'],
        uncompressed_pdf=False
    )
    
    # Get file size
    pdf_size = pdf_file.stat().st_size
    size_mb = pdf_size / (1024 * 1024)
    
    print(f"✅ Successfully created PDF!")
    print(f"📊 File details:")
    print(f"   Path: {pdf_file}")
    print(f"   Size: {size_mb:.2f} MB ({pdf_size:,} bytes)")
    print(f"\n✨ Your technical report is ready for download!")
    
except Exception as e:
    print(f"❌ Error converting HTML to PDF: {e}")
    exit(1)
