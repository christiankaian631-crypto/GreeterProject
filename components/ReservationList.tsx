
// @ts-nocheck
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Reservation, ReservationStatus, Shift, LocationPreference } from '../types';
import { Trash2, FileText, Share2, Loader2, ChevronDown, Utensils, Pencil, Copy, MapPin, Calendar, User, Users, Clock, Banknote, Filter, Check, ChevronRight, Star, Tag, LayoutGrid, ArrowRightLeft, CalendarRange, X, Ban, RotateCcw, XCircle, ClipboardList, Info } from 'lucide-react';
import { generateAndSharePDF, exportVisualToImage } from '../services/pdfService';
import { exportToExcel, exportToHTML } from '../services/exportService';
import { ExportActions } from './ExportActions';

interface Props {
  reservations: Reservation[];
  dateRange: { start: string, end: string };
  onDelete: (id: string) => void;
  onEdit: (res: Reservation) => void; 
  onStatusChange: (id: string, status: ReservationStatus, reason?: string) => void;
  onTableChange: (id: string, tableNumber: string, mergedTables?: string[]) => void;
  onDateChange: (id: string, newDate: string) => void;
  onEditMenu?: (id: string) => void;
  isDarkMode?: boolean;
  outletName?: string;
}

const ReservationList: React.FC<Props> = ({ reservations, dateRange, onDelete, onEdit, onStatusChange, onTableChange, onDateChange, onEditMenu, isDarkMode, outletName }) => {
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [sharingId, setSharingId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [copiedSKId, setCopiedSKId] = useState<string | null>(null);
  
  const [editingTableId, setEditingTableId] = useState<string | null>(null);
  const [tempTableNum, setTempTableNum] = useState<string>('');
  
  const [editingDateId, setEditingDateId] = useState<string | null>(null);
  const [tempDate, setTempDate] = useState<string>('');
  
  const filtered = reservations.filter(r => 
    r.reservationDate >= dateRange.start && 
    r.reservationDate <= dateRange.end
  );
  
  const activeGuests = filtered.filter(r => r.status === ReservationStatus.CHECKED_IN);
  
  const upcomingGrouped = useMemo(() => {
    const upcoming = filtered.filter(r => r.status === ReservationStatus.CONFIRMED || r.status === ReservationStatus.CANCELLED);
    const groups: Record<string, Reservation[]> = {};
    upcoming.forEach(res => {
      if (!groups[res.reservationDate]) groups[res.reservationDate] = [];
      groups[res.reservationDate].push(res);
    });
    return Object.keys(groups).sort().map(date => ({
      date,
      items: groups[date].sort((a, b) => a.arrivalTime.localeCompare(b.arrivalTime)),
      totalPax: groups[date].filter(r => r.status !== ReservationStatus.CANCELLED).reduce((sum, r) => sum + r.guestCount, 0),
      cancelCount: groups[date].filter(r => r.status === ReservationStatus.CANCELLED).length
    }));
  }, [filtered]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount || 0);
  };

  const toTitleCase = (str: string) => {
    if (!str) return '-';
    return str.toLowerCase().split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  };

  const getRecapText = (res: Reservation) => {
    const formattedDate = res.reservationDate ? new Date(res.reservationDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : '-';
    
    let locText = 'Tidak ditentukan';
    const locPref = res.locationPreference;
    if (locPref === 'Non-Smoking') locText = 'Tidak merokok';
    else if (locPref === 'Smoking') locText = 'Merokok';
    else if (locPref === 'VIP Room') locText = 'VIP Room (Tidak merokok)';
    else if (locPref === 'Outdoor') locText = 'Outdoor (Merokok)';

    const payStatus = res.isFullPayment ? 'Lunas / Full Payment' : (res.hasDownPayment ? `Sudah DP (${formatCurrency(res.downPaymentAmount || 0)})` : 'Belum DP');

    return `Salam Hangat dari Justus SteakHouse The Barn

Kami menyampaikan konfirmasi untuk reservasi Bapak / Ibu :

Tanggal Reservasi : ${formattedDate}
Nama Tamu : ${toTitleCase(res.guestName)}
Jumlah Tamu : ${res.guestCount || 0} Pax
Jam Kedatangan : ${res.arrivalTime || '-'}
Tempat / Lokasi (Merokok atau Tidak) : ${locText}
No. Telepon : ${res.phoneNumber || '-'}
Pembayaran : ${payStatus}
Kebutuhan Lainnya : ${res.otherRequirements || '-'}

Mohon berkenan untuk dapat memperhatikan mengenai waktu kedatangan 30 menit dari waktu reservasi yang telah ditentukan, apabila adanya keterlambatan kedatangan mohon dapat menginformasikan kepada Kami, untuk menghindari adanya pembatalan reservasi.

Mohon berkenan untuk dapat membalas konfirmasi reservasi yang telah Kami kirimkan. Apabila Bapak / Ibu telah menyetujui. 

Kami mengucapkan terima kasih telah memilih Justus SteakHouse The Barn sebagai pilihan tempat Acara Bapak / Ibu. 
Sampai bertemu di Justus Steakhouse The Barn.


Salam Hangat
Justus SteakHouse The Barn`;
  };

  const getIftarSK = (res?: Reservation) => {
    const formattedDate = res?.reservationDate ? new Date(res.reservationDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : '';
    const name = res ? toTitleCase(res.guestName) : '';
    const pax = res?.guestCount ? `${res.guestCount} Pax` : '';
    const time = res?.arrivalTime || '';
    const area = res?.locationPreference || '';
    const phone = res?.phoneNumber || '';
    const other = res?.otherRequirements || '';

    return `Salam hangat dari Justus Group,

Untuk melakukan Reservasi di outlet Justus Steakhouse, mohon kakak dapat mengisi lembar reservasi berikut :
Justus Outlet yang dituju : ${res ? (outletName || 'Justus Steakhouse') : ''}
Tanggal Reservasi : ${formattedDate}
Nama Tamu : ${name}
Jumlah Tamu : ${pax}
Jam Kedatangan : ${time}
Area (Smoking / Non-Smoking) : ${area}
No. Telepon : ${phone}
Kebutuhan Lainnya : ${other}

Ketentuan Layanan Reservasi Iftar
1.	Reservasi iftar dilakukan minimal 1 (satu) hari sebelumnya, dengan batas penerimaan reservasi maksimal pukul 20.00 WIB.
2.	Reservasi berdasarkan ketersediaan tempat dapat dilakukan pada hari yang sama, dengan batas penerimaan reservasi maksimal pukul 15.00 WIB.
3.	Setiap tamu reservasi diberlakukan untuk menentukan menu di awal dan mengirimkan pilihan menu paling lambat pukul 14.00 WIB pada hari pelaksanaan atau sesuai tanggal reservasi.
4.	Setiap tamu reservasi diberlakukan untuk melakukan pembayaran di awal, dilakukan 1 (satu) hari sebelumnya atau dihari yang sama, maksimal pukul 14.00 WIB
5.	Pembayaran sebesar total nilai transaksi atau down payment with nominal Rp 100.000/orang.
6.	Kedatangan tamu reservasi maksimal 15 menit sebelum waktu berbuka puasa, sesuai tanggal dan jam reservasi yang telah ditentukan.
7.	Pesanan makanan dan minuman akan disajikan 10 menit sebelum waktu berbuka puasa.Apabila terdapat penambahan jumlah tamu pada hari pelaksanaan atau saat kedatangan, akan disesuaikan dengan ketersediaan tempat.
8.	Meja reservasi yang telah ditentukan dan dikonfirmasi oleh outlet tidak dapat dipindahkan apabila kondisi restoran dalam keadaan full reservation, kecuali terdapat ketersediaan tempat.

Ketentuan Pembatalan
1.	Pembatalan reservasi pada hari yang sama, khususnya untuk pesanan yang telah diproses atau disajikan, tidak dapat dibatalkan. Kebijakan yang diberikan berupa layanan take away.
2.	Pembatalan reservasi dapat dilakukan maksimal pukul 14.00 WIB.
3.	Pembayaran yang telah dilakukan tidak dapat dikembalikan dalam bentuk uang. Kebijakan yang berlaku berupa penjadwalan ulang pada hari berikutnya dan hanya berlaku selama bulan Ramadan.

Mohon berkenan untuk memberikan konfirmasi apabila Bapak/Ibu telah menyetujui reservasi iftar ini.

Terima kasih telah memilih outlet kami sebagai pilihan kegiatan Iftar Bapak/Ibu

Justus Group`;
  };

  const getRegularSK = () => {
    return `Syarat & Ketentuan :

- Tidak diperkenankan membawa makanan atau minuman (beralkohol atau tidak) dari luar, ketentuan mengikat kepada aturan restoran Halal MUI

- Tidak diperkenankan membawa binatang peliharaan, ketentuan mengikat kepada aturan restoran Halal MUI

- Apabila adanya pembatalan pemesanan tempat, DP 50% tidak dapat dikembalikan atau diuangkan. Kebijakan yang dikeluarkan oleh Justus Steakhouse hanya dapat diganti oleh produk atau penundaaan tanggal pemesanan tempat.

- Jam keterlambatan Kedatangan maksimum 15 menit dari waktu yang telah di pesan (khusus pemesanan tempat tanpa DP). Apabila melebihi ketentuan yang diberlakukan tanpa ada konfirmasi, pemesanan tempat dianggap batal.

- Pemesanan menu diawal, akan Kami proses apabila telah melampirkan bukti pembayaran DP 50% dari nilai total transaksi


Terima Kasih dan Salam Hangat,
Justus Steakhouse The Barn`;
  };

  const handleCopySingle = (res: Reservation) => {
    const text = res.shift === Shift.IFTAR ? getIftarSK(res) : getRecapText(res);
    navigator.clipboard.writeText(text);
    setCopiedId(res.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleCopySK = (res: Reservation) => {
    const text = res.shift === Shift.IFTAR ? getIftarSK(res) : getRegularSK();
    navigator.clipboard.writeText(text);
    setCopiedSKId(res.id);
    setTimeout(() => setCopiedSKId(null), 2000);
  };

  const handleRestore = (res: Reservation) => {
    if (confirm(`Pulihkan reservasi atas nama ${res.guestName.toUpperCase()}?`)) {
        onStatusChange(res.id, ReservationStatus.CONFIRMED, "");
    }
  };

  const handleCancelReservation = (res: Reservation) => {
    const reason = prompt(`Masukkan alasan pembatalan untuk ${res.guestName.toUpperCase()}:`, "Permintaan Tamu");
    if (reason !== null) {
        onStatusChange(res.id, ReservationStatus.CANCELLED, reason);
    }
  };

  const getStatusBadge = (res: Reservation) => {
    if (res.status === ReservationStatus.CANCELLED) {
      return <span className="text-[9px] font-sans font-black px-3 py-1 rounded-full bg-red-600 text-white uppercase tracking-widest">CANCELLED</span>;
    }
    if (res.status === ReservationStatus.CHECKED_IN) {
      return <span className="text-[9px] font-sans font-black px-3 py-1 rounded-full bg-blue-600 text-white uppercase tracking-widest shadow-[0_0_15px_rgba(37,99,235,0.5)]">IN HOUSE</span>;
    }
    if (res.status === ReservationStatus.COMPLETED) {
      return <span className="text-[9px] font-sans font-black px-3 py-1 rounded-full bg-gray-700 text-white uppercase tracking-widest">COMPLETED</span>;
    }
    return null;
  };

  const renderCard = (res: Reservation) => {
    const isCancelled = res.status === ReservationStatus.CANCELLED;
    const isCompleted = res.status === ReservationStatus.COMPLETED;
    const statusColor = res.status === ReservationStatus.CHECKED_IN 
        ? 'bg-blue-600 shadow-[0_0_15px_rgba(37,99,235,0.5)]' 
        : isCancelled 
        ? 'bg-red-600 shadow-[0_0_15px_rgba(239,68,68,0.5)]'
        : 'bg-gold-500 shadow-[0_0_10px_rgba(212,175,55,0.3)]';
    
    const isEditingTable = editingTableId === res.id;
    const isEditingDate = editingDateId === res.id;

    return (
      <div key={res.id} className={`glass-card rounded-[2.5rem] p-8 mb-6 transition-all group shadow-2xl relative overflow-visible animate-fade-in border-white/5 hover:border-gold-500/30 ${isCancelled ? 'opacity-50 grayscale' : ''}`}>
        <div className={`absolute top-0 left-0 bottom-0 w-1.5 ${statusColor}`}></div>
        
        <div className="flex flex-col lg:flex-row justify-between gap-8">
            <div className="flex-1 space-y-8">
                <div className="flex items-center justify-between border-b border-white/5 pb-5">
                    <div className="flex items-center gap-3">
                      <span className={`text-[9px] font-sans font-black px-3 py-1 rounded-full ${res.shift === Shift.LUNCH ? 'bg-blue-500' : res.shift === Shift.IFTAR ? 'bg-emerald-500' : 'bg-indigo-600'} text-white uppercase tracking-widest`}>{res.shift}</span>
                      {res.isWalkIn && <span className="text-[9px] font-sans font-black px-3 py-1 rounded-full bg-amber-600 text-white uppercase tracking-widest">WALK-IN</span>}
                      {getStatusBadge(res)}
                      {res.hasDownPayment && !isCancelled && <span className={`text-[9px] font-sans font-black px-3 py-1 rounded-full ${res.isFullPayment ? 'bg-emerald-600' : 'bg-gold-500 text-black'} uppercase flex items-center gap-1 tracking-widest`}><Banknote size={10}/> {res.isFullPayment ? 'PAID' : 'DP DONE'}</span>}
                    </div>
                    <div className="flex items-center gap-4">
                       <span className="text-[10px] font-sans font-black text-gray-600 uppercase tracking-[0.2em]">#{res.id.slice(-4)}</span>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-8">
                    <div className="space-y-2 relative">
                      <label className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-500 flex items-center gap-2"><Calendar size={12} className="text-gold-500"/> Tanggal</label>
                      {isEditingDate ? (
                        <div className="flex items-center gap-1 animate-fade-in absolute top-8 left-0 z-20">
                           <input type="date" value={tempDate} onChange={(e) => setTempDate(e.target.value)} className="bg-dark-800 text-white border border-gold-600 rounded px-2 py-1.5 text-xs outline-none color-scheme-dark font-sans" autoFocus />
                           <button onClick={() => { onDateChange(res.id, tempDate); setEditingDateId(null); }} className="p-1.5 bg-emerald-600 text-white rounded"><Check size={14}/></button>
                           <button onClick={() => setEditingDateId(null)} className="p-1.5 bg-red-600 text-white rounded"><X size={14}/></button>
                        </div>
                      ) : (
                        <p className={`text-sm font-sans font-bold text-white bg-white/5 px-3 py-1.5 rounded-lg border border-white/5 inline-block ${isCancelled ? 'line-through opacity-50' : ''}`}>{res.reservationDate || '-'}</p>
                      )}
                    </div>

                    <div className="space-y-2 lg:col-span-2 xl:col-span-1">
                      <label className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-500 flex items-center gap-2"><User size={12} className="text-gold-500"/> Nama Tamu</label>
                      <p className={`text-xl font-serif font-black uppercase tracking-tight text-white truncate glow-text ${isCancelled ? 'line-through opacity-50' : ''}`} title={res.guestName}>{toTitleCase(res.guestName) || '-'}</p>
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-500 flex items-center gap-2"><Users size={12} className="text-gold-500"/> Jumlah</label>
                      <p className={`text-lg font-sans font-black text-white ${isCancelled ? 'opacity-50' : ''}`}>{res.guestCount || 0} <span className="text-[10px] text-gray-500 uppercase font-bold ml-1">Pax</span></p>
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-500 flex items-center gap-2"><Clock size={12} className="text-gold-500"/> Waktu</label>
                      <p className={`text-lg font-sans font-black text-white ${isCancelled ? 'opacity-50' : ''}`}>
                        {res.isWalkIn ? (
                          <span className="text-xs bg-blue-600/20 text-blue-400 px-2 py-1 rounded border border-blue-500/30">WALK-IN</span>
                        ) : (
                          <>{res.arrivalTime || '-'} <span className="text-xs text-gold-500">WIB</span></>
                        )}
                      </p>
                    </div>

                    <div className="space-y-2 relative">
                      <label className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-500 flex items-center gap-2"><MapPin size={12} className="text-gold-500"/> Lokasi</label>
                      {isEditingTable ? (
                         <div className="flex items-center gap-1 animate-fade-in absolute top-8 left-0 z-20">
                            <input type="text" value={tempTableNum} onChange={(e) => setTempTableNum(e.target.value)} placeholder="Tbl #" className="w-16 bg-dark-800 text-white border border-gold-600 rounded px-2 py-1.5 text-xs outline-none font-sans font-bold" autoFocus />
                            <button onClick={() => { onTableChange(res.id, tempTableNum); setEditingTableId(null); }} className="p-1.5 bg-emerald-600 text-white rounded"><Check size={14}/></button>
                            <button onClick={() => setEditingTableId(null)} className="p-1.5 bg-red-600 text-white rounded"><X size={14}/></button>
                         </div>
                      ) : (
                        <p className={`text-sm font-sans font-black uppercase text-gold-500 tracking-tight ${isCancelled ? 'opacity-50' : ''}`}>{res.locationPreference || '-'}</p>
                      )}
                    </div>
                </div>

                {isCancelled && res.cancellationReason && (
                    <div className="mt-4 p-4 rounded-2xl bg-red-900/10 border border-red-500/20">
                         <p className="text-[10px] font-black uppercase text-red-500 tracking-widest mb-1 flex items-center gap-1.5"><Ban size={12}/> Alasan Pembatalan</p>
                         <p className="text-xs italic text-red-200 font-sans">"{res.cancellationReason}"</p>
                    </div>
                )}
            </div>

            <div className="flex flex-row lg:flex-col gap-3 shrink-0 justify-end border-t lg:border-t-0 lg:border-l border-white/5 pt-6 lg:pt-0 lg:pl-10">
                <button onClick={() => handleCopySingle(res)} className={`p-5 rounded-2xl border transition-all flex items-center justify-center ${copiedId === res.id ? 'bg-emerald-600 border-emerald-500 text-white' : 'bg-white/5 border-gold-500/30 text-gold-500 hover:bg-gold-500 hover:text-black'}`} title="Salin Draf WhatsApp">
                  {copiedId === res.id ? <Check size={24}/> : <Copy size={24}/>}
                </button>
                <button onClick={() => handleCopySK(res)} className={`p-5 rounded-2xl border transition-all flex items-center justify-center ${copiedSKId === res.id ? 'bg-emerald-600 border-emerald-500 text-white' : 'bg-amber-600/10 border-amber-500/30 text-amber-500 hover:bg-amber-500 hover:text-black'}`} title={res.shift === Shift.IFTAR ? "Salin S&K Iftar" : "Salin S&K Lunch/Dinner"}>
                  {copiedSKId === res.id ? <Check size={24}/> : <ClipboardList size={24}/>}
                </button>
                {!isCancelled && !isCompleted && (
                  <>
                    <button onClick={() => { setEditingDateId(res.id); setTempDate(res.reservationDate); }} className="p-5 bg-amber-600/10 text-amber-500 rounded-2xl border border-amber-600/20 hover:bg-amber-600 hover:text-white transition-all shadow-xl" title="Pindah Tanggal">
                      <CalendarRange size={24}/>
                    </button>
                    <button onClick={() => { setEditingTableId(res.id); setTempTableNum(res.tableNumber || ''); }} className="p-5 bg-gold-600/10 text-gold-500 rounded-2xl border border-gold-600/20 hover:bg-gold-500 hover:text-black transition-all shadow-xl" title="Ganti Meja">
                      <ArrowRightLeft size={24}/>
                    </button>
                  </>
                )}
                
                {isCancelled ? (
                  <button onClick={() => handleRestore(res)} className="p-5 bg-emerald-600/10 text-emerald-500 rounded-2xl border border-emerald-600/20 hover:bg-emerald-600 hover:text-white transition-all shadow-xl" title="Pulihkan">
                    <RotateCcw size={24}/>
                  </button>
                ) : (
                  <>
                    <button onClick={() => handleCancelReservation(res)} className="p-5 bg-red-900/20 text-red-500 rounded-2xl border border-red-500/20 hover:bg-red-500 hover:text-white transition-all shadow-xl" title="Batalkan Reservasi">
                      <XCircle size={24}/>
                    </button>
                    <button onClick={() => onEdit(res)} className="p-5 bg-blue-600/10 text-blue-500 rounded-2xl border border-blue-600/20 hover:bg-blue-600 hover:text-white transition-all shadow-xl" title="Edit Full">
                      <Pencil size={24}/>
                    </button>
                    {onEditMenu && (
                      <button 
                        onClick={() => onEditMenu(res.id)} 
                        className={`p-5 rounded-2xl border transition-all shadow-xl ${
                          res.hasInputtedMenu 
                            ? 'bg-emerald-600/10 text-emerald-500 border-emerald-600/20 hover:bg-emerald-600 hover:text-white' 
                            : 'bg-amber-500/10 text-amber-400 border-amber-500/20 hover:bg-amber-500 hover:text-black'
                        }`} 
                        title={res.hasInputtedMenu ? "Edit Menu Terinput" : "Input Menu Tamu"}
                      >
                        <Utensils size={24}/>
                      </button>
                    )}
                  </>
                )}
                
                <button onClick={() => onDelete(res.id)} className="p-5 bg-gray-600/10 text-gray-500 rounded-2xl border border-gray-600/20 hover:bg-red-600 hover:text-white transition-all shadow-xl" title="Hapus Permanen">
                  <Trash2 size={24}/>
                </button>
            </div>
        </div>
      </div>
    );
  };

  const handleExportHTML = () => {
    const headers = ["Date", "Time", "Status", "Guest Name", "Pax", "Table", "Phone"];
    const data = filtered.map(r => [
      r.reservationDate,
      r.arrivalTime,
      r.status,
      r.guestName,
      r.guestCount,
      r.tableNumber,
      r.phoneNumber
    ]);
    exportToHTML(data, headers, `Reservations_${dateRange.start}_to_${dateRange.end}`, "Reservation List Report");
  };

  return (
    <div className="space-y-10 max-w-7xl mx-auto" id="reservation-list-container">
      <div className="glass-card p-10 rounded-[3rem] border border-white/5 shadow-2xl flex flex-col md:flex-row justify-between items-center gap-6">
        <div>
           <h2 className="text-4xl font-serif font-black uppercase tracking-tighter text-white">Monitoring <span className="text-gold-500">Live</span></h2>
           <p className="text-[11px] font-black uppercase tracking-[0.4em] text-gray-500 mt-2">Digital Operational Hub • Status: Aktif</p>
        </div>
        <div className="flex flex-col items-end gap-3">
          <ExportActions 
            onExportPDF={() => generateAndSharePDF(filtered, dateRange, "RESERVATION LIST REPORT", true, 'ALL', 'ALL', undefined, outletName || "JUSTUS STEAKHOUSE")}
            onExportHTML={handleExportHTML}
            onExportImage={() => exportVisualToImage('reservation-list-container', `Reservations_${dateRange.start}`)}
            onShareWA={() => generateAndSharePDF(filtered, dateRange, "RESERVATION LIST REPORT", false, 'ALL', 'ALL', undefined, outletName || "JUSTUS STEAKHOUSE")}
          />
          <button onClick={() => exportToExcel(filtered, `Recap_${dateRange.start}`)} className="bg-emerald-600/10 hover:bg-emerald-600 text-emerald-500 hover:text-white px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 transition-all active:scale-95 border border-emerald-600/20">
             <FileText size={14} /> EXCEL
          </button>
        </div>
      </div>

      {activeGuests.length > 0 && (
        <section>
          <div className="flex items-center gap-4 mb-8">
             <div className="w-1.5 h-6 bg-blue-500 rounded-full shadow-[0_0_10px_rgba(37,99,235,0.8)]"></div>
             <h3 className="text-sm font-black text-blue-400 uppercase tracking-[0.4em]">Sedang Makan / In House ({activeGuests.length})</h3>
          </div>
          <div className="space-y-6">
            {activeGuests.map(renderCard)}
          </div>
        </section>
      )}

      <section>
        <div className="flex items-center gap-4 mb-8">
           <div className="w-1.5 h-6 bg-gold-500 rounded-full shadow-[0_0_10px_rgba(212,175,55,0.8)]"></div>
           <h3 className="text-sm font-black text-gold-500 uppercase tracking-[0.4em]">Upcoming Forecast ({upcomingGrouped.reduce((s, g) => s + (g.items.length - g.cancelCount), 0)})</h3>
        </div>
        
        {upcomingGrouped.length > 0 ? (
          <div className="space-y-12">
            {upcomingGrouped.map((group) => (
              <div key={group.date} className="animate-fade-in">
                <div className="flex items-center gap-4 mb-6 sticky top-24 z-10 py-3 bg-dark-950/80 backdrop-blur-md">
                   <div className="flex items-center gap-3 bg-white/5 border border-gold-500/20 px-4 py-2 rounded-2xl shadow-lg">
                      <Calendar size={16} className="text-gold-500" />
                      <span className="text-sm font-sans font-black uppercase tracking-widest text-gold-500">{new Date(group.date).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'short' })}</span>
                   </div>
                   <div className="h-px flex-1 bg-gradient-to-r from-gold-500/20 to-transparent"></div>
                   <div className="flex items-center gap-4 text-[10px] font-sans font-black uppercase tracking-widest text-gray-500">
                      <span>{group.items.length - group.cancelCount} Bookings</span>
                      {group.cancelCount > 0 && <span className="text-red-500 font-bold">({group.cancelCount} Batal)</span>}
                      <span className="w-1 h-1 rounded-full bg-gray-700"></span>
                      <span className="text-emerald-500">{group.totalPax} Pax</span>
                   </div>
                </div>
                <div className="space-y-6">
                  {group.items.map(renderCard)}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="glass-card py-32 rounded-[3.5rem] border border-dashed border-white/5 text-center flex flex-col items-center gap-6 grayscale opacity-20">
             <Calendar size={64}/>
             <span className="text-[11px] font-black uppercase tracking-[0.5em]">No Data Found</span>
          </div>
        )}
      </section>
    </div>
  );
};

export default ReservationList;
