
import React, { useMemo, useState } from 'react';
import { Reservation, ReservationStatus, WaitingListEntry, WaitingStatus } from '../types';
import { generateEODReportPDF, exportVisualToPDF, exportVisualToHTML, exportVisualToImage } from '../services/pdfService';
import { ExportActions } from './ExportActions';
import { 
  ShieldCheck, 
  Banknote, 
  Users, 
  Utensils, 
  TrendingUp, 
  PieChart, 
  Calendar,
  ArrowLeft,
  Download,
  Share2,
  CheckCircle2,
  Wallet,
  Loader2
} from 'lucide-react';

interface Props {
  reservations: Reservation[];
  waitingList: WaitingListEntry[];
  date: string;
  outletName: string;
  isDarkMode?: boolean;
  onBack: () => void;
  onArchiveDay?: (date: string) => void;
}

const EODReport: React.FC<Props> = ({ reservations, waitingList, date, outletName, isDarkMode, onBack, onArchiveDay }) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  const [isArchiving, setIsArchiving] = useState(false);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount || 0);
  };

  const stats = useMemo(() => {
    const dayRsv = reservations.filter(r => r.reservationDate === date);
    const dayWait = waitingList.filter(w => w.reservationDate === date);

    const activeRsv = dayRsv.filter(r => r.status !== ReservationStatus.CANCELLED);
    const settledRsv = activeRsv.filter(r => r.totalBillAmount > 0);

    const totalRevenue = settledRsv.reduce((sum, r) => sum + r.totalBillAmount, 0);
    const totalPax = activeRsv.reduce((sum, r) => sum + r.guestCount, 0);
    const totalGroups = activeRsv.length;

    const totalDiscountAmount = settledRsv.reduce((sum, r) => sum + (r.discountAmount || 0), 0);
    const totalFixedDeduction = settledRsv.reduce((sum, r) => sum + (r.fixedDeduction || 0), 0);

    const paymentMethods: Record<string, number> = {};
    settledRsv.forEach(r => {
      const method = r.paymentBank || 'CASH';
      paymentMethods[method] = (paymentMethods[method] || 0) + r.totalBillAmount;
    });

    const dpPayments: Record<string, number> = {};
    activeRsv.forEach(r => {
      if (r.hasDownPayment || r.isFullPayment) {
        const method = r.paymentBank || 'CASH';
        dpPayments[method] = (dpPayments[method] || 0) + r.downPaymentAmount;
      }
    });

    const shiftBreakdown = {
      LUNCH: activeRsv.filter(r => r.shift === 'LUNCH').length,
      IFTAR: activeRsv.filter(r => r.shift === 'IFTAR').length,
      DINNER: activeRsv.filter(r => r.shift === 'DINNER').length,
    };

    return {
      totalRevenue,
      totalPax,
      totalGroups,
      totalDiscountAmount,
      totalFixedDeduction,
      paymentMethods,
      dpPayments,
      shiftBreakdown,
      waitingCount: dayWait.length,
      seatedWait: dayWait.filter(w => w.status === WaitingStatus.SEATED).length,
    };
  }, [reservations, waitingList, date]);

  const handleDownload = async () => {
    setIsGenerating(true);
    await generateEODReportPDF(stats, date, outletName, false);
    setIsGenerating(false);
  };

  const handleShare = async () => {
    setIsSharing(true);
    await generateEODReportPDF(stats, date, outletName, true);
    setIsSharing(false);
  };

  return (
    <div className="animate-fade-in space-y-8 pb-20">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="p-3 bg-gold-500/10 text-gold-500 rounded-2xl hover:bg-gold-500 hover:text-black transition-all">
            <ArrowLeft size={24} />
          </button>
          <div>
            <h2 className={`text-3xl font-serif font-black uppercase tracking-tighter ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>End of Day Report</h2>
            <p className="text-[10px] text-gold-600 font-black uppercase tracking-[0.4em]">{outletName} | {date}</p>
          </div>
        </div>
        <div className="flex flex-col items-end gap-3">
          <ExportActions 
            onExportPDF={handleDownload}
            onExportHTML={() => exportVisualToHTML('eod-report-container', `EOD_Report_${date}`)}
            onExportImage={() => exportVisualToImage('eod-report-container', `EOD_Visual_${date}`)}
            onShareWA={handleShare}
          />
        </div>
      </div>

      <div id="eod-report-container" className="space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className={`p-8 rounded-[2.5rem] border shadow-xl ${isDarkMode ? 'bg-dark-800 border-gold-900/20' : 'bg-white border-gray-200'}`}>
          <div className="flex items-center gap-4 mb-6">
            <div className="p-3 bg-gold-500 rounded-2xl text-black shadow-lg"><Banknote size={24} /></div>
            <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Total Revenue</p>
          </div>
          <p className={`text-3xl font-sans font-black ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{formatCurrency(stats.totalRevenue)}</p>
          <div className="mt-4 flex items-center gap-2 text-emerald-500">
            <TrendingUp size={16} />
            <span className="text-[10px] font-bold uppercase tracking-widest">Revenue Flow Completed</span>
          </div>
        </div>

        <div className={`p-8 rounded-[2.5rem] border shadow-xl ${isDarkMode ? 'bg-dark-800 border-gold-900/20' : 'bg-white border-gray-200'}`}>
          <div className="flex items-center gap-4 mb-6">
            <div className="p-3 bg-rose-500 rounded-2xl text-white shadow-lg"><PieChart size={24} /></div>
            <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Total Discounts</p>
          </div>
          <p className={`text-3xl font-sans font-black ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{formatCurrency(stats.totalDiscountAmount + stats.totalFixedDeduction)}</p>
          <p className="mt-4 text-[10px] text-rose-500 font-bold uppercase tracking-widest">Incl. Nominal Deductions</p>
        </div>

        <div className={`p-8 rounded-[2.5rem] border shadow-xl ${isDarkMode ? 'bg-dark-800 border-gold-900/20' : 'bg-white border-gray-200'}`}>
          <div className="flex items-center gap-4 mb-6">
            <div className="p-3 bg-blue-500 rounded-2xl text-white shadow-lg"><Users size={24} /></div>
            <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Total Coverage</p>
          </div>
          <p className={`text-3xl font-sans font-black ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{stats.totalPax} <span className="text-sm text-gray-500 font-bold">PAX</span></p>
          <p className="mt-4 text-[10px] text-blue-500 font-bold uppercase tracking-widest">{stats.totalGroups} Groups Seated</p>
        </div>

        <div className={`p-8 rounded-[2.5rem] border shadow-xl ${isDarkMode ? 'bg-dark-800 border-gold-900/20' : 'bg-white border-gray-200'}`}>
          <div className="flex items-center gap-4 mb-6">
            <div className="p-3 bg-emerald-500 rounded-2xl text-white shadow-lg"><Utensils size={24} /></div>
            <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Service Efficiency</p>
          </div>
          <p className={`text-3xl font-sans font-black ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{stats.seatedWait} / {stats.waitingCount}</p>
          <p className="mt-4 text-[10px] text-emerald-500 font-bold uppercase tracking-widest">Waiting List Conversion</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className={`p-10 rounded-[3rem] border shadow-xl ${isDarkMode ? 'bg-dark-800 border-gold-900/20' : 'bg-white border-gray-200'}`}>
          <div className="flex items-center gap-4 mb-8">
            <PieChart size={20} className="text-gold-500" />
            <h3 className={`text-sm font-black uppercase tracking-[0.3em] ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Settled Payments</h3>
          </div>
          <div className="space-y-4">
            {(Object.entries(stats.paymentMethods) as [string, number][]).map(([method, amount]) => (
              <div key={method} className="flex justify-between items-center p-4 bg-black/20 rounded-2xl border border-white/5">
                <span className="text-xs font-bold text-gray-400 uppercase">{method}</span>
                <span className={`text-sm font-mono font-black ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{formatCurrency(amount)}</span>
              </div>
            ))}
            {Object.keys(stats.paymentMethods).length === 0 && (
              <p className="text-center py-10 text-gray-500 text-xs font-bold uppercase italic">No settled bills recorded</p>
            )}
          </div>
        </div>

        <div className={`p-10 rounded-[3rem] border shadow-xl ${isDarkMode ? 'bg-dark-800 border-gold-900/20' : 'bg-white border-gray-200'}`}>
          <div className="flex items-center gap-4 mb-8">
            <Wallet size={20} className="text-gold-500" />
            <h3 className={`text-sm font-black uppercase tracking-[0.3em] ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>DP / Full Payments</h3>
          </div>
          <div className="space-y-4">
            {(Object.entries(stats.dpPayments) as [string, number][]).map(([method, amount]) => (
              <div key={method} className="flex justify-between items-center p-4 bg-black/20 rounded-2xl border border-white/5">
                <span className="text-xs font-bold text-gray-400 uppercase">{method}</span>
                <span className={`text-sm font-mono font-black ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{formatCurrency(amount)}</span>
              </div>
            ))}
            {Object.keys(stats.dpPayments).length === 0 && (
              <p className="text-center py-10 text-gray-500 text-xs font-bold uppercase italic">No DP payments recorded</p>
            )}
          </div>
        </div>

        <div className={`p-10 rounded-[3rem] border shadow-xl ${isDarkMode ? 'bg-dark-800 border-gold-900/20' : 'bg-white border-gray-200'}`}>
          <div className="flex items-center gap-4 mb-8">
            <Calendar size={20} className="text-gold-500" />
            <h3 className={`text-sm font-black uppercase tracking-[0.3em] ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Shift Distribution</h3>
          </div>
          <div className="grid grid-cols-1 gap-4">
            {Object.entries(stats.shiftBreakdown).map(([shift, count]) => (
              <div key={shift} className="p-6 bg-black/20 rounded-3xl border border-white/5 flex justify-between items-center">
                <p className="text-[9px] font-black text-gray-500 uppercase tracking-widest">{shift}</p>
                <div className="flex items-center gap-3">
                  <p className={`text-2xl font-sans font-black ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{count}</p>
                  <p className="text-[9px] text-gold-600 font-bold uppercase">Groups</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className={`p-10 rounded-[3rem] border border-dashed text-center ${isDarkMode ? 'bg-gold-500/5 border-gold-500/30' : 'bg-gold-50 border-gold-200'}`}>
        <div className="w-16 h-16 bg-gold-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
          <CheckCircle2 size={32} className="text-black" />
        </div>
        <h3 className={`text-xl font-serif font-black uppercase tracking-tighter mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Operational Day Summary</h3>
        <p className="text-[10px] text-gold-600 font-bold uppercase tracking-widest max-w-md mx-auto mb-8">Semua data operasional untuk hari ini telah divalidasi dan dicatat dalam sistem. Laporan ini merupakan ringkasan akhir untuk hari {date}.</p>
        
        {onArchiveDay && (
          <button 
            onClick={() => {
              if (window.confirm(`Are you sure you want to CLOSE and ARCHIVE all data for ${date}? This will clear today's active list and move it to history.`)) {
                setIsArchiving(true);
                onArchiveDay(date);
                setTimeout(() => setIsArchiving(false), 2000);
              }
            }}
            disabled={isArchiving}
            className="px-12 py-5 bg-rose-600 hover:bg-rose-500 text-white rounded-2xl font-black uppercase tracking-[0.2em] text-xs shadow-2xl transition-all active:scale-95 flex items-center gap-3 mx-auto disabled:opacity-50"
          >
            {isArchiving ? <Loader2 size={18} className="animate-spin" /> : <ShieldCheck size={18} />}
            Finalize & Archive Day
          </button>
        )}
      </div>
      </div>
    </div>
  );
};

export default EODReport;
