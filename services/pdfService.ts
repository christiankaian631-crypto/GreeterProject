import { Reservation, ReservationStatus, Shift, MenuOrderType, WaitingListEntry, WaitingStatus } from '../types';
import { MENU_DATA_BANDUNG, MENU_DATA_JAKARTA } from '../components/MenuList';
import * as XLSX from 'xlsx';
import html2canvas from 'html2canvas';

declare global {
  interface Window {
    jspdf: any;
  }
}

const formatDate = (dateStr: string) => {
  return new Date(dateStr).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
};

const getFileDateFormat = (dateStr: string) => {
  const d = new Date(dateStr);
  const day = d.getDate();
  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  const month = monthNames[d.getMonth()];
  const year = d.getFullYear().toString().slice(-2);
  return `${day} ${month} ${year}`;
};

const getShortDateFormat = (dateStr: string, includeYear: boolean = true) => {
  const d = new Date(dateStr);
  const day = d.getDate();
  const monthNames = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];
  const month = monthNames[d.getMonth()];
  const year = d.getFullYear().toString().slice(-2);
  return includeYear ? `${day} ${month} ${year}` : `${day} ${month}`;
};

const getForecastFilename = (dateStr: string) => {
  const today = new Date().toISOString().split('T')[0];
  const tomorrowDate = new Date();
  tomorrowDate.setDate(tomorrowDate.getDate() + 1);
  const tomorrow = tomorrowDate.toISOString().split('T')[0];
  
  const shortDate = getShortDateFormat(dateStr, true);
  
  if (dateStr === today) {
    return `TODAY FORECAST RESERVASI ${shortDate}`;
  } else if (dateStr === tomorrow) {
    return `TOMMOROW FORCAST RESERVATION ${shortDate}`;
  } else {
    return `FORECAST RESERVASI ${shortDate}`;
  }
};

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount || 0);
};

// Global Theme Colors
const THEME_GOLD_PREMIUM = [184, 134, 11]; // Premium Gold for Headers
const DARK_GREEN = [0, 100, 0]; // Dark Green for specific keywords
const SHIFT_LUNCH_COLOR = [0, 123, 255]; // Blue
const SHIFT_IFTAR_COLOR = [16, 185, 129]; // Emerald/Green
const SHIFT_DINNER_COLOR = [79, 70, 229]; // Indigo

const FOOD_PRIORITY = [
  'SALAD', 'SOUP', 'LIGHT MEAL', 'KIDS MEAL', 'SPECIALTY STEAK', 'PRIME SELECTION', 
  'BIG CUT', 'FAMILY SET', 'WESTERN DELIGHT', 'PASTA LOVERS', 'ASIAN DELIGHT', 
  'INDONESIAN FAVORITE', 'BURGER & SANDWICH', 'NPD', 'DESSERT'
];

const BEVERAGE_PRIORITY = [
  'JUICE', 'SMOOTHIES', 'DRINKING & MINERAL WATER', 'MILKSHAKE', 'SOFT DRINK', 
  'FRAPPE', 'ARTISAN TEA', 'TEA', 'COFFEE', 'MANUAL BREW', 'CHOCOLATE', 
  'ICED BLENDED', 'MOCKTAIL', 'FREE MENU'
];

// Helper for conditional styling within table cells
const applyKeywordStyling = (data: any) => {
  const text = data.cell.text ? data.cell.text.join(' ').toUpperCase() : '';
  const keywords = ['BUKA PUASA', 'ON THE SPOT', 'MENU DI AWAL', 'PESANAN'];
  
  const matches = keywords.some(k => text.includes(k));
  if (matches) {
    data.cell.styles.textColor = DARK_GREEN;
    data.cell.styles.fontStyle = 'bold';
  } else {
    data.cell.styles.textColor = [0, 0, 0];
    data.cell.styles.fontStyle = 'bold';
  }
};

export const shareFile = async (blob: Blob, fileName: string, title: string, waText?: string) => {
  const file = new File([blob], fileName, { type: 'application/pdf' });
  
  const triggerDownload = () => {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    link.click();
    URL.revokeObjectURL(url);
  };

  if (navigator.canShare && navigator.canShare({ files: [file] })) {
    try {
      await navigator.share({
        files: [file],
        title: title,
        text: waText || `Shared Document: ${fileName}`
      });
      return true;
    } catch (err) {
      const error = err as Error;
      if (error.name === 'AbortError') return false;
      console.warn('Share API fallback to download:', error.message);
      triggerDownload();
      return false;
    }
  } else {
    triggerDownload();
    return false;
  }
};

