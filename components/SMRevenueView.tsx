
// @ts-nocheck
import React, { useState, useMemo } from 'react';
import { 
  ArrowLeft, 
  TrendingUp, 
  Search, 
  Calendar, 
  Star,
  Tag,
  LayoutGrid,
  Clock,
  CheckCircle2,
  Lock,
  Wallet,
  CalendarRange,
  RotateCcw
} from 'lucide-react';
import { Reservation, ReservationStatus } from '../types';

interface Props {
  reservations: Reservation[];
  isDarkMode?: boolean;
  onBack: () => void;
  onUpdateTotalBill: (id: string, amount: number) => void;
}

const SMRevenueView: React.FC<Props> = ({ reservations, isDarkMode, onBack }) => {
  const [searchTerm, setSearchTerm] = useState('');
  
  // Default: Rentang hari ini
  const today = new Date().toISOString().split('T')[0];
  const [startDate, setStartDate] = useState(today);
  const [endDate, setEndDate] = useState(today);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', { 
        style: 'currency', 
        currency: 'IDR', 
        minimumFractionDigits: 0 
    }).format(amount);
  };

  const salesData = useMemo(() => {
    return reservations.filter(r => 
      (r.isHarrySalesManager || r.isNurulSalesManager) && 
      !r.isWalkIn &&
      r.status !== ReservationStatus.CANCELLED &&
      (r.guestName.toLowerCase().includes(searchTerm.toLowerCase())) &&
      (r.reservationDate >= startDate && r.reservationDate <= endDate)
    ).sort((a, b) => b.reservationDate.localeCompare(a.reservationDate) || b.createdAt - a.createdAt);
  }, [reservations, searchTerm, startDate, endDate]);

  const totalAchievement = useMemo(() => {
    return salesData.reduce((sum, r) => sum + (r.totalBillAmount || 0), 0);
  }, [salesData]);

  const getStatusDisplay = (status: ReservationStatus) => {
    switch (status) {
      case ReservationStatus.COMPLETED:
        return (
          <div className="flex items-center gap-1.5 text-emerald-500 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20 text-[9px] font-sans font-black uppercase tracking-widest">
            <CheckCircle2 size={12} /> Checked Out
          </div>
        );
      case ReservationStatus.CHECKED_IN:
        return (
          <div className="flex items-center gap-1.5 text-blue-400 bg-blue-500/10 px-2.5 py-1 rounded-full border border-blue-500/20 text-[9px] font-sans font-black uppercase tracking-widest">
            <Clock size={12} className="animate-pulse" /> In House
          </div>
        );
      default:
        return (
          <div className="flex items-center gap-1.5 text-gray-500 bg-white/5 px-2.5 py-1 rounded-full border border-white/10 text-[9px] font-sans font-black uppercase tracking-widest">
            <Lock size={12} /> Confirmed
          </div>
        );
    }
  };

  const handleResetFilters = () => {
    setStartDate(today);
    setEndDate(today);
    setSearchTerm('');
  };

  return (
    <div className="animate-fade-in space-y-8 pb-32">
      {/* Header Area */}
      <div className={`p-8 rounded-[2.5rem] border flex flex-col lg:flex-row justify-between items-start lg:items-center gap-8 shadow-2xl ${isDarkMode ? 'bg-dark-800 border-gold-900/30' : 'bg-white border-gray-200'}`}>
        <div className="flex items-center gap-6">
          <button onClick={onBack} className="p-4 hover:bg-gold-500 hover:text-black rounded-2xl transition-all border border-gold-500/20 text-gold-500 bg-gold-500/5 group">
            <ArrowLeft size={28} className="group-hover:-translate-x-1 transition-transform" />
          </button>
          <div className="flex items-center gap-4">
             <div className="p-4 bg-amber-600 rounded-[1.5rem] text-white shadow-[0_10px_30px_rgba(217,119,6,0.3)]">
                <TrendingUp size={32} />
             </div>
             <div>
                <h2 className={`text-3xl font-serif font-black uppercase tracking-tight ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Sales Manager Revenue</h2>
                <p className="text-[11px] text-amber-500 font-black uppercase tracking-[0.4em] mt-1">Revenue Monitoring (Harry SM & Nurul SM)</p>
             </div>
          </div>
        </div>

        <div className="flex flex-col xl:flex-row gap-4 w-full lg:w-auto items-stretch xl:items-center">
            {/* Date Range Picker UI */}
            <div className={`flex flex-col sm:flex-row items-center gap-3 p-2 rounded-2xl border ${isDarkMode ? 'bg-dark-900 border-white/5' : 'bg-gray-100 border-gray-200'}`}>
                <div className="flex items-center gap-2 px-3">
                    <CalendarRange size={16} className="text-gold-500" />
                    <span className="text-[9px] font-black text-gray-500 uppercase tracking-widest">Range</span>
                </div>
                <input 
                    type="date" 
                    value={startDate} 
                    onChange={(e) => setStartDate(e.target.value)} 
                    className="bg-transparent border-none text-xs font-sans font-black outline-none color-scheme-dark uppercase tracking-widest text-white px-2"
                />
                <span className="text-gray-600 text-xs font-bold">TO</span>
                <input 
                    type="date" 
                    value={endDate} 
                    onChange={(e) => setEndDate(e.target.value)} 
                    className="bg-transparent border-none text-xs font-sans font-black outline-none color-scheme-dark uppercase tracking-widest text-white px-2"
                />
                <button 
                  onClick={handleResetFilters}
                  className="p-2 hover:bg-gold-500 hover:text-black rounded-xl text-gray-500 transition-all ml-1"
                  title="Reset Filter"
                >
                  <RotateCcw size={14} />
                </button>
            </div>

            <div className="relative flex-1 xl:w-64">
              <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-500" size={18}/>
              <input 
                type="text" 
                placeholder="Cari nama tamu..." 
                value={searchTerm} 
                onChange={(e) => setSearchTerm(e.target.value)} 
                className={`w-full rounded-2xl py-4 pl-14 pr-6 text-sm focus:border-gold-500 outline-none shadow-inner border ${isDarkMode ? 'bg-dark-900 border-white/5 text-white' : 'bg-gray-100 border-gray-200 text-gray-900'}`} 
              />
            </div>
        </div>
      </div>

      {/* Info Banner */}
      <div className={`p-10 rounded-[3rem] border flex flex-col md:flex-row items-center justify-between gap-8 shadow-2xl relative overflow-hidden group ${isDarkMode ? 'bg-dark-800 border-gold-500/20' : 'bg-amber-50 border-gold-200'}`}>
         <div className="flex items-center gap-8 relative z-10">
            <div className="w-20 h-20 bg-gold-500 rounded-[1.5rem] flex items-center justify-center shadow-[0_15px_40px_rgba(212,175,55,0.4)]">
               <Star size={40} className="text-black fill-black" />
            </div>
            <div>
               <p className="text-sm font-black text-gray-500 uppercase tracking-[0.3em] mb-1">Total Revenue Performance</p>
               <h3 className={`text-5xl font-sans font-black tracking-tight uppercase ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                 {formatCurrency(totalAchievement)}
               </h3>
               <p className="text-[10px] font-black text-amber-600 uppercase tracking-widest mt-2">Combined Team Effort • {startDate} ~ {endDate}</p>
            </div>
         </div>

         <div className="flex flex-col items-center justify-center gap-1 px-10 py-6 bg-black/20 backdrop-blur-xl rounded-[2rem] border border-white/5 relative z-10 min-w-[200px]">
            <p className="text-[11px] text-gray-400 font-black uppercase tracking-[0.2em]">Records in Period</p>
            <p className="text-5xl font-sans font-black text-gold-500">{salesData.length}</p>
         </div>
      </div>

      {/* Data Table */}
      <div className={`rounded-[3rem] border overflow-hidden shadow-2xl ${isDarkMode ? 'bg-dark-800 border-white/5' : 'bg-white border-gray-200'}`}>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className={`font-black text-[11px] uppercase tracking-[0.2em] border-b ${isDarkMode ? 'bg-black/40 text-gray-500 border-white/5' : 'bg-gray-50 text-gray-400 border-gray-100'}`}>
              <tr>
                <th className="px-10 py-8">NAMA TAMU</th>
                <th className="px-8 py-8 text-center">KLASIFIKASI SM</th>
                <th className="px-8 py-8 text-center">NOMOR TABLE</th>
                <th className="px-8 py-8 text-center">TOTAL PAX</th>
                <th className="px-10 py-8 text-right">TOTAL BILL</th>
              </tr>
            </thead>
            <tbody className={`divide-y ${isDarkMode ? 'divide-white/5' : 'divide-gray-100'}`}>
              {salesData.map((res) => (
                <tr key={res.id} className={`transition-all duration-300 group ${isDarkMode ? 'hover:bg-gold-500/[0.03]' : 'hover:bg-gray-50'}`}>
                  <td className="px-10 py-8">
                    <div className="flex flex-col gap-1">
                      <p className={`text-lg font-serif font-black uppercase tracking-tight group-hover:text-gold-500 transition-colors ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                        {res.guestName}
                      </p>
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1.5">
                          <Calendar size={12} className="text-gray-600" />
                          <span className="text-[10px] text-gray-600 font-sans font-bold uppercase">{res.reservationDate}</span>
                        </div>
                        {getStatusDisplay(res.status)}
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-8 text-center">
                    {res.isHarrySalesManager ? (
                        <span className="px-3 py-1.5 rounded-lg bg-gold-500/10 text-gold-500 border border-gold-500/20 text-[9px] font-sans font-black uppercase tracking-widest">HARRY SM</span>
                    ) : (
                        <span className="px-3 py-1.5 rounded-lg bg-pink-500/10 text-pink-500 border border-pink-500/20 text-[9px] font-sans font-black uppercase tracking-widest">NURUL SM</span>
                    )}
                  </td>
                  <td className="px-8 py-8 text-center">
                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-black/20 rounded-xl border border-white/5">
                       <LayoutGrid size={14} className="text-gold-500" />
                       <span className={`font-sans font-black text-base ${isDarkMode ? 'text-gold-400' : 'text-gold-600'}`}>
                         {res.tableNumber || '?'}
                       </span>
                    </div>
                  </td>
                  <td className="px-8 py-8 text-center">
                    <span className={`px-4 py-2 rounded-xl text-xs font-sans font-black border ${isDarkMode ? 'bg-white/5 border-white/5 text-gray-400' : 'bg-gray-50 border-gray-200 text-gray-600'}`}>
                      {res.guestCount} PAX
                    </span>
                  </td>
                  <td className="px-10 py-8 text-right">
                    <span className={`font-sans font-black text-xl tracking-tight ${res.totalBillAmount ? 'text-gold-500' : 'text-gray-600 italic opacity-50'}`}>
                      {res.totalBillAmount ? formatCurrency(res.totalBillAmount) : 'Rp 0'}
                    </span>
                  </td>
                </tr>
              ))}
              {salesData.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-40 text-center">
                    <div className="flex flex-col items-center gap-4 opacity-20">
                        <TrendingUp size={80} className="text-gray-600" />
                        <p className="text-gray-500 font-black uppercase tracking-[0.5em] text-xs italic">
                          No Sales Manager Guest Data Found
                        </p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Footer Branding */}
      <div className="pt-20 flex flex-col items-center">
         <div className="h-px w-32 bg-gradient-to-r from-transparent via-gold-500/30 to-transparent mb-8"></div>
         <p className="text-[11px] font-black uppercase tracking-[0.6em] text-gray-600 italic">SM MONITORING • JUSTUS GROUP</p>
         <p className="text-[8px] font-sans font-bold text-gray-700 mt-2 uppercase tracking-widest">INTEGRATED REVENUE ENGINE V8.0.0</p>
      </div>
    </div>
  );
};

export default SMRevenueView;
