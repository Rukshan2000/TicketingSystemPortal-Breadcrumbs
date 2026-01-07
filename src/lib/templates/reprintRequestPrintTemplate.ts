import { ReprintRequest } from '@/store/services/reprintRequestApi';

const REASON_LABELS: Record<string, string> = {
  damaged: 'Damaged Ticket',
  lost: 'Lost Ticket',
  print_error: 'Print Error',
  customer_request: 'Customer Request',
  faded: 'Faded/Unreadable',
  other: 'Other',
};

const STATUS_CONFIG = {
  pending: { label: 'Pending' },
  approved: { label: 'Approved' },
  rejected: { label: 'Rejected' },
  completed: { label: 'Completed' },
} as const;

type StatusKey = keyof typeof STATUS_CONFIG;

export const getReasonLabel = (reason: string) => {
  return REASON_LABELS[reason] || reason;
};

export const getDisplayStatus = (request: ReprintRequest): StatusKey => {
  if ((request as any).approval_status === 'APPROVED') {
    return 'approved';
  }
  if ((request as any).approval_status === 'REJECTED') {
    return 'rejected';
  }
  return (request.status as StatusKey);
};

export const generateTicketPrintTemplate = (request: ReprintRequest): string => {
  const now = new Date();
  const dateStr = now.toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' }).toUpperCase();
  const timeStr = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
  const terminalId = 'T0001';
  const location = request.location || 'Main Entrance';
  const referenceNo = `${request.trace_no}${now.getTime()}`.substring(0, 30).toUpperCase();
  
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Ticket Receipt - ${request.id}</title>
      <style>
        @media print {
          body {
            margin: 0;
            padding: 2mm;
          }
          .no-print {
            display: none;
          }
          @page {
            margin: 0;
            size: 100mm auto;
            orphans: 0;
            widows: 0;
          }
        }

        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }

        body {
          font-family: 'Courier New', Courier, monospace;
          width: 100mm;
          margin: 0;
          padding: 3mm;
          background: white;
          color: black;
          font-size: 11pt;
          line-height: 1.2;
        }

        .receipt {
          width: 100%;
        }

        .header {
          text-align: center;
          margin-bottom: 1mm;
        }

        .logo-line {
          font-weight: bold;
          font-size: 14pt;
          margin: 0.5mm 0;
        }

        .temple-name {
          font-weight: bold;
          font-size: 9pt;
          margin: 3mm 0;
          letter-spacing: 0.5px;
        }

        .address-line {
          font-weight: bold;
          font-size: 11pt;
          margin: 0.5mm 0;
        }

        .contact-line {
          font-size: 10pt;
          text-align: left;
          margin: 0.5mm 0;
        }

        .divider {
          width: 100%;
          border: none;
          border-top: 1px dashed #000;
          margin: 0.8mm 0;
          padding: 0;
        }

        .info-line {
          font-size: 10pt;
          text-align: left;
          margin: 0.2mm 0;
          padding: 0;
          white-space: nowrap;
        }

        .amount-line {
          font-size: 10pt;
          text-align: left;
          margin: 0.2mm 0;
          padding: 0;
        }

        .bold {
          font-weight: bold;
        }

        .center {
          text-align: center;
        }

        .ticket-header {
          font-weight: bold;
          font-size: 10pt;
          text-align: center;
          margin: 0.5mm 0;
        }

        .qr-container {
          text-align: center;
          margin: 2mm 0;
          padding: 1mm 0;
        }

        #qrcode {
          margin: 0 auto;
          display: block;
        }

        .page-num {
          text-align: right;
          font-size: 10pt;
          margin-top: 2mm;
          margin-bottom: 3mm;
          padding-bottom: 2mm;
        }

        .logo-img {
          max-width: 35mm;
          height: auto;
          margin: 0 auto 1.5mm;
          display: block;
        }

        .print-button {
          position: fixed;
          top: 20px;
          right: 20px;
          padding: 10px 20px;
          background: #4CAF50;
          color: white;
          border: none;
          border-radius: 5px;
          cursor: pointer;
          font-size: 14pt;
          z-index: 1000;
        }

        .print-button:hover {
          background: #45a049;
        }

        .ticket-grid {
          display: grid;
          grid-template-columns: 1fr 1fr 1fr;
          gap: 1.5mm;
          font-size: 10pt;
          text-align: left;
          margin: 0.2mm 0;
          padding: 0;
        }

        .ticket-grid-header {
          font-weight: bold;
          display: grid;
          grid-template-columns: 1fr 1fr 1fr;
          gap: 1.5mm;
          font-size: 10pt;
          margin: 0.2mm 0;
          padding: 0;
        }

        .ticket-col {
          text-align: left;
        }

        .info-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1.5mm;
          font-size: 10pt;
          text-align: left;
          margin: 0.2mm 0;
          padding: 0;
        }
      </style>
      <script src="https://cdnjs.cloudflare.com/ajax/libs/qrious/4.0.2/qrious.min.js"></script>
    </head>
    <body>
      <button class="print-button no-print" onclick="window.print()">🖨️ Print Ticket</button>
      
      <div class="receipt">
        <div class="header">
          <div class="logo-line">TICKET MANAGEMENT SYSTEM</div>
          <div class="temple-name">REPRINT TICKET</div>
        </div>

        <div class="center">
          <div class="address-line">OFFICIAL ENTRY TICKET</div>
          <div class="address-line">VALID FOR ONE PERSON</div>
        </div>

        <hr class="divider">

        <!-- Date and Time -->
        <div class="info-grid">
          <div>DATE : ${dateStr}</div>
          <div>TIME : ${timeStr}</div>
        </div>

        <!-- Terminal and Location -->
        <div class="info-grid">
          <div>TERMINAL ID : ${terminalId}</div>
          <div>LOCATION : ${location}</div>
        </div>

        <!-- Number of Tickets -->
        <div class="info-line">NO. TICKETS : ${request.requested_copies}</div>

        <!-- Total Amount -->
        <div class="ticket-grid">
          <div class="ticket-col">TOTAL AMOUNT</div>
          <div class="ticket-col">LKR</div>
          <div class="ticket-col">${request.total_amount ? request.total_amount.toLocaleString('en-US', { minimumFractionDigits: 2 }) : '0.00'}</div>
        </div>

        <hr class="divider">

        <!-- Payment Details -->
        <div class="ticket-grid">
          <div class="ticket-col">TOTAL DEP</div>
          <div class="ticket-col">LKR</div>
          <div class="ticket-col">${request.total_amount ? request.total_amount.toLocaleString('en-US', { minimumFractionDigits: 2 }) : '0.00'}</div>
        </div>
        <div class="ticket-grid">
          <div class="ticket-col">BALANCE</div>
          <div class="ticket-col">LKR</div>
          <div class="ticket-col">0.00</div>
        </div>

        <hr class="divider">

        <!-- Reference Numbers -->
        <div class="info-line">TRACE NO : ${request.trace_no}</div>
        <div class="info-line">REFERENCE NO : ${referenceNo}</div>

        <hr class="divider">

        <!-- Ticket Type -->
        <div class="ticket-header bold">REPRINT - ${getReasonLabel(request.reason).toUpperCase()}</div>

        <hr class="divider">

        <!-- Ticket Details -->
        <div class="ticket-grid-header">
          <div class="ticket-col">TICKET AMOUNT P/P</div>
          <div class="ticket-col">#TICKETS</div>
          <div class="ticket-col">TOTAL AMOUNT</div>
        </div>
        <div class="ticket-grid">
          <div class="ticket-col">${request.total_amount ? (request.total_amount / request.requested_copies).toLocaleString('en-US', { minimumFractionDigits: 2 }) : '0.00'} LKR</div>
          <div class="ticket-col">${request.requested_copies}</div>
          <div class="ticket-col">${request.total_amount ? request.total_amount.toLocaleString('en-US', { minimumFractionDigits: 2 }) : '0.00'} LKR</div>
        </div>

        <!-- QR Code -->
        <div class="qr-container">
          <canvas id="qrcode"></canvas>
        </div>

        <div class="page-num">01/01</div>
      </div>

      <script>
        window.onload = function() {
          var qr = new QRious({
            element: document.getElementById('qrcode'),
            value: '${referenceNo}',
            size: 120,
            level: 'M'
          });
        };
      </script>
    </body>
    </html>
  `.trim();
};