// 1. Generate Operational Summary PDF
export const generateOperationalTodayPDF = async (
  reservations: Reservation[],
  waitingList: WaitingListEntry[],
  date: string,
  outletName: string = "JUSTUS STEAKHOUSE"
) => {
  if (!window.jspdf) return;

  try {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF('l', 'mm', 'a4'); 
    const pageWidth = doc.internal.pageSize.getWidth();
    const centerX = pageWidth / 2;

    const dateReservations = reservations.filter(r => r.reservationDate === date);
    const dateWaiting = waitingList.filter(w => w.reservationDate === date);

    const walkIns = dateReservations.filter(r => r.isWalkIn && r.status !== ReservationStatus.CANCELLED);
    const walkInStats = { groups: walkIns.length, pax: walkIns.reduce((s, r) => s + r.guestCount, 0) };

    const bookings = dateReservations.filter(r => !r.isWalkIn);
    const activeBookings = bookings.filter(r => r.status !== ReservationStatus.CANCELLED);
    const rsvStats = { 
      groups: activeBookings.length, 
      pax: activeBookings.reduce((s, r) => s + r.guestCount, 0), 
      cancelledPax: bookings.filter(r => r.status === ReservationStatus.CANCELLED).reduce((s, r) => s + r.guestCount, 0) 
    };

    const seatedWait = dateWaiting.filter(w => w.status === WaitingStatus.SEATED);
    const waitStats = { 
      groups: dateWaiting.length, 
      pax: dateWaiting.reduce((s, w) => s + w.guestCount, 0), 
      cancelledPax: dateWaiting.filter(w => w.status === WaitingStatus.CANCELLED).reduce((s, w) => s + w.guestCount, 0) 
    };

    const totalStats = {
      groups: walkInStats.groups + rsvStats.groups + dateWaiting.filter(w => w.status !== WaitingStatus.CANCELLED).length,
      pax: walkInStats.pax + rsvStats.pax + seatedWait.reduce((s, w) => s + w.guestCount, 0),
      cancelledPax: rsvStats.cancelledPax + waitStats.cancelledPax
    };

    doc.setFillColor(30, 30, 30);
    doc.rect(0, 0, 297, 40, 'F');
    doc.setTextColor(...THEME_GOLD_PREMIUM);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(24);
    const titleText1 = outletName === "JUSTUS STEAKHOUSE" ? "JUSTUS STEAKHOUSE" : `JUSTUS STEAKHOUSE | ${outletName}`;
    doc.text(titleText1, centerX, 15, { align: 'center' });
    doc.setFontSize(12);
    doc.setTextColor(255, 255, 255);
    doc.text("DAILY OPERATIONAL SUMMARY REPORT", centerX, 24, { align: 'center' });
    doc.setFontSize(9);
    doc.setTextColor(180, 180, 180);
    doc.text(`Periode: ${formatDate(date).toUpperCase()}`, centerX, 30, { align: 'center' });

    let currentY = 50;

    if (dateWaiting.length > 0) {
      doc.setFillColor(...THEME_GOLD_PREMIUM);
      doc.rect(8, currentY, 281, 8, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(9); doc.setFont("helvetica", "bold");
      doc.text("DETAIL DATA WAITING LIST", 12, currentY + 5.5);
      currentY += 10;

      const waitRows = dateWaiting.sort((a,b) => a.joinedAt - b.joinedAt).map((w, i) => [
        (i + 1).toString(), w.guestName.toUpperCase(), w.phoneNumber || '-', `${w.guestCount} PX`,
        new Date(w.joinedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }),
        w.status.toUpperCase(), w.preferredTable?.toUpperCase() || '-'
      ]);

      (doc as any).autoTable({
        head: [['#', 'NAMA TAMU', 'PHONE', 'PAX', 'JOIN TIME', 'STATUS', 'AREA']],
        body: waitRows,
        startY: currentY,
        theme: 'grid',
        headStyles: { fillColor: THEME_GOLD_PREMIUM, textColor: [255, 255, 255], fontSize: 8, fontStyle: 'bold', halign: 'center' },
        styles: { fontSize: 7, cellPadding: 2, halign: 'center', fontStyle: 'bold', textColor: [0, 0, 0] },
        margin: { left: 8, right: 8 }
      });
      currentY = (doc as any).lastAutoTable.finalY + 10;
    }

    [Shift.LUNCH, Shift.IFTAR, Shift.DINNER].forEach(shift => {
      const shiftData = dateReservations.filter(r => r.shift === shift);
      if (shiftData.length === 0) return;
      if (currentY > 230) { doc.addPage(); currentY = 20; }

      doc.setFillColor(...THEME_GOLD_PREMIUM);
      doc.rect(8, currentY, 281, 8, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFont("helvetica", "bold");
      doc.text(`DETAIL DATA ${shift} SHIFT`, 12, currentY + 5.5);
      currentY += 10;

      const rsvRows = shiftData.sort((a,b) => a.arrivalTime.localeCompare(b.arrivalTime)).map((r, i) => {
        const payLabel = r.hasDownPayment 
            ? `${r.paymentBank} (${r.paymentSubMethod}) - ${r.isFullPayment ? 'LUNAS' : 'DP'}: ${formatCurrency(r.downPaymentAmount)}`
            : 'UNPAID';
            
        return [
          (i + 1).toString(), r.guestName.toUpperCase(), r.phoneNumber || '-', `${r.guestCount} PX`, r.arrivalTime,
          r.isWalkIn ? 'WALK-IN' : 'BOOKING', r.menuOrderType?.toUpperCase() || 'ON THE SPOT',
          r.isHarrySalesManager ? 'HARRY SM' : (r.isNurulSalesManager ? 'NURUL SM' : 'REGULAR'),
          r.tableNumber || '-', r.status.toUpperCase(), payLabel
        ];
      });

      (doc as any).autoTable({
        head: [['#', 'NAMA TAMU', 'PHONE', 'PAX', 'WAKTU', 'TIPE', 'PESANAN', 'KLASIFIKASI', 'MEJA', 'STATUS', 'PEMBAYARAN (BANK/METHOD - CAT: NOMINAL)']],
        body: rsvRows,
        startY: currentY,
        theme: 'grid',
        headStyles: { fillColor: THEME_GOLD_PREMIUM, fontSize: 7, fontStyle: 'bold', halign: 'center' },
        styles: { fontSize: 6.5, cellPadding: 2, halign: 'center', fontStyle: 'bold', textColor: [0, 0, 0] },
        margin: { left: 8, right: 8 },
        didParseCell: applyKeywordStyling
      });
      currentY = (doc as any).lastAutoTable.finalY + 10;
    });

    if (currentY > 230) { doc.addPage(); currentY = 20; }
    doc.setDrawColor(200, 200, 200);
    doc.setFillColor(248, 248, 248);
    doc.rect(8, currentY, 281, 40, 'FD');
    doc.setFontSize(10); doc.setTextColor(0, 0, 0); doc.setFont("helvetica", "bold");
    doc.text("SUMMARY OPERATIONAL TODAY", 12, currentY + 8);
    
    const statsX = [12, 82, 152, 222];
    const rowY = currentY + 18;
    doc.setFontSize(8);

    const drawStats = (x: number, label: string, color: number[], g: number, p: number, c?: number) => {
        doc.setTextColor(...color); doc.text(label, x, rowY);
        doc.setTextColor(0, 0, 0); doc.text(`TOTAL GROUP : ${g} GROUP`, x, rowY + 6);
        doc.text(`TOTAL COVER : ${p} PAX`, x, rowY + 11);
        if (c !== undefined) doc.text(`CANCELED    : ${c} PAX`, x, rowY + 16);
    };

    drawStats(statsX[0], "WALK IN", SHIFT_LUNCH_COLOR, walkInStats.groups, walkInStats.pax);
    drawStats(statsX[1], "RESERVASI", SHIFT_IFTAR_COLOR, rsvStats.groups, rsvStats.pax, rsvStats.cancelledPax);
    drawStats(statsX[2], "WAITING LIST", SHIFT_DINNER_COLOR, waitStats.groups, waitStats.pax, waitStats.cancelledPax);
    drawStats(statsX[3], "TOTAL GUEST TODAY", [0, 0, 0], totalStats.groups, totalStats.pax, totalStats.cancelledPax);

    const pdfBlob = doc.output('blob');
    const fileName = `SUMMARY REPORT TODAY OPERATIONAL.pdf`;
    await shareFile(pdfBlob, fileName, `Op Report - ${outletName}`);
    
  } catch (err) { console.error(err); alert("Gagal memproses Laporan Operasional."); }
};

// 2.5. Generate Operational Today Excel
export const generateOperationalTodayExcel = (
  reservations: Reservation[],
  waitingList: WaitingListEntry[],
  date: string,
  outletName: string = "JUSTUS STEAKHOUSE"
) => {
  try {
    const dateReservations = reservations.filter(r => r.reservationDate === date);
    const dateWaiting = waitingList.filter(w => w.reservationDate === date);

    const rows: any[] = [
      [`REKAP OPERASIONAL - ${outletName.toUpperCase()}`, ""],
      [`PERIODE: ${formatDate(date).toUpperCase()}`, ""],
      [],
      ["#", "TYPE", "NAMA TAMU", "PHONE", "PAX", "WAKTU", "STATUS", "AREA/MEJA", "KLASIFIKASI", "PEMBAYARAN/PESANAN"]
    ];

    let count = 1;

    // Add Waiting List
    dateWaiting.sort((a, b) => a.joinedAt - b.joinedAt).forEach(w => {
      rows.push([
        count++,
        "WAITING",
        w.guestName.toUpperCase(),
        w.phoneNumber || "-",
        `${w.guestCount} PX`,
        new Date(w.joinedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }),
        w.status.toUpperCase(),
        w.preferredTable?.toUpperCase() || "-",
        "-",
        "-"
      ]);
    });

    // Add Reservations (Lunch, Iftar, Dinner)
    [Shift.LUNCH, Shift.IFTAR, Shift.DINNER].forEach(shift => {
      const shiftData = dateReservations.filter(r => r.shift === shift);
      shiftData.sort((a, b) => a.arrivalTime.localeCompare(b.arrivalTime)).forEach(r => {
        const payLabel = r.hasDownPayment 
            ? `${r.paymentBank} (${r.paymentSubMethod}) - ${r.isFullPayment ? 'LUNAS' : 'DP'}: ${formatCurrency(r.downPaymentAmount)}`
            : 'UNPAID';

        rows.push([
          count++,
          shift.toUpperCase(),
          r.guestName.toUpperCase(),
          r.phoneNumber || "-",
          `${r.guestCount} PX`,
          r.arrivalTime,
          r.status.toUpperCase(),
          r.tableNumber || "-",
          r.isHarrySalesManager ? 'HARRY SM' : (r.isNurulSalesManager ? 'NURUL SM' : 'REGULAR'),
          payLabel
        ]);
      });
    });

    const ws = XLSX.utils.aoa_to_sheet(rows);
    ws['!cols'] = [
      { wch: 5 },  // #
      { wch: 12 }, // TYPE
      { wch: 30 }, // NAMA TAMU
      { wch: 15 }, // PHONE
      { wch: 10 }, // PAX
      { wch: 10 }, // WAKTU
      { wch: 15 }, // STATUS
      { wch: 15 }, // AREA/MEJA
      { wch: 15 }, // KLASIFIKASI
      { wch: 50 }  // PEMBAYARAN/PESANAN
    ];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Rekap Operasional");
    XLSX.writeFile(wb, `REKAP_OPERASIONAL_${date}.xlsx`);
  } catch (err) { console.error(err); alert("Failed to generate Excel file."); }
};

