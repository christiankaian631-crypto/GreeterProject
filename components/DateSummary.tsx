
// @ts-nocheck
import React, { useMemo, useState } from 'react';
import { Reservation, ReservationStatus, AppSettings, Shift } from '../types';
import { Calendar, Users, Wallet, Clock, LayoutGrid, FileSpreadsheet, MessageSquare, ClipboardCheck, Banknote, Loader2, Download, Share2, Pencil, ArrowRightLeft, ChevronDown, ChevronUp, Check, X, Square, CheckSquare, MapPin, Ban, CalendarRange, Copy, RotateCcw, XCircle, ClipboardList, Utensils, Flame, Info, Bell, Target, Hash, Sparkles } from 'lucide-react';
import { generateAndSharePDF } from '../services/pdfService';
import { exportToCSV } from '../services/exportService';

interface Props {
  reservations: Reservation[];
  dateRange: { start: string, end: string };
  onEdit: (res: Reservation) => void;
  onTableChange: (id: string, tableNumber: string, mergedTables?: string[]) => void;
  onDateChange: (id: string, newDate: string) => void;
  onToggleMenuStatus?: (id: string) => void;
  onTogglePayment?: (id: string) => void;
  onToggleFullPayment?: (id: string) => void;
  onStatusChange?: (id: string, status: ReservationStatus, reason?: string) => void;
  onEditMenu?: (id: string) => void;
  settings?: AppSettings;
  isDarkMode?: boolean;
  outletName?: string;
}

