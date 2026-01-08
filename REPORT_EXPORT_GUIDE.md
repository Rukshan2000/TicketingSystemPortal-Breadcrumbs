# Report Letterhead & PDF Export Documentation

## Overview

This feature adds professional letterhead templates to reports and enables users to export reports as black and white PDFs with a polished, professional appearance.

## Features Implemented

### 1. Report Letterhead Component
**File**: `src/components/reports/report-letterhead.tsx`

A reusable letterhead component that displays:
- Organization name and branding
- Contact information (email, phone, website)
- Report generation details
- Confidentiality disclaimer

**Usage**:
```tsx
<ReportLetterhead
  title="Ticket Summary Report"
  generatedBy="John Doe"
  generatedDate="January 8, 2026"
/>
```

### 2. PDF Export Utilities
**File**: `src/lib/pdfExport.ts`

Provides multiple utility functions for exporting reports:

#### `exportReportToPDF(htmlContent, options)`
Exports HTML content as a black and white PDF using the browser's print dialog.

**Parameters**:
- `htmlContent`: HTML string to export
- `options.filename`: Output filename (default: `report_${timestamp}.pdf`)
- `options.title`: Report title
- `options.pageOrientation`: 'portrait' or 'landscape' (default: 'portrait')

#### `exportReportToCSV(data, filename)`
Exports data array as a CSV file with proper escaping.

**Parameters**:
- `data`: Array of objects to export
- `filename`: Output filename

#### `formatTableForPDF(data, title)`
Formats a data array into an HTML table with PDF-friendly styling.

#### `createPrintDocument(letterheadHTML, contentHTML, title)`
Creates a complete, print-ready HTML document with letterhead and content.

### 3. Print Styles
**File**: `src/styles/print.css`

CSS media queries that ensure black and white printing:
- Forces black text on white background
- Proper table formatting with borders
- Page break handling
- Professional spacing and typography

## Implementation in Reports Page

The Reports page (`src/app/dashboard/reports/page.tsx`) has been updated with:

### Letterhead Display
The report letterhead is displayed at the top of the Reports page:
```tsx
<ReportLetterhead
  title="Reports & Analytics"
  generatedBy={currentUser.name}
/>
```

### Export Buttons
Each report tab now includes CSV and PDF export buttons:

**Ticket Reports**:
- CSV Export: Exports as CSV with columns
- PDF Export: Opens print dialog to save as black and white PDF

**User Activity Reports**:
- CSV Export: User data in CSV format
- PDF Export: Professional letterhead + user table in PDF

**Custom Reports**:
- CSV Export: Custom query results as CSV
- PDF Export: Letterhead + custom query results as PDF

## How to Use

### For Users

1. **View Reports**
   - Navigate to the Reports & Analytics page
   - Select desired report tab (Tickets, Users, Workflows, Reviews, or Custom)
   - Data loads automatically

2. **Export as CSV**
   - Click the "CSV" button in the report header
   - File downloads automatically

3. **Export as PDF**
   - Click the "PDF" button in the report header
   - Browser print dialog opens
   - Select "Save as PDF" as the printer
   - Click "Save"
   - Choose location and filename

4. **Customize PDF Export**
   - In the print dialog, you can:
     - Adjust margins
     - Change paper size
     - Exclude header/footer (if needed)
     - Set to grayscale for true black and white

### For Developers

To add PDF export to new report types:

```tsx
import { exportReportToCSV, createPrintDocument } from '@/lib/pdfExport';

// CSV Export
const handleExportCSV = () => {
  const data = yourReportData.map(row => ({
    'Column 1': row.col1,
    'Column 2': row.col2,
  }));
  exportReportToCSV(data, 'report-name.csv');
};

// PDF Export
const handleExportPDF = () => {
  const tableHTML = `
    <h2>Report Title</h2>
    <table>
      <!-- your table structure -->
    </table>
  `;
  
  const letterheadHTML = `
    <h1>Organization Name</h1>
    <p>Additional info</p>
  `;
  
  const fullHTML = createPrintDocument(letterheadHTML, tableHTML, 'Report Title');
  const printWindow = window.open('', '', 'width=800,height=600');
  if (printWindow) {
    printWindow.document.write(fullHTML);
    printWindow.document.close();
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 250);
  }
};
```

## Black and White Output

The PDF export is designed for black and white printing:

- ✅ All text is pure black (RGB: 0, 0, 0)
- ✅ All backgrounds are white (RGB: 255, 255, 255)
- ✅ Tables have 1px solid black borders
- ✅ Badge indicators use black borders (no colors)
- ✅ Professional spacing and typography
- ✅ Proper page breaks to avoid splitting data

## Files Modified

1. **src/app/dashboard/reports/page.tsx**
   - Added letterhead component
   - Added PDF export functions
   - Updated all report tabs with export buttons
   - Added CSV and PDF export handlers

2. **src/app/globals.css**
   - Imported print styles

## Files Created

1. **src/components/reports/report-letterhead.tsx**
   - Professional letterhead component

2. **src/lib/pdfExport.ts**
   - All PDF and CSV export utilities

3. **src/styles/print.css**
   - Print-specific CSS media queries

## Browser Compatibility

- ✅ Chrome/Chromium
- ✅ Firefox
- ✅ Safari
- ✅ Edge
- ✅ Mobile browsers (print to PDF support varies)

## Notes

- No external PDF libraries required (uses browser native print)
- Black and white output ensures compatibility with all printers
- Print dialog provides additional customization options
- All data is processed client-side for privacy
- File names include timestamps to prevent overwrites

## Future Enhancements

Potential improvements:
- Add direct PDF download without print dialog (requires external library like jsPDF)
- Custom branding/logo in letterhead
- Watermarks and document numbering
- Email report delivery
- Scheduled report generation
- Report templates customization