// 3. Generate Forecast Report PDF
export const generateAndSharePDF = async (
  reservations: Reservation[], 
  dateRange: { start: string, end: string },
  reportTitle: string = "DAILY RESERVASI FORECAST",
  forceDownload: boolean = false,
  shiftFilter: 'LUNCH' | 'DINNER' | 'IFTAR' | 'ALL' = 'ALL',
  categoryFilter: 'RSV' | 'WLK' | 'ALL' = 'ALL',
  customColumns?: string[],
  outletName: string = "JUSTUS STEAKHOUSE",
  waSummaryText?: string
) => {
  if (!window.jspdf) return;

  try {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF('l', 'mm', 'a4');
    const pageWidth = doc.internal.pageSize.getWidth();
    const centerX = pageWidth / 2;

    const rsvData = reservations.filter(r => !r.isWalkIn);
    const shiftTotals = {
      [Shift.LUNCH]: { count: 0, pax: 0 },
      [Shift.IFTAR]: { count: 0, pax: 0 },
      [Shift.DINNER]: { count: 0, pax: 0 },
      TOTAL: { count: 0, pax: 0 }
    };

    rsvData.filter(r => r.status !== ReservationStatus.CANCELLED).forEach(r => {
      shiftTotals[r.shift].count++;
      shiftTotals[r.shift].pax += r.guestCount;
      shiftTotals.TOTAL.count++;
      shiftTotals.TOTAL.pax += r.guestCount;
    });

    doc.setFillColor(30, 30, 30);
    doc.rect(0, 0, 297, 48, 'F');
    doc.setTextColor(...THEME_GOLD_PREMIUM);
    doc.setFont("helvetica", "bold"); doc.setFontSize(26);
    const titleText2 = outletName === "JUSTUS STEAKHOUSE" ? "JUSTUS STEAKHOUSE" : `JUSTUS STEAKHOUSE | ${outletName}`;
    doc.text(titleText2, centerX, 18, { align: 'center' });
    doc.setFontSize(14); doc.setTextColor(255, 255, 255);
    doc.text(reportTitle, centerX, 28, { align: 'center' });
    doc.setFontSize(10); doc.setTextColor(180, 180, 180);
    doc.text(`Period: ${formatDate(dateRange.start)} - ${formatDate(dateRange.end)}`, centerX, 36, { align: 'center' });

    let currentY = 55;

    const groupedByDate: Record<string, Reservation[]> = {};
    rsvData.forEach(r => { 
        if (!groupedByDate[r.reservationDate]) groupedByDate[r.reservationDate] = []; 
        groupedByDate[r.reservationDate].push(r); 
    });

    Object.keys(groupedByDate).sort().forEach(dateKey => {
      if (currentY > 180) { doc.addPage(); currentY = 20; }
      doc.setFillColor(240, 240, 240);
      doc.rect(8, currentY, 281, 8, 'F');
      doc.setFont("helvetica", "bold"); doc.setFontSize(10); doc.setTextColor(0, 0, 0);
      doc.text(formatDate(dateKey).toUpperCase(), 12, currentY + 5.5);
      currentY += 10;

      [Shift.LUNCH, Shift.IFTAR, Shift.DINNER].forEach(shift => {
        const shiftItems = groupedByDate[dateKey].filter(r => r.shift === shift);
        if (shiftItems.length === 0) return;
        if (currentY > 240) { doc.addPage(); currentY = 20; }

        const rows = shiftItems.sort((a,b) => a.arrivalTime.localeCompare(b.arrivalTime)).map(res => {
            const payLabel = res.hasDownPayment 
                ? `${res.paymentBank} (${res.paymentSubMethod}) - ${res.isFullPayment ? 'LUNAS' : 'DP'}: ${formatCurrency(res.downPaymentAmount)}`
                : 'UNPAID';

            return [
                res.guestName.toUpperCase(), res.phoneNumber || '-', res.guestCount, res.arrivalTime, 
                res.isHarrySalesManager ? "HARRY SM" : (res.isNurulSalesManager ? "NURUL SM" : "REGULAR"),
                res.tableNumber || '-', res.menuOrderType?.toUpperCase() || 'ON THE SPOT', 
                payLabel, res.otherRequirements || '-'
            ];
        });

        (doc as any).autoTable({
            head: [[`NAMA TAMU (${shift})`, 'PHONE', 'PX', 'TIME', 'KLASIFIKASI', 'TBL', 'PESANAN', 'PEMBAYARAN (BANK/METHOD - CAT: NOMINAL)', 'REQUEST']],
            body: rows,
            startY: currentY,
            theme: 'grid',
            headStyles: { fillColor: THEME_GOLD_PREMIUM, textColor: [255, 255, 255], fontSize: 7, fontStyle: 'bold', halign: 'center' },
            styles: { fontSize: 6, halign: 'center', fontStyle: 'bold', textColor: [0, 0, 0] },
            margin: { left: 8, right: 8 },
            didParseCell: applyKeywordStyling
        });
        currentY = (doc as any).autoTable.previous.finalY + 8;
      });
    });

    if (currentY > 230) { doc.addPage(); currentY = 20; }
    doc.setFillColor(250, 250, 250); doc.setDrawColor(220, 220, 220); doc.rect(8, currentY, 281, 30, 'FD');
    doc.setFontSize(9); doc.setTextColor(80, 80, 80); doc.setFont("helvetica", "bold");
    doc.text("RINGKASAN RESERVASI SHIFT", 12, currentY + 7);

    const gridX = [12, 82, 152, 222];
    const summarySections = [
      { label: "RESERVASI LUNCH", data: shiftTotals[Shift.LUNCH], color: SHIFT_LUNCH_COLOR },
      { label: "RESERVASI IFTAR", data: shiftTotals[Shift.IFTAR], color: SHIFT_IFTAR_COLOR },
      { label: "RESERVASI DINNER", data: shiftTotals[Shift.DINNER], color: SHIFT_DINNER_COLOR },
      { label: "TOTAL RESERVASI", data: shiftTotals.TOTAL, color: [0, 0, 0] }
    ];

    summarySections.forEach((s, idx) => {
      const x = gridX[idx];
      doc.setFont("helvetica", "bold"); doc.setTextColor(...s.color);
      doc.text(s.label, x, currentY + 16);
      doc.setFont("helvetica", "bold"); doc.setFontSize(8); doc.setTextColor(0, 0, 0);
      doc.text(`- TOTAL GROUP : ${s.data.count} GROUP`, x, currentY + 21);
      doc.text(`- TOTAL COVER : ${s.data.pax} PAX`, x, currentY + 25);
    });

    // --- START OF WALK-IN GUEST RECAP PAGE ---
    const wlkData = reservations.filter(r => r.isWalkIn);
    
    doc.addPage();
    let walkInY = 20;
    
    // Header for the Walk-In page
    doc.setFillColor(30, 30, 30);
    doc.rect(0, 0, 297, 40, 'F');
    doc.setTextColor(...THEME_GOLD_PREMIUM);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(22);
    const titleText3 = outletName === "JUSTUS STEAKHOUSE" ? "JUSTUS STEAKHOUSE" : `JUSTUS STEAKHOUSE | ${outletName}`;
    doc.text(titleText3, centerX, 15, { align: 'center' });
    doc.setFontSize(11);
    doc.setTextColor(255, 255, 255);
    doc.text("REKAP OPERASIONAL TAMU WALK-IN", centerX, 24, { align: 'center' });
    doc.setFontSize(8);
    doc.setTextColor(180, 180, 180);
    doc.text(`Periode: ${formatDate(dateRange.start).toUpperCase()} - ${formatDate(dateRange.end).toUpperCase()}`, centerX, 30, { align: 'center' });
    
    walkInY = 50;

    const sortedWalkIns = [...wlkData].sort((a, b) => {
      const dateCompare = a.reservationDate.localeCompare(b.reservationDate);
      if (dateCompare !== 0) return dateCompare;
      return a.arrivalTime.localeCompare(b.arrivalTime);
    });

    const walkInRows = sortedWalkIns.map((w, i) => {
      const payLabel = w.hasDownPayment 
          ? `${w.paymentBank} (${w.paymentSubMethod}) - ${w.isFullPayment ? 'LUNAS' : 'DP'}: ${formatCurrency(w.downPaymentAmount)}`
          : 'UNPAID';
          
      return [
        (i + 1).toString(),
        getShortDateFormat(w.reservationDate, false),
        w.shift.toUpperCase(),
        w.guestName.toUpperCase(),
        w.phoneNumber || '-',
        `${w.guestCount} PX`,
        w.arrivalTime,
        w.tableNumber || '-',
        w.status.toUpperCase(),
        payLabel
      ];
    });

    if (walkInRows.length > 0) {
      (doc as any).autoTable({
        head: [['#', 'TANGGAL', 'SHIFT', 'NAMA TAMU', 'PHONE', 'PAX', 'JAM', 'MEJA', 'STATUS', 'PEMBAYARAN (BANK/METODE/NOMINAL)']],
        body: walkInRows,
        startY: walkInY,
        theme: 'grid',
        headStyles: { fillColor: THEME_GOLD_PREMIUM, textColor: [255, 255, 255], fontSize: 8, fontStyle: 'bold', halign: 'center' },
        styles: { fontSize: 7, cellPadding: 2, halign: 'center', fontStyle: 'bold', textColor: [0, 0, 0] },
        margin: { left: 8, right: 8 },
        didParseCell: applyKeywordStyling
      });
      walkInY = (doc as any).autoTable.previous.finalY + 10;
    } else {
      doc.setDrawColor(200, 200, 200);
      doc.setFillColor(248, 248, 248);
      doc.rect(8, walkInY, 281, 40, 'FD');
      doc.setFontSize(11);
      doc.setTextColor(120, 120, 120);
      doc.setFont("helvetica", "bold");
      doc.text("TIDAK ADA DATA TAMU WALK-IN UNTUK PERIODE INI", centerX, walkInY + 22, { align: 'center' });
      walkInY += 50;
    }

    const walkInShiftTotals = {
      [Shift.LUNCH]: { count: 0, pax: 0 },
      [Shift.IFTAR]: { count: 0, pax: 0 },
      [Shift.DINNER]: { count: 0, pax: 0 },
      TOTAL: { count: 0, pax: 0 }
    };
    
    sortedWalkIns.forEach(w => {
      if (w.status !== ReservationStatus.CANCELLED) {
        walkInShiftTotals[w.shift].count++;
        walkInShiftTotals[w.shift].pax += w.guestCount;
        walkInShiftTotals.TOTAL.count++;
        walkInShiftTotals.TOTAL.pax += w.guestCount;
      }
    });

    if (walkInY + 35 > 280) {
      doc.addPage();
      walkInY = 20;
    }

    doc.setFillColor(250, 250, 250); doc.setDrawColor(220, 220, 220); doc.rect(8, walkInY, 281, 30, 'FD');
    doc.setFontSize(9); doc.setTextColor(80, 80, 80); doc.setFont("helvetica", "bold");
    doc.text("RINGKASAN OPERASIONAL TAMU WALK-IN", 12, walkInY + 7);

    const wGridX = [12, 82, 152, 222];
    const wSummarySections = [
      { label: "WALK-IN LUNCH", data: walkInShiftTotals[Shift.LUNCH], color: SHIFT_LUNCH_COLOR },
      { label: "WALK-IN IFTAR", data: walkInShiftTotals[Shift.IFTAR], color: SHIFT_IFTAR_COLOR },
      { label: "WALK-IN DINNER", data: walkInShiftTotals[Shift.DINNER], color: SHIFT_DINNER_COLOR },
      { label: "TOTAL WALK-IN", data: walkInShiftTotals.TOTAL, color: [0, 0, 0] }
    ];

    wSummarySections.forEach((s, idx) => {
      const x = wGridX[idx];
      doc.setFont("helvetica", "bold"); doc.setTextColor(...s.color);
      doc.text(s.label, x, walkInY + 16);
      doc.setFont("helvetica", "bold"); doc.setFontSize(8); doc.setTextColor(0, 0, 0);
      doc.text(`- TOTAL GROUP : ${s.data.count} GROUP`, x, walkInY + 21);
      doc.text(`- TOTAL COVER : ${s.data.pax} PAX`, x, walkInY + 25);
    });
    // --- END OF WALK-IN GUEST RECAP PAGE ---

    const pdfBlob = doc.output('blob');
    const fileName = `${getForecastFilename(dateRange.start)}.pdf`;
    if (forceDownload) doc.save(fileName);
    else await shareFile(pdfBlob, fileName, `Justus Forecast`, waSummaryText);

  } catch (e) { console.error(e); alert('Failed to generate PDF Report.'); }
};

