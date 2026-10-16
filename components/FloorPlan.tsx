
// @ts-nocheck
import React, { useState, useEffect, useMemo } from 'react';
import { Reservation, ReservationStatus, AppSettings, LocationPreference } from '../types';
import { Users, Clock, MapPin, LogIn, LogOut, UserPlus, ArrowRightLeft, Link as LinkIcon, X, ArrowLeft, BookmarkCheck, Check, AlertCircle, FileDown, Utensils } from 'lucide-react';
import { exportFloorPlanToHTML } from '../services/exportService';

interface Props {
  reservations: Reservation[];
  onStatusChange?: (id: string, status: ReservationStatus) => void;
  onQuickWalkIn?: (tableNum: string) => void;
  onTableChange?: (id: string, newTable: string, newMergedTables?: string[]) => void;
  onMergeTable?: (id: string, tablesToMerge: string[]) => void;
  onEditMenu?: (id: string) => void;
  settings: AppSettings;
  isDarkMode?: boolean;
  onBack?: () => void;
  outletName?: string;
}

interface PickerState {
  type: 'CHANGE' | 'MERGE';
  resId: string;
  currentTable: string;
  initialMergedTables: string[];
  selectedTables: string[];
  guestName: string;
  reservationDate: string;
  arrivalTime: string;
}

