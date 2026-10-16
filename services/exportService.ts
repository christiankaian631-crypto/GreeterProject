
import { Reservation, ReservationStatus } from '../types';
import * as XLSX from 'xlsx';

export const exportToExcel = (reservations: Reservation[], filename: string) => {
  const headers = [
    "Date", 
    "Time", 
    "Status", 
    "Type", 
    "Guest Name", 
    "Pax", 
    "Table Number", 
    "Merged Tables",
    "Area", 
    "SM Classification",
    "Phone", 
    "Company", 
    "PIC Incharge", 
    "Deposit (DP) Amount", 
    "Notes",
    "Cancellation Reason"
  ];

  const data = reservations.map(res => {
    const smLabel = res.isHarrySalesManager ? 'Harry SM' : (res.isNurulSalesManager ? 'Nurul SM' : 'Regular');
    
    return [
      res.reservationDate,
      res.arrivalTime,
      res.status,
      res.isWalkIn ? 'Walk-In' : 'Reservation',
      res.guestName.toUpperCase(),
      res.guestCount,
      res.tableNumber || '',
      res.mergedTables?.join(', ') || '',
      res.locationPreference,
      smLabel,
      res.phoneNumber || '',
      res.companyOrPersonalName || '',
      res.picIncharge || '', 
      res.hasDownPayment ? res.downPaymentAmount : 0,
      res.otherRequirements || '',
      res.cancellationReason || ''
    ];
  });

  const ws = XLSX.utils.aoa_to_sheet([headers, ...data]);
  
  // Set column widths
  ws['!cols'] = [
    { wch: 12 }, // Date
    { wch: 10 }, // Time
    { wch: 15 }, // Status
    { wch: 12 }, // Type
    { wch: 30 }, // Guest Name
    { wch: 8 },  // Pax
    { wch: 15 }, // Table Number
    { wch: 20 }, // Merged Tables
    { wch: 15 }, // Area
    { wch: 15 }, // SM Classification
    { wch: 15 }, // Phone
    { wch: 20 }, // Company
    { wch: 20 }, // PIC Incharge
    { wch: 15 }, // Deposit
    { wch: 30 }, // Notes
    { wch: 30 }  // Cancellation Reason
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Reservations");
  XLSX.writeFile(wb, `${filename}.xlsx`);
};

export const exportToCSV = (reservations: Reservation[], filename: string) => {
  // Define Headers
  const headers = [
    "Date", 
    "Time", 
    "Status", 
    "Type", 
    "Guest Name", 
    "Pax", 
    "Table Number", 
    "Merged Tables",
    "Area", 
    "SM Classification",
    "Phone", 
    "Company", 
    "PIC Incharge", 
    "Deposit (DP) Amount", 
    "Notes",
    "Cancellation Reason"
  ];

  // Map Data
  const rows = reservations.map(res => {
    // Handle special characters and quotes in CSV
    const escape = (val: string | undefined | null) => {
        if (!val) return '';
        return `"${val.replace(/"/g, '""')}"`;
    };

    const tableStr = res.mergedTables && res.mergedTables.length > 0 
        ? `${res.tableNumber} + ${res.mergedTables.join('+')}`
        : res.tableNumber || '';

    const smLabel = res.isHarrySalesManager ? 'Harry SM' : (res.isNurulSalesManager ? 'Nurul SM' : 'Regular');

    return [
      res.reservationDate,
      res.arrivalTime,
      res.status,
      res.isWalkIn ? 'Walk-In' : 'Reservation',
      escape(res.guestName),
      res.guestCount,
      escape(res.tableNumber),
      escape(res.mergedTables?.join(', ')),
      res.locationPreference,
      smLabel,
      `'${res.phoneNumber}`, // Force string for excel phone numbers to prevent scientific notation
      escape(res.companyOrPersonalName),
      escape(res.picIncharge), 
      res.hasDownPayment ? res.downPaymentAmount : 0,
      escape(res.otherRequirements),
      escape(res.cancellationReason)
    ].join(',');
  });

  const csvContent = [headers.join(','), ...rows].join('\n');
  
  // Create Blob and Link
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", `${filename}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

export const exportToHTML = (data: any[], headers: string[], filename: string, title: string) => {
  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>${title}</title>
      <style>
        body { font-family: sans-serif; padding: 20px; background: #f4f4f4; }
        h1 { color: #333; text-align: center; }
        table { width: 100%; border-collapse: collapse; background: white; box-shadow: 0 2px 5px rgba(0,0,0,0.1); }
        th, td { padding: 12px; text-align: left; border-bottom: 1px solid #ddd; }
        th { background-color: #b8860b; color: white; text-transform: uppercase; font-size: 12px; }
        tr:hover { background-color: #f9f9f9; }
        .footer { margin-top: 20px; font-size: 10px; color: #888; text-align: center; }
      </style>
    </head>
    <body>
      <h1>${title}</h1>
      <table>
        <thead>
          <tr>
            ${headers.map(h => `<th>${h}</th>`).join('')}
          </tr>
        </thead>
        <tbody>
          ${data.map(row => `
            <tr>
              ${row.map((cell: any) => `<td>${cell || '-'}</td>`).join('')}
            </tr>
          `).join('')}
        </tbody>
      </table>
      <div class="footer">Generated by Justus Greeter App on ${new Date().toLocaleString()}</div>
    </body>
    </html>
  `;

  const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", `${filename}.html`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

export const exportFloorPlanToHTML = (zones: any[], reservations: Reservation[], filename: string, outletName: string) => {
  const getReservationsForTable = (tableNum: string) => {
    return reservations.filter(r => 
      (r.tableNumber === tableNum || r.mergedTables?.includes(tableNum)) && 
      (r.status === ReservationStatus.CONFIRMED || r.status === ReservationStatus.CHECKED_IN)
    );
  };

  const getTableStatus = (tableRes: any[]) => {
    if (tableRes.length === 0) return { status: 'FREE', res: null };
    const checkedIn = tableRes.find(r => r.status === ReservationStatus.CHECKED_IN);
    if (checkedIn) return { status: 'OCCUPIED', res: checkedIn };
    const confirmed = tableRes.filter(r => r.status === ReservationStatus.CONFIRMED).sort((a: any, b: any) => a.arrivalTime.localeCompare(b.arrivalTime));
    if (confirmed.length > 0) return { status: 'RESERVED', res: confirmed[0] };
    return { status: 'FREE', res: null };
  };

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Floor Plan - ${outletName}</title>
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;700;900&family=Playfair+Display:wght@900&display=swap');
        
        :root {
          --gold: #d4af37;
          --bg: #050505;
          --surface: #0a0a0a;
          --active: #2563eb;
          --text: #ffffff;
        }

        body { 
          font-family: 'Inter', sans-serif; 
          padding: 40px; 
          background: var(--bg); 
          color: var(--text); 
          margin: 0;
        }

        .header { 
          text-align: center; 
          margin-bottom: 60px; 
          border-bottom: 1px solid rgba(212, 175, 55, 0.3); 
          padding-bottom: 30px; 
        }

        h1 { 
          font-family: 'Playfair Display', serif;
          font-size: 48px;
          color: var(--gold); 
          text-transform: uppercase; 
          letter-spacing: 8px; 
          margin: 0; 
        }

        .subtitle {
          font-size: 12px;
          font-weight: 900;
          letter-spacing: 4px;
          color: #666;
          margin-top: 10px;
          text-transform: uppercase;
        }

        .zone { 
          margin-bottom: 60px; 
          background: var(--surface); 
          padding: 40px; 
          border-radius: 40px; 
          border: 1px solid rgba(255,255,255,0.05); 
          box-shadow: 0 20px 50px rgba(0,0,0,0.5);
        }

        .zone-title { 
          font-size: 24px; 
          font-weight: 900; 
          text-transform: uppercase; 
          letter-spacing: 4px; 
          color: var(--gold); 
          margin-bottom: 30px; 
          display: flex;
          align-items: center;
          gap: 15px;
        }

        .zone-title::after {
          content: '';
          height: 1px;
          flex: 1;
          background: rgba(212, 175, 55, 0.2);
        }

        .grid { 
          display: grid; 
          grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); 
          gap: 20px; 
        }

        .table { 
          padding: 25px; 
          border-radius: 24px; 
          border: 1px solid rgba(255,255,255,0.05); 
          display: flex; 
          flex-direction: column; 
          justify-content: space-between; 
          min-height: 140px; 
          transition: transform 0.3s ease;
          position: relative;
          overflow: hidden;
        }

        .table-num { 
          font-size: 32px; 
          font-weight: 900; 
          letter-spacing: -2px;
        }

        .table-label { 
          font-size: 10px; 
          font-weight: 900;
          opacity: 0.4; 
          text-transform: uppercase; 
          letter-spacing: 2px;
        }

        .status-free { background: rgba(255,255,255,0.02); color: rgba(255,255,255,0.3); }
        .status-occupied { background: var(--active); color: #fff; box-shadow: 0 10px 30px rgba(37, 99, 235, 0.3); }
        .status-reserved { background: var(--gold); color: #000; box-shadow: 0 10px 30px rgba(212, 175, 55, 0.3); }

        .guest-name { 
          font-size: 14px; 
          font-weight: 900; 
          margin-top: 15px; 
          text-transform: uppercase; 
          letter-spacing: -0.5px;
          line-height: 1.2;
        }

        .details { 
          font-size: 11px; 
          margin-top: 8px; 
          font-weight: 700;
          opacity: 0.8; 
          display: flex;
          gap: 10px;
        }

        .footer { 
          margin-top: 80px; 
          text-align: center; 
          font-size: 10px; 
          color: #444; 
          text-transform: uppercase;
          letter-spacing: 2px;
        }

        .legend {
          display: flex;
          justify-content: center;
          gap: 30px;
          margin-bottom: 40px;
        }

        .legend-item {
          display: flex;
          align-items: center;
          gap: 10px;
          font-size: 10px;
          font-weight: 900;
          text-transform: uppercase;
          letter-spacing: 1px;
          color: #666;
        }

        .dot { width: 8px; height: 8px; border-radius: 50%; }

        @media print {
          body { background: white; color: black; padding: 20px; }
          .zone { background: none; border: 1px solid #eee; box-shadow: none; page-break-inside: avoid; }
          .status-free { background: #f9f9f9; color: #ccc; border: 1px solid #eee; }
          .status-occupied { background: #eee; color: #000; border: 2px solid #000; }
          .status-reserved { background: #fff; color: #000; border: 2px solid #d4af37; }
          .header h1 { color: black; }
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>${outletName}</h1>
        <div class="subtitle">Operational Floor Plan Layout</div>
        <div style="font-size: 10px; color: #444; margin-top: 15px; font-weight: 900; letter-spacing: 2px;">
          GENERATED: ${new Date().toLocaleString().toUpperCase()}
        </div>
      </div>

      <div class="legend">
        <div class="legend-item"><div class="dot" style="background: rgba(255,255,255,0.1)"></div>Available</div>
        <div class="legend-item"><div class="dot" style="background: var(--gold)"></div>Reserved</div>
        <div class="legend-item"><div class="dot" style="background: var(--active)"></div>Occupied</div>
      </div>

      ${zones.map(zone => `
        <div class="zone">
          <div class="zone-title">${zone.name}</div>
          <div class="grid">
            ${Array.from({ length: zone.tableEnd - zone.tableStart + 1 }, (_, i) => (zone.tableStart + i).toString()).map(num => {
              const tableResList = getReservationsForTable(num);
              const { status, res } = getTableStatus(tableResList);
              const statusClass = status === 'OCCUPIED' ? 'status-occupied' : (status === 'RESERVED' ? 'status-reserved' : 'status-free');
              
              return `
                <div class="table ${statusClass}">
                  <div style="display: flex; justify-content: space-between; align-items: flex-start;">
                    <span class="table-label">Table</span>
                    <span class="table-num">${num}</span>
                  </div>
                  ${res ? `
                    <div>
                      <div class="guest-name">${res.guestName}</div>
                      <div class="details">
                        <span>${res.arrivalTime}</span>
                        <span>•</span>
                        <span>${res.guestCount} PAX</span>
                      </div>
                    </div>
                  ` : `
                    <div style="font-size: 9px; font-weight: 900; letter-spacing: 2px; opacity: 0.2; text-align: center; margin-top: 20px;">VACANT</div>
                  `}
                </div>
              `;
            }).join('')}
          </div>
        </div>
      `).join('')}

      <div class="footer">
        &copy; ${new Date().getFullYear()} JUSTUS STEAKHOUSE GROUP - CONFIDENTIAL OPERATIONAL DOCUMENT
      </div>
    </body>
    </html>
  `;

  const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", `${filename}.html`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