// 2. Generate Queue Ticket PDF (thermal)
export const generateQueueTicketPDF = async (
  entry: WaitingListEntry,
  outletName: string = "JUSTUS STEAKHOUSE",
  shouldShare: boolean = true
) => {
  if (!window.jspdf) return;
  try {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF('p', 'mm', [80, 150]); 
    doc.setFont("courier", "bold");
    doc.setFontSize(12);
    doc.text("JUSTUS STEAKHOUSE", 40, 15, { align: 'center' });
    doc.setFontSize(9);
    doc.text(outletName.toUpperCase(), 40, 20, { align: 'center' });
    doc.text("--------------------------------", 40, 28, { align: 'center' });
    doc.setFontSize(11);
    doc.text("QUEUE TICKET", 40, 35, { align: 'center' });
    doc.text("--------------------------------", 40, 42, { align: 'center' });
    doc.setFont("courier", "bold"); doc.setFontSize(9);
    const joinTime = new Date(entry.joinedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
    doc.text(`DATE    : ${formatDate(entry.reservationDate)}`, 10, 50);
    doc.text(`TIME    : ${joinTime} WIB`, 10, 56);
    doc.text(`GUEST   : ${entry.guestName.toUpperCase()}`, 10, 62);
    doc.text(`PAX     : ${entry.guestCount} COVERS`, 10, 68);
    doc.text(`AREA    : ${entry.preferredTable?.toUpperCase() || '-'}`, 10, 74);
    doc.text("--------------------------------", 40, 82, { align: 'center' });
    doc.setFontSize(10);
    doc.text("PLEASE WAIT FOR YOUR TURN", 40, 92, { align: 'center' });
    doc.setFontSize(8);
    doc.text("Kami akan memanggil Anda segera", 40, 97, { align: 'center' });
    doc.text("saat meja tersedia.", 40, 101, { align: 'center' });
    doc.text("--------------------------------", 40, 110, { align: 'center' });
    doc.text("THANK YOU FOR YOUR PATIENCE", 40, 118, { align: 'center' });
    doc.text("POWERED BY DIGITAL GREETER", 40, 125, { align: 'center' });
    const pdfBlob = doc.output('blob');
    if (shouldShare) await shareFile(pdfBlob, `Queue_${entry.guestName}_${joinTime.replace(':', '')}.pdf`, `Queue Ticket - ${entry.guestName}`);
    else doc.save(`Queue_${entry.guestName}_${joinTime.replace(':', '')}.pdf`);
  } catch (err) { console.error(err); alert("Gagal memproses PDF Tiket Antrean."); }
};

// 4. Generate Order Checklist PDF (thermal) - UPDATED SORTING AND RENDERING
export const generateOrderChecklistPDF = async (
  res: any,
  shouldShare: boolean = false,
  outletName: string = "JUSTUS STEAKHOUSE",
  settings?: any
) => {
  if (!window.jspdf) return;
  try {
    const { jsPDF } = window.jspdf;
    
    // 1. Parsing & Sorting Logic
    const foodPriority = FOOD_PRIORITY;
    const beveragePriority = BEVERAGE_PRIORITY;
    
    interface ParsedItem {
      fullString: string;
      mainName: string;
      condiments: string[];
      condimentCount: number;
      note?: string;
      category: string;
      isFood: boolean;
      isBeverage: boolean;
      isDessert: boolean;
      priorityIndex: number;
    }

    const items: ParsedItem[] = (res.orderedMenuItems || []).map((itemStr: string) => {
      const noteMatch = itemStr.match(/\s\[Note:\s(.*)\]$/);
      const note = noteMatch ? noteMatch[1] : undefined;
      let strWithoutNote = note ? itemStr.replace(/\s\[Note:\s.*\]$/, '') : itemStr;

      // Remove ( 4 PERSON ) and ( 6 PERSON )
      strWithoutNote = strWithoutNote.replace(/\(\s*\d+\s*PERSON\s*\)/gi, '').trim();

      const [mainPart, detailPart] = strWithoutNote.split(' (');
      const condiments = detailPart ? detailPart.replace(')', '').split(', ') : [];
      
      // Get base name without quantity (e.g. "2x Tenderloin" -> "Tenderloin")
      let baseName = mainPart.replace(/^\d+x\s+/, '').trim();
      
      // Remove ( 4 PERSON ) and ( 6 PERSON ) from base name if still present
      baseName = baseName.replace(/\(\s*\d+\s*PERSON\s*\)/gi, '').trim();
      
      // Determine category from settings or regional menu
      let category = 'OTHERS';
      const allPossibleMenu = [...MENU_DATA_JAKARTA, ...MENU_DATA_BANDUNG, ...(settings?.customMenu || [])];
      const menuItem = allPossibleMenu.find((m: any) => m.name === baseName);
      if (menuItem) {
        category = menuItem.category.toUpperCase();
      }

      // If category is still OTHERS, try heuristic
      if (category === 'OTHERS') {
        const upperName = baseName.toUpperCase();
        
        // Specific FREE item mappings
        const freeBeverages = ['FREE ICE TEA', 'FREE ICE LEMON TEA', 'FREE CASSAVANOVA', 'FREE ORANG JUICE', 'FREE SWEET LAVANDULA'];
        const freeDesserts = ['FREE BROWNIES CHEEZIE SUNDAE', 'FREE ICE CREAM VANILA', 'FREE ICE CREAM COKELAT', 'FREE ICE CREAM STAWBERRY'];

        if (freeBeverages.some(item => upperName.includes(item))) category = 'TEA'; // Map to a beverage category
        else if (freeDesserts.some(item => upperName.includes(item))) category = 'DESSERT';
        
        // Beverage Heuristics
        else if (upperName.includes('TEA') || upperName.includes('TEH')) category = 'TEA';
        else if (upperName.includes('COFFEE') || upperName.includes('KOPI') || upperName.includes('LATTE') || upperName.includes('CAPPUCCINO')) category = 'COFFEE';
        else if (upperName.includes('JUICE') || upperName.includes('JUS')) category = 'JUICE';
        else if (upperName.includes('SMOOTHIE')) category = 'SMOOTHIES';
        else if (upperName.includes('WATER') || upperName.includes('AQUA') || upperName.includes('EQUIL')) category = 'DRINKING & MINERAL WATER';
        else if (upperName.includes('MILKSHAKE')) category = 'MILKSHAKE';
        else if (upperName.includes('COKE') || upperName.includes('SPRITE') || upperName.includes('FANTA') || upperName.includes('SODA')) category = 'SOFT DRINK';
        else if (upperName.includes('MOCKTAIL')) category = 'MOCKTAIL';
        else if (upperName.includes('CHOCO')) category = 'CHOCOLATE';
        else if (upperName.includes('BLEND')) category = 'ICED BLENDED';
        
        // Food Heuristics
        else if (upperName.includes('SOUP')) category = 'SOUP';
        else if (upperName.includes('SALAD')) category = 'SALAD';
        else if (upperName.includes('PASTA') || upperName.includes('SPAGHETTI') || upperName.includes('FETTUCINE')) category = 'PASTA LOVERS';
        else if (upperName.includes('FRIES') || upperName.includes('SAUSAGE') || upperName.includes('CALAMARI') || upperName.includes('MIX PLATTER') || upperName.includes('NACHOS')) category = 'LIGHT MEAL';
        else if (upperName.includes('BURGER') || upperName.includes('SANDWICH')) category = 'BURGER & SANDWICH';
        else if (upperName.includes('STEAK') || upperName.includes('SIRLOIN') || upperName.includes('RIB EYE') || upperName.includes('TENDERLOIN') || upperName.includes('WAGYU')) category = 'SPECIALTY STEAK';
        else if (
          upperName.includes('FAMILY SET') || 
          upperName.includes('MEAT LOVER') || 
          upperName.includes('FAMILY BARBEQUE') || 
          upperName.includes('COWBOY STEAK') || 
          upperName.includes('FRIED SEAFOOD PLATTER')
        ) category = 'FAMILY SET';
      }

      const foodIdx = foodPriority.indexOf(category);
      const bevIdx = beveragePriority.indexOf(category);
      const isDessert = category === 'DESSERT';

      return {
        fullString: itemStr,
        mainName: mainPart,
        condiments,
        condimentCount: condiments.length,
        note,
        category,
        isFood: (foodIdx !== -1 || (bevIdx === -1)) && !isDessert,
        isBeverage: bevIdx !== -1,
        isDessert,
        priorityIndex: foodIdx !== -1 ? foodIdx : (bevIdx !== -1 ? bevIdx : 999)
      };
    });

    // Sort: 
    // 1. Food -> Dessert -> Beverage
    // 2. Within each group: Fewer condiments first (for food)
    // 3. Within each, by priority list index
    // 4. Finally by name
    const sortedItems = items.sort((a, b) => {
      const getGroupOrder = (it: ParsedItem) => {
        if (it.isFood) return 0;
        if (it.isDessert) return 1;
        if (it.isBeverage) return 2;
        return 3;
      };

      const orderA = getGroupOrder(a);
      const orderB = getGroupOrder(b);

      if (orderA !== orderB) return orderA - orderB;
      
      // Within Food/Dessert: Fewer condiments first
      if (!a.isBeverage && a.condimentCount !== b.condimentCount) {
        return a.condimentCount - b.condimentCount;
      }
      
      // By Priority Index
      if (a.priorityIndex !== b.priorityIndex) return a.priorityIndex - b.priorityIndex;
      
      // Finally by name
      return a.mainName.localeCompare(b.mainName);
    });

    const itemEstimate = sortedItems.length;
    // Heuristic for height: ~30mm base + ~15mm per item + ~5mm per condiment/note line + category headers
    const totalDetailLines = sortedItems.reduce((acc, it) => acc + it.condiments.length + (it.note ? 1 : 0), 0);
    const calculatedHeight = 150 + (itemEstimate * 12) + (totalDetailLines * 6) + 20;
    
    const doc = new jsPDF('p', 'mm', [80, Math.max(250, calculatedHeight)]); 
    doc.setFont("courier", "bold");
    doc.setFontSize(10);
    doc.text("JUSTUS STEAKHOUSE", 40, 10, { align: 'center' });
    doc.setFontSize(8);
    doc.text(outletName.toUpperCase(), 40, 14, { align: 'center' });
    doc.text("--------------------------------", 40, 20, { align: 'center' });
    doc.text(`DATE    : ${formatDate(res.reservationDate)}`, 5, 25);
    doc.text(`NAME    : ${res.guestName.toUpperCase()}`, 5, 29);
    doc.text(`TABLE   : ${res.tableNumber || '-'}`, 5, 33);
    doc.text(`PAX     : ${res.guestCount} | TIME: ${res.arrivalTime}`, 5, 37);
    doc.text(`PESANAN : ${res.menuOrderType?.toUpperCase() || '-'}`, 5, 41);
    doc.text(`PIC     : ${res.picIncharge.split(' ')[0].toUpperCase()}`, 5, 45);
    doc.text(`SM CLAS : ${res.isHarrySalesManager ? 'HARRY SM' : (res.isNurulSalesManager ? 'NURUL SM' : 'REGULAR')}`, 5, 49);
    
    const payLabel = res.hasDownPayment 
        ? `${res.paymentBank} (${res.paymentSubMethod}) - ${res.isFullPayment ? 'LUNAS' : 'DP'}: ${formatCurrency(res.downPaymentAmount)}`
        : 'UNPAID';
    const splitPay = doc.splitTextToSize(`PAYMENT : ${payLabel.toUpperCase()}`, 70);
    doc.text(splitPay, 5, 53);
    
    let y = 53 + (splitPay.length * 4);
    const splitNotes = doc.splitTextToSize(`NOTES   : ${res.otherRequirements || '-'}`, 70);
    doc.text(splitNotes, 5, y);
    y += (splitNotes.length * 4);
    
    doc.text("--------------------------------", 40, y, { align: 'center' });
    y += 5; doc.text("ORDER CHECKLIST", 40, y, { align: 'center' }); y += 6;

    let currentSection: 'FOOD' | 'BEVERAGE' | 'DESSERT' | null = null;

    sortedItems.forEach((item) => {
      // Section Header
      const itemSection = item.isDessert ? 'DESSERT' : (item.isBeverage ? 'BEVERAGE' : 'FOOD');
      if (currentSection !== itemSection) {
        currentSection = itemSection;
        doc.setFontSize(11);
        doc.setFont("courier", "bold");
        doc.text("================================", 40, y, { align: 'center' });
        y += 4;
        doc.text(`*** ${currentSection} ***`, 40, y, { align: 'center' });
        y += 4;
        doc.text("================================", 40, y, { align: 'center' });
        y += 6;
      }

      doc.setFontSize(9);
      doc.setFont("courier", "bold");
      const splitMain = doc.splitTextToSize(item.mainName.toUpperCase(), 70);
      doc.text(splitMain, 5, y); 
      y += (splitMain.length * 4);
      
      // Render Condiments Vertically (Mengurut Kebawah)
      if (item.condiments.length > 0) {
        doc.setFontSize(7);
        doc.setFont("courier", "normal");
        item.condiments.forEach(cond => {
          const splitCond = doc.splitTextToSize(`  - ${cond.toUpperCase()}`, 70);
          doc.text(splitCond, 5, y);
          y += (splitCond.length * 4);
        });
      }

      // Render Item Note Vertically (Mengurut Kebawah)
      if (item.note) {
        doc.setFontSize(7);
        doc.setFont("courier", "italic");
        const splitItemNote = doc.splitTextToSize(`  * NOTE: ${item.note.toUpperCase()}`, 70);
        doc.text(splitItemNote, 5, y);
        y += (splitItemNote.length * 4);
      }

      y += 2; // Spacer between items
    });

    const pdfBlob = doc.output('blob');
    const shortDate = getShortDateFormat(res.reservationDate, false);
    const fileName = `MENU PESANAN (${res.guestName.toUpperCase()}) ${shortDate}.pdf`;
    if (shouldShare) await shareFile(pdfBlob, fileName, `Order Checklist`);
    else doc.save(fileName);
  } catch (err) { console.error(err); alert("Failed to process Order PDF."); }
};

// 5. Generate Bill Receipt PDF (thermal) - TEMPLATE UPDATE
export const generateBillReceiptPDF = async (
  bill: any[],
  guestInfo: any,
  subtotal: number,
  serviceCharge: number,
  tax: number,
  grandTotal: number,
  dpAmount: number,
  remainingBalance: number,
  shouldShare: boolean = false,
  outletName: string = "JUSTUS STEAKHOUSE",
  discountPercent: number = 0,
  discountAmount: number = 0,
  fixedDeduction: number = 0
) => {
  if (!window.jspdf) return;
  try {
    const { jsPDF } = window.jspdf;
    const itemEstimate = bill.length;
    const doc = new jsPDF('p', 'mm', [80, Math.max(250, 200 + (itemEstimate * 15))]);
    doc.setFont("courier", "bold");
    doc.setFontSize(10);
    doc.text("JUSTUS STEAKHOUSE", 40, 10, { align: 'center' });
    doc.setFontSize(8);
    doc.text(outletName.toUpperCase(), 40, 14, { align: 'center' });
    doc.text("--------------------------------", 40, 20, { align: 'center' });
    doc.text("ESTIMATION BILL RECEIPT", 40, 26, { align: 'center' });
    doc.text("--------------------------------", 40, 32, { align: 'center' });
    doc.text(`DATE     : ${formatDate(guestInfo.date)}`, 5, 38);
    
    const splitName = doc.splitTextToSize(`NAME     : ${guestInfo.name.toUpperCase()}`, 70);
    doc.text(splitName, 5, 42);
    let headerY = 42 + (splitName.length * 4);
    
    doc.text(`TABLE    : ${guestInfo.tableNumber}`, 5, headerY); headerY += 4;
    doc.text(`PAX      : ${guestInfo.pax} | TIME: ${guestInfo.time}`, 5, headerY); headerY += 6;
    doc.text("--------------------------------", 40, headerY, { align: 'center' });
    
    const drinkCategories = BEVERAGE_PRIORITY;

    const sortedBill = [...bill].sort((a, b) => {
      const aIsDrink = drinkCategories.includes(a.category?.toUpperCase());
      const bIsDrink = drinkCategories.includes(b.category?.toUpperCase());
      if (aIsDrink !== bIsDrink) return aIsDrink ? 1 : -1;
      
      const aCat = (a.category || '').toUpperCase();
      const bCat = (b.category || '').toUpperCase();
      const aIdx = aIsDrink ? BEVERAGE_PRIORITY.indexOf(aCat) : FOOD_PRIORITY.indexOf(aCat);
      const bIdx = bIsDrink ? BEVERAGE_PRIORITY.indexOf(bCat) : FOOD_PRIORITY.indexOf(bCat);
      
      if (aIdx !== bIdx) return (aIdx === -1 ? 999 : aIdx) - (bIdx === -1 ? 999 : bIdx);
      return a.name.localeCompare(b.name);
    });

    let y = headerY + 6;
    let currentSection: 'FOOD' | 'BEVERAGE' | null = null;
    doc.setFontSize(8);
    sortedBill.forEach(item => {
        const itemIsDrink = drinkCategories.includes(item.category?.toUpperCase());
        const itemSection = itemIsDrink ? 'BEVERAGE' : 'FOOD';
        
        if (currentSection !== itemSection) {
          currentSection = itemSection;
          doc.setFont("courier", "bold");
          doc.text(`--- ${currentSection} ---`, 40, y, { align: 'center' });
          y += 5;
        }

        doc.setFont("courier", "normal");
        const itemText = `${item.quantity}x ${item.name.toUpperCase()}${item.isDiscounted ? " (% DISC)" : ""}`;
        const splitItem = doc.splitTextToSize(itemText, 50);
        doc.text(splitItem, 5, y);
        doc.text(formatCurrency(item.price * item.quantity).replace('Rp', '').trim(), 75, y, { align: 'right' });
        y += Math.max(splitItem.length * 4, 5);
    });

    y += 5;
    doc.text("--------------------------------", 40, y, { align: 'center' }); y += 6;
    
    const drawRow = (label: string, value: string, currentY: number, isBold: boolean = false) => {
        if (isBold) doc.setFont("courier", "bold");
        else doc.setFont("courier", "normal");
        doc.text(label, 5, currentY);
        doc.text(value, 75, currentY, { align: 'right' });
    };

    drawRow("SUBTOTAL", formatCurrency(subtotal).replace('Rp', '').trim(), y); y += 5;
    
    if (discountPercent > 0) {
      drawRow(`DISCOUNT (${discountPercent}%)`, `-${formatCurrency(discountAmount).replace('Rp', '').trim()}`, y); y += 5;
    }
    
    if (fixedDeduction > 0) {
      drawRow("POTONGAN HARGA", `-${formatCurrency(fixedDeduction).replace('Rp', '').trim()}`, y); y += 5;
    }

    drawRow("SERVICE (5%)", formatCurrency(serviceCharge).replace('Rp', '').trim(), y); y += 5;
    drawRow("TAX PB1 (10%)", formatCurrency(tax).replace('Rp', '').trim(), y); y += 5;
    
    doc.setFontSize(9);
    drawRow("GRAND TOTAL", formatCurrency(grandTotal).replace('Rp', '').trim(), y, true); y += 7;
    
    doc.text("--------------------------------", 40, y, { align: 'center' }); y += 6;
    
    doc.setFontSize(8);
    doc.text("DEDUCTIONS / PRE-PAYMENT", 5, y); y += 5;
    const payInfo = `${guestInfo.paymentBank} (${guestInfo.paymentSubMethod})`.toUpperCase();
    const splitPayInfo = doc.splitTextToSize(payInfo, 50);
    doc.text(splitPayInfo, 5, y);
    doc.text(`-${formatCurrency(dpAmount).replace('Rp', '').trim()}`, 75, y, { align: 'right' }); 
    y += Math.max(splitPayInfo.length * 4, 7);
    
    doc.setFontSize(11);
    doc.text("REMAINING BALANCE", 40, y, { align: 'center' }); y += 6;
    doc.text(formatCurrency(remainingBalance), 40, y, { align: 'center' }); y += 10;
    
    doc.setFontSize(8);
    doc.setFont("courier", "normal");
    doc.text("--------------------------------", 40, y, { align: 'center' }); y += 5;
    doc.text("THIS IS NOT AN OFFICIAL INVOICE", 40, y, { align: 'center' }); y += 4;
    doc.text("ESTIMASI TAGIHAN SEMENTARA", 40, y, { align: 'center' }); y += 6;
    doc.text("THANK YOU FOR YOUR VISIT", 40, y, { align: 'center' });
    
    const pdfBlob = doc.output('blob');
    const fileName = `CHECKING BILL (${guestInfo.name.toUpperCase()}).pdf`;
    if (shouldShare) await shareFile(pdfBlob, fileName, `Bill Estimation - ${guestInfo.name}`);
    else doc.save(fileName);
  } catch (err) { console.error(err); alert("Failed to process Bill PDF."); }
};

// 6. Generate Tally PDF
export const generateTallyPDF = async (
  tallyData: any,
  filteredTemplate: any[],
  dateRange: { start: string, end: string },
  outletName: string = "JUSTUS STEAKHOUSE"
) => {
  if (!window.jspdf) return;
  try {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF('p', 'mm', 'a4');
    
    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.text(`TALLY MENU IFTAR - ${outletName.toUpperCase()}`, 105, 15, { align: 'center' });
    doc.setFontSize(10);
    doc.text(`PERIOD: ${dateRange.start} - ${dateRange.end}`, 105, 22, { align: 'center' });
    
    let currentY = 30;

    filteredTemplate.forEach((cat, index) => {
      const activeItems = cat.items.filter((itemName: string) => (tallyData[itemName]?.qty || 0) > 0);
      if (activeItems.length === 0) return;

      // Add Category Header
      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(212, 175, 55);
      doc.text(cat.category.toUpperCase(), 14, currentY);
      doc.setTextColor(0, 0, 0);
      currentY += 5;

      const rows = activeItems.map((itemName: string) => {
        const data = tallyData[itemName];
        const tableDetails = Object.entries(data.tableDetails || {})
          .map(([table, qty]) => (qty as number) > 1 ? `${table}(${qty})` : table)
          .join(', ');
          
        return [
          itemName,
          data.qty,
          tableDetails
        ];
      });

      (doc as any).autoTable({
        head: [['NAMA MENU', 'QTY', 'NO TABLE']],
        body: rows,
        startY: currentY,
        theme: 'grid',
        headStyles: { fillColor: [40, 40, 40], textColor: [255, 255, 255], fontStyle: 'bold' },
        styles: { fontSize: 9, cellPadding: 3 },
        columnStyles: {
          0: { cellWidth: 'auto' },
          1: { cellWidth: 20, halign: 'center' },
          2: { cellWidth: 60 }
        },
        margin: { left: 14, right: 14 },
        didDrawPage: (data: any) => {
          currentY = data.cursor.y + 10;
        }
      });

      // Check for page overflow
      if (currentY > 270 && index < filteredTemplate.length - 1) {
        doc.addPage();
        currentY = 20;
      }
    });

    doc.save(`Tally_Iftar_${dateRange.start}.pdf`);
  } catch (err) { console.error(err); alert("Failed to generate Tally PDF."); }
};

// 7. Generate Tally Excel
export const generateTallyExcel = (
  tallyData: any,
  filteredTemplate: any[],
  dateRange: { start: string, end: string },
  outletName: string = "JUSTUS STEAKHOUSE"
) => {
  try {
    const rows: any[] = [
      ['TALLY MENU IFTAR', outletName.toUpperCase()],
      ['PERIOD', `${dateRange.start} - ${dateRange.end}`],
      [],
      ['CATEGORY', 'NAMA MENU', 'QTY', 'NO TABLE'] // Single header for the table
    ];

    filteredTemplate.forEach(cat => {
      const activeItems = cat.items.filter((itemName: string) => (tallyData[itemName]?.qty || 0) > 0);
      if (activeItems.length === 0) return;

      activeItems.forEach((itemName: string) => {
        const data = tallyData[itemName];
        const tableDetails = Object.entries(data.tableDetails || {})
          .map(([table, qty]) => (qty as number) > 1 ? `${table}(${qty})` : table)
          .join(', ');

        rows.push([
          cat.category.toUpperCase(),
          itemName,
          data.qty,
          tableDetails
        ]);
      });
    });

    const ws = XLSX.utils.aoa_to_sheet(rows);
    
    // Set column widths for better "Template" feel
    ws['!cols'] = [
      { wch: 20 }, // Category
      { wch: 40 }, // Nama Menu
      { wch: 10 }, // Qty
      { wch: 50 }  // No Table
    ];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Tally Iftar");
    XLSX.writeFile(wb, `Tally_Iftar_${dateRange.start}.xlsx`);
  } catch (err) { console.error(err); alert("Failed to generate Excel file."); }
};

// 8. Share Tally WhatsApp
export const shareTallyWhatsApp = (
  tallyData: any,
  filteredTemplate: any[],
  dateRange: { start: string, end: string },
  outletName: string = "JUSTUS STEAKHOUSE"
) => {
  let text = `*TALLY MENU IFTAR - ${outletName.toUpperCase()}*\n`;
  text += `Period: ${dateRange.start} - ${dateRange.end}\n\n`;

  filteredTemplate.forEach(cat => {
    const activeItems = cat.items.filter((itemName: string) => (tallyData[itemName]?.qty || 0) > 0);
    if (activeItems.length > 0) {
      text += `*${cat.category}*\n`;
      activeItems.forEach((itemName: string) => {
        const data = tallyData[itemName];
        const tableDetails = Object.entries(data.tableDetails || {})
          .map(([table, qty]) => (qty as number) > 1 ? `${table}(${qty})` : table)
          .join(', ');
        text += `- ${itemName}: *${data.qty}* (Tables: ${tableDetails})\n`;
      });
      text += `\n`;
    }
  });

  const encodedText = encodeURIComponent(text);
  window.open(`https://wa.me/?text=${encodedText}`, '_blank');
};

// 9. Generate EOD Report PDF
export const generateEODReportPDF = async (
  stats: any,
  date: string,
  outletName: string,
  shouldShare: boolean = false
) => {
  if (!window.jspdf) return;
  try {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    
    // Header
    doc.setFont("helvetica", "bold");
    doc.setFontSize(20);
    doc.text("END OF DAY REPORT", 105, 20, { align: 'center' });
    
    doc.setFontSize(12);
    doc.text(outletName.toUpperCase(), 105, 28, { align: 'center' });
    doc.text(`DATE: ${date}`, 105, 35, { align: 'center' });
    
    doc.setDrawColor(212, 175, 55);
    doc.setLineWidth(1);
    doc.line(20, 40, 190, 40);

    // Summary Stats
    const summaryRows = [
      ["TOTAL REVENUE", formatCurrency(stats.totalRevenue)],
      ["TOTAL DISCOUNTS", formatCurrency(stats.totalDiscountAmount + stats.totalFixedDeduction)],
      ["TOTAL PAX", `${stats.totalPax} GUESTS`],
      ["TOTAL GROUPS", `${stats.totalGroups} GROUPS`],
      ["WAITING LIST CONVERSION", `${stats.seatedWait} / ${stats.waitingCount}`]
    ];

    (doc as any).autoTable({
      startY: 50,
      head: [['METRIC', 'VALUE']],
      body: summaryRows,
      theme: 'striped',
      headStyles: { fillColor: [212, 175, 55], textColor: [0, 0, 0] },
      styles: { fontSize: 10, cellPadding: 5 }
    });

    // Payment Breakdown
    const paymentRows = (Object.entries(stats.paymentMethods) as [string, number][]).map(([method, amount]) => [
      method.toUpperCase(),
      formatCurrency(amount)
    ]);

    doc.setFontSize(14);
    doc.text("SETTLED PAYMENTS", 20, (doc as any).lastAutoTable.finalY + 15);

    (doc as any).autoTable({
      startY: (doc as any).lastAutoTable.finalY + 20,
      head: [['PAYMENT METHOD', 'AMOUNT']],
      body: paymentRows.length > 0 ? paymentRows : [['-', '-']],
      theme: 'grid',
      headStyles: { fillColor: [0, 0, 0], textColor: [255, 255, 255] }
    });

    // DP Payments
    const dpRows = (Object.entries(stats.dpPayments) as [string, number][]).map(([method, amount]) => [
      method.toUpperCase(),
      formatCurrency(amount)
    ]);

    doc.setFontSize(14);
    doc.text("DP / FULL PAYMENTS", 20, (doc as any).lastAutoTable.finalY + 15);

    (doc as any).autoTable({
      startY: (doc as any).lastAutoTable.finalY + 20,
      head: [['PAYMENT METHOD', 'AMOUNT']],
      body: dpRows.length > 0 ? dpRows : [['-', '-']],
      theme: 'grid',
      headStyles: { fillColor: [0, 0, 0], textColor: [255, 255, 255] }
    });

    // Shift Distribution
    const shiftRows = Object.entries(stats.shiftBreakdown).map(([shift, count]) => [
      shift,
      `${count} GROUPS`
    ]);

    doc.setFontSize(14);
    doc.text("SHIFT DISTRIBUTION", 20, (doc as any).lastAutoTable.finalY + 15);

    (doc as any).autoTable({
      startY: (doc as any).lastAutoTable.finalY + 20,
      head: [['SHIFT', 'COUNT']],
      body: shiftRows,
      theme: 'grid',
      headStyles: { fillColor: [0, 0, 0], textColor: [255, 255, 255] }
    });

    const fileName = `EOD_REPORT_${outletName.replace(/\s+/g, '_')}_${date}.pdf`;
    const pdfBlob = doc.output('blob');

    if (shouldShare) {
      await shareFile(pdfBlob, fileName, `EOD Report - ${outletName} - ${date}`);
    } else {
      doc.save(fileName);
    }
  } catch (err) {
    console.error(err);
    alert("Failed to generate EOD PDF.");
  }
};

// 10. Visual Export Helpers
export const exportVisualToPDF = async (elementId: string, fileName: string, shouldShare: boolean = false) => {
  const element = document.getElementById(elementId);
  if (!element) return;
  
  try {
    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      logging: false,
      backgroundColor: '#000000'
    });
    
    const imgData = canvas.toDataURL('image/png');
    const { jsPDF } = window.jspdf;
    const pdf = new jsPDF('p', 'mm', 'a4');
    
    const imgProps = pdf.getImageProperties(imgData);
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
    
    pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
    
    if (shouldShare) {
      const pdfBlob = pdf.output('blob');
      await shareFile(pdfBlob, `${fileName}.pdf`, fileName);
    } else {
      pdf.save(`${fileName}.pdf`);
    }
  } catch (error) {
    console.error('Error exporting to PDF:', error);
  }
};

