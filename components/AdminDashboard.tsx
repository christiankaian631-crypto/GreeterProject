
// @ts-nocheck
import React, { useState, useMemo } from 'react';
import { 
  ShieldCheck, 
  ArrowLeft, 
  Users,
  Wallet,
  Award,
  LayoutList,
  BarChart3,
  Activity,
  ChevronRight,
  CalendarRange,
  RotateCcw,
  Clock,
  LayoutGrid,
  Flame,
  ClipboardList,
  CreditCard,
  Banknote,
  Shield,
  MapPin,
  Loader2,
  TrendingUp,
  Star,
  Hash,
  ArrowUpRight,
  Sun,
  Zap,
  Moon,
  Check,
  X,
  Share2,
  FileDown,
  FileSpreadsheet,
  BarChart,
  Layers,
  UserPlus,
  User
} from 'lucide-react';
import { Reservation, ReservationStatus, Shift, WaitingListEntry, WaitingStatus, ALL_OUTLETS } from '../types';
import { generateOperationalTodayPDF, generateOperationalTodayExcel, exportVisualToPDF, exportVisualToHTML, exportVisualToImage, exportToHTML } from '../services/pdfService';
import { ExportActions } from './ExportActions';
import EODReport from './EODReport';

// --- NEW COMPONENT: 3D ISOMETRIC BAR CHART ---
const IsometricBarChart = ({ data }: { data: { h: string, v: number }[] }) => {
  const maxValue = Math.max(...data.map(d => d.v), 1);
  
  return (
    <div className="relative w-full h-[400px] flex items-end justify-between px-10 pt-20 pb-10 overflow-visible" style={{ perspective: '1200px' }}>
      {/* Chart Floor / Grid */}
      <div className="absolute inset-x-0 bottom-0 h-full border-b border-white/5 origin-bottom" 
           style={{ transform: 'rotateX(60deg)', background: 'radial-gradient(circle at center, rgba(212,175,55,0.05) 0%, transparent 70%)' }}>
      </div>

      {data.map((point, i) => {
        const heightPercentage = (point.v / maxValue) * 100;
        const barHeight = Math.max((heightPercentage * 2.5), 4); // Scale for visual impact
        const isActive = point.v > 0;
        const isPeak = point.v === maxValue && point.v > 0;

        return (
          <div key={i} className="relative flex flex-col items-center group" style={{ width: `${100 / data.length}%` }}>
            {/* The 3D Container */}
            <div className="relative transition-all duration-700 ease-out preserve-3d" 
                 style={{ 
                   height: `${barHeight}px`, 
                   width: '30px', 
                   transform: 'rotateX(-20deg) rotateY(45deg)',
                   transformStyle: 'preserve-3d'
                 }}>
              
              {/* Front Face */}
              <div className={`absolute inset-0 border border-white/10 transition-colors duration-500 ${isPeak ? 'bg-gold-500' : isActive ? 'bg-gold-600/60' : 'bg-white/5'}`} 
                   style={{ transform: 'translateZ(15px)' }}></div>
              
              {/* Back Face */}
              <div className="absolute inset-0 bg-black/40 border border-white/5" 
                   style={{ transform: 'translateZ(-15px)' }}></div>
              
              {/* Left Face */}
              <div className={`absolute inset-y-0 left-0 w-[30px] border border-white/10 transition-colors duration-500 ${isPeak ? 'bg-gold-700' : isActive ? 'bg-gold-800/40' : 'bg-white/5'}`} 
                   style={{ transform: 'rotateY(-90deg) translateZ(15px)' }}></div>
              
              {/* Right Face */}
              <div className={`absolute inset-y-0 right-0 w-[30px] border border-white/10 transition-colors duration-500 ${isPeak ? 'bg-gold-400' : isActive ? 'bg-gold-500/30' : 'bg-white/5'}`} 
                   style={{ transform: 'rotateY(90deg) translateZ(15px)' }}></div>
              
              {/* Top Face */}
              <div className={`absolute inset-x-0 top-0 h-[30px] border border-white/10 transition-colors duration-500 ${isPeak ? 'bg-white shadow-[0_0_20px_#fff]' : isActive ? 'bg-gold-400' : 'bg-white/10'}`} 
                   style={{ transform: 'rotateX(90deg) translateZ(15px)' }}></div>

              {/* Peak Indicator Sparkle */}
              {isPeak && (
                <div className="absolute -top-12 left-1/2 -translate-x-1/2 animate-bounce">
                  <div className="bg-gold-500 text-black text-[8px] font-black px-2 py-0.5 rounded-full shadow-lg">PEAK</div>
                </div>
              )}
            </div>

            {/* Label & Value */}
            <div className="mt-8 text-center">
              <p className={`text-[14px] font-sans font-black ${isPeak ? 'text-gold-500' : isActive ? 'text-white' : 'text-gray-700'}`}>{point.v}</p>
              <p className="text-[9px] font-black text-gray-500 uppercase tracking-tighter mt-1">{point.h}:00</p>
            </div>

            {/* Tooltip on Hover */}
            <div className="absolute -top-20 opacity-0 group-hover:opacity-100 transition-opacity z-50 pointer-events-none">
              <div className="bg-white text-black px-3 py-1.5 rounded-xl text-[10px] font-black shadow-2xl whitespace-nowrap">
                {point.v} Guests @ {point.h}:00
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

// --- NEW COMPONENT: DUAL 3D ISOMETRIC BAR CHART ---
const DualIsometricBarChart = ({ data }: { data: { h: string, rsv: number, wlk: number }[] }) => {
  const maxValue = Math.max(...data.map(d => Math.max(d.rsv, d.wlk)), 1);
  
  return (
    <div className="relative w-full h-[450px] flex items-end justify-between px-10 pt-24 pb-12 overflow-visible" style={{ perspective: '1200px' }}>
      {/* Chart Floor / Grid */}
      <div className="absolute inset-x-0 bottom-0 h-full border-b border-white/5 origin-bottom" 
           style={{ transform: 'rotateX(60deg)', background: 'radial-gradient(circle at center, rgba(212,175,55,0.05) 0%, transparent 70%)' }}>
      </div>

      {data.map((point, i) => {
        const rsvHeight = (point.rsv / maxValue) * 250;
        const wlkHeight = (point.wlk / maxValue) * 250;
        
        return (
          <div key={i} className="relative flex flex-col items-center group" style={{ width: `${100 / data.length}%` }}>
            <div className="flex gap-1 items-end h-[300px] preserve-3d">
              {/* Reservation Bar (Gold) */}
              <div className="relative transition-all duration-700 ease-out preserve-3d" 
                   style={{ 
                     height: `${Math.max(rsvHeight, 4)}px`, 
                     width: '14px', 
                     transform: 'rotateX(-20deg) rotateY(45deg)',
                     transformStyle: 'preserve-3d'
                   }}>
                <div className={`absolute inset-0 border border-white/10 ${point.rsv > 0 ? 'bg-gold-500' : 'bg-white/5'}`} style={{ transform: 'translateZ(7px)' }}></div>
                <div className="absolute inset-0 bg-black/40 border border-white/5" style={{ transform: 'translateZ(-7px)' }}></div>
                <div className={`absolute inset-y-0 left-0 w-[14px] border border-white/10 ${point.rsv > 0 ? 'bg-gold-700' : 'bg-white/5'}`} style={{ transform: 'rotateY(-90deg) translateZ(7px)' }}></div>
                <div className={`absolute inset-y-0 right-0 w-[14px] border border-white/10 ${point.rsv > 0 ? 'bg-gold-400' : 'bg-white/5'}`} style={{ transform: 'rotateY(90deg) translateZ(7px)' }}></div>
                <div className={`absolute inset-x-0 top-0 h-[14px] border border-white/10 ${point.rsv > 0 ? 'bg-white shadow-[0_0_15px_#fff]' : 'bg-white/10'}`} style={{ transform: 'rotateX(90deg) translateZ(7px)' }}></div>
              </div>

              {/* Walk-in Bar (Blue) */}
              <div className="relative transition-all duration-700 ease-out preserve-3d" 
                   style={{ 
                     height: `${Math.max(wlkHeight, 4)}px`, 
                     width: '14px', 
                     transform: 'rotateX(-20deg) rotateY(45deg)',
                     transformStyle: 'preserve-3d'
                   }}>
                <div className={`absolute inset-0 border border-white/10 ${point.wlk > 0 ? 'bg-blue-500' : 'bg-white/5'}`} style={{ transform: 'translateZ(7px)' }}></div>
                <div className="absolute inset-0 bg-black/40 border border-white/5" style={{ transform: 'translateZ(-7px)' }}></div>
                <div className={`absolute inset-y-0 left-0 w-[14px] border border-white/10 ${point.wlk > 0 ? 'bg-blue-700' : 'bg-white/5'}`} style={{ transform: 'rotateY(-90deg) translateZ(7px)' }}></div>
                <div className={`absolute inset-y-0 right-0 w-[14px] border border-white/10 ${point.wlk > 0 ? 'bg-blue-400' : 'bg-white/5'}`} style={{ transform: 'rotateY(90deg) translateZ(7px)' }}></div>
                <div className={`absolute inset-x-0 top-0 h-[14px] border border-white/10 ${point.wlk > 0 ? 'bg-white shadow-[0_0_15px_#3b82f6]' : 'bg-white/10'}`} style={{ transform: 'rotateX(90deg) translateZ(7px)' }}></div>
              </div>
            </div>

            {/* Label */}
            <div className="mt-8 text-center">
              <p className="text-[9px] font-black text-gray-500 uppercase tracking-tighter mt-1">{point.h}:00</p>
            </div>

            {/* Tooltip */}
            <div className="absolute -top-24 opacity-0 group-hover:opacity-100 transition-opacity z-50 pointer-events-none">
              <div className="bg-white text-black px-4 py-2 rounded-xl text-[10px] font-black shadow-2xl whitespace-nowrap flex flex-col gap-1">
                <div className="flex items-center gap-2"><div className="w-2 h-2 bg-gold-500 rounded-full"></div> RSV: {point.rsv} Meja</div>
                <div className="flex items-center gap-2"><div className="w-2 h-2 bg-blue-500 rounded-full"></div> WLK: {point.wlk} Meja</div>
                <div className="border-t border-gray-200 mt-1 pt-1 text-gray-400">Time: {point.h}:00 WIB</div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

interface Props {
  onBackToApp?: () => void; 
  onUpdateTotalBill?: (id: string, amount: number) => void; 
  reservations: Reservation[];
  waitingList?: WaitingListEntry[]; 
  currentUsername: string;
  currentOutlet?: string;
  isDarkMode?: boolean;
  users?: any[];
  onMutateCrew?: (name: string, newOutlet: string) => void;
  onEODClose?: (date: string) => void;
}

type AdminView = 'GRID' | 'SUMMARY' | 'SALES' | 'TRAFFIC' | 'MENU' | 'WAITING' | 'TRANSACTIONS' | 'USERS' | 'EOD' | 'TURNOVER';

const AdminDashboard: React.FC<Props> = ({ reservations, waitingList = [], currentUsername, currentOutlet, onBackToApp, isDarkMode = true, users = [], onMutateCrew, onEODClose }) => {
  const [activeView, setActiveView] = useState<AdminView>('GRID');
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [mutationConfirm, setMutationConfirm] = useState<{ name: string, outlet: string } | null>(null);
  const today = new Date().toISOString().split('T')[0];
  const [startDate, setStartDate] = useState(today);
  const [endDate, setEndDate] = useState(today);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount || 0);
  };

  const validReservations = useMemo(() => {
    return reservations.filter(r => 
      r.reservationDate >= startDate &&
      r.reservationDate <= endDate
    );
  }, [reservations, startDate, endDate]);

  const activeReservations = useMemo(() => validReservations.filter(r => r.status !== ReservationStatus.CANCELLED), [validReservations]);

  const salesStats = useMemo(() => {
    const totalRev = activeReservations.reduce((sum, r) => sum + (r.totalBillAmount || 0), 0);
    const dayMap: Record<string, number> = {};
    activeReservations.forEach(r => {
      dayMap[r.reservationDate] = (dayMap[r.reservationDate] || 0) + (r.totalBillAmount || 0);
    });
    const trend = Object.entries(dayMap).sort((a,b) => b[0].localeCompare(a[0])).map(([date, val]) => ({
        date, val
    }));
    return { totalRev, totalGroups: activeReservations.length, trend };
  }, [activeReservations]);

  const isLunchTime = (time?: string) => time && time >= "10:00" && time <= "16:59";
  const isDinnerTime = (time?: string) => time && (time >= "17:00" || (time >= "00:00" && time < "10:00"));

  const trafficStats = useMemo(() => {
    return {
      [Shift.LUNCH]: activeReservations.filter(r => isLunchTime(r.arrivalTime)).reduce((s,r)=>s+r.guestCount, 0),
      [Shift.IFTAR]: activeReservations.filter(r => r.shift === Shift.IFTAR).reduce((s,r)=>s+r.guestCount, 0),
      [Shift.DINNER]: activeReservations.filter(r => isDinnerTime(r.arrivalTime)).reduce((s,r)=>s+r.guestCount, 0)
    };
  }, [activeReservations]);

  const menuStats = useMemo(() => {
    const itemMap: Record<string, number> = {};
    activeReservations.forEach(res => {
      res.orderedMenuItems?.forEach(itemStr => {
        const match = itemStr.match(/^(\d+)x\s+(.*?)(?:\s\(|(?:\s\[Note:)|$)/);
        if (match) {
          const qty = parseInt(match[1]);
          const itemName = match[2].trim();
          itemMap[itemName] = (itemMap[itemName] || 0) + qty;
        }
      });
    });
    return Object.entries(itemMap).sort((a,b) => b[1] - a[1]).slice(0, 15).map(([name, qty]) => ({ name, qty }));
  }, [activeReservations]);

  const getEffectiveCheckIn = (r: Reservation) => {
    if (r.checkedInAt) return r.checkedInAt;
    if (r.arrivalTime && r.reservationDate) {
      try {
        const [h, m] = r.arrivalTime.split(':').map(Number);
        const d = new Date(r.reservationDate);
        d.setHours(h, m, 0, 0);
        return d.getTime();
      } catch (e) {
        return r.createdAt;
      }
    }
    return r.createdAt;
  };

  const trafficLoadDetails = useMemo(() => {
    return activeReservations
      .filter(r => r.status === ReservationStatus.CHECKED_IN || r.status === ReservationStatus.COMPLETED)
      .map(r => {
        let waitingTime = 0;
        if (r.isWalkIn && r.waitingListRefId) {
          const waitEntry = (waitingList || []).find(w => w.id === r.waitingListRefId);
          if (waitEntry && waitEntry.seatedAt) {
            waitingTime = Math.round((waitEntry.seatedAt - waitEntry.joinedAt) / 60000);
          }
        }

        // --- DURATION CALCULATION LOGIC ---
        let durationMinutes = 0;
        const effectiveCheckIn = getEffectiveCheckIn(r);

        if (effectiveCheckIn) {
          const endTime = r.completedAt || Date.now();
          durationMinutes = Math.max(0, Math.round((endTime - effectiveCheckIn) / 60000));
        }

        const formatTime = (ts?: number) => ts ? new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }) : '-';

        return {
          id: r.id,
          name: r.guestName,
          checkInTime: r.checkedInAt ? formatTime(r.checkedInAt) : r.arrivalTime,
          checkOutTime: r.completedAt ? formatTime(r.completedAt) : (r.status === ReservationStatus.CHECKED_IN ? 'Dining...' : '-'),
          cover: r.guestCount,
          table: r.tableNumber || r.mergedTables?.join(', ') || '-',
          isWalkIn: r.isWalkIn,
          waitingTime: waitingTime > 0 ? `${waitingTime} min` : (r.isWalkIn ? '0 min' : '-'),
          duration: `${durationMinutes} min`,
          remark: r.isWalkIn && r.waitingListRefId ? 'From Waiting List' : '-'
        };
      })
      .sort((a, b) => a.checkInTime.localeCompare(b.checkInTime));
  }, [activeReservations, waitingList]);

  const trafficSummary = useMemo(() => {
    const getStats = (type: 'lunch' | 'dinner') => {
      const filtered = activeReservations.filter(r => 
        (r.status === ReservationStatus.CHECKED_IN || r.status === ReservationStatus.COMPLETED) &&
        (type === 'lunch' ? isLunchTime(r.arrivalTime) : isDinnerTime(r.arrivalTime))
      );
      const tables = filtered.length;
      const covers = filtered.reduce((s, r) => s + r.guestCount, 0);
      
      const completed = filtered.filter(r => r.completedAt);
      const totalDur = completed.reduce((s, r) => {
        const checkIn = getEffectiveCheckIn(r);
        return s + Math.round((r.completedAt! - checkIn) / 60000);
      }, 0);
      const avgDur = completed.length > 0 ? Math.round(totalDur / completed.length) : 0;
      
      // Efficiency Indicator: Turnover Rate (Covers per Table)
      const turnoverRate = tables > 0 ? (covers / tables).toFixed(1) : "0.0";
      
      return { tables, covers, avgDur, totalDur, turnoverRate };
    };

    return {
      lunch: getStats('lunch'),
      dinner: getStats('dinner')
    };
  }, [activeReservations]);

  const tableUtilization = useMemo(() => {
    const stats: Record<string, { totalMinutes: number, visits: number, covers: number }> = {};
    
    activeReservations
      .filter(r => (r.status === ReservationStatus.CHECKED_IN || r.status === ReservationStatus.COMPLETED))
      .forEach(r => {
        const checkIn = getEffectiveCheckIn(r);
        if (!checkIn) return;
        
        const tables = r.tableNumber ? [r.tableNumber] : (r.mergedTables || []);
        const endTime = r.completedAt || Date.now();
        const duration = Math.max(0, Math.round((endTime - checkIn) / 60000));
        
        tables.forEach(t => {
          if (!stats[t]) stats[t] = { totalMinutes: 0, visits: 0, covers: 0 };
          stats[t].totalMinutes += duration;
          stats[t].visits += 1;
          stats[t].covers += r.guestCount;
        });
      });
      
    return Object.entries(stats)
      .map(([table, data]) => ({ table, ...data }))
      .sort((a, b) => b.totalMinutes - a.totalMinutes);
  }, [activeReservations]);

  const paymentStats = useMemo(() => {
    const cash = activeReservations.filter(r => r.paymentMethod === 'Cash').reduce((sum, r) => sum + (r.totalBillAmount || 0), 0);
    const card = activeReservations.filter(r => r.paymentMethod === 'Card').reduce((sum, r) => sum + (r.totalBillAmount || 0), 0);
    const dp = activeReservations.filter(r => r.hasDownPayment && !r.isFullPayment).reduce((sum, r) => sum + (r.downPaymentAmount || 0), 0);
    const full = activeReservations.filter(r => r.isFullPayment).reduce((sum, r) => sum + (r.downPaymentAmount || 0), 0);
    
    return [
      { name: 'CASH REVENUE', val: cash, color: 'text-emerald-500', icon: Banknote },
      { name: 'CARD REVENUE', val: card, color: 'text-blue-500', icon: CreditCard },
      { name: 'TOTAL DEPOSIT (DP)', val: dp, color: 'text-amber-500', icon: Wallet },
      { name: 'TOTAL SETTLED (LUNAS)', val: full, color: 'text-indigo-500', icon: ShieldCheck }
    ];
  }, [activeReservations]);

  const waitingStats = useMemo(() => {
    const filteredWaiting = waitingList.filter(w => w.reservationDate >= startDate && w.reservationDate <= endDate);
    const total = filteredWaiting.length;
    const seated = filteredWaiting.filter(w => w.status === WaitingStatus.SEATED).length;
    const cancelled = filteredWaiting.filter(w => w.status === WaitingStatus.CANCELLED).length;
    const rate = total > 0 ? (seated / total) * 100 : 0;
    
    const hours: Record<number, number> = {};
    for (let h = 10; h <= 22; h++) hours[h] = 0;
    filteredWaiting.forEach(w => {
        const hour = new Date(w.joinedAt).getHours();
        if (hour >= 10 && hour <= 22) hours[hour]++;
    });
    const hourlyData = Object.entries(hours).map(([h, v]) => ({ h, v }));
    
    const totalGroup = total;
    const totalCover = filteredWaiting.reduce((sum, w) => sum + w.guestCount, 0);

    return { total, seated, cancelled, rate, hourlyData, raw: filteredWaiting, totalGroup, totalCover };
  }, [waitingList, startDate, endDate]);

  const turnOverStats = useMemo(() => {
    const getShiftStats = (type?: 'lunch' | 'dinner') => {
      const filtered = activeReservations.filter(r => {
        if (!type) return true;
        return type === 'lunch' ? isLunchTime(r.arrivalTime) : isDinnerTime(r.arrivalTime);
      });
      const totalPax = filtered.reduce((s, r) => s + r.guestCount, 0);
      const totalGroups = filtered.length;
      const totalRsv = filtered.filter(r => !r.isWalkIn).reduce((s, r) => s + r.guestCount, 0);
      const totalWlk = filtered.filter(r => r.isWalkIn).reduce((s, r) => s + r.guestCount, 0);
      return { totalPax, totalGroups, totalRsv, totalWlk };
    };

    const hoursRsv: Record<number, number> = {};
    const hoursWlk: Record<number, number> = {};
    for (let h = 10; h <= 22; h++) {
      hoursRsv[h] = 0;
      hoursWlk[h] = 0;
    }
    
    activeReservations.forEach(r => {
      if (r.arrivalTime) {
        const [hourStr] = r.arrivalTime.split(':');
        const hour = parseInt(hourStr);
        if (hour >= 10 && hour <= 22) {
          if (r.isWalkIn) {
            hoursWlk[hour] += 1;
          } else {
            hoursRsv[hour] += 1;
          }
        }
      }
    });
    
    const hourlyData = Object.keys(hoursRsv).sort((a, b) => parseInt(a) - parseInt(b)).map(h => ({
      h,
      rsv: hoursRsv[parseInt(h)],
      wlk: hoursWlk[parseInt(h)]
    }));
    
    return { 
      hourlyData, 
      lunch: getShiftStats('lunch'),
      dinner: getShiftStats('dinner'),
      total: getShiftStats()
    };
  }, [activeReservations]);

  const handleShareSummaryPdf = async () => {
    setIsGeneratingPdf(true);
    try {
        await generateOperationalTodayPDF(validReservations, waitingStats.raw, startDate, currentOutlet || 'JUSTUS STEAKHOUSE');
    } finally {
        setIsGeneratingPdf(false);
    }
  };

  const handleShareSummaryWhatsApp = () => {
    const periodStr = startDate === endDate ? startDate : `${startDate} s/d ${endDate}`;
    let text = `*LAPORAN OPERASIONAL - ${currentOutlet || 'JUSTUS STEAKHOUSE'}*\n`;
    text += `*Periode:* ${periodStr}\n`;
    text += `--------------------------------\n\n`;

    const reservationsToday = validReservations.filter(r => !r.isWalkIn);
    text += `*1. DATA RESERVASI*\n`;
    if (reservationsToday.length === 0) text += `- Tidak ada data reservasi\n`;
    else {
        reservationsToday.sort((a,b) => a.arrivalTime.localeCompare(b.arrivalTime)).forEach((r, i) => {
            const statusIcon = r.status === ReservationStatus.CANCELLED ? '❌' : (r.status === ReservationStatus.CHECKED_IN ? '🔵' : (r.status === ReservationStatus.COMPLETED ? '⚪' : '✅'));
            text += `${i+1}. ${statusIcon} ${r.guestName} (${r.arrivalTime})\n   - Pax: ${r.guestCount} | Status: ${r.status}\n`;
        });
    }
    text += `\n`;

    const walkInsToday = validReservations.filter(r => r.isWalkIn);
    text += `*2. DATA WALK-IN*\n`;
    if (walkInsToday.length === 0) text += `- Tidak ada data walk-in\n`;
    else {
        walkInsToday.forEach((r, i) => {
            text += `${i+1}. 👣 ${r.guestName}\n   - Pax: ${r.guestCount} | Meja: ${r.tableNumber || '-'}\n`;
        });
    }
    text += `\n`;

    text += `*3. WAITING LIST*\n`;
    if (waitingStats.raw.length === 0) text += `- Tidak ada data antrean\n`;
    else {
        waitingStats.raw.sort((a,b) => a.joinedAt - b.joinedAt).forEach((w, i) => {
            const joinTime = new Date(w.joinedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
            text += `${i+1}. ${w.status === WaitingStatus.SEATED ? '🪑' : '⏳'} ${w.guestName} (${joinTime})\n   - Pax: ${w.guestCount} | Status: ${w.status}\n`;
        });
    }

    text += `\n--------------------------------\n*RINGKASAN:* Total Pax: ${activeReservations.reduce((s,r)=>s+r.guestCount, 0)} | Revenue: ${formatCurrency(salesStats.totalRev)}`;
    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`, '_blank');
  };

  const activeTablesCount = useMemo(() => {
    const todayStr = new Date().toISOString().split('T')[0];
    return reservations.filter(r => 
      r.reservationDate === todayStr && 
      r.status === ReservationStatus.CHECKED_IN
    ).length;
  }, [reservations]);

  const [showActiveTablesNotif, setShowActiveTablesNotif] = useState(false);

  const Header = ({ title, subtitle, showShare = false }: { title: string, subtitle: string, showShare?: boolean }) => (
    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12 animate-fade-in">
      <div className="flex items-center gap-6">
        <button onClick={() => setActiveView('GRID')} className="p-4 rounded-[2rem] bg-white/5 border border-white/10 hover:bg-gold-500 hover:text-black transition-all group shadow-2xl">
          <ArrowLeft size={24} className="group-hover:-translate-x-1 transition-transform" />
        </button>
        <div>
          <h2 className="text-6xl font-serif font-black uppercase text-white tracking-tighter leading-none">{title}</h2>
          <div className="flex items-center gap-4 mt-4">
            <p className="text-[10px] font-black uppercase tracking-[0.5em] text-gold-500">{subtitle}</p>
            <button 
              onClick={() => setShowActiveTablesNotif(true)}
              className="flex items-center gap-2 px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-full text-emerald-500 hover:bg-emerald-500 hover:text-black transition-all group"
            >
              <Activity size={12} className="animate-pulse" />
              <span className="text-[9px] font-black uppercase tracking-widest">Live: {activeTablesCount} Tables</span>
            </button>
          </div>
        </div>
      </div>
      <div className="flex flex-col sm:flex-row items-center gap-4">
          {showShare && (
            <div className="flex gap-2">
                <button onClick={handleShareSummaryPdf} disabled={isGeneratingPdf} className="flex items-center gap-3 bg-red-700 hover:bg-red-600 text-white px-6 py-4 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all shadow-xl active:scale-95 disabled:opacity-50">
                    {isGeneratingPdf ? <Loader2 size={18} className="animate-spin" /> : <FileDown size={18} />} PDF Summary
                </button>
                <button 
                    onClick={() => generateOperationalTodayExcel(validReservations, waitingStats.raw, startDate, currentOutlet || 'JUSTUS STEAKHOUSE')} 
                    className="flex items-center gap-3 bg-emerald-700 hover:bg-emerald-600 text-white px-6 py-4 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all shadow-xl active:scale-95"
                >
                    <FileSpreadsheet size={18} /> Excel Summary
                </button>
                <button onClick={handleShareSummaryWhatsApp} className="flex items-center gap-3 bg-emerald-600 hover:bg-emerald-500 text-white px-6 py-4 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all shadow-xl active:scale-95">
                    <Share2 size={18} /> WA Share
                </button>
            </div>
          )}
          <div className={`flex flex-col sm:flex-row items-center gap-3 p-3 rounded-[2rem] border ${isDarkMode ? 'bg-dark-800 border-white/5 shadow-inner' : 'bg-gray-100 border-gray-200 shadow-sm'}`}>
              <div className="flex items-center gap-2 px-4"><CalendarRange size={16} className="text-gold-500" /><span className="text-[9px] font-black text-gray-500 uppercase tracking-widest">Global Period</span></div>
              <div className="flex items-center gap-2 bg-black/20 p-2 rounded-2xl border border-white/5">
                  <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="bg-transparent border-none text-xs font-sans font-black outline-none color-scheme-dark uppercase text-white px-2" />
                  <span className="text-gray-600 text-[10px] font-black tracking-tighter">~</span>
                  <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="bg-transparent border-none text-xs font-sans font-black outline-none color-scheme-dark uppercase text-white px-2" />
              </div>
              <button onClick={() => {setStartDate(today); setEndDate(today);}} className="p-2.5 hover:bg-gold-500 hover:text-black rounded-xl text-gray-500 transition-all border border-white/5"><RotateCcw size={14} /></button>
          </div>
      </div>
    </div>
  );

  if (activeView === 'GRID') {
    const featureItems = [
      { id: 'SUMMARY', icon: Activity, title: 'Op Summary', desc: 'Analisis volume tamu per segmen dan utilisasi meja.', color: 'text-emerald-500', tag: 'Core Metrics' },
      { id: 'SALES', icon: Award, title: 'Revenue Stream', desc: 'Timeline pencapaian finansial dan target harian.', color: 'text-gold-500', tag: 'Financial Logs' },
      { id: 'TRANSACTIONS', icon: CreditCard, title: 'Payment Audit', desc: 'Integritas aliran dana dan audit metode pembayaran.', color: 'text-blue-500', tag: 'Audit Hub' },
      { id: 'WAITING', icon: Clock, title: 'Wait Analysis', desc: 'Efisiensi konversi antrean dan kecepatan pelayanan.', color: 'text-amber-500', tag: 'Service Flow' },
      { id: 'TURNOVER', icon: RotateCcw, title: 'Turn Over Cust', desc: 'Analisis perputaran tamu dan kepadatan jam operasional.', color: 'text-emerald-400', tag: 'Table Cycle' },
      { id: 'TRAFFIC', icon: LayoutList, title: 'Traffic Loads', desc: 'Pemetaan beban kerja operasional per jam sibuk.', color: 'text-indigo-400', tag: 'Inflow Balance' },
      { id: 'MENU', icon: BarChart3, title: 'Menu Ranking', desc: 'Identifikasi item terlaris untuk strategi profitabilitas.', color: 'text-rose-500', tag: 'Product Velocity' },
      { id: 'USERS', icon: Shield, title: 'Authorized Staff', desc: 'Manajemen akses personil dan database identitas.', color: 'text-emerald-400', tag: 'Secure Credentials' }
    ];

    return (
      <div className="animate-fade-in space-y-16 pb-20">
        {/* Active Tables Notification Modal */}
        {showActiveTablesNotif && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/90 backdrop-blur-md p-4">
            <div className="glass-card p-10 rounded-[3rem] w-full max-w-md border-emerald-500/30 shadow-[0_0_50px_rgba(16,185,129,0.2)] text-center animate-scale-in">
              <div className="w-20 h-20 bg-emerald-500 rounded-[2rem] flex items-center justify-center mx-auto mb-8 shadow-lg shadow-emerald-500/20">
                <Activity size={40} className="text-black animate-pulse" />
              </div>
              <h3 className="text-4xl font-serif font-black text-white uppercase tracking-tighter mb-2">Active Tables</h3>
              <p className="text-emerald-500 text-[10px] font-black uppercase tracking-[0.4em] mb-8">Real-time Operational Status</p>
              
              <div className="p-8 bg-black/40 rounded-[2.5rem] border border-white/5 mb-10">
                <p className="text-7xl font-sans font-black text-white">{activeTablesCount}</p>
                <p className="text-[10px] text-gray-500 font-bold uppercase mt-4 tracking-widest">TABLES CURRENTLY OCCUPIED</p>
              </div>

              <button 
                onClick={() => setShowActiveTablesNotif(false)}
                className="w-full py-5 bg-emerald-600 hover:bg-emerald-500 text-white font-black uppercase text-[11px] rounded-2xl transition-all shadow-xl active:scale-95 tracking-widest"
              >
                Close Notification
              </button>
            </div>
          </div>
        )}

        <div className="glass-card p-12 rounded-[5rem] border-white/5 relative overflow-hidden group shadow-2xl">
          <div className="absolute -top-32 -right-32 p-16 opacity-[0.03] group-hover:scale-125 transition-transform duration-[3000ms] rotate-12"><ShieldCheck size={560} /></div>
          <div className="relative z-10 flex flex-col md:flex-row justify-between items-end gap-10">
            <div>
              <div className="flex flex-wrap items-center gap-4 mb-6">
                <div className="px-6 py-2 bg-gold-500 text-black text-[10px] font-black uppercase tracking-[0.5em] rounded-full shadow-lg">DATA ANALYTICS CONSOLE</div>
                <div className="px-6 py-2 bg-white/5 border border-white/10 text-white text-[10px] font-black uppercase tracking-[0.5em] rounded-full">{currentOutlet || 'GLOBAL'}</div>
              </div>
              <h2 className="text-8xl font-serif font-black uppercase tracking-tighter text-white mb-8 leading-none">Operational <span className="text-gold-500">Intel</span></h2>
              <p className="text-base font-black uppercase tracking-[0.4em] text-gray-500 max-w-3xl leading-relaxed">Pusat kendali data operasional terpadu. Monitor performa bisnis dengan presisi angka tanpa visualisasi grafis yang kompleks.</p>
            </div>
            {onBackToApp && (
                <button onClick={onBackToApp} className="px-12 py-8 bg-white text-black rounded-[2.5rem] font-black uppercase text-sm flex items-center gap-5 shadow-[0_20px_60px_rgba(255,255,255,0.15)] hover:scale-105 active:scale-95 transition-all z-20 group">
                    <ArrowLeft size={24} strokeWidth={3} className="group-hover:-translate-x-1 transition-transform" /> 
                    Exit Admin
                </button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-10">
          {featureItems.map((feat, i) => (
            <div key={i} onClick={() => setActiveView(feat.id as any)} className="glass-card p-10 rounded-[4rem] border-white/5 hover:border-gold-500/40 transition-all cursor-pointer group shadow-2xl hover:-translate-y-4 duration-500 flex flex-col relative overflow-hidden h-[380px]">
              <div className="flex justify-between items-start mb-12">
                  <div className={`w-20 h-20 rounded-[2rem] bg-white/5 ${feat.color} flex items-center justify-center shadow-2xl group-hover:scale-110 transition-transform duration-500`}><feat.icon size={40} strokeWidth={2} /></div>
                  <div className="text-[10px] font-black text-gray-700 bg-white/5 px-4 py-2 rounded-full border border-white/5">{i+1}</div>
              </div>
              <h3 className="text-3xl font-serif font-black uppercase tracking-tight text-white mb-4 group-hover:text-gold-500 transition-colors">{feat.title}</h3>
              <p className="text-xs text-gray-500 leading-relaxed font-bold mb-12 flex-1 opacity-70 group-hover:opacity-100 transition-opacity">{feat.desc}</p>
              <div className="flex items-center justify-between text-[12px] font-black uppercase tracking-[0.3em] text-gray-600 border-t border-white/5 pt-10">
                <span className={feat.color}>{feat.tag}</span>
                <div className="flex items-center gap-2 text-white opacity-0 group-hover:opacity-100 transition-all translate-x-4 group-hover:translate-x-0">OPEN DATA <ChevronRight size={18} /></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (activeView === 'SUMMARY') {
      const paxRsv = activeReservations.filter(r => !r.isWalkIn).reduce((s,r)=>s+r.guestCount, 0);
      const paxWlk = activeReservations.filter(r => r.isWalkIn).reduce((s,r)=>s+r.guestCount, 0);
      return (
        <div className="space-y-12 animate-fade-in">
            <Header title="Op Summary" subtitle="Core Numerical Indicators" showShare={true} />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                <div className="bg-dark-800 p-10 rounded-[3rem] border border-white/5 shadow-xl text-center group hover:border-gold-500/30 transition-all">
                    <p className="text-[10px] font-black text-gray-500 uppercase tracking-[0.3em] mb-4">Advance Booking</p>
                    <p className="text-6xl font-sans font-black text-white">{paxRsv}</p>
                    <p className="text-[10px] text-gold-600 font-bold uppercase mt-4 tracking-widest">GUESTS</p>
                </div>
                <div className="bg-dark-800 p-10 rounded-[3rem] border border-white/5 shadow-xl text-center group hover:border-blue-500/30 transition-all">
                    <p className="text-[10px] font-black text-gray-500 uppercase tracking-[0.3em] mb-4">Direct Walk-In</p>
                    <p className="text-6xl font-sans font-black text-white">{paxWlk}</p>
                    <p className="text-[10px] text-blue-500 font-bold uppercase mt-4 tracking-widest">GUESTS</p>
                </div>
                <div className="bg-dark-800 p-10 rounded-[3rem] border border-white/5 shadow-xl text-center group hover:border-emerald-500/30 transition-all">
                    <p className="text-[10px] font-black text-gray-500 uppercase tracking-[0.3em] mb-4">Active Tables</p>
                    <p className="text-6xl font-sans font-black text-emerald-500">{activeReservations.length}</p>
                    <p className="text-[10px] text-emerald-600 font-bold uppercase mt-4 tracking-widest">ENTRIES</p>
                </div>
                <div className="bg-dark-800 p-10 rounded-[3rem] border border-white/5 shadow-xl text-center group hover:border-rose-500/30 transition-all">
                    <p className="text-[10px] font-black text-gray-500 uppercase tracking-[0.3em] mb-4">Total Coverage</p>
                    <p className="text-6xl font-sans font-black text-white">{paxRsv + paxWlk}</p>
                    <p className="text-[10px] text-rose-500 font-bold uppercase mt-4 tracking-widest">TOTAL PAX</p>
                </div>
                <div className="md:col-span-4 bg-gold-500/5 p-12 rounded-[4rem] border border-gold-500/20 flex flex-col md:flex-row justify-between items-center px-16 shadow-2xl">
                    <div className="flex items-center gap-8 mb-6 md:mb-0">
                        <div className="p-6 bg-gold-500 text-black rounded-[2rem] shadow-2xl"><Banknote size={40}/></div>
                        <div>
                            <p className="text-sm font-black text-gold-600 uppercase tracking-[0.4em]">Settled Revenue Flow</p>
                            <p className="text-5xl font-sans font-black text-white mt-1">{formatCurrency(salesStats.totalRev)}</p>
                        </div>
                    </div>
                    <button 
                      onClick={() => setActiveView('EOD')}
                      className="px-10 py-5 bg-gold-500 hover:bg-gold-400 text-black rounded-[2rem] font-black uppercase text-xs tracking-[0.2em] shadow-2xl shadow-gold-900/40 transition-all active:scale-95 flex items-center gap-3"
                    >
                      <Shield size={20} /> RUN END OF DAY
                    </button>
                </div>
            </div>
        </div>
      );
  }

  if (activeView === 'WAITING') {
      return (
        <div className="space-y-12 animate-fade-in">
            <Header title="Wait Analysis" subtitle="Queue Management Precision" />
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                <div className="p-12 bg-dark-800 rounded-[4rem] border border-white/5 shadow-2xl flex flex-col justify-center items-center gap-6">
                    <div className="text-center">
                        <p className="text-[10px] font-black text-gray-500 uppercase tracking-[0.4em] mb-2">Seating Efficiency</p>
                        <p className="text-8xl font-sans font-black text-emerald-500">{Math.round(waitingStats.rate)}%</p>
                        <p className="text-[10px] text-emerald-600 font-bold uppercase mt-6 tracking-widest">CONVERSION RATE</p>
                    </div>
                </div>
                <div className="grid grid-cols-1 gap-6">
                    <div className="p-8 bg-black/40 rounded-[3rem] border border-white/5 flex justify-between items-center px-12">
                        <div className="flex items-center gap-6">
                            <div className="p-4 bg-amber-500 rounded-2xl text-black"><Users size={28}/></div>
                            <p className="text-xs font-black text-gray-400 uppercase tracking-widest">Total Group</p>
                        </div>
                        <p className="text-5xl font-sans font-black text-white">{waitingStats.totalGroup}</p>
                    </div>
                    <div className="p-8 bg-black/40 rounded-[3rem] border border-white/5 flex justify-between items-center px-12">
                        <div className="flex items-center gap-6">
                            <div className="p-4 bg-amber-600 rounded-2xl text-white"><Users size={28}/></div>
                            <p className="text-xs font-black text-gray-400 uppercase tracking-widest">Total Cover</p>
                        </div>
                        <p className="text-5xl font-sans font-black text-white">{waitingStats.totalCover}</p>
                    </div>
                    <div className="p-8 bg-black/40 rounded-[3rem] border border-white/5 flex justify-between items-center px-12">
                        <div className="flex items-center gap-6">
                            <div className="p-4 bg-emerald-500 rounded-2xl text-black"><Check size={28}/></div>
                            <p className="text-xs font-black text-gray-400 uppercase tracking-widest">Total Seated</p>
                        </div>
                        <p className="text-5xl font-sans font-black text-white">{waitingStats.seated}</p>
                    </div>
                    <div className="p-8 bg-black/40 rounded-[3rem] border border-white/5 flex justify-between items-center px-12">
                        <div className="flex items-center gap-6">
                            <div className="p-4 bg-red-600 rounded-2xl text-white"><X size={28}/></div>
                            <p className="text-xs font-black text-gray-400 uppercase tracking-widest">Drop Out / Cancel</p>
                        </div>
                        <p className="text-5xl font-sans font-black text-white">{waitingStats.cancelled}</p>
                    </div>
                </div>

                {/* --- ENHANCED: 3D TRAFFIC CHART SECTION --- */}
                <div className="lg:col-span-2 glass-card p-12 rounded-[5rem] border-white/5 shadow-2xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-10 opacity-[0.02]"><BarChart size={200} /></div>
                    
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-16 relative z-10">
                        <div>
                            <h3 className="text-[14px] font-black text-gold-500 uppercase tracking-[0.6em] mb-2 flex items-center gap-3">
                                <Layers size={20} className="animate-pulse" /> HOURLY TRAFFIC HEATMAP (3D)
                            </h3>
                            <p className="text-xs text-gray-500 font-bold uppercase tracking-widest">IDENTIFIKASI TRAFFIC TERTINGGI DARI SETIAP WAKTU</p>
                        </div>
                        <div className="px-6 py-3 bg-gold-500/10 border border-gold-500/20 rounded-2xl">
                             <p className="text-[10px] font-black text-gold-500 uppercase tracking-widest">PEAK HOUR DETECTED</p>
                             <p className="text-xl font-sans font-black text-white">
                                {[...waitingStats.hourlyData].sort((a,b)=>b.v - a.v)[0]?.h}:00 WIB
                             </p>
                        </div>
                    </div>

                    <div className="bg-black/30 rounded-[3rem] border border-white/5 p-4 shadow-inner">
                        <IsometricBarChart data={waitingStats.hourlyData} />
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-12">
                        <div className="p-6 bg-white/5 rounded-3xl border border-white/5">
                            <p className="text-[9px] font-black text-gray-600 uppercase tracking-widest mb-1">Peak Vol</p>
                            <p className="text-2xl font-black text-gold-500 font-sans">{Math.max(...waitingStats.hourlyData.map(d=>d.v))} Entries</p>
                        </div>
                        <div className="p-6 bg-white/5 rounded-3xl border border-white/5">
                            <p className="text-[9px] font-black text-gray-600 uppercase tracking-widest mb-1">Avg Vol</p>
                            <p className="text-2xl font-black text-white font-sans">
                                {(waitingStats.hourlyData.reduce((s,d)=>s+d.v,0)/waitingStats.hourlyData.length).toFixed(1)}
                            </p>
                        </div>
                        <div className="p-6 bg-white/5 rounded-3xl border border-white/5">
                            <p className="text-[9px] font-black text-gray-600 uppercase tracking-widest mb-1">Active Slots</p>
                            <p className="text-2xl font-black text-emerald-500 font-sans">{waitingStats.hourlyData.filter(d=>d.v>0).length} Hours</p>
                        </div>
                        <div className="p-6 bg-white/5 rounded-3xl border border-white/5">
                            <p className="text-[9px] font-black text-gray-600 uppercase tracking-widest mb-1">Idle Slots</p>
                            <p className="text-2xl font-black text-gray-400 font-sans">{waitingStats.hourlyData.filter(d=>d.v===0).length} Hours</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
      );
  }

  // Fallback views for other modules (remain as they were but with updated data mapping)
  if (activeView === 'TURNOVER') {
    return (
      <div className="space-y-12 animate-fade-in">
          <Header title="Turn Over Cust" subtitle="Customer Flow & Table Cycle" />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
              {/* Lunch Shift */}
              <div className="p-12 bg-blue-600/5 rounded-[4rem] border border-blue-500/20 shadow-2xl relative overflow-hidden group">
                  <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:scale-110 transition-transform"><Sun size={120} /></div>
                  <div className="text-center relative z-10">
                      <p className="text-[10px] font-black text-blue-400 uppercase tracking-[0.4em] mb-2">Lunch Shift Coverage</p>
                      <p className="text-7xl font-sans font-black text-white">{turnOverStats.lunch.totalPax}</p>
                      <p className="text-[10px] text-blue-500 font-bold uppercase mt-6 tracking-widest">GUESTS (PAX)</p>
                      <div className="flex justify-center gap-8 mt-10 border-t border-white/5 pt-8">
                        <div className="text-center">
                          <p className="text-[9px] font-black text-gold-500 uppercase tracking-widest mb-1">RSV</p>
                          <p className="text-xl font-black text-white">{turnOverStats.lunch.totalRsv}</p>
                        </div>
                        <div className="w-px h-10 bg-white/10"></div>
                        <div className="text-center">
                          <p className="text-[9px] font-black text-blue-500 uppercase tracking-widest mb-1">WLK</p>
                          <p className="text-xl font-black text-white">{turnOverStats.lunch.totalWlk}</p>
                        </div>
                        <div className="w-px h-10 bg-white/10"></div>
                        <div className="text-center">
                          <p className="text-[9px] font-black text-emerald-500 uppercase tracking-widest mb-1">Groups</p>
                          <p className="text-xl font-black text-white">{turnOverStats.lunch.totalGroups}</p>
                        </div>
                      </div>
                  </div>
              </div>

              {/* Dinner Shift */}
              <div className="p-12 bg-indigo-600/5 rounded-[4rem] border border-indigo-500/20 shadow-2xl relative overflow-hidden group">
                  <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:scale-110 transition-transform"><Moon size={120} /></div>
                  <div className="text-center relative z-10">
                      <p className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.4em] mb-2">Dinner Shift Coverage</p>
                      <p className="text-7xl font-sans font-black text-white">{turnOverStats.dinner.totalPax}</p>
                      <p className="text-[10px] text-indigo-500 font-bold uppercase mt-6 tracking-widest">GUESTS (PAX)</p>
                      <div className="flex justify-center gap-8 mt-10 border-t border-white/5 pt-8">
                        <div className="text-center">
                          <p className="text-[9px] font-black text-gold-500 uppercase tracking-widest mb-1">RSV</p>
                          <p className="text-xl font-black text-white">{turnOverStats.dinner.totalRsv}</p>
                        </div>
                        <div className="w-px h-10 bg-white/10"></div>
                        <div className="text-center">
                          <p className="text-[9px] font-black text-blue-500 uppercase tracking-widest mb-1">WLK</p>
                          <p className="text-xl font-black text-white">{turnOverStats.dinner.totalWlk}</p>
                        </div>
                        <div className="w-px h-10 bg-white/10"></div>
                        <div className="text-center">
                          <p className="text-[9px] font-black text-emerald-500 uppercase tracking-widest mb-1">Groups</p>
                          <p className="text-xl font-black text-white">{turnOverStats.dinner.totalGroups}</p>
                        </div>
                      </div>
                  </div>
              </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-12">
              <div className="p-8 bg-black/40 rounded-[3rem] border border-white/5 flex justify-between items-center px-12">
                  <div className="flex items-center gap-6">
                      <div className="p-4 bg-blue-500 rounded-2xl text-white"><Users size={28}/></div>
                      <p className="text-xs font-black text-gray-400 uppercase tracking-widest">Total Daily Groups</p>
                  </div>
                  <p className="text-5xl font-sans font-black text-white">{turnOverStats.total.totalGroups}</p>
              </div>
              <div className="p-8 bg-black/40 rounded-[3rem] border border-white/5 flex justify-between items-center px-12">
                  <div className="flex items-center gap-6">
                      <div className="p-4 bg-indigo-500 rounded-2xl text-white"><TrendingUp size={28}/></div>
                      <p className="text-xs font-black text-gray-400 uppercase tracking-widest">Total Daily Pax</p>
                  </div>
                  <p className="text-5xl font-sans font-black text-white">
                    {turnOverStats.total.totalPax}
                  </p>
              </div>
          </div>

              <div id="turnover-chart-section" className="lg:col-span-2 glass-card p-12 rounded-[5rem] border-white/5 shadow-2xl relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-10 opacity-[0.02]"><BarChart size={200} /></div>
                  
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-16 relative z-10">
                      <div>
                          <h3 className="text-[14px] font-black text-emerald-500 uppercase tracking-[0.6em] mb-2 flex items-center gap-3">
                              <Layers size={20} className="animate-pulse" /> HOURLY TURNOVER HEATMAP (DUAL 3D)
                          </h3>
                          <p className="text-xs text-gray-500 font-bold uppercase tracking-widest">DISTRIBUSI KEPADATAN MEJA: RESERVASI (GOLD) VS WALK-IN (BLUE)</p>
                      </div>
                      <div className="flex flex-col items-end gap-4">
                        <ExportActions 
                          onExportPDF={() => exportVisualToPDF('turnover-chart-section', 'Turnover_Report')}
                          onExportHTML={() => exportVisualToHTML('turnover-chart-section', 'Turnover_Report')}
                          onExportImage={() => exportVisualToImage('turnover-chart-section', 'Turnover_Report')}
                          onShareWA={() => exportVisualToPDF('turnover-chart-section', 'Turnover_Report', true)}
                        />
                        <div className="flex gap-4">
                          <div className="px-6 py-3 bg-gold-500/10 border border-gold-500/20 rounded-2xl text-center">
                               <p className="text-[10px] font-black text-gold-500 uppercase tracking-widest">PEAK RSV</p>
                               <p className="text-xl font-sans font-black text-white">
                                  {[...turnOverStats.hourlyData].sort((a,b)=>b.rsv - a.rsv)[0]?.h}:00
                               </p>
                          </div>
                          <div className="px-6 py-3 bg-blue-500/10 border border-blue-500/20 rounded-2xl text-center">
                               <p className="text-[10px] font-black text-blue-500 uppercase tracking-widest">PEAK WLK</p>
                               <p className="text-xl font-sans font-black text-white">
                                  {[...turnOverStats.hourlyData].sort((a,b)=>b.wlk - a.wlk)[0]?.h}:00
                               </p>
                          </div>
                        </div>
                      </div>
                  </div>

                  <div className="bg-black/30 rounded-[3rem] border border-white/5 p-4 shadow-inner">
                      <DualIsometricBarChart data={turnOverStats.hourlyData} />
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-12">
                      <div className="p-6 bg-white/5 rounded-3xl border border-white/5">
                          <p className="text-[9px] font-black text-gray-600 uppercase tracking-widest mb-1">Max Tables/Hr</p>
                          <p className="text-2xl font-black text-emerald-500 font-sans">{Math.max(...turnOverStats.hourlyData.map(d=>d.rsv + d.wlk))} Meja</p>
                      </div>
                      <div className="p-6 bg-white/5 rounded-3xl border border-white/5">
                          <p className="text-[9px] font-black text-gray-600 uppercase tracking-widest mb-1">Avg Tables/Hr</p>
                          <p className="text-2xl font-black text-white font-sans">
                              {(turnOverStats.hourlyData.reduce((s,d)=>s+d.rsv+d.wlk,0)/turnOverStats.hourlyData.length).toFixed(1)}
                          </p>
                      </div>
                      <div className="p-6 bg-white/5 rounded-3xl border border-white/5">
                          <p className="text-[9px] font-black text-gray-600 uppercase tracking-widest mb-1">Busy Slots</p>
                          <p className="text-2xl font-black text-blue-500 font-sans">{turnOverStats.hourlyData.filter(d=>d.rsv+d.wlk>0).length} Hours</p>
                      </div>
                      <div className="p-6 bg-white/5 rounded-3xl border border-white/5">
                          <p className="text-[9px] font-black text-gray-600 uppercase tracking-widest mb-1">Legend</p>
                          <div className="flex flex-col gap-1 mt-1">
                            <div className="flex items-center gap-2 text-[8px] font-black text-gold-500 uppercase"><div className="w-2 h-2 bg-gold-500 rounded-full"></div> Reservation</div>
                            <div className="flex items-center gap-2 text-[8px] font-black text-blue-500 uppercase"><div className="w-2 h-2 bg-blue-500 rounded-full"></div> Walk-In</div>
                          </div>
                      </div>
                  </div>
              </div>
          </div>
    );
  }

  if (activeView === 'SALES') {
      return (
          <div className="space-y-12 animate-fade-in">
              <Header title="Revenue Trend" subtitle="Daily Financial Achievement" />
              <div className="glass-card p-12 rounded-[4rem] border-white/5">
                <h3 className="text-[11px] font-black text-gold-500 uppercase tracking-[0.5em] mb-10 border-b border-white/5 pb-6 flex items-center gap-4"><TrendingUp size={20}/> FINANCIAL LOGS</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {salesStats.trend.map((day, i) => (
                        <div key={i} className="p-8 bg-black/40 rounded-[2.5rem] border border-white/5 flex justify-between items-center group hover:border-gold-500/30 transition-all">
                            <div>
                                <p className="text-[9px] font-black text-gray-500 uppercase tracking-widest">{new Date(day.date).toLocaleDateString('id-ID', { weekday: 'long' })}</p>
                                <p className="text-lg font-black text-white mt-1 uppercase tracking-tight font-sans">{day.date}</p>
                            </div>
                            <div className="text-right">
                                <p className="text-xl font-sans font-black text-gold-500">{formatCurrency(day.val)}</p>
                            </div>
                        </div>
                    ))}
                </div>
              </div>
          </div>
      );
  }

  if (activeView === 'TRANSACTIONS') {
    return (
      <div className="space-y-12 animate-fade-in">
          <Header title="Payment Audit" subtitle="Financial Integrity Breakdown" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {paymentStats.map((p, i) => (
                  <div key={i} className="p-10 bg-dark-800 rounded-[4rem] border border-white/5 group hover:border-gold-500/30 transition-all flex items-center gap-10 shadow-xl">
                      <div className={`p-6 rounded-[2rem] bg-white/5 ${p.color} shadow-inner group-hover:scale-110 transition-transform`}><p.icon size={40}/></div>
                      <div>
                          <p className="text-[10px] font-black text-gray-500 uppercase tracking-[0.3em] mb-2">{p.name}</p>
                          <p className="text-4xl font-sans font-black text-white tracking-tighter">{formatCurrency(p.val)}</p>
                      </div>
                  </div>
              ))}
          </div>
      </div>
    );
  }

  const handleDownloadTrafficHTML = () => {
    exportVisualToHTML('traffic-load-content', `TRAFFIC_LOAD_${new Date().toISOString().split('T')[0]}`);
  };

  const handleDownloadTrafficImage = () => {
    exportVisualToImage('traffic-load-content', `TRAFFIC_LOAD_${new Date().toISOString().split('T')[0]}`);
  };

  if (activeView === 'TRAFFIC') {
    return (
      <div className="space-y-12 animate-fade-in" id="traffic-load-content">
          <Header title="Traffic Loads" subtitle="Shift Efficiency Indicators" />
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
              {/* Lunch Stats */}
              <div className="glass-card p-10 rounded-[4rem] border-blue-500/20 bg-blue-600/5 relative overflow-hidden group">
                  <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:scale-110 transition-transform"><Sun size={120} /></div>
                  <div className="flex items-center gap-4 mb-8">
                      <div className="p-3 bg-blue-500 rounded-2xl text-black"><Sun size={24}/></div>
                      <h3 className="text-2xl font-serif font-black text-white uppercase tracking-tighter">Lunch Shift</h3>
                  </div>
                  <div className="grid grid-cols-5 gap-4">
                      <div className="text-center">
                          <p className="text-[8px] font-black text-blue-400 uppercase tracking-widest mb-1">Tables</p>
                          <p className="text-3xl font-sans font-black text-white">{trafficSummary.lunch.tables}</p>
                      </div>
                      <div className="text-center border-x border-white/10">
                          <p className="text-[8px] font-black text-blue-400 uppercase tracking-widest mb-1">Covers</p>
                          <p className="text-3xl font-sans font-black text-white">{trafficSummary.lunch.covers}</p>
                      </div>
                      <div className="text-center border-r border-white/10">
                          <p className="text-[8px] font-black text-blue-400 uppercase tracking-widest mb-1">Avg Dur</p>
                          <p className="text-3xl font-sans font-black text-white">{trafficSummary.lunch.avgDur}<span className="text-xs ml-1">m</span></p>
                      </div>
                      <div className="text-center border-r border-white/10">
                          <p className="text-[8px] font-black text-blue-400 uppercase tracking-widest mb-1">Total Dur</p>
                          <p className="text-3xl font-sans font-black text-white">{trafficSummary.lunch.totalDur}<span className="text-xs ml-1">m</span></p>
                      </div>
                      <div className="text-center">
                          <p className="text-[8px] font-black text-emerald-400 uppercase tracking-widest mb-1">Turnover</p>
                          <p className="text-3xl font-sans font-black text-emerald-500">{trafficSummary.lunch.turnoverRate}</p>
                      </div>
                  </div>
              </div>

              {/* Dinner Stats */}
              <div className="glass-card p-10 rounded-[4rem] border-indigo-500/20 bg-indigo-600/5 relative overflow-hidden group">
                  <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:scale-110 transition-transform"><Moon size={120} /></div>
                  <div className="flex items-center gap-4 mb-8">
                      <div className="p-3 bg-indigo-500 rounded-2xl text-black"><Moon size={24}/></div>
                      <h3 className="text-2xl font-serif font-black text-white uppercase tracking-tighter">Dinner Shift</h3>
                  </div>
                  <div className="grid grid-cols-5 gap-4">
                      <div className="text-center">
                          <p className="text-[8px] font-black text-indigo-400 uppercase tracking-widest mb-1">Tables</p>
                          <p className="text-3xl font-sans font-black text-white">{trafficSummary.dinner.tables}</p>
                      </div>
                      <div className="text-center border-x border-white/10">
                          <p className="text-[8px] font-black text-indigo-400 uppercase tracking-widest mb-1">Covers</p>
                          <p className="text-3xl font-sans font-black text-white">{trafficSummary.dinner.covers}</p>
                      </div>
                      <div className="text-center border-r border-white/10">
                          <p className="text-[8px] font-black text-indigo-400 uppercase tracking-widest mb-1">Avg Dur</p>
                          <p className="text-3xl font-sans font-black text-white">{trafficSummary.dinner.avgDur}<span className="text-xs ml-1">m</span></p>
                      </div>
                      <div className="text-center border-r border-white/10">
                          <p className="text-[8px] font-black text-indigo-400 uppercase tracking-widest mb-1">Total Dur</p>
                          <p className="text-3xl font-sans font-black text-white">{trafficSummary.dinner.totalDur}<span className="text-xs ml-1">m</span></p>
                      </div>
                      <div className="text-center">
                          <p className="text-[8px] font-black text-emerald-400 uppercase tracking-widest mb-1">Turnover</p>
                          <p className="text-3xl font-sans font-black text-emerald-500">{trafficSummary.dinner.turnoverRate}</p>
                      </div>
                  </div>
              </div>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-10">
              <div className="xl:col-span-2 glass-card p-12 rounded-[4rem] border-white/5">
                  <div className="flex justify-between items-center mb-10 border-b border-white/5 pb-6">
                      <h3 className="text-[11px] font-black text-indigo-400 uppercase tracking-[0.5em] flex items-center gap-4">
                          <LayoutList size={20}/> DETAILED TRAFFIC LOGS
                      </h3>
                      <div className="flex items-center gap-3">
                          <button 
                              onClick={handleDownloadTrafficImage}
                              className="no-export flex items-center gap-2 px-6 py-2 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 rounded-full text-[10px] font-black text-emerald-500 uppercase tracking-widest transition-all"
                          >
                              <Share2 size={14} /> DOWNLOAD IMAGE (HD)
                          </button>
                          <button 
                              onClick={handleDownloadTrafficHTML}
                              className="no-export flex items-center gap-2 px-6 py-2 bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/20 rounded-full text-[10px] font-black text-indigo-400 uppercase tracking-widest transition-all"
                          >
                              <FileDown size={14} /> DOWNLOAD HTML
                          </button>
                      </div>
                  </div>
                  <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse">
                          <thead>
                              <tr className="border-b border-white/5">
                                  <th className="pb-6 text-[10px] font-black text-gray-500 uppercase tracking-widest">Guest Name</th>
                                  <th className="pb-6 text-[10px] font-black text-gray-500 uppercase tracking-widest text-center">Cover</th>
                                  <th className="pb-6 text-[10px] font-black text-gray-500 uppercase tracking-widest text-center">Table</th>
                                  <th className="pb-6 text-[10px] font-black text-gray-500 uppercase tracking-widest text-center">Type</th>
                                  <th className="pb-6 text-[10px] font-black text-gray-500 uppercase tracking-widest text-center">Check-In</th>
                                  <th className="pb-6 text-[10px] font-black text-gray-500 uppercase tracking-widest text-center">Check-Out</th>
                                  <th className="pb-6 text-[10px] font-black text-gray-500 uppercase tracking-widest text-center">Duration</th>
                                  <th className="pb-6 text-[10px] font-black text-gray-500 uppercase tracking-widest text-center">Wait Time</th>
                                  <th className="pb-6 text-[10px] font-black text-gray-500 uppercase tracking-widest text-center">Remark</th>
                              </tr>
                          </thead>
                          <tbody className="divide-y divide-white/5">
                              {trafficLoadDetails.map((item) => (
                                  <tr key={item.id} className="group hover:bg-white/5 transition-all">
                                      <td className="py-6">
                                          <p className="text-sm font-black text-white uppercase tracking-tight">{item.name}</p>
                                      </td>
                                      <td className="py-6 text-center">
                                          <p className="text-sm font-sans font-black text-white">{item.cover}</p>
                                      </td>
                                      <td className="py-6 text-center">
                                          <p className="text-sm font-sans font-black text-gold-500">{item.table}</p>
                                      </td>
                                      <td className="py-6 text-center">
                                          <span className={`px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-tighter ${item.isWalkIn ? 'bg-emerald-500/10 text-emerald-500' : 'bg-blue-500/10 text-blue-500'}`}>
                                              {item.isWalkIn ? 'Walk-In' : 'Reservation'}
                                          </span>
                                      </td>
                                      <td className="py-6 text-center">
                                          <p className="text-sm font-sans font-black text-white">{item.checkInTime}</p>
                                      </td>
                                      <td className="py-6 text-center">
                                          <p className={`text-sm font-sans font-black ${item.checkOutTime === 'Dining...' ? 'text-emerald-500 animate-pulse' : 'text-white'}`}>{item.checkOutTime}</p>
                                      </td>
                                      <td className="py-6 text-center">
                                          <p className="text-sm font-sans font-black text-indigo-400">
                                              {item.duration}
                                          </p>
                                      </td>
                                      <td className="py-6 text-center">
                                          <p className={`text-sm font-sans font-black ${item.isWalkIn ? 'text-emerald-500' : 'text-gray-500'}`}>
                                              {item.waitingTime}
                                          </p>
                                      </td>
                                      <td className="py-6 text-center">
                                          <p className={`text-xs font-black uppercase tracking-widest ${item.remark !== '-' ? 'text-gold-500' : 'text-gray-600'}`}>
                                              {item.remark}
                                          </p>
                                      </td>
                                  </tr>
                              ))}
                              {trafficLoadDetails.length === 0 && (
                                  <tr>
                                      <td colSpan={9} className="py-20 text-center text-gray-500 font-black uppercase tracking-[0.3em] text-xs">
                                          No traffic data recorded for this period
                                      </td>
                                  </tr>
                              )}
                          </tbody>
                      </table>
                  </div>
              </div>

              <div className="glass-card p-12 rounded-[4rem] border-white/5">
                  <div className="mb-10 border-b border-white/5 pb-6">
                      <h3 className="text-[11px] font-black text-gold-500 uppercase tracking-[0.5em] flex items-center gap-4">
                          <LayoutGrid size={20}/> TABLE UTILIZATION
                      </h3>
                  </div>
                  <div className="space-y-6">
                      {tableUtilization.map((stat) => (
                          <div key={stat.table} className="flex items-center justify-between p-6 bg-white/5 rounded-3xl border border-white/5 hover:border-gold-500/30 transition-all">
                              <div>
                                  <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">Table</p>
                                  <p className="text-2xl font-sans font-black text-gold-500">{stat.table}</p>
                              </div>
                              <div className="text-right">
                                  <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">Total Dining Time</p>
                                  <p className="text-2xl font-sans font-black text-white">{stat.totalMinutes}<span className="text-xs ml-1 text-gray-500">min</span></p>
                                  <p className="text-[8px] font-black text-indigo-400 uppercase tracking-widest mt-1">
                                      {stat.visits} Visits • {stat.covers} Covers
                                  </p>
                              </div>
                          </div>
                      ))}
                      {tableUtilization.length === 0 && (
                          <div className="py-20 text-center text-gray-500 font-black uppercase tracking-[0.3em] text-[10px]">
                              No table data
                          </div>
                      )}
                  </div>
              </div>
          </div>
      </div>
    );
  }

  const handleDownloadMenuImage = () => {
    exportVisualToImage('menu-ranking-content', `MENU_RANKING_${new Date().toISOString().split('T')[0]}`);
  };

  if (activeView === 'MENU') {
    return (
      <div className="space-y-12 animate-fade-in" id="menu-ranking-content">
          <Header title="Menu Ranking" subtitle="Product Engineering Ranking" />
          <div className="glass-card p-12 rounded-[4rem] border-white/5">
              <div className="flex justify-between items-center mb-10 border-b border-white/5 pb-6">
                  <h3 className="text-[11px] font-black text-rose-500 uppercase tracking-[0.5em] flex items-center gap-4">
                      <Star size={20}/> TOP PERFORMANCE ITEMS
                  </h3>
                  <button 
                      onClick={handleDownloadMenuImage}
                      className="no-export flex items-center gap-2 px-6 py-2 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 rounded-full text-[10px] font-black text-rose-500 uppercase tracking-widest transition-all"
                  >
                      <Share2 size={14} /> DOWNLOAD IMAGE (HD)
                  </button>
              </div>
              <div className="space-y-4">
                  {menuStats.map((m, i) => (
                      <div key={i} className="flex items-center gap-6 p-6 bg-black/40 rounded-3xl border border-white/5 group hover:border-rose-500/30 transition-all">
                          <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center font-black text-rose-500 text-xl border border-white/5 font-sans">{i+1}</div>
                          <div className="flex-1">
                              <p className="text-lg font-black text-white uppercase tracking-tight">{m.name}</p>
                          </div>
                          <div className="text-right">
                              <p className="text-3xl font-sans font-black text-white leading-none">{m.qty}</p>
                              <p className="text-[8px] font-black text-rose-500 uppercase mt-1 tracking-widest">SOLD QTY</p>
                          </div>
                      </div>
                  ))}
              </div>
          </div>
      </div>
    );
  }

  if (activeView === 'USERS') {
    return (
        <div className="animate-fade-in space-y-12">
            <Header title="Identity Hub" subtitle="Authorized Access Control" />
            {users.filter(u => u.allowedOutlet === currentOutlet || u.allowedOutlet === 'ALL').length === 0 ? (
                <div className="glass-card p-12 rounded-[3rem] text-center text-gray-500 border border-white/5">
                    <User size={40} className="mx-auto mb-4 text-gold-500/40" />
                    <p className="text-sm font-bold uppercase tracking-wider text-white">Belum Ada Staff Terdaftar di Outlet Ini</p>
                    <p className="text-xs text-gray-400 mt-2">Staff akan otomatis terdaftar pada saat pertama kali log in dengan mengisi Username.</p>
                </div>
            ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-10">
                {users
                    .filter(u => u.allowedOutlet === currentOutlet || u.allowedOutlet === 'ALL')
                    .map((u, i) => (
                    <div key={i} className="glass-card p-10 rounded-[4rem] border-white/5 flex flex-col gap-8 group hover:border-gold-500/40 transition-all shadow-2xl relative overflow-hidden">
                        <div className="flex items-center gap-10">
                            <div className="w-28 h-28 rounded-[3rem] bg-gold-500/10 border border-gold-500/20 flex items-center justify-center text-4xl font-serif font-black text-gold-500 shadow-inner group-hover:bg-gold-500 group-hover:text-black transition-all duration-500">
                                {u.name.substring(0,1)}
                            </div>
                            <div className="relative z-10">
                                <h4 className="text-2xl font-black text-white uppercase tracking-tight mb-2">{u.name.split(' ')[0]}</h4>
                                <p className="text-[11px] font-black text-gold-500 uppercase tracking-[0.3em] mb-2">{u.role}</p>
                                <div className="flex items-center gap-4 mb-4">
                                    <div className="flex items-center gap-2 text-[10px] text-gray-500 font-black uppercase">
                                        <MapPin size={12} /> {u.allowedOutlet}
                                    </div>
                                    <div className="flex items-center gap-2 text-[10px] text-emerald-500 font-black uppercase bg-emerald-500/10 px-2 py-0.5 rounded">
                                        <User size={12} /> USER: {u.name}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Mutation Controls */}
                        <div className="mt-4 pt-8 border-t border-white/5">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="p-2 bg-emerald-500/10 rounded-lg text-emerald-500"><UserPlus size={16}/></div>
                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Mutasi Crew ke Outlet Lain</p>
                            </div>
                            
                            <div className="flex flex-wrap gap-2">
                                {ALL_OUTLETS.filter(o => o !== u.allowedOutlet).slice(0, 6).map(outlet => (
                                    <button 
                                        key={outlet}
                                        onClick={() => setMutationConfirm({ name: u.name, outlet })}
                                        className="px-4 py-2 bg-white/5 hover:bg-gold-500 hover:text-black rounded-xl text-[9px] font-black uppercase tracking-tighter transition-all border border-white/5"
                                    >
                                        {outlet}
                                    </button>
                                ))}
                                <select 
                                    className="bg-black/40 border border-white/10 text-[9px] font-black uppercase rounded-xl px-4 py-2 outline-none text-gold-500 focus:border-gold-500 transition-all"
                                    onChange={(e) => {
                                        if (e.target.value) {
                                            setMutationConfirm({ name: u.name, outlet: e.target.value });
                                        }
                                        e.target.value = "";
                                    }}
                                    value=""
                                >
                                    <option value="" disabled>Pilih Outlet Lain...</option>
                                    {ALL_OUTLETS.map(o => (
                                        <option key={o} value={o}>{o}</option>
                                    ))}
                                </select>
                            </div>
                            <p className="text-[8px] text-gray-600 mt-4 italic">* Role akan otomatis mengikuti ke outlet baru.</p>
                        </div>
                    </div>
                ))}
            </div>
            )}

            {/* Custom Mutation Confirmation Modal */}
            {mutationConfirm && (
                <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/90 backdrop-blur-xl p-4 animate-fade-in">
                    <div className="glass-card p-10 rounded-[3rem] w-full max-w-[450px] border border-gold-500/30 text-center shadow-2xl">
                        <div className="w-24 h-24 bg-gold-500/10 border border-gold-500/20 rounded-[2rem] flex items-center justify-center mx-auto mb-8 shadow-inner">
                            <UserPlus size={48} className="text-gold-500" />
                        </div>
                        <h3 className="text-2xl font-serif font-black text-white uppercase tracking-tighter mb-4">Konfirmasi Mutasi</h3>
                        <p className="text-sm text-gray-400 leading-relaxed mb-10">
                            Apakah Anda yakin ingin memindahkan <span className="text-white font-black uppercase">{mutationConfirm.name.split(' ')[0]}</span> ke outlet <span className="text-gold-500 font-black uppercase">{mutationConfirm.outlet}</span>?
                        </p>
                        
                        <div className="grid grid-cols-2 gap-4">
                            <button 
                                onClick={() => setMutationConfirm(null)}
                                className="py-4 bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white rounded-2xl font-black uppercase text-[10px] tracking-widest transition-all"
                            >
                                Batal
                            </button>
                            <button 
                                onClick={() => {
                                    onMutateCrew?.(mutationConfirm.name, mutationConfirm.outlet);
                                    setMutationConfirm(null);
                                }}
                                className="py-4 bg-gold-500 hover:bg-gold-400 text-black rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl transition-all active:scale-95"
                            >
                                Ya, Mutasi Sekarang
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
  }

  if (activeView === 'EOD') {
    return (
      <EODReport 
        reservations={reservations}
        waitingList={waitingList}
        date={startDate}
        outletName={currentOutlet || "JUSTUS STEAKHOUSE"}
        isDarkMode={isDarkMode}
        onBack={() => setActiveView('SUMMARY')}
        onArchiveDay={onEODClose}
      />
    );
  }

  return (
    <div className="space-y-12 animate-fade-in">
        <Header title={activeView} subtitle="Loading Management Data" />
        <div className="glass-card p-40 rounded-[5rem] border-white/5 text-center shadow-2xl flex flex-col items-center justify-center">
            <Loader2 size={80} className="text-gold-500 animate-spin opacity-40 mb-12" />
            <p className="text-gray-500 font-black uppercase tracking-[0.8em] text-sm animate-pulse">Initializing Data Stream...</p>
        </div>
    </div>
  );
};

export default AdminDashboard;