const FloorPlan: React.FC<Props> = ({ reservations, onStatusChange, onQuickWalkIn, onTableChange, onMergeTable, onEditMenu, settings, isDarkMode, onBack, outletName }) => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [activeFilter, setActiveFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [picker, setPicker] = useState<PickerState | null>(null);

  const handleDownloadHTML = () => {
    const filename = `FloorPlan_${outletName || 'Justus'}_${new Date().toISOString().split('T')[0]}`;
    exportFloorPlanToHTML(settings.zones, reservations, filename, outletName || 'JUSTUS STEAKHOUSE');
  };

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  const occupiedTablesSet = useMemo(() => {
    const set = new Set<string>();
    if (!picker) {
        reservations.forEach(r => {
            if (r.status === ReservationStatus.CHECKED_IN || r.status === ReservationStatus.CONFIRMED) {
                if (r.tableNumber) set.add(r.tableNumber);
                r.mergedTables?.forEach(t => set.add(t));
            }
        });
        return set;
    }

    const targetTimeMinutes = parseInt(picker.arrivalTime.split(':')[0]) * 60 + parseInt(picker.arrivalTime.split(':')[1]);
    reservations.forEach(r => {
        if (r.reservationDate !== picker.reservationDate) return;
        if (r.id === picker.resId) return;
        if (r.status === ReservationStatus.CANCELLED || r.status === ReservationStatus.COMPLETED) return;

        const bookingTimeMinutes = parseInt(r.arrivalTime.split(':')[0]) * 60 + parseInt(r.arrivalTime.split(':')[1]);
        if (Math.abs(targetTimeMinutes - bookingTimeMinutes) < 120) {
            if (r.tableNumber) set.add(r.tableNumber);
            r.mergedTables?.forEach(t => set.add(t));
        }
    });
    return set;
  }, [reservations, picker]);

  const getReservationsForTable = (tableNum: string) => {
    return reservations.filter(r => 
      (r.tableNumber === tableNum || r.mergedTables?.includes(tableNum)) && 
      (r.status === ReservationStatus.CONFIRMED || r.status === ReservationStatus.CHECKED_IN)
    );
  };

  const getTableStatus = (tableRes: Reservation[]) => {
    if (tableRes.length === 0) return { status: 'FREE', res: null };
    const checkedIn = tableRes.find(r => r.status === ReservationStatus.CHECKED_IN);
    if (checkedIn) return { status: 'OCCUPIED', res: checkedIn };
    const confirmed = tableRes.filter(r => r.status === ReservationStatus.CONFIRMED).sort((a, b) => a.arrivalTime.localeCompare(b.arrivalTime));
    if (confirmed.length > 0) {
      const nearest = confirmed[0];
      const [hours, minutes] = nearest.arrivalTime.split(':').map(Number);
      const resTime = new Date(currentTime);
      resTime.setHours(hours, minutes, 0, 0);
      const isToday = new Date().toISOString().split('T')[0] === nearest.reservationDate;
      if (isToday) {
         const diffMinutes = (resTime.getTime() - currentTime.getTime()) / (1000 * 60);
         return { status: diffMinutes <= 60 ? 'RESERVED_ACTIVE' : 'RESERVED_FUTURE', res: nearest };
      }
      return { status: 'RESERVED_FUTURE', res: nearest };
    }
    return { status: 'FREE', res: null };
  };

  const visibleZones = activeFilter === 'ALL' ? settings.zones : settings.zones.filter(z => z.id === activeFilter);

  const filteredZones = useMemo(() => {
    if (!searchQuery) return visibleZones;
    
    return visibleZones.map(zone => {
      const tables = Array.from({ length: (zone.tableEnd - zone.tableStart + 1) }, (_, i) => (zone.tableStart + i).toString());
      const matchingTables = tables.filter(tableNum => {
        const tableResList = getReservationsForTable(tableNum);
        return tableResList.some(r => 
          r.guestName.toLowerCase().includes(searchQuery.toLowerCase()) ||
          r.tableNumber?.includes(searchQuery)
        );
      });
      
      if (matchingTables.length > 0) return zone;
      return null;
    }).filter(Boolean) as typeof settings.zones;
  }, [visibleZones, searchQuery, reservations]);

  return (
    <div className="animate-fade-in space-y-6 relative pb-24">
      <div className={`p-6 rounded-[2.5rem] border shadow-2xl transition-all`} style={{ backgroundColor: 'var(--app-surface)', borderColor: 'var(--app-primary)' }}>
        <div className={`flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-8 border-b pb-6 border-gray-700/50`}>
          <div className="flex items-center gap-4">
            {onBack && (
                <button onClick={onBack} className="p-3 hover:bg-gold-500 hover:text-black rounded-2xl transition-all border border-gold-500/20 text-gold-500 bg-gold-500/10 active:scale-95">
                    <ArrowLeft size={24} />
                </button>
            )}
            <div>
                <h3 className={`text-2xl font-serif font-bold mb-1 tracking-tight uppercase`} style={{ color: 'var(--app-font)' }}>LAY OUT TABLE MONITOR</h3>
                <p className="text-[10px] text-gray-500 font-black uppercase tracking-[0.3em]">Live Operational Status & Floor Management</p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
            <div className="relative flex-1 sm:w-64 group">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Users size={16} className="text-gray-500 group-focus-within:text-gold-500 transition-colors" />
              </div>
              <input
                type="text"
                placeholder="SEARCH GUEST OR TABLE..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-black/40 border border-white/10 rounded-xl py-2.5 pl-11 pr-4 text-xs font-bold text-white placeholder:text-gray-600 focus:outline-none focus:border-gold-500/50 focus:ring-1 focus:ring-gold-500/20 transition-all uppercase tracking-wider"
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery('')} className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 hover:text-white">
                  <X size={14} />
                </button>
              )}
            </div>
            
            <div className="flex items-center gap-4 px-4 py-2 bg-black/30 rounded-xl border border-white/5">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full shadow-[0_0_8px_rgba(51,51,51,0.5)]" style={{ backgroundColor: 'var(--tbl-idle)' }}></div>
                <span className="text-[9px] font-black text-gray-500 uppercase tracking-widest">Free</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full shadow-[0_0_8px_rgba(212,175,55,0.5)]" style={{ backgroundColor: 'var(--tbl-upcoming)' }}></div>
                <span className="text-[9px] font-black text-gray-500 uppercase tracking-widest">Reserved</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full shadow-[0_0_8px_rgba(37,99,235,0.5)]" style={{ backgroundColor: 'var(--tbl-active)' }}></div>
                <span className="text-[9px] font-black text-gray-500 uppercase tracking-widest">Occupied</span>
              </div>
              <button 
                onClick={handleDownloadHTML}
                className="ml-2 flex items-center gap-2 bg-gold-500 hover:bg-gold-400 text-black px-4 py-2 rounded-lg font-black text-[10px] uppercase tracking-widest transition-all active:scale-95 shadow-lg shadow-gold-500/20"
              >
                <FileDown size={14} />
                <span>EXPORT HTML</span>
              </button>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 mb-8 overflow-x-auto pb-2 custom-scrollbar no-scrollbar">
           <button 
            onClick={() => setActiveFilter('ALL')} 
            className={`px-6 py-3 rounded-2xl text-[10px] font-black uppercase transition-all border shadow-lg active:scale-95 whitespace-nowrap tracking-widest`} 
            style={activeFilter === 'ALL' ? {backgroundColor: 'var(--app-primary)', color: 'var(--app-bg)', borderColor: 'var(--app-primary)'} : {backgroundColor: 'var(--app-surface)', color: 'var(--app-font)', borderColor: 'var(--app-primary)', opacity: 0.6}}
           >
            All Areas
           </button>
            {settings.zones.map(zone => (
                <button 
                  key={zone.id} 
                  onClick={() => setActiveFilter(zone.id)} 
                  className={`px-6 py-3 rounded-2xl text-[10px] font-black uppercase transition-all border shadow-lg active:scale-95 whitespace-nowrap tracking-widest`} 
                  style={activeFilter === zone.id ? {backgroundColor: 'var(--app-primary)', color: 'var(--app-bg)', borderColor: 'var(--app-primary)'} : {backgroundColor: 'var(--app-surface)', color: 'var(--app-font)', borderColor: 'var(--app-primary)', opacity: 0.6}}
                >
                  {zone.name}
                </button>
            ))}
        </div>

        <div className="space-y-12">
          {filteredZones.map((zone) => (
            <div key={zone.id} className={`p-8 rounded-[2.5rem] border border-white/5 bg-black/20 shadow-inner relative overflow-hidden group/zone`}>
              <div className="absolute top-0 right-0 p-8 opacity-5 group-hover/zone:opacity-10 transition-opacity">
                <MapPin size={120} style={{ color: 'var(--app-primary)' }} />
              </div>
              
              <div className="flex items-center justify-between mb-8 border-b border-white/5 pb-4">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-2xl bg-white/5 border border-white/10 shadow-lg"><MapPin size={20} style={{ color: 'var(--app-primary)' }} /></div>
                  <div>
                    <h4 className={`text-lg font-serif font-black uppercase tracking-[0.15em]`} style={{ color: 'var(--app-font)' }}>{zone.name}</h4>
                    <p className="text-[9px] text-gray-500 font-bold uppercase tracking-widest mt-0.5">{zone.description || 'Main Dining Area'}</p>
                  </div>
                </div>
                <div className="px-4 py-1.5 bg-black/40 rounded-full border border-white/5">
                  <span className="text-[10px] font-black text-gold-500 uppercase tracking-widest">
                    {zone.tableEnd - zone.tableStart + 1} Tables
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-5">
                {Array.from({ length: (zone.tableEnd - zone.tableStart + 1) }, (_, i) => (zone.tableStart + i).toString()).map((tableNum) => {
                  const tableResList = getReservationsForTable(tableNum);
                  const { status, res: primaryRes } = getTableStatus(tableResList);

                  // Filter by search query
                  if (searchQuery && primaryRes) {
                    const matches = primaryRes.guestName.toLowerCase().includes(searchQuery.toLowerCase()) || tableNum.includes(searchQuery);
                    if (!matches) return null;
                  } else if (searchQuery && !tableNum.includes(searchQuery)) {
                    return null;
                  }

                  let bgStyle: React.CSSProperties = { backgroundColor: 'var(--tbl-idle)' };
                  let isReserved = false;
                  let isOccupied = false;
                  
                  if (status === 'OCCUPIED') {
                    bgStyle = { backgroundColor: 'var(--tbl-active)' };
                    isOccupied = true;
                  }
                  else if (status === 'RESERVED_ACTIVE') { 
                    bgStyle = { backgroundColor: 'var(--tbl-upcoming)' }; 
                    isReserved = true; 
                  }
                  else if (status === 'RESERVED_FUTURE') { 
                    bgStyle = { backgroundColor: 'var(--tbl-idle)', opacity: 0.8, borderStyle: 'dashed', borderWidth: '2px', borderColor: 'var(--tbl-upcoming)' }; 
                    isReserved = true; 
                  }

                  const isMainTable = primaryRes?.tableNumber === tableNum;

                  return (
                    <div 
                      key={tableNum} 
                      className={`relative p-5 rounded-3xl border border-white/10 transition-all duration-500 min-h-[160px] flex flex-col justify-between shadow-2xl hover:-translate-y-2 hover:shadow-[0_20px_40px_rgba(0,0,0,0.4)] group overflow-hidden ${isMainTable ? 'ring-2 ring-white/20' : ''}`} 
                      style={bgStyle}
                    >
                      <div className="absolute top-0 right-0 -mr-4 -mt-4 w-16 h-16 bg-white/5 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700"></div>
                      
                      <div className="flex justify-between items-start relative z-10">
                        <div className="flex flex-col">
                          <span className={`text-[8px] font-black uppercase opacity-60 text-white tracking-[0.2em]`}>TABLE</span>
                          <span className={`text-3xl font-black text-white leading-none tracking-tighter`}>{tableNum}</span>
                        </div>
                        {isOccupied && <div className="p-1.5 bg-white/20 rounded-lg backdrop-blur-md"><Users size={14} className="text-white" /></div>}
                        {isReserved && !isOccupied && <div className="p-1.5 bg-black/20 rounded-lg backdrop-blur-md"><Clock size={14} className="text-white" /></div>}
                      </div>

                      {primaryRes ? (
                        <div className="mt-4 relative z-10">
                          <div className="flex items-center gap-2 mb-2">
                            <div className={`h-1 w-8 rounded-full ${isOccupied ? 'bg-white' : 'bg-black/40'}`}></div>
                            <span className="text-[8px] font-black text-white uppercase tracking-widest opacity-70">
                              {isOccupied ? 'In Service' : 'Upcoming'}
                            </span>
                          </div>
                          
                          <p className={`font-black text-sm truncate uppercase text-white tracking-tight leading-tight mb-1`}>{primaryRes.guestName}</p>
                          
                          <div className="flex flex-wrap gap-2 mt-2">
                            <div className="flex items-center gap-1 bg-black/20 px-2 py-1 rounded-md border border-white/5">
                              <Clock size={10} className="text-white/70" />
                              <span className="text-[9px] font-black text-white">{primaryRes.arrivalTime}</span>
                            </div>
                            <div className="flex items-center gap-1 bg-black/20 px-2 py-1 rounded-md border border-white/5">
                              <Users size={10} className="text-white/70" />
                              <span className="text-[9px] font-black text-white">{primaryRes.guestCount}</span>
                            </div>
                          </div>

                          {isMainTable && (
                            <div className="mt-4 space-y-2 pt-3 border-t border-white/20">
                                {onEditMenu && (
                                  <button 
                                    onClick={(e) => { e.stopPropagation(); onEditMenu(primaryRes.id); }} 
                                    className={`w-full text-[9px] py-2 rounded-xl font-black uppercase flex items-center justify-center gap-1.5 transition-all active:scale-95 border shadow-md ${
                                      primaryRes.hasInputtedMenu 
                                        ? 'bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border-emerald-500/40' 
                                        : 'bg-gold-500 hover:bg-gold-400 text-black border-gold-400'
                                    }`}
                                    title={primaryRes.hasInputtedMenu ? "Edit Menu Terinput" : "Input Menu Tamu"}
                                  >
                                    <Utensils size={12} />
                                    <span>{primaryRes.hasInputtedMenu ? 'Menu Terinput (✓)' : 'Input Menu'}</span>
                                  </button>
                                )}
                                {isOccupied ? (
                                  <button 
                                    onClick={(e) => { e.stopPropagation(); onStatusChange?.(primaryRes.id, ReservationStatus.COMPLETED); }} 
                                    className="w-full bg-white/10 hover:bg-white/20 text-white text-[9px] py-2.5 rounded-xl font-black uppercase flex items-center justify-center gap-2 transition-all active:scale-95 border border-white/10"
                                  >
                                    <LogOut size={12} /> Check Out
                                  </button>
                                ) : (
                                  <button 
                                    onClick={(e) => { e.stopPropagation(); onStatusChange?.(primaryRes.id, ReservationStatus.CHECKED_IN); }} 
                                    className="w-full bg-black/40 hover:bg-black/60 text-white text-[9px] py-2.5 rounded-xl font-black uppercase flex items-center justify-center gap-2 transition-all active:scale-95 border border-white/10"
                                  >
                                    <LogIn size={12} /> Check In
                                  </button>
                                )}
                                <div className="flex gap-2">
                                    <button 
                                      title="Change Table"
                                      onClick={(e) => { e.stopPropagation(); setPicker({ type: 'CHANGE', resId: primaryRes.id, currentTable: tableNum, initialMergedTables: primaryRes.mergedTables || [], selectedTables: [tableNum, ...(primaryRes.mergedTables || [])], guestName: primaryRes.guestName, reservationDate: primaryRes.reservationDate, arrivalTime: primaryRes.arrivalTime }); }} 
                                      className="flex-1 bg-black/20 hover:bg-black/40 text-white text-[9px] py-2.5 rounded-xl font-black uppercase flex items-center justify-center gap-2 border border-white/5 transition-all"
                                    >
                                      <ArrowRightLeft size={12} />
                                    </button>
                                    <button 
                                      title="Merge Tables"
                                      onClick={(e) => { e.stopPropagation(); setPicker({ type: 'MERGE', resId: primaryRes.id, currentTable: tableNum, initialMergedTables: primaryRes.mergedTables || [], selectedTables: [tableNum, ...(primaryRes.mergedTables || [])], guestName: primaryRes.guestName, reservationDate: primaryRes.reservationDate, arrivalTime: primaryRes.arrivalTime }); }} 
                                      className="flex-1 bg-black/20 hover:bg-black/40 text-white text-[9px] py-2.5 rounded-xl font-black uppercase flex items-center justify-center gap-2 border border-white/5 transition-all"
                                    >
                                      <LinkIcon size={12} />
                                    </button>
                                </div>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="mt-4 pt-4 relative z-10">
                          <button 
                            onClick={(e) => { e.stopPropagation(); onQuickWalkIn?.(tableNum); }} 
                            className={`w-full text-[9px] py-4 rounded-2xl border border-white/10 bg-white/5 hover:bg-white/10 text-white font-black uppercase flex flex-col items-center justify-center gap-1 transition-all shadow-lg backdrop-blur-sm group/btn`}
                          >
                            <UserPlus size={16} className="group-hover/btn:scale-110 transition-transform" />
                            <span className="opacity-60">Walk In</span>
                          </button>
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

      {picker && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/90 backdrop-blur-xl p-4 animate-fade-in">
           <div className={`w-full max-w-6xl rounded-[3rem] border border-gold-500/30 bg-[#0a0a0a] shadow-[0_0_100px_rgba(0,0,0,0.8)] flex flex-col max-h-[95vh] overflow-hidden`}>
              <div className="p-8 border-b border-white/5 flex justify-between items-center bg-white/5">
                 <div className="flex items-center gap-6">
                    <div className={`p-4 rounded-3xl ${picker.type === 'CHANGE' ? 'bg-blue-600/20 text-blue-500' : 'bg-indigo-600/20 text-indigo-500'} border border-white/10 shadow-xl`}>
                       {picker.type === 'CHANGE' ? <ArrowRightLeft size={32}/> : <LinkIcon size={32}/>}
                    </div>
                    <div>
                        <h4 className="text-2xl font-serif font-black text-white uppercase tracking-tight">
                        {picker.type === 'CHANGE' ? 'TABLE MIGRATION' : 'TABLE MERGE MANAGER'}
                        </h4>
                        <div className="flex items-center gap-3 mt-1">
                          <span className="px-2 py-0.5 bg-gold-500/10 border border-gold-500/20 rounded text-[10px] font-black text-gold-500 uppercase tracking-widest">{picker.reservationDate}</span>
                          <span className="px-2 py-0.5 bg-gold-500/10 border border-gold-500/20 rounded text-[10px] font-black text-gold-500 uppercase tracking-widest">{picker.arrivalTime}</span>
                          <span className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Real-time Availability</span>
                        </div>
                    </div>
                 </div>
                 <button onClick={() => setPicker(null)} className="p-3 bg-white/5 text-gray-500 hover:text-red-500 hover:bg-red-500/10 rounded-2xl transition-all border border-white/5 active:scale-90"><X size={28}/></button>
              </div>

              <div className="flex-1 overflow-y-auto p-8 space-y-10 custom-scrollbar">
                 <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="md:col-span-2 bg-blue-500/5 border border-blue-500/20 p-6 rounded-3xl flex items-start gap-4 shadow-inner">
                       <div className="p-2 bg-blue-500/20 rounded-lg"><AlertCircle size={20} className="text-blue-500"/></div>
                       <div>
                          <p className="text-xs font-black uppercase text-blue-400 tracking-wider mb-1">Operational Directive</p>
                          <p className="text-[11px] font-medium text-gray-400 leading-relaxed">
                            {picker.type === 'CHANGE' 
                              ? `Relocating ${picker.guestName.toUpperCase()} from Table ${picker.currentTable}. Selecting a new table will immediately update the floor plan.` 
                              : `Merging additional tables for ${picker.guestName.toUpperCase()}. Current primary: Table ${picker.currentTable}.`}
                          </p>
                       </div>
                    </div>
                    <div className="bg-gold-500/5 border border-gold-500/20 p-6 rounded-3xl flex flex-col justify-center items-center text-center">
                       <span className="text-[10px] font-black text-gold-500 uppercase tracking-[0.2em] mb-1">Selected Tables</span>
                       <div className="flex flex-wrap justify-center gap-2">
                          {picker.selectedTables.map(t => (
                            <span key={t} className={`px-3 py-1 rounded-lg font-black text-sm ${t === picker.currentTable ? 'bg-gold-500 text-black' : 'bg-blue-600 text-white'}`}>{t}</span>
                          ))}
                          {picker.selectedTables.length === 0 && <span className="text-gray-600 font-black italic">None</span>}
                       </div>
                    </div>
                 </div>
                 
                 {settings.zones.map(zone => (
                    <div key={zone.id} className="space-y-6">
                       <div className="flex items-center gap-4">
                          <div className="h-px flex-1 bg-white/5"></div>
                          <h4 className="text-[12px] font-black text-gray-500 uppercase tracking-[0.3em] whitespace-nowrap">{zone.name}</h4>
                          <div className="h-px flex-1 bg-white/5"></div>
                       </div>
                       <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 xl:grid-cols-12 gap-3">
                          {Array.from({ length: zone.tableEnd - zone.tableStart + 1 }, (_, i) => (zone.tableStart + i).toString()).map(num => {
                             const isBusy = occupiedTablesSet.has(num);
                             const isSelected = picker.selectedTables.includes(num);
                             const isPrimary = isSelected && picker.selectedTables[0] === num;

                             return (
                                <button 
                                  key={num} 
                                  type="button"
                                  disabled={isBusy && !isSelected}
                                  onClick={() => {
                                      if (picker.type === 'CHANGE') {
                                          onTableChange?.(picker.resId, num, []);
                                          setPicker(null);
                                      } else {
                                          setPicker(prev => {
                                              if (!prev) return null;
                                              const isAlreadySelected = prev.selectedTables.includes(num);
                                              const newSelected = isAlreadySelected 
                                                  ? prev.selectedTables.filter(t => t !== num)
                                                  : [...prev.selectedTables, num];
                                              return { ...prev, selectedTables: newSelected };
                                          });
                                      }
                                  }}
                                  className={`h-20 rounded-2xl border-2 transition-all flex flex-col items-center justify-center gap-1 active:scale-90 relative group/tbl-btn ${
                                      isBusy && !isSelected ? 'bg-black/40 border-white/5 text-gray-800 opacity-30 cursor-not-allowed grayscale' :
                                      isSelected ? (isPrimary ? 'bg-gold-500 border-gold-400 text-black shadow-[0_0_20px_rgba(212,175,55,0.3)]' : 'bg-blue-600 border-blue-500 text-white shadow-[0_0_20px_rgba(37,99,237,0.3)]') :
                                      'bg-white/5 border-white/5 text-gray-500 hover:border-gold-500/40 hover:bg-white/10'
                                  }`}
                                >
                                   <span className="text-[8px] font-black opacity-60 uppercase tracking-tighter">TBL</span>
                                   <span className="text-2xl font-black tracking-tighter">{num}</span>
                                   {isBusy && !isSelected && <span className="absolute bottom-1 text-[7px] font-black uppercase text-red-900">BUSY</span>}
                                   {isSelected && (
                                       <span className="absolute bottom-1 text-[7px] font-black uppercase">
                                           {isPrimary ? 'PRIMARY' : 'MERGED'}
                                       </span>
                                   )}
                                </button>
                             );
                          })}
                       </div>
                    </div>
                 ))}
              </div>

              <div className="p-8 border-t border-white/5 bg-white/5 flex flex-col sm:flex-row justify-between items-center gap-6">
                 <div className="flex items-center gap-8">
                    <div className="flex items-center gap-3">
                        <div className="w-4 h-4 bg-gold-500 rounded-lg shadow-lg shadow-gold-500/20"></div>
                        <span className="text-[11px] font-black text-gray-400 uppercase tracking-widest">Primary Table</span>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="w-4 h-4 bg-blue-600 rounded-lg shadow-lg shadow-blue-600/20"></div>
                        <span className="text-[11px] font-black text-gray-400 uppercase tracking-widest">Merged Tables</span>
                    </div>
                    <div className="flex items-center gap-3 opacity-40">
                        <div className="w-4 h-4 bg-black/40 border border-white/10 rounded-lg"></div>
                        <span className="text-[11px] font-black text-gray-400 uppercase tracking-widest">Occupied</span>
                    </div>
                 </div>
                 <div className="flex gap-4 w-full sm:w-auto">
                    <button onClick={() => setPicker(null)} className="flex-1 sm:flex-none px-10 py-4 bg-white/5 hover:bg-white/10 text-white rounded-2xl font-black uppercase text-[10px] tracking-[0.2em] transition-all border border-white/10">Cancel</button>
                    {picker.type === 'MERGE' && (
                      <button 
                          disabled={picker.selectedTables.length === 0}
                          onClick={() => {
                              onMergeTable?.(picker.resId, picker.selectedTables);
                              setPicker(null);
                          }} 
                          className="flex-1 sm:flex-none px-12 py-4 bg-gold-500 hover:bg-gold-400 disabled:opacity-50 disabled:cursor-not-allowed text-black rounded-2xl font-black uppercase text-[10px] tracking-[0.2em] transition-all shadow-[0_10px_30px_rgba(212,175,55,0.3)] active:scale-95"
                      >
                          Confirm Merge
                      </button>
                    )}
                 </div>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default FloorPlan;