export const exportVisualToImage = async (elementId: string, fileName: string) => {
  const element = document.getElementById(elementId);
  if (!element) return;
  
  try {
    const canvas = await html2canvas(element, {
      scale: 3, // High definition scale
      useCORS: true,
      logging: false,
      backgroundColor: '#050505',
      onclone: (clonedDoc) => {
        // Ensure no-export elements are hidden in the clone
        const noExportElements = clonedDoc.querySelectorAll('.no-export');
        noExportElements.forEach(el => (el as HTMLElement).style.display = 'none');
      }
    });
    
    const imgData = canvas.toDataURL('image/png', 1.0);
    const link = document.createElement('a');
    link.href = imgData;
    link.download = `${fileName}.png`;
    link.click();
  } catch (error) {
    console.error('Error exporting to image:', error);
  }
};

export const exportVisualToHTML = (elementId: string, fileName: string) => {
  const element = document.getElementById(elementId);
  if (!element) return;
  
  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>${fileName}</title>
      <script src="https://cdn.tailwindcss.com"></script>
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;700;900&family=Playfair+Display:wght@900&family=JetBrains+Mono:wght@700&display=swap');
        
        body { 
          background-color: #050505; 
          color: #fff; 
          padding: 60px; 
          font-family: 'Inter', sans-serif; 
        }
        
        .export-container { 
          max-width: 1400px; 
          margin: 0 auto; 
        }
        
        .glass-card {
          background: rgba(255, 255, 255, 0.03);
          backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 255, 255, 0.05);
        }
        
        .font-serif { font-family: 'Playfair Display', serif; }
        .font-sans { font-family: 'Inter', sans-serif; }
        .font-mono { font-family: 'JetBrains Mono', monospace; }
        
        .no-export { display: none !important; }
        
        /* Ensure SVGs are visible */
        svg { display: inline-block; vertical-align: middle; }
        
        /* Custom colors to match app */
        .text-gold-500 { color: #d4af37; }
        .bg-gold-500 { background-color: #d4af37; }
        .text-rose-500 { color: #f43f5e; }
        .text-emerald-500 { color: #10b981; }
        .text-blue-500 { color: #3b82f6; }
        .text-indigo-500 { color: #6366f1; }
        .text-indigo-400 { color: #818cf8; }
        
        /* Table styling for export */
        table { width: 100%; border-collapse: collapse; }
        th, td { border-bottom: 1px solid rgba(255, 255, 255, 0.05); }
      </style>
    </head>
    <body>
      <div class="export-container">
        ${element.innerHTML}
      </div>
    </body>
    </html>
  `;
  
  const blob = new Blob([htmlContent], { type: 'text/html' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${fileName}.html`;
  link.click();
  URL.revokeObjectURL(url);
};

export const exportToHTML = (data: any[][], headers: string[], fileName: string, title: string) => {
  const tableRows = data.map(row => 
    `<tr>${row.map(cell => `<td style="border: 1px solid #444; padding: 8px;">${cell}</td>`).join('')}</tr>`
  ).join('');
  
  const tableHeaders = `<tr>${headers.map(h => `<th style="border: 1px solid #444; padding: 8px; background: #222; color: #d4af37;">${h}</th>`).join('')}</tr>`;

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>${title}</title>
      <style>
        body { background-color: #0a0a0a; color: #fff; font-family: sans-serif; padding: 40px; }
        table { width: 100%; border-collapse: collapse; margin-top: 20px; }
        h1 { color: #d4af37; text-align: center; }
      </style>
    </head>
    <body>
      <h1>${title}</h1>
      <table>
        <thead>${tableHeaders}</thead>
        <tbody>${tableRows}</tbody>
      </table>
    </body>
    </html>
  `;
  
  const blob = new Blob([htmlContent], { type: 'text/html' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${fileName}.html`;
  link.click();
  URL.revokeObjectURL(url);
};
