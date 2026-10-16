
import React, { useState, useEffect, useRef } from 'react';
import { Reservation, LocationPreference, ReservationStatus } from '../types';
import { Users, Clock, Cigarette, Phone, Building2, Trash2, Ban, Copy, Check, Banknote, FileText, Calendar, Share2, Loader2, UserCheck, LayoutGrid, CheckCircle, XCircle, ArrowRightLeft, LogIn, LogOut, Footprints, ChevronDown, Utensils, RotateCcw, Eye, EyeOff, X, CalendarRange, Pencil } from 'lucide-react';
import { generateAndSharePDF } from '../services/pdfService';

// Declaration for jsPDF since we are loading it via CDN
declare global {
  interface Window {
    jspdf: any;
  }
}

interface Props {
  reservations: Reservation[];
  dateRange: { start: string, end: string };
  onDelete: (id: string) => void;
  onEdit: (res: Reservation) => void; // New prop for Editing
  onStatusChange: (id: string, status: ReservationStatus, reason?: string) => void;
  onTableChange: (id: string, tableNumber: string, mergedTables?: string[]) => void;
  onDateChange: (id: string, newDate: string) => void;
}

const ReservationList: React.FC<Props> = ({ reservations, dateRange, onDelete, onEdit, onStatusChange, onTableChange, onDateChange }) => {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [copiedAll, setCopiedAll] = useState(false);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [showHistory, setShowHistory] = useState(false); // Default Hidden (Hilang di List)
  
  // UI State for Dropdowns and Editing
  const [openMenuKey, setOpenMenuKey] = useState<string | null>(null);
  const [editingTableId, setEditingTableId] = useState<string | null>(null);
  const [tempTableNum, setTempTableNum] = useState<string>('');
  
  // Edit Date State
  const [editingDateId, setEditingDateId] = useState<string | null>(null);
  const [tempDate, setTempDate] = useState<string>('');
  
  // Ref for click outside to close menus
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setOpenMenuKey(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Filter based on range
  const filteredReservations = reservations
    .filter(r => r.reservationDate >= dateRange.start && r.reservationDate <= dateRange.end);

  // Helper sort function
  const sortReservations = (list: Reservation[]) => {
    return list.sort((a, b) => {
      if (a.status === ReservationStatus.CHECKED_IN && b.status === ReservationStatus.CHECKED_IN) {
         const tableA = parseInt(a.tableNumber || '999');
         const tableB = parseInt(b.tableNumber || '999');
         return tableA - tableB;
      }
      
      const statusPriority = {
        [ReservationStatus.CHECKED_IN]: 0,
        [ReservationStatus.CONFIRMED]: 1,
        [ReservationStatus.COMPLETED]: 2,
        [ReservationStatus.CANCELLED]: 3
      };
      const statusDiff = (statusPriority[a.status] || 0) - (statusPriority[b.status] || 0);
      if (statusDiff !== 0) return statusDiff;
      if (a.reservationDate !== b.reservationDate) {
        return a.reservationDate.localeCompare(b.reservationDate);
      }
      return a.arrivalTime.localeCompare(b.arrivalTime);
    });
  };

  const activeGuests = sortReservations(filteredReservations.filter(r => r.status === ReservationStatus.CHECKED_IN));
  const reservationBook = sortReservations(filteredReservations.filter(r => {
    if (r.status === ReservationStatus.CHECKED_IN) return false;
    if (!showHistory) return r.status === ReservationStatus.CONFIRMED;
    return true;
  }));

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  };

  const getReservationText = (res: Reservation) => {
    const dpText = res.hasDownPayment 
      ? `Sudah DP (${formatCurrency(res.downPaymentAmount)})` 
      : 'Belum DP';
    
    let headerTag = '';
    if (res.status === ReservationStatus.CANCELLED) headerTag = '❌ [RESERVASI DIBATALKAN]\n';
    if (res.status === ReservationStatus.CHECKED_IN) headerTag = '🔵 [CHECK-IN / MEJA AKTIF]\n';
    if (res.status === ReservationStatus.COMPLETED) headerTag = '⚪ [CHECK-OUT / SELESAI]\n';
    if (res.status === ReservationStatus.CONFIRMED) headerTag = '✅ [CONFIRMED]\n';
    
    // Updated order per user request: Date, Name, Count, Time, Location
    return `${headerTag}Tanggal Reservasi : ${res.reservationDate}
Nama Tamu : ${res.guestName}
Jumlah Tamu : ${res.guestCount} Pax
Jam Kedatangan : ${res.arrivalTime}
Tempat / Lokasi : ${res.locationPreference}
No. Meja : ${res.tableNumber ? 'Meja ' + res.tableNumber : 'Belum ditentukan'}
No. Telepon : ${res.phoneNumber}
Kebutuhan Lainnya : ${res.otherRequirements || '-'}
Nama Perusahaan yang Reservasi : ${res.companyOrPersonalName || '-'}
Status DP : ${dpText}
${res.status === ReservationStatus.CANCELLED ? `Alasan Batal: ${res.cancellationReason}` : ''}`;
  };

  const handleCopyDraft = (res: Reservation) => {
    navigator.clipboard.writeText(getReservationText(res));
    setCopiedId(res.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleCopyRecap = () => {
    if (filteredReservations.length === 0) return;
    const activeReservations = filteredReservations.filter(r => r.status !== ReservationStatus.CANCELLED);
    if (activeReservations.length === 0) {
        alert("Tidak ada reservasi aktif untuk disalin.");
        return;
    }

    let text = `*REKAP RESERVASI BOOK JUSTUS STEAKHOUSE*\n`;
    text += `Periode: ${formatDate(dateRange.start)} - ${formatDate(dateRange.end)}\n\n`;

    const grouped = activeReservations.reduce((groups, res) => {
        const date = res.reservationDate;
        if (!groups[date]) groups[date] = [];
        groups[date].push(res);
        return groups;
    }, {} as Record<string, Reservation[]>);

    const dates = Object.keys(grouped).sort();
    dates.forEach(date => {
      text += `\n📅 *${formatDate(date)}*\n--------------------------------\n`;
      grouped[date].forEach((res, index) => {
         const statusMark = res.status === ReservationStatus.CHECKED_IN ? '(ON TABLE)' : (res.status === ReservationStatus.COMPLETED ? '(OUT)' : '');
         const walkInMark = res.isWalkIn ? '[WALK-IN]' : '';
         text += `${index + 1}. *${res.guestName}* ${walkInMark} (${res.arrivalTime}) ${statusMark} [${res.tableNumber ? 'Meja ' + res.tableNumber : 'No Table'}]\n`;
         text += `   Pax: ${res.guestCount} | Area: ${res.locationPreference}\n`;
         if(res.hasDownPayment) text += `   DP: ${formatCurrency(res.downPaymentAmount)}\n`;
         text += `\n`;
      });
      const dailyPax = grouped[date].reduce((sum, r) => sum + r.guestCount, 0);
      text += `   > Total Harian: ${grouped[date].length} Resv | ${dailyPax} Pax\n`;
    });

    const totalPax = activeReservations.reduce((sum, r) => sum + r.guestCount, 0);
    const totalDP = activeReservations.reduce((sum, r) => sum + (r.hasDownPayment ? r.downPaymentAmount : 0), 0);

    text += `\n================================\n*GRAND TOTAL REKAP*\nTotal Reservasi: ${activeReservations.length}\nTotal Pax: ${totalPax}\nTotal DP: ${formatCurrency(totalDP)}`;

    navigator.clipboard.writeText(text);
    setCopiedAll(true);
    setTimeout(() => setCopiedAll(false), 2000);
  };

  const handleSharePDF = async () => {
    setIsGeneratingPdf(true);
    await generateAndSharePDF(filteredReservations, dateRange, "RESERVATION LIST REPORT", false, 'ALL', 'ALL', undefined, "JUSTUS STEAKHOUSE");
    setIsGeneratingPdf(false);
  };

  const getLocationBadge = (loc: LocationPreference) => {
    switch (loc) {
      case LocationPreference.SMOKING:
        return <span className="inline-flex items-center gap-1.5 text-xs font-bold text-orange-400 uppercase tracking-wider"><Cigarette size={14} /> Smoking</span>;
      case LocationPreference.NON_SMOKING:
        return <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-400 uppercase tracking-wider"><Ban size={14} /> Non-Smoking</span>;
      case LocationPreference.VIP:
        return <span className="inline-flex items-center gap-1.5 text-xs font-bold text-gold-400 uppercase tracking-wider">VIP Room</span>;
      default:
        return <span className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-400 uppercase tracking-wider">Outdoor</span>;
    }
  };

  const getStatusBadge = (res: Reservation) => {
    if (res.status === ReservationStatus.CANCELLED) {
      return (
        <span className="flex items-center gap-1 bg-red-900/20 text-red-500 border border-red-900/50 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-widest">
          <XCircle size={12} /> Dibatalkan
        </span>
      );
    }
    if (res.status === ReservationStatus.CHECKED_IN) {
      return (
        <span className="flex items-center gap-1 bg-blue-900/20 text-blue-400 border border-blue-900/50 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-widest">
          <LogIn size={12} /> Sedang Makan
        </span>
      );
    }
    if (res.status === ReservationStatus.COMPLETED) {
      return (
        <span className="flex items-center gap-1 bg-gray-800 text-gray-500 border border-gray-700 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-widest">
          <LogOut size={12} /> Selesai
        </span>
      );
    }
    return (
      <span className="flex items-center gap-1 bg-emerald-900/20 text-emerald-500 border border-emerald-900/50 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-widest">
        <CheckCircle size={12} /> Terkonfirmasi
      </span>
    );
  };

  const renderCard = (res: Reservation) => {
    const isCancelled = res.status === ReservationStatus.CANCELLED;
    const isCompleted = res.status === ReservationStatus.COMPLETED;
    const isCheckedIn = res.status === ReservationStatus.CHECKED_IN;
    const isWalkIn = res.isWalkIn;
    const isEditingTable = editingTableId === res.id;
    const isEditingDate = editingDateId === res.id;
    const occupancyKey = `${res.id}-occupancy`;
    const bookingKey = `${res.id}-booking`;

    const cardBorderClass = isCancelled 
        ? 'border-red-900/30 opacity-60 grayscale-[0.8]' 
        : isCompleted
        ? 'border-gray-800 opacity-70'
        : isCheckedIn
        ? 'border-blue-500 shadow-[0_0_20px_rgba(37,99,235,0.2)] bg-dark-800' 
        : 'border-gold-800/40 hover:border-gold-600';

    const occupiedTableNums = reservations
      .filter(r => 
        r.status === ReservationStatus.CHECKED_IN && 
        r.reservationDate === res.reservationDate &&
        r.id !== res.id
      )
      .map(r => r.tableNumber);

    const availableTableOptions = Array.from({ length: 40 }, (_, i) => (i + 1).toString())
      .filter(num => !occupiedTableNums.includes(num));

    let mainActionLabel = 'Check In / Out';
    let mainActionIcon = <LogIn size={14} />;
    let mainActionColor = 'text-gray-400 bg-gray-900/10 border-gray-700';
    let mainActionBorder = 'border-gray-700';

    if (res.status === ReservationStatus.CONFIRMED) {
      mainActionLabel = 'Check In';
      mainActionIcon = <LogIn size={14} />;
      mainActionColor = 'text-emerald-500 bg-emerald-900/30';
      mainActionBorder = 'border-emerald-600';
    } else if (res.status === ReservationStatus.CHECKED_IN) {
      mainActionLabel = 'Check Out';
      mainActionIcon = <LogOut size={14} />;
      mainActionColor = 'text-blue-300 bg-blue-900/30';
      mainActionBorder = 'border-blue-600';
    } else if (res.status === ReservationStatus.COMPLETED) {
      mainActionLabel = 'Selesai';
      mainActionIcon = <Check size={14} />;
      mainActionColor = 'text-gray-500 bg-gray-900/30';
      mainActionBorder = 'border-gray-600';
    }

    return (
      <div 
        key={res.id} 
        className={`rounded-lg border relative overflow-visible group transition-all duration-300 ${cardBorderClass} ${isCheckedIn ? 'transform hover:-translate-y-1' : ''} bg-dark-900`}
      >
        <div className={`absolute top-0 bottom-0 left-0 w-1 ${
          isCancelled ? 'bg-red-800' : 
          isCompleted ? 'bg-gray-700' :
          isCheckedIn ? 'bg-gradient-to-b from-blue-500 to-blue-700' :
          'bg-gradient-to-b from-gold-600 to-gold-800'
        }`}></div>
        
        <div className="p-6 pl-8 flex flex-col md:flex-row md:items-start justify-between gap-6">
          <div className="flex-1 space-y-4 relative z-10">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2 mb-1">
                   {isWalkIn && (
                     <span className="text-[10px] font-bold uppercase tracking-wider bg-blue-900/50 text-blue-300 px-2 rounded-full flex items-center gap-1">
                       <Footprints size={10} /> Walk-In
                     </span>
                   )}
                </div>

                <div className="flex items-center flex-wrap gap-3">
                   <h3 className={`text-2xl font-serif font-bold leading-tight tracking-wide ${isCancelled ? 'text-red-500 line-through decoration-2' : isCompleted ? 'text-gray-400' : isCheckedIn ? 'text-blue-100' : 'text-white'}`}>
                     {res.guestName}
                   </h3>
                   {getStatusBadge(res)}
                </div>
                
                <div className="text-xs text-gray-500 mt-2 flex items-center gap-2">
                   <Calendar size={12} />
                   {isEditingDate ? (
                     <div className="flex items-center gap-2 animate-fade-in">
                        <input 
                           type="date"
                           value={tempDate}
                           onChange={(e) => setTempDate(e.target.value)}
                           className="bg-dark-800 text-white border border-gold-600 rounded px-2 py-1 text-xs outline-none color-scheme-dark"
                           autoFocus
                        />
                        <button onClick={() => { onDateChange(res.id, tempDate); setEditingDateId(null); }} className="text-green-500 hover:text-green-400"><Check size={16}/></button>
                        <button onClick={() => setEditingDateId(null)} className="text-red-500 hover:text-red-400"><X size={16}/></button>
                     </div>
                   ) : (
                     <span className="font-mono">{res.reservationDate}</span>
                   )}
                </div>
              </div>
              <div className="hidden md:block text-center min-w-[100px]">
                <span className={`block text-3xl font-serif font-bold ${isCancelled ? 'text-gray-500' : isCompleted ? 'text-gray-400' : 'text-gold-500'}`}>{res.arrivalTime}</span>
                <span className="text-xs text-gray-500 font-medium uppercase tracking-widest">WIB</span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-y-3 gap-x-8 text-sm pt-2">
              <div className="flex items-center gap-3 text-gray-400">
                <Users size={16} className={isCancelled ? "text-gray-600" : "text-gold-700"} />
                <span className="text-gray-300">{res.guestCount} Orang</span>
              </div>
              <div className="flex items-center gap-3 pt-2 sm:pt-0">
                {getLocationBadge(res.locationPreference)}
              </div>
              <div className="flex items-center gap-3 text-gray-400">
                 <LayoutGrid size={16} className={isCancelled ? "text-gray-600" : "text-gold-700"} />
                 {isEditingTable ? (
                    <div className="flex items-center gap-2 animate-fade-in">
                       <select 
                         value={tempTableNum}
                         onChange={(e) => setTempTableNum(e.target.value)}
                         className="bg-dark-800 text-white border border-gold-600 rounded px-2 py-1 text-xs outline-none"
                         autoFocus
                       >
                         <option value="">No Tbl</option>
                         {availableTableOptions.map(n => <option key={n} value={n}>Meja {n}</option>)}
                       </select>
                       <button onClick={() => { onTableChange(res.id, tempTableNum); setEditingTableId(null); }} className="text-green-500 hover:text-green-400"><Check size={16}/></button>
                       <button onClick={() => setEditingTableId(null)} className="text-red-500 hover:text-red-400"><X size={16}/></button>
                    </div>
                 ) : (
                    <span className={`${res.tableNumber ? (isCheckedIn ? 'text-blue-300 font-bold text-lg' : 'text-gold-400 font-bold') : 'text-gray-500 italic'}`}>
                        {res.tableNumber ? `Meja ${res.tableNumber}` : 'No Table'}
                    </span>
                 )}
              </div>
            </div>

            {(res.otherRequirements || isCancelled) && (
              <div className={`mt-4 bg-dark-800 border-l-2 pl-3 py-2 text-sm italic ${isCancelled ? 'border-red-600 text-red-200' : 'border-gold-600 text-gray-300'}`}>
                {isCancelled && res.cancellationReason && (
                   <p className="not-italic font-bold mb-1 text-red-400">Alasan Batal: "{res.cancellationReason}"</p>
                )}
                {res.otherRequirements && <span>"{res.otherRequirements}"</span>}
              </div>
            )}
          </div>

          <div className="flex flex-row md:flex-col items-center md:items-end justify-between md:justify-start gap-2 md:border-l md:border-dark-700 md:pl-6 min-w-[150px]">
            <div className="flex flex-col gap-2 w-full relative" ref={menuRef}>
               <div className="relative w-full">
                  <button 
                    onClick={(e) => { e.stopPropagation(); setOpenMenuKey(openMenuKey === occupancyKey ? null : occupancyKey); }}
                    className={`w-full flex items-center justify-between gap-2 px-3 py-2 border rounded text-xs font-bold uppercase tracking-wider transition-colors ${mainActionColor} ${mainActionBorder}`}
                  >
                    <span className="flex items-center gap-1">{mainActionIcon} {mainActionLabel}</span>
                    <ChevronDown size={14} />
                  </button>
                  {openMenuKey === occupancyKey && (
                    <div className="absolute right-0 top-full mt-2 w-52 bg-dark-900 border border-blue-800 rounded shadow-2xl z-50 overflow-hidden">
                       <div className="p-1">
                           {res.status === ReservationStatus.CHECKED_IN && (
                              <button onClick={() => { onStatusChange(res.id, ReservationStatus.COMPLETED); setOpenMenuKey(null); }} className="w-full text-left px-2 py-2 rounded text-xs font-bold flex items-center gap-2 mb-1 bg-orange-900/50 text-white hover:bg-orange-800">
                                <LogOut size={14} /> Check Out
                              </button>
                           )}
                           {res.status === ReservationStatus.CONFIRMED && (
                             <>
                                <button onClick={() => { onStatusChange(res.id, ReservationStatus.CHECKED_IN); setOpenMenuKey(null); }} className="w-full text-left px-2 py-2 rounded text-xs font-bold flex items-center gap-2 mb-1 text-emerald-400 hover:bg-emerald-900/20">
                                  <LogIn size={14} /> Check In (Occupied)
                                </button>
                                <button onClick={() => { onStatusChange(res.id, ReservationStatus.COMPLETED); setOpenMenuKey(null); }} className="w-full text-left px-2 py-2 rounded text-xs font-bold flex items-center gap-2 mb-1 text-orange-400 hover:bg-orange-900/20">
                                  <LogOut size={14} /> Skip to Completed
                                </button>
                             </>
                           )}
                       </div>
                    </div>
                  )}
               </div>

               <div className="flex gap-2 w-full">
                  <button onClick={() => { setEditingTableId(res.id); setTempTableNum(res.tableNumber || ''); }} className="flex-1 bg-dark-800 text-gold-500 border border-gold-800/50 px-2 py-2 rounded flex items-center justify-center text-xs font-bold uppercase tracking-wider">
                     <ArrowRightLeft size={14} />
                  </button>
                  <button onClick={() => { setEditingDateId(res.id); setTempDate(res.reservationDate); }} className="flex-1 bg-dark-800 text-gold-500 border border-gold-800/50 px-2 py-2 rounded flex items-center justify-center text-xs font-bold uppercase tracking-wider">
                     <CalendarRange size={14} />
                  </button>
               </div>

              <div className="flex gap-2 justify-end border-t border-dark-700 pt-2 mt-2 w-full">
                <button onClick={() => onEdit(res)} className="p-2 text-blue-500 hover:bg-blue-600 hover:text-white rounded transition-colors border border-transparent"><Pencil size={18} /></button>
                <button onClick={() => handleCopyDraft(res)} className="p-2 text-gold-600 hover:bg-gold-600 hover:text-white rounded transition-colors border border-gold-900/50">{copiedId === res.id ? <Check size={18} /> : <Copy size={18} />}</button>
                <button onClick={() => onDelete(res.id)} className="p-2 text-gray-600 hover:text-red-500 rounded transition-colors"><Trash2 size={18} /></button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  if (filteredReservations.length === 0) {
    return (
      <div className="bg-dark-800 rounded border border-dark-700 p-16 text-center">
        <Clock className="text-gray-600 mx-auto mb-6" size={32} />
        <h3 className="text-xl font-serif text-white mb-2">No Reservations Found</h3>
        <p className="text-gray-500">Tidak ada reservasi pada periode ini.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap justify-between items-center gap-3 bg-dark-800/50 p-4 rounded border border-gold-900/30">
        <button 
          onClick={() => setShowHistory(!showHistory)}
          className={`flex items-center gap-2 px-4 py-2 rounded text-xs font-bold uppercase tracking-wider transition-colors border ${showHistory ? 'bg-gold-900/30 border-gold-600 text-gold-400' : 'bg-dark-900 border-dark-600 text-gray-500 hover:text-gray-300'}`}
        >
          {showHistory ? <Eye size={16} /> : <EyeOff size={16} />}
          {showHistory ? 'Sembunyikan Riwayat' : 'Tampilkan Riwayat'}
        </button>

        <div className="flex gap-3">
          <button onClick={handleSharePDF} disabled={isGeneratingPdf} className="flex items-center gap-2 bg-red-800 hover:bg-red-700 border border-red-600 text-white px-4 py-2 rounded text-sm font-bold uppercase tracking-wider">
            {isGeneratingPdf ? <Loader2 size={16} className="animate-spin"/> : <Share2 size={16} />} Share PDF
          </button>
          <button onClick={handleCopyRecap} className="flex items-center gap-2 bg-dark-800 hover:bg-gold-900 border border-gold-800 text-gold-500 px-4 py-2 rounded text-sm font-bold uppercase tracking-wider">
            {copiedAll ? <Check size={16} /> : <FileText size={16} />} Salin Rekap
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-12">
        {activeGuests.length > 0 && (
          <div className="space-y-4">
             <div className="flex items-center gap-3 bg-blue-900/20 p-3 rounded-lg border border-blue-800/50">
                <Utensils size={20} className="text-blue-400" />
                <h4 className="text-xl font-serif font-bold text-blue-100 tracking-wide uppercase">Table Active (Occupied)</h4>
             </div>
             <div className="grid grid-cols-1 gap-4">{activeGuests.map(renderCard)}</div>
          </div>
        )}

        {reservationBook.length > 0 && (
           <div className="space-y-4">
             <div className="flex items-center gap-3 bg-gold-900/20 p-3 rounded-lg border border-gold-800/50">
                <Calendar size={20} className="text-gold-400" />
                <h4 className="text-xl font-serif font-bold text-gold-100 tracking-wide uppercase">Reservasi Up Coming (Forecast)</h4>
             </div>
             <div className="grid grid-cols-1 gap-4">{reservationBook.map(renderCard)}</div>
           </div>
        )}
      </div>
    </div>
  );
};

export default ReservationList;