const DateSummary: React.FC<Props> = ({ 
  reservations, 
  dateRange, 
  onEdit, 
  onTableChange, 
  onDateChange, 
  onToggleMenuStatus, 
  onTogglePayment, 
  onToggleFullPayment, 
  onStatusChange,
  onEditMenu,
  settings, 
  isDarkMode, 
  outletName 
}) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [editingTableId, setEditingTableId] = useState<string | null>(null);
  const [tempTableNum, setTempTableNum] = useState<string>('');
  
  const [editingDateId, setEditingDateId] = useState<string | null>(null);
  const [tempDate, setTempDate] = useState<string>('');

  const totalTables = settings?.totalTables || 40;
  
  const groupedData = useMemo(() => {
    const validData = reservations.filter(r => 
      r.reservationDate >= dateRange.start && 
      r.reservationDate <= dateRange.end &&
      !r.isWalkIn 
    );
    const groups: Record<string, Reservation[]> = {};
    validData.forEach(res => {
      if (!groups[res.reservationDate]) groups[res.reservationDate] = [];
      groups[res.reservationDate].push(res);
    });
    return Object.keys(groups).sort().map(date => {
      const dayRes = groups[date].sort((a, b) => a.arrivalTime.localeCompare(b.arrivalTime));
      return {
        date,
        items: dayRes,
        totalPax: dayRes.filter(r => r.status !== ReservationStatus.CANCELLED).reduce((sum, r) => sum + r.guestCount, 0),
        totalDP: dayRes.filter(r => r.status !== ReservationStatus.CANCELLED).reduce((sum, r) => sum + (r.hasDownPayment ? r.downPaymentAmount : 0), 0),
        count: dayRes.filter(r => r.status !== ReservationStatus.CANCELLED).length,
        cancelCount: dayRes.filter(r => r.status === ReservationStatus.CANCELLED).length
      };
    });
  }, [reservations, dateRange]);

  const formatDate = (dateStr: string) => new Date(dateStr).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  const formatCurrency = (amount: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount || 0);

  const toTitleCase = (str: string) => {
    if (!str) return '-';
    return str.toLowerCase().split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  };

  const getForecastData = () => reservations.filter(r => r.reservationDate >= dateRange.start && r.reservationDate <= dateRange.end && r.status !== ReservationStatus.CANCELLED);

  const handleAction = async (forceDownload: boolean) => {
    setIsGenerating(true);
    try {
      await generateAndSharePDF(getForecastData(), dateRange, "FORECAST RESERVASI", forceDownload, 'ALL', 'ALL', undefined, outletName || "JUSTUS STEAKHOUSE");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCancelReservation = (res: Reservation) => {
    const reason = prompt(`Masukkan alasan pembatalan untuk ${res.guestName.toUpperCase()}:`, "Permintaan Tamu");
    if (reason !== null) {
        onStatusChange?.(res.id, ReservationStatus.CANCELLED, reason);
    }
  };

  const handleRestore = (res: Reservation) => {
    if (confirm(`Pulihkan reservasi atas nama ${res.guestName.toUpperCase()}?`)) {
        onStatusChange?.(res.id, ReservationStatus.CONFIRMED, "");
    }
  };

  const getIftarSK = (res?: Reservation) => {
    const toTitleCase = (str: string) => {
      if (!str) return '-';
      return str.toLowerCase().split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
    };
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

  const handleCopyRecap = (res: Reservation) => {
    if (res.shift === Shift.IFTAR) {
      const text = getIftarSK(res);
      navigator.clipboard.writeText(text);
      alert('Draf konfirmasi WhatsApp Iftar disalin ke clipboard');
      return;
    }
    const formattedDate = res.reservationDate ? new Date(res.reservationDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : '-';
    
    let locText = 'Tidak ditentukan';
    const locPref = res.locationPreference;
    if (locPref === 'Non-Smoking') locText = 'Tidak merokok';
    else if (locPref === 'Smoking') locText = 'Merokok';
    else if (locPref === 'VIP Room') locText = 'VIP Room (Tidak merokok)';
    else if (locPref === 'Outdoor') locText = 'Outdoor (Merokok)';

    const payStatus = res.isFullPayment ? 'Lunas / Full Payment' : (res.hasDownPayment ? `Sudah DP (${formatCurrency(res.downPaymentAmount || 0)})` : 'Belum DP');

    const recap = `Salam Hangat dari Justus SteakHouse The Barn

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

    navigator.clipboard.writeText(recap);
    alert('Draf konfirmasi WhatsApp disalin ke clipboard');
  };

  const handleCopySKDirect = (res: Reservation) => {
    const text = res.shift === Shift.IFTAR ? getIftarSK(res) : getRegularSK();
    navigator.clipboard.writeText(text);
    alert(res.shift === Shift.IFTAR ? 'S&K Iftar disalin ke clipboard' : 'S&K Lunch/Dinner disalin ke clipboard');
  };

  if (groupedData.length === 0) {
    return (
      <div className={`rounded-[2.5rem] border p-20 text-center animate-fade-in ${isDarkMode ? 'bg-dark-800 border-dark-700' : 'bg-white border-gray-200'}`}>
        <Calendar className="text-gray-700 mx-auto mb-6" size={48} />
        <h3 className={`text-2xl font-serif font-black uppercase tracking-tight mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Forecast Belum Tersedia</h3>
        <p className="text-gray-500 text-sm">Tidak ada data reservasi terkonfirmasi untuk periode yang dipilih.</p>
      </div>
    );
  }

  return (
    <div className="space-y-12 animate-fade-in relative">
      <div className={`flex flex-col lg:flex-row justify-between items-center gap-6 p-8 rounded-[3rem] border shadow-2xl ${isDarkMode ? 'bg-dark-800 border-gold-900/30' : 'bg-white border-gray-200'}`}>
         <div>
            <h3 className={`text-2xl font-serif font-black uppercase tracking-tight ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Reservasi Book Forecast</h3>
            <p className="text-[10px] text-gold-600 font-black uppercase tracking-[0.3em] mt-1">Management Monitoring for {outletName || "JUSTUS"}</p>
         </div>
         <div className="flex flex-wrap items-center gap-3">
            <button onClick={() => exportToCSV(getForecastData(), `Recap_${dateRange.start}`)} className="flex items-center gap-2 bg-emerald-700 hover:bg-emerald-600 text-white px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all">
                <FileSpreadsheet size={16} /> EXCEL
            </button>
            <button onClick={() => handleAction(true)} disabled={isGenerating} className="flex items-center gap-2 bg-blue-700 hover:bg-blue-600 text-white px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all">
                {isGenerating ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />} PDF
            </button>
            <button onClick={() => handleAction(false)} disabled={isGenerating} className="flex items-center gap-2 bg-green-700 hover:bg-green-600 text-white px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all">
                {isGenerating ? <Loader2 size={16} className="animate-spin" /> : <Share2 size={16} />} WA
            </button>
         </div>
      </div>

      <div className="space-y-16">
        {groupedData.map((group) => (
          <div key={group.date} className="space-y-6">
            <div className={`p-8 rounded-[2.5rem] border flex flex-col md:flex-row justify-between items-center gap-6 shadow-xl sticky top-24 z-10 ${isDarkMode ? 'bg-dark-950 border-gold-500/40' : 'bg-gray-50 border-gray-200'}`}>
              <div className="flex items-center gap-5">
                <div className="bg-gold-500 text-black font-sans font-black p-4 rounded-[1.5rem] text-center min-w-[80px] shadow-lg border border-white/20">
                   <span className="block text-[11px] uppercase tracking-tighter">{new Date(group.date).toLocaleDateString('en-US', { month: 'short' })}</span>
                   <span className="block text-3xl leading-none font-sans">{new Date(group.date).getDate()}</span>
                </div>
                <div>
                   <h4 className={`text-2xl font-serif font-black uppercase tracking-tighter ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{formatDate(group.date)}</h4>
                   <p className="text-[10px] text-gold-600 font-sans font-black uppercase tracking-widest">{group.count} Terkonfirmasi</p>
                </div>
              </div>
              <div className={`flex gap-12 p-5 rounded-2xl border ${isDarkMode ? 'bg-black/40 border-white/5' : 'bg-white border-gray-200 shadow-sm'}`}>
                 <div className="flex items-center gap-4">
                    <Users size={24} className="text-emerald-500" />
                    <div><span className="block text-[10px] text-gray-500 uppercase font-black">Daily Volume</span><span className={`block font-sans font-black text-xl ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{group.totalPax} Pax</span></div>
                 </div>
                 <div className="flex items-center gap-4">
                    <Wallet size={24} className="text-gold-500" />
                    <div><span className="block text-[10px] text-gray-500 uppercase font-black">Daily Deposits</span><span className={`block font-sans font-black text-xl truncate max-w-[150px] ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{formatCurrency(group.totalDP)}</span></div>
                 </div>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-5">
               {group.items.map((res) => {
                 const isExpanded = expandedId === res.id;
                 const isEditingTable = editingTableId === res.id;
                 const isCancelled = res.status === ReservationStatus.CANCELLED;
                 const isCheckedIn = res.status === ReservationStatus.CHECKED_IN;

                 const cardBg = isCheckedIn 
                    ? (isDarkMode ? 'bg-blue-900/10 border-blue-500/30' : 'bg-blue-50 border-blue-200')
                    : (isDarkMode ? 'bg-dark-800 border-white/5' : 'bg-white border-gray-100');

                 return (
                 <div key={res.id} className={`p-6 rounded-[2rem] border transition-all relative overflow-hidden ${cardBg} ${isDarkMode ? 'hover:border-gold-500/30' : 'hover:border-gold-300'} ${isCancelled ? 'opacity-50 grayscale' : ''}`}>
                    {/* Status Strip */}
                    <div className={`absolute top-0 left-0 bottom-0 w-1.5 ${isCheckedIn ? 'bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.5)]' : isCancelled ? 'bg-red-500' : 'bg-gold-500'}`}></div>
                    
                    <div className="flex flex-col md:flex-row justify-between gap-6">
                        <div className="flex flex-1 gap-6 items-start">
                           <div className={`shrink-0 flex flex-col items-center justify-center p-3 rounded-2xl border min-w-[90px] ${res.shift === Shift.LUNCH ? 'bg-blue-600/10 border-blue-500/20' : res.shift === Shift.IFTAR ? 'bg-emerald-600/10 border-emerald-500/20' : 'bg-indigo-600/10 border-indigo-500/20'}`}>
                              <p className="text-[9px] font-black text-gray-500 uppercase font-sans">{res.shift}</p>
                              <span className={`font-sans font-black text-xl ${res.shift === Shift.LUNCH ? 'text-blue-500' : res.shift === Shift.IFTAR ? 'text-emerald-500' : 'text-indigo-500'}`}>{res.arrivalTime || '-'}</span>
                           </div>
                           <div className="flex-1 cursor-pointer" onClick={() => setExpandedId(isExpanded ? null : res.id)}>
                              <h5 className={`text-2xl font-serif font-black uppercase tracking-tighter flex items-center gap-3 ${isDarkMode ? 'text-white' : 'text-gray-900'} ${isCancelled ? 'line-through' : ''}`}>
                                {toTitleCase(res.guestName) || '-'}
                                {res.tableNumber && !isCancelled && <span className="bg-gold-500 text-black px-2 py-0.5 rounded text-xs font-sans">T-{res.tableNumber}</span>}
                                {isCheckedIn && <span className="bg-blue-600 text-white px-3 py-0.5 rounded-full text-[9px] font-sans font-black tracking-widest shadow-lg animate-pulse">IN HOUSE</span>}
                              </h5>
                              <div className="flex flex-wrap items-center gap-4 mt-2">
                                 <span className="text-[10px] font-sans font-black text-gray-500 uppercase tracking-widest"><Users size={12} className="inline mr-1"/> {res.guestCount || 0} PAX</span>
                                 <span className="text-[10px] font-sans font-black text-gold-600 uppercase tracking-widest"><MapPin size={12} className="inline mr-1"/> {res.locationPreference || '-'}</span>
                                 <span className="flex items-center gap-1.5 text-[9px] font-sans font-black uppercase tracking-widest px-2 py-0.5 rounded bg-white/5 text-gray-400">
                                    {res.menuOrderType === 'Menu di Awal' && <ClipboardList size={10}/>}
                                    {res.menuOrderType === 'Buka Puasa' && <Flame size={10}/>}
                                    {res.menuOrderType === 'On The Spot' && <Utensils size={10}/>}
                                    {res.menuOrderType}
                                 </span>
                                 {isCancelled && <span className="bg-red-600 text-white text-[8px] font-sans font-black px-2 py-0.5 rounded uppercase tracking-widest">DIBATALKAN</span>}
                              </div>
                           </div>
                        </div>

                        <div className="flex items-center gap-3">
                           <div className="flex items-center gap-2">
                              {isCancelled ? (
                                  <button onClick={() => handleRestore(res)} className="p-3 bg-emerald-600/10 text-emerald-500 rounded-2xl border border-emerald-600/20 hover:bg-emerald-600 hover:text-white transition-all shadow-lg" title="Pulihkan"><RotateCcw size={20} /></button>
                              ) : (
                                <>
                                    <button onClick={() => handleCopyRecap(res)} className="p-3 bg-emerald-600/10 text-emerald-500 rounded-2xl border border-emerald-600/20 hover:bg-emerald-600 hover:text-white transition-all shadow-lg" title="Salin Draf WhatsApp"><Copy size={20} /></button>
                                    <button onClick={() => handleCopySKDirect(res)} className="p-3 bg-amber-600/10 text-amber-500 rounded-2xl border border-amber-600/20 hover:bg-amber-600 hover:text-white transition-all shadow-lg" title={res.shift === Shift.IFTAR ? "Salin S&K Iftar" : "Salin S&K Lunch/Dinner"}><ClipboardList size={20} /></button>
                                    <button onClick={() => onEdit(res)} className="p-3 bg-blue-600/10 text-blue-500 rounded-2xl border border-blue-600/20 hover:bg-blue-600 hover:text-white transition-all shadow-lg" title="Edit Data"><Pencil size={20} /></button>
                                    {onEditMenu && (
                                      <button 
                                        onClick={() => onEditMenu(res.id)} 
                                        className={`p-3 rounded-2xl border transition-all shadow-lg ${res.hasInputtedMenu ? "bg-emerald-600/10 text-emerald-500 border-emerald-600/20 hover:bg-emerald-600 hover:text-white" : "bg-amber-500/10 text-amber-400 border-amber-500/20 hover:bg-amber-500 hover:text-black"}`} 
                                        title={res.hasInputtedMenu ? "Edit Menu Terinput" : "Input Menu Tamu"}
                                      >
                                        <Utensils size={20} />
                                      </button>
                                    )}
                                    <button onClick={() => { setEditingTableId(res.id); setTempTableNum(res.tableNumber || ''); }} className="p-3 bg-gold-500/10 text-gold-500 rounded-2xl border border-gold-600/20 hover:bg-gold-500 hover:text-black transition-all shadow-lg" title="Pindah Table"><ArrowRightLeft size={20} /></button>
                                    <button onClick={() => handleCancelReservation(res)} className="p-3 bg-red-900/20 text-red-500 rounded-2xl border border-red-500/20 hover:bg-red-500 hover:text-white transition-all shadow-lg" title="Batalkan Reservasi"><XCircle size={20} /></button>
                                </>
                              )}
                              <button onClick={() => setExpandedId(isExpanded ? null : res.id)} className={`p-3 rounded-2xl transition-all shadow-lg ${isExpanded ? 'bg-white text-black' : 'text-gray-500 hover:text-white'}`}>{isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}</button>
                           </div>
                        </div>
                    </div>

                    {isEditingTable && (
                       <div className="mt-5 p-5 rounded-2xl bg-black/40 border border-gold-600/50 flex items-center justify-between animate-fade-in shadow-inner">
                          <div className="flex items-center gap-4">
                             <label className="text-[10px] font-black text-gold-500 uppercase font-sans">Assign Table</label>
                             <select value={tempTableNum} onChange={(e) => setTempTableNum(e.target.value)} className="bg-dark-800 text-white border border-gold-900/50 rounded-xl px-4 py-2 text-xs outline-none focus:border-gold-500 font-sans font-bold">
                                <option value="">No Table</option>
                                {Array.from({length: totalTables}, (_, i) => (i+1).toString()).map(n => <option key={n} value={n}>Table {n}</option>)}
                             </select>
                          </div>
                          <div className="flex gap-2">
                             <button onClick={() => setEditingTableId(null)} className="px-5 py-2 text-[10px] font-black uppercase text-gray-500 hover:text-white transition-colors">Batal</button>
                             <button onClick={() => { onTableChange(res.id, tempTableNum); setEditingTableId(null); }} className="px-8 py-2 bg-gold-600 text-black rounded-xl text-[10px] font-black uppercase shadow-lg active:scale-95 transition-all">Simpan Table</button>
                          </div>
                       </div>
                    )}

                    {isExpanded && (
                       <div className={`mt-6 pt-6 border-t animate-fade-in ${isDarkMode ? 'border-white/5' : 'border-gray-100'}`}>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                             <div className="space-y-4">
                                <div><p className="text-[9px] font-black text-gray-500 uppercase tracking-widest mb-1.5 font-sans">No. Telepon</p><p className={`text-sm font-sans font-black ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{res.phoneNumber || '-'}</p></div>
                                <div><p className="text-[9px] font-black text-gray-500 uppercase tracking-widest mb-1.5 font-sans">PIC Incharge</p><p className={`text-sm font-sans font-black uppercase tracking-tight ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{res.picIncharge?.split(' ')[0]}</p></div>
                             </div>
                             <div className="bg-black/20 p-5 rounded-3xl border border-white/5 shadow-inner">
                                <p className="text-[9px] font-black text-gold-600 uppercase tracking-widest mb-2 flex items-center gap-2 font-sans"><MessageSquare size={12}/> Catatan Khusus</p>
                                <p className="text-xs italic text-gray-400 leading-relaxed font-sans">"{res.otherRequirements || 'Tidak ada catatan.'}"</p>
                                {isCancelled && res.cancellationReason && (
                                    <div className="mt-3 pt-3 border-t border-red-500/20">
                                         <p className="text-[9px] font-black text-red-500 uppercase mb-1 font-sans">Alasan Pembatalan:</p>
                                         <p className="text-xs font-bold text-red-400 font-sans">"{res.cancellationReason}"</p>
                                    </div>
                                )}
                             </div>
                          </div>
                       </div>
                    )}
                 </div>
                 );
               })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default DateSummary;
