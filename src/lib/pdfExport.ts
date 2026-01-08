// PDF Export Utility using browser native print capabilities
export interface ExportOptions {
  filename?: string;
  title?: string;
  generatedBy?: string;
  pageOrientation?: 'portrait' | 'landscape';
}

/**
 * Export report as black and white PDF
 * Uses browser's print-to-PDF functionality
 */
export const exportReportToPDF = async (
  htmlContent: string,
  options: ExportOptions = {}
) => {
  const {
    filename = `report_${Date.now()}.pdf`,
    title = 'Report',
    pageOrientation = 'portrait',
  } = options;

  // Create a temporary container
  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = htmlContent;
  tempDiv.className = 'print-content';
  
  // Apply print styles
  const style = document.createElement('style');
  style.textContent = `
    @media print {
      * {
        color: black !important;
        background: white !important;
        border-color: black !important;
      }
      
      .print-content {
        width: 100%;
        margin: 0;
        padding: 0;
      }
      
      .print-content table {
        width: 100%;
        border-collapse: collapse;
        margin: 20px 0;
      }
      
      .print-content th,
      .print-content td {
        padding: 8px;
        border: 1px solid black;
        text-align: left;
      }
      
      .print-content th {
        background: white !important;
        font-weight: bold;
        border-bottom: 2px solid black;
      }
      
      .print-content tr:nth-child(even) {
        background: white !important;
      }
      
      .print-content h1,
      .print-content h2,
      .print-content h3 {
        color: black !important;
        page-break-after: avoid;
      }
      
      .print-content p {
        margin: 10px 0;
      }
      
      .print-content .badge {
        background: white !important;
        border: 1px solid black;
        color: black !important;
        padding: 2px 6px;
        font-size: 12px;
      }
      
      @page {
        size: A4 ${pageOrientation === 'landscape' ? 'landscape' : 'portrait'};
        margin: 15mm;
      }
      
      body {
        margin: 0;
        padding: 0;
      }
    }
  `;

  document.head.appendChild(style);
  document.body.appendChild(tempDiv);

  // Open print dialog
  return new Promise<void>((resolve) => {
    window.print();
    
    // Cleanup after print
    setTimeout(() => {
      document.head.removeChild(style);
      document.body.removeChild(tempDiv);
      resolve();
    }, 1000);
  });
};

/**
 * Export report as CSV
 */
export const exportReportToCSV = (
  data: Record<string, any>[],
  filename: string = `report_${Date.now()}.csv`
) => {
  if (!data || data.length === 0) return;

  const headers = Object.keys(data[0]);
  const csvContent = [
    headers.join(','),
    ...data.map((row) =>
      headers.map((h) => {
        const value = row[h] ?? '';
        // Escape quotes and wrap in quotes if contains comma
        const escaped = String(value).replace(/"/g, '""');
        return escaped.includes(',') ? `"${escaped}"` : escaped;
      }).join(',')
    ),
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

/**
 * Format table HTML for PDF export
 */
export const formatTableForPDF = (
  data: Record<string, any>[],
  title: string = ''
): string => {
  if (!data || data.length === 0) {
    return `<p>No data available</p>`;
  }

  const headers = Object.keys(data[0]);
  
  let html = '';
  if (title) {
    html += `<h2 style="color: black; margin-top: 20px; margin-bottom: 10px;">${title}</h2>`;
  }

  html += '<table style="width: 100%; border-collapse: collapse; margin: 20px 0;">';
  
  // Header row
  html += '<thead><tr>';
  headers.forEach((header) => {
    html += `<th style="padding: 10px; border: 1px solid black; background: white; font-weight: bold; text-align: left;">${header}</th>`;
  });
  html += '</tr></thead>';

  // Body rows
  html += '<tbody>';
  data.forEach((row) => {
    html += '<tr>';
    headers.forEach((header) => {
      const value = row[header] ?? '-';
      html += `<td style="padding: 8px; border: 1px solid black; text-align: left;">${value}</td>`;
    });
    html += '</tr>';
  });
  html += '</tbody></table>';

  return html;
};

/**
 * Create a complete print document with letterhead and content
 */
export const createPrintDocument = (
  letterheadHTML: string,
  contentHTML: string,
  title: string = 'Report'
): string => {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8">
        <title>${title}</title>
        <style>
          * {
            margin: 0;
            padding: 0;
            color: black;
            background: white;
          }
          
          body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            padding: 20px;
          }
          
          @page {
            size: A4;
            margin: 15mm;
          }
          
          .letterhead {
            text-align: center;
            margin-bottom: 30px;
            border-bottom: 2px solid black;
            padding-bottom: 20px;
          }
          
          .letterhead h1 {
            font-size: 24px;
            font-weight: bold;
            margin-bottom: 5px;
          }
          
          .letterhead p {
            font-size: 12px;
            margin: 2px 0;
          }
          
          .letterhead .contact-info {
            display: flex;
            justify-content: center;
            gap: 20px;
            margin-top: 10px;
            font-size: 11px;
          }
          
          .report-details {
            display: grid;
            grid-template-columns: 1fr 1fr 1fr;
            gap: 20px;
            margin-bottom: 30px;
            font-size: 12px;
          }
          
          .report-details-item {
            border-bottom: 1px solid black;
            padding-bottom: 5px;
          }
          
          .report-details-item strong {
            display: block;
            margin-bottom: 3px;
          }
          
          .content {
            margin-top: 30px;
          }
          
          table {
            width: 100%;
            border-collapse: collapse;
            margin: 20px 0;
          }
          
          th {
            background: white !important;
            color: black;
            border: 1px solid black;
            padding: 10px;
            text-align: left;
            font-weight: bold;
          }
          
          td {
            border: 1px solid black;
            padding: 8px;
            text-align: left;
          }
          
          tr:nth-child(even) {
            background: white;
          }
          
          h1, h2, h3 {
            margin: 15px 0 10px 0;
            page-break-after: avoid;
          }
          
          .badge {
            background: white !important;
            color: black !important;
            border: 1px solid black;
            padding: 2px 6px;
            font-size: 11px;
            display: inline-block;
            margin: 2px;
          }
          
          .footer {
            margin-top: 40px;
            padding-top: 20px;
            border-top: 1px solid black;
            font-size: 10px;
            color: black;
            text-align: center;
          }
        </style>
      </head>
      <body>
        <div class="letterhead">
          ${letterheadHTML}
        </div>
        <div class="content">
          ${contentHTML}
        </div>
        <div class="footer">
          <p>This document is confidential and intended for authorized use only.</p>
          <p>Generated on ${new Date().toLocaleString()}</p>
        </div>
      </body>
    </html>
  `;
};
