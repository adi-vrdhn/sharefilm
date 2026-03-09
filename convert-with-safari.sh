#!/bin/bash

# FilmShare Technical Report - HTML to PDF Converter
# This script uses macOS native tools to convert HTML to PDF

HTML_FILE="/Users/aditya/Desktop/GITHUB AI/myproject/TECHNICAL_REPORT.html"
PDF_FILE="/Users/aditya/Desktop/GITHUB AI/myproject/TECHNICAL_REPORT.pdf"

echo "📄 Converting HTML to PDF..."
echo "Parameters:"
echo "  Input:  $HTML_FILE"
echo "  Output: $PDF_FILE"
echo ""

# Check if HTML file exists
if [ ! -f "$HTML_FILE" ]; then
    echo "❌ Error: HTML file not found at $HTML_FILE"
    exit 1
fi

# Use macOS built-in print to PDF functionality via wkhtmltopdf alternative
# Try using Safari's native export via applescript
osascript <<EOF

tell application "Safari"
    open "$HTML_FILE"
    delay 2
    
    -- Print to PDF
    tell application "System Events"
        keystroke "p" using command down
        delay 1
        
        -- Select "Save as PDF" from print menu
        click menu button 2 of window 1 of application "System Events"
        delay 1
        click menu item "Save as PDF" of menu 1 of menu button 2 of window 1 of application "System Events"
        delay 2
        
        -- Specify the file path
        keystroke "$PDF_FILE"
        delay 1
        keystroke return
        delay 2
    end tell
    
    quit
end tell

EOF

if [ -f "$PDF_FILE" ]; then
    SIZE=$(du -h "$PDF_FILE" | cut -f1)
    echo ""
    echo "✅ Successfully created PDF!"
    echo "📊 File size: $SIZE"
    echo "📍 Location: $PDF_FILE"
    echo ""
    echo "✨ Your technical report is ready!"
    echo "You can now:"
    echo "  • Open the PDF with Preview or any PDF reader"
    echo "  • Share it via email or cloud storage"
    echo "  • Print it for physical copies"
else
    echo "⚠️  Safari automation may require accessibility permissions."
    echo "Please try the manual method:"
    echo "1. Open: $HTML_FILE"
    echo "2. Press: Cmd+P"
    echo "3. Select: Save as PDF"
    echo "4. Save to: TECHNICAL_REPORT.pdf"
fi
