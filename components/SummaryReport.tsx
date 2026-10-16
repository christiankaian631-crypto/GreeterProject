
import React, { useMemo, useState } from 'react';
import { Reservation, ReservationStatus, LocationPreference, GuestSegment, Shift } from '../types';
import { FileText, TrendingUp, Users, Wallet, PieChart, MapPin, Share2, Loader2, Download, Tag, FileSpreadsheet, Clock, BarChart3, UtensilsCrossed, Layers } from 'lucide-react';
import { generateAndSharePDF, exportVisualToPDF, exportVisualToHTML, exportVisualToImage } from '../services/pdfService';
import { exportToExcel, exportToHTML } from '../services/exportService';
import { ExportActions } from './ExportActions';
import { MENU_DATA_BANDUNG, MENU_DATA_JAKARTA, OUTLETS_JAKARTA } from './MenuList';

interface Props {
  reservations: Reservation[];
  dateRange: { start: string, end: string };
  isDarkMode?: boolean;
  outletName?: string;
}

const SummaryReport: React.FC<Props> = ({ reservations, dateRange, isDarkMode, outletName }) => {
  const [isGenerating, setIsGenerating] = useState(false);
  
  const stats = useMemo(() => {
    const validData = reservations.filter(r => 
      r.reservationDate >= dateRange.start && 
      r.reservationDate <= dateRange.end &&
      r.status !== ReservationStatus.CANCELLED
    );

    const totalTx = validData.length;
    const totalPax = validData.reduce((sum, r) => sum + r.guestCount, 0);
    const totalDP = validData.reduce((sum, r) => sum + (r.hasDownPayment ? r.downPaymentAmount : 0), 0);
    
    const walkIns = validData.filter(r => r.isWalkIn);
    const bookings = validData.filter(r => !r.isWalkIn);

    const shiftStats = {
      rsv: {
        lunch: { count: bookings.filter(r => r.shift === Shift.LUNCH).length, pax: bookings.filter(r => r.shift === Shift.LUNCH).reduce((s,r)=>s+r.guestCount, 0) },
        iftar: { count: bookings.filter(r => r.shift === Shift.IFTAR).length, pax: bookings.filter(r => r.shift === Shift.IFTAR).reduce((s,r)=>s+r.guestCount, 0) },
        dinner: { count: bookings.filter(r => r.shift === Shift.DINNER).length, pax: bookings.filter(r => r.shift === Shift.DINNER).reduce((s,r)=>s+r.guestCount, 0) }
      },
      wlk: {
        lunch: { count: walkIns.filter(r => r.shift === Shift.LUNCH).length, pax: walkIns.filter(r => r.shift === Shift.LUNCH).reduce((s,r)=>s+r.guestCount, 0) },
        iftar: { count: walkIns.filter(r => r.shift === Shift.IFTAR).length, pax: walkIns.filter(r => r.shift === Shift.IFTAR).reduce((s,r)=>s+r.guestCount, 0) },
        dinner: { count: walkIns.filter(r => r.shift === Shift.DINNER).length, pax: walkIns.filter(r => r.shift === Shift.DINNER).reduce((s,r)=>s+r.guestCount, 0) }
      }
    };

    const active = validData.filter(r => r.status === ReservationStatus.CHECKED_IN).length;

    const areas = {
      [LocationPreference.NON_SMOKING]: validData.filter(r => r.locationPreference === LocationPreference.NON_SMOKING).length,
      [LocationPreference.SMOKING]: validData.filter(r => r.locationPreference === LocationPreference.SMOKING).length,
      [LocationPreference.VIP]: validData.filter(r => r.locationPreference === LocationPreference.VIP).length,
      [LocationPreference.OUTDOOR]: validData.filter(r => r.locationPreference === LocationPreference.OUTDOOR).length,
    };

    const segmentStats: Record<string, { count: number, pax: number, dp: number }> = {};
    Object.values(GuestSegment).forEach(seg => {
        // Fix: Use casting to avoid 'unknown' index type error (line 56)
        segmentStats[seg as string] = { count: 0, pax: 0, dp: 0 };
    });

    validData.forEach(res => {
        // Fix: res.segmentation now exists on type 'Reservation' after types.ts update (line 60)
        const seg = res.segmentation || GuestSegment.FAMILY;
        if (segmentStats[seg]) {
            segmentStats[seg].count += 1;
            segmentStats[seg].pax += res.guestCount;
            segmentStats[seg].dp += (res.hasDownPayment ? res.downPaymentAmount : 0);
        }
    });

    // MENU ENGINEERING LOGIC
    const completedReservations = validData.filter(r => r.status === ReservationStatus.COMPLETED);
    const menuAggregation: Record<string, { name: string, qty: number, category: string }> = {};
    const categoryAggregation: Record<string, number> = {};

    const isJakarta = outletName && OUTLETS_JAKARTA.includes(outletName);
    const regionalMenu = isJakarta ? MENU_DATA_JAKARTA : MENU_DATA_BANDUNG;

    completedReservations.forEach(res => {
      res.orderedMenuItems?.forEach(itemStr => {
        const match = itemStr.match(/^(\d+)x\s+(.*?)(?:\s\(|(?:\s\[Note:)|$)/);
        if (match) {
          const qty = parseInt(match[1]);
          const itemName = match[2].trim();
          
          const menuRef = regionalMenu.find(m => m.name.toLowerCase() === itemName.toLowerCase());
          const category = menuRef?.category || 'OTHERS';

          if (!menuAggregation[itemName]) {
            menuAggregation[itemName] = {
              name: itemName,
              qty: 0,
              category: category
            };
          }
          menuAggregation[itemName].qty += qty;
          categoryAggregation[category] = (categoryAggregation[category] || 0) + qty;
        }
      });
    });

    const sortedMenuEngineering = Object.values(menuAggregation).sort((a, b) => b.qty - a.qty);
    const sortedCategoryPopularity = Object.entries(categoryAggregation)
      .map(([name, qty]) => ({ name, qty }))
      .sort((a, b) => b.qty - a.qty);

    const totalItemsSold = sortedMenuEngineering.reduce((sum, item) => sum + item.qty, 0);

    return { validData, totalTx, totalPax, totalDP, walkIns, bookings, active, areas, segmentStats, shiftStats, sortedMenuEngineering, sortedCategoryPopularity, totalItemsSold };
  }, [reservations, dateRange]);

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount);
  };

  const handleSharePDF = async () => {
    setIsGenerating(true);
    try {
      await generateAndSharePDF(stats.validData, dateRange, "FORECAST RESERVATION", false, 'ALL', 'ALL', undefined, outletName || "JUSTUS STEAKHOUSE");
    } catch (e) {
      console.error("Failed to share PDF", e);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownloadPDF = async () => {
    setIsGenerating(true);
    try {
      await generateAndSharePDF(stats.validData, dateRange, "FORECAST RESERVATION", true, 'ALL', 'ALL', undefined, outletName || "JUSTUS STEAKHOUSE");
    } catch (e) {
      console.error("Failed to download PDF", e);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleExportHTML = () => {
    const headers = ["Date", "Time", "Status", "Guest Name", "Pax", "Table", "Phone"];
    const data = stats.validData.map(r => [
      r.reservationDate,
      r.arrivalTime,
      r.status,
      r.guestName,
      r.guestCount,
      r.tableNumber,
      r.phoneNumber
    ]);
    exportToHTML(data, headers, `Summary_Report_${dateRange.start}_to_${dateRange.end}`, "Summary Report");
  };

  const handleExportVisualPDF = () => {
    exportVisualToPDF('summary-report-container', `Summary_Visual_${dateRange.start}`);
  };

  const handleExportVisualHTML = () => {
    exportVisualToHTML('summary-report-container', `Summary_Visual_${dateRange.start}`);
  };

  return (
    <div className="animate-fade-in space-y-6">
      <div className={`p-6 rounded-lg border flex flex-col md:flex-row justify-between items-start md:items-center gap-4 ${isDarkMode ? 'bg-dark-800 border-gold-900/50' : 'bg-white border-gray-200'}`}>
        <div>
          <h2 className={`text-2xl font-serif font-bold flex items-center gap-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            <FileText className="text-gold-500" />
            Summary Report
          </h2>
          <p className="text-gold-600 text-sm mt-1">
            Operational Report: <span className={`${isDarkMode ? 'text-white' : 'text-gray-900'} font-mono font-bold`}>{formatDate(dateRange.start)} - {formatDate(dateRange.end)}</span>
          </p>
        </div>
        <div className="flex flex-col items-end gap-3 no-print">
          <ExportActions 
            onExportPDF={handleDownloadPDF}
            onExportHTML={handleExportHTML}
            onExportImage={() => exportVisualToImage('summary-report-container', `Summary_Visual_${dateRange.start}`)}
            onShareWA={handleSharePDF}
          />
          <button onClick={() => exportToExcel(stats.validData, `Justus_Summary_${dateRange.start}`)} className="flex items-center gap-2 bg-emerald-700/10 hover:bg-emerald-700 text-emerald-500 hover:text-white px-4 py-2 rounded text-xs font-bold uppercase tracking-wider border border-emerald-500/20 transition-all"><FileSpreadsheet size={16} /> EXCEL</button>
        </div>
      </div>

      <div id="summary-report-container" className="space-y-6">

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className={`p-5 rounded border ${isDarkMode ? 'bg-dark-800 border-blue-900/30' : 'bg-white border-blue-100'}`}>
          <div className="flex justify-between items-start mb-2"><span className="text-xs font-bold text-blue-400 uppercase tracking-widest">Total Tables</span><TrendingUp size={18} className="text-blue-500" /></div>
          <p className={`text-3xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{stats.totalTx}</p>
        </div>
        <div className={`p-5 rounded border ${isDarkMode ? 'bg-dark-800 border-emerald-900/30' : 'bg-white border-emerald-100'}`}>
          <div className="flex justify-between items-start mb-2"><span className="text-xs font-bold text-emerald-400 uppercase tracking-widest">Total Pax</span><Users size={18} className="text-emerald-500" /></div>
          <p className={`text-3xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{stats.totalPax}</p>
        </div>
        <div className={`p-5 rounded border ${isDarkMode ? 'bg-dark-800 border-gold-900/30' : 'bg-white border-gold-100'}`}>
          <div className="flex justify-between items-start mb-2"><span className="text-xs font-bold text-gold-400 uppercase tracking-widest">Total Deposit</span><Wallet size={18} className="text-gold-500" /></div>
          <p className={`text-2xl font-bold truncate ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{formatCurrency(stats.totalDP)}</p>
        </div>
        <div className={`p-5 rounded border ${isDarkMode ? 'bg-dark-800 border-purple-900/30' : 'bg-white border-purple-100'}`}>
          <div className="flex justify-between items-start mb-2"><span className="text-xs font-bold text-purple-400 uppercase tracking-widest">Active Tables</span><PieChart size={18} className="text-purple-500" /></div>
          <p className={`text-3xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{stats.active}</p>
        </div>
      </div>

      {/* NEW SECTION: MENU & CATEGORY ENGINEERING SUMMARY */}
      <div className={`p-6 rounded-lg border shadow-xl ${isDarkMode ? 'bg-dark-900/40 border-gold-900/30' : 'bg-white border-gray-200'}`}>
          <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-8">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-gold-600 text-black shadow-lg">
                <BarChart3 size={20} />
              </div>
              <div>
                <h3 className={`text-lg font-serif font-black uppercase tracking-tight ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Menu Engineering Summary</h3>
                <p className="text-[10px] text-gold-600 font-bold uppercase tracking-widest">Analysis of items from Checked-Out tables</p>
              </div>
            </div>
            <div className={`px-4 py-2 rounded-full border text-xs font-black uppercase tracking-widest ${isDarkMode ? 'bg-black/40 border-gold-900/30 text-gold-500' : 'bg-gray-50 border-gray-200 text-gray-600'}`}>
              Total Items: {stats.totalItemsSold}
            </div>
          </div>

          {stats.sortedMenuEngineering.length === 0 ? (
            <div className={`py-16 text-center border border-dashed rounded-xl ${isDarkMode ? 'border-dark-700' : 'border-gray-200'}`}>
              <UtensilsCrossed size={32} className="mx-auto mb-4 text-gray-600 opacity-20" />
              <p className="text-gray-500 italic text-sm">No items processed yet. Tables must be checked out to appear here.</p>
            </div>
          ) : (
            <div className="space-y-12">
               {/* Category Popularity Sub-section */}
               <div className="space-y-4">
                  <div className="flex items-center gap-2 mb-4">
                    <Layers size={16} className="text-emerald-500" />
                    <h4 className={`text-sm font-black uppercase tracking-widest ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Category Popularity</h4>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {stats.sortedCategoryPopularity.map((cat, idx) => {
                      const maxCatQty = stats.sortedCategoryPopularity[0].qty;
                      const pct = (cat.qty / maxCatQty) * 100;
                      return (
                        <div key={idx} className={`p-4 rounded-xl border flex flex-col gap-3 transition-all ${isDarkMode ? 'bg-black/20 border-white/5 hover:border-gold-500/30' : 'bg-gray-50 border-gray-100'}`}>
                          <div className="flex justify-between items-start">
                            <span className={`text-[10px] font-black uppercase tracking-tight truncate max-w-[150px] ${isDarkMode ? 'text-gold-500/80' : 'text-gold-700'}`}>{cat.name}</span>
                            <span className={`text-xs font-mono font-black ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{cat.qty}</span>
                          </div>
                          <div className={`h-1 w-full rounded-full overflow-hidden ${isDarkMode ? 'bg-white/5' : 'bg-white'}`}>
                            <div className="h-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]" style={{ width: `${pct}%` }}></div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
               </div>

               {/* Item Ranking Table */}
               <div className="space-y-4">
                  <div className="flex items-center gap-2 mb-4">
                    <Tag size={16} className="text-gold-500" />
                    <h4 className={`text-sm font-black uppercase tracking-widest ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Item Ranking</h4>
                  </div>
                  <div className={`overflow-hidden rounded-xl border ${isDarkMode ? 'border-gold-900/20' : 'border-gray-100'}`}>
                      <table className="w-full text-left text-sm">
                        <thead className={`uppercase font-black text-[10px] tracking-[0.2em] ${isDarkMode ? 'bg-dark-950 text-gold-500' : 'bg-gray-50 text-gray-500'}`}>
                          <tr>
                            <th className="px-6 py-4">Ranking & Item Description</th>
                            <th className="px-6 py-4 text-center">Category</th>
                            <th className="px-6 py-4 text-right">Sold Qty</th>
                          </tr>
                        </thead>
                        <tbody className={`divide-y ${isDarkMode ? 'divide-gold-900/10' : 'divide-gray-100'}`}>
                          {stats.sortedMenuEngineering.map((item, index) => {
                            const topQty = stats.sortedMenuEngineering[0].qty;
                            const percentage = (item.qty / topQty) * 100;
                            
                            return (
                              <tr key={index} className={`transition-colors ${isDarkMode ? 'hover:bg-gold-500/5' : 'hover:bg-gray-50'}`}>
                                <td className="px-6 py-4">
                                  <div className="flex flex-col gap-1.5">
                                    <div className="flex items-center gap-3">
                                      <span className={`flex-shrink-0 w-6 h-6 flex items-center justify-center rounded text-[10px] font-black ${index === 0 ? 'bg-gold-500 text-black' : (isDarkMode ? 'bg-dark-800 text-gray-500' : 'bg-gray-100 text-gray-400')}`}>
                                        {index + 1}
                                      </span>
                                      <span className={`font-black uppercase tracking-tight ${isDarkMode ? 'text-gray-100' : 'text-gray-800'}`}>{item.name}</span>
                                    </div>
                                    <div className={`w-full h-1 rounded-full overflow-hidden ${isDarkMode ? 'bg-dark-800' : 'bg-gray-100'}`}>
                                      <div 
                                        className={`h-full rounded-full transition-all duration-1000 ${index === 0 ? 'bg-gold-500 shadow-[0_0_10px_rgba(212,175,55,0.4)]' : 'bg-gold-600/40'}`} 
                                        style={{ width: `${percentage}%` }}
                                      ></div>
                                    </div>
                                  </div>
                                </td>
                                <td className="px-6 py-4 text-center">
                                  <span className={`text-[9px] font-black px-2 py-1 rounded border uppercase tracking-widest ${isDarkMode ? 'bg-black/40 border-gold-900/30 text-gold-600/70' : 'bg-gray-50 border-gray-200 text-gray-400'}`}>
                                    {item.category}
                                  </span>
                                </td>
                                <td className="px-6 py-4 text-right">
                                  <span className={`font-mono text-lg font-black ${isDarkMode ? 'text-gold-400' : 'text-gold-600'}`}>
                                    {item.qty}
                                  </span>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                  </div>
               </div>
            </div>
          )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className={`p-6 rounded-lg border ${isDarkMode ? 'bg-dark-800 border-gold-900/30' : 'bg-white border-gray-200'}`}>
          <h3 className={`text-sm font-bold uppercase tracking-wider mb-6 flex items-center gap-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}><Clock size={16} className="text-gold-500" /> Detailed Shift Recap</h3>
          <div className="space-y-6">
             <div className="space-y-3">
                <p className="text-[10px] font-black text-gold-500 uppercase tracking-widest border-b border-gold-900/20 pb-1">RESERVATIONS (BOOKING)</p>
                <div className="grid grid-cols-3 gap-2">
                   <div className="p-3 bg-dark-900/50 rounded-lg border border-gold-900/10 text-center"><p className="text-[9px] text-gray-500 uppercase font-bold">Lunch</p><p className="font-bold text-lg">{stats.shiftStats.rsv.lunch.count}</p><p className="text-[9px] text-emerald-500">{stats.shiftStats.rsv.lunch.pax} Pax</p></div>
                   <div className="p-3 bg-dark-900/50 rounded-lg border border-gold-900/10 text-center"><p className="text-[9px] text-gray-500 uppercase font-bold">Iftar</p><p className="font-bold text-lg">{stats.shiftStats.rsv.iftar.count}</p><p className="text-[9px] text-emerald-500">{stats.shiftStats.rsv.iftar.pax} Pax</p></div>
                   <div className="p-3 bg-dark-900/50 rounded-lg border border-gold-900/10 text-center"><p className="text-[9px] text-gray-500 uppercase font-bold">Dinner</p><p className="font-bold text-lg">{stats.shiftStats.rsv.dinner.count}</p><p className="text-[9px] text-emerald-500">{stats.shiftStats.rsv.dinner.pax} Pax</p></div>
                </div>
             </div>
             <div className="space-y-3">
                <p className="text-[10px] font-black text-blue-500 uppercase tracking-widest border-b border-blue-900/20 pb-1">WALK-IN GUESTS</p>
                <div className="grid grid-cols-3 gap-2">
                   <div className="p-3 bg-dark-900/50 rounded-lg border border-blue-900/10 text-center"><p className="text-[9px] text-gray-500 uppercase font-bold">Lunch</p><p className="font-bold text-lg">{stats.shiftStats.wlk.lunch.count}</p><p className="text-[9px] text-blue-400">{stats.shiftStats.wlk.lunch.pax} Pax</p></div>
                   <div className="p-3 bg-dark-900/50 rounded-lg border border-blue-900/10 text-center"><p className="text-[9px] text-gray-500 uppercase font-bold">Iftar</p><p className="font-bold text-lg">{stats.shiftStats.wlk.iftar.count}</p><p className="text-[9px] text-blue-400">{stats.shiftStats.wlk.iftar.pax} Pax</p></div>
                   <div className="p-3 bg-dark-900/50 rounded-lg border border-blue-900/10 text-center"><p className="text-[9px] text-gray-500 uppercase font-bold">Dinner</p><p className="font-bold text-lg">{stats.shiftStats.wlk.dinner.count}</p><p className="text-[9px] text-blue-400">{stats.shiftStats.wlk.dinner.pax} Pax</p></div>
                </div>
             </div>
          </div>
        </div>
        <div className={`p-6 rounded-lg border ${isDarkMode ? 'bg-dark-800 border-gold-900/30' : 'bg-white border-gray-200'}`}>
          <h3 className={`text-sm font-bold uppercase tracking-wider mb-6 flex items-center gap-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}><MapPin size={16} className="text-gold-500" /> Area Distribution</h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center"><span className="text-xs font-bold text-emerald-500">Non-Smoking</span><span className="font-bold">{stats.areas[LocationPreference.NON_SMOKING]}</span></div>
            <div className="flex justify-between items-center"><span className="text-xs font-bold text-orange-500">Smoking Area</span><span className="font-bold">{stats.areas[LocationPreference.SMOKING]}</span></div>
            <div className="flex justify-between items-center"><span className="text-xs font-bold text-gold-500">VIP Room</span><span className="font-bold">{stats.areas[LocationPreference.VIP]}</span></div>
            <div className="flex justify-between items-center"><span className="text-xs font-bold text-blue-500">Outdoor</span><span className="font-bold">{stats.areas[LocationPreference.OUTDOOR]}</span></div>
          </div>
        </div>
      </div>

      <div className={`rounded-lg border overflow-hidden ${isDarkMode ? 'bg-dark-800 border-gold-900/30' : 'bg-white border-gray-200'}`}>
        <div className={`p-4 border-b ${isDarkMode ? 'border-gold-900/30 bg-dark-900/50' : 'bg-gray-50 border-gray-200'}`}>
          <h3 className={`text-sm font-bold uppercase tracking-wider flex items-center gap-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}><Tag size={16} className="text-gold-500" /> Segmentation Summary</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className={`uppercase font-bold text-xs tracking-wider ${isDarkMode ? 'bg-dark-900 text-gold-500' : 'bg-gray-100 text-gray-700'}`}>
              <tr><th className="px-4 py-3">Segment</th><th className="px-4 py-3 text-center">Tx</th><th className="px-4 py-3 text-center">Pax</th><th className="px-4 py-3 text-right">Total Deposit</th></tr>
            </thead>
            <tbody className={`divide-y ${isDarkMode ? 'divide-dark-700' : 'divide-gray-100'}`}>
              {Object.entries(stats.segmentStats).map(([segment, data]: [string, any]) => (
                  <tr key={segment}>
                    <td className={`px-4 py-3 font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{segment}</td>
                    <td className="px-4 py-3 text-center">{data.count}</td>
                    <td className="px-4 py-3 text-center">{data.pax}</td>
                    <td className="px-4 py-3 text-right text-gold-500 font-mono">{formatCurrency(data.dp)}</td>
                  </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      </div>
    </div>
  );
};

export default SummaryReport;
