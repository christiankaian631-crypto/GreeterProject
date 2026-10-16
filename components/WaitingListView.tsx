
// @ts-nocheck
import React, { useState, useEffect, useMemo } from 'react';
import { WaitingListEntry, WaitingStatus, AppSettings, Reservation, ReservationStatus } from '../types';
import { Clock, Users, UserPlus, ArrowLeft, Check, X, Timer, LayoutGrid, Phone, MapPin, AlertCircle, Sparkles, Hourglass, Hash, Star, Lock, Share2, Loader2, ChevronRight } from 'lucide-react';
import { generateQueueTicketPDF, exportVisualToPDF, exportVisualToHTML, exportVisualToImage } from '../services/pdfService';
import { ExportActions } from './ExportActions';

interface Props {
  waitingList: WaitingListEntry[];
  reservations: Reservation[];
  onAddWaiting: (entry: Omit<WaitingListEntry, 'id' | 'joinedAt' | 'status' | 'reservationDate'>) => void;
  onSeatWaiting: (entryId: string, tableNum: string) => void;
  onCancelWaiting: (entryId: string) => void;
  settings: AppSettings;
  isDarkMode?: boolean;
  onBack: () => void;
}

const WaitingListView: React.FC<Props> = ({ waitingList, reservations, onAddWaiting, onSeatWaiting, onCancelWaiting, settings, isDarkMode, onBack }) => {
  const [formData, setFormData] = useState({ guestName: '', guestCount: 2, preferredTable: '', phoneNumber: '' });
  const [currentTime, setCurrentTime] = useState(Date.now());
  const [isAssigningId, setIsAssigningId] = useState<string | null>(null);
  const [selectedTable, setSelectedTable] = useState('');
  const [sharingId, setSharingId] = useState<string | null>(null);

  useEffect(() => {
    const interval = setInterval(() => setCurrentTime(Date.now()), 10000);
    return () => clearInterval(interval);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.guestName || !formData.preferredTable) return;
    onAddWaiting(formData);
    setFormData({ guestName: '', guestCount: 2, preferredTable: '', phoneNumber: '' });
  };

  const getWaitTime = (timestamp: number) => {
    return Math.floor((currentTime - timestamp) / 60000);
  };

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
  };

  const handleShareTicket = async (entry: WaitingListEntry) => {
    setSharingId(entry.id);
    await generateQueueTicketPDF(entry, settings.zones[0]?.name || "JUSTUS STEAKHOUSE", true);
    setSharingId(null);
  };

  const activeWaiting = useMemo(() => {
    return waitingList
      .filter(w => w.status === WaitingStatus.WAITING && w.reservationDate === new Date().toISOString().split('T')[0])
      .sort((a, b) => a.joinedAt - b.joinedAt);
  }, [waitingList]);

  const occupiedTablesSet = useMemo(() => {
    const set = new Set<string>();
    const todayStr = new Date().toISOString().split('T')[0];
    const now = new Date();

    reservations.forEach(r => {
      if (r.reservationDate !== todayStr) return;
      if (r.status === ReservationStatus.CHECKED_IN) {
        if (r.tableNumber) set.add(r.tableNumber);
        r.mergedTables?.forEach(t => set.add(t));
      }
      if (r.status === ReservationStatus.CONFIRMED) {
        const [hours, minutes] = r.arrivalTime.split(':').map(Number);
        const resTime = new Date(now);
        resTime.setHours(hours, minutes, 0, 0);
        const diffMinutes = (resTime.getTime() - now.getTime()) / (1000 * 60);
        if (diffMinutes <= 60) {
            if (r.tableNumber) set.add(r.tableNumber);
            r.mergedTables?.forEach(t => set.add(t));
        }
      }
    });
    return set;
  }, [reservations]);

  const activeAssignGuest = useMemo(() => 
    waitingList.find(w => w.id === isAssigningId)
  , [waitingList, isAssigningId]);

  return (
    <div className="animate-fade-in space-y-8 pb-32">
      <div className={`p-8 rounded-[2.5rem] border flex flex-col lg:flex-row justify-between items-center gap-8 shadow-2xl ${isDarkMode ? 'bg-dark-800 border-gold-900/30' : 'bg-white border-gray-200'}`}>
        <div className="flex items-center gap-6">
          <button onClick={onBack} className="p-4 hover:bg-gold-500 hover:text-black rounded-2xl transition-all border border-gold-500/20 text-gold-500 bg-gold-500/5">
            <ArrowLeft size={24} />
          </button>
          <div>
            <h2 className={`text-3xl font-serif font-black uppercase tracking-tighter ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Waiting List</h2>
            <p className="text-[10px] text-amber-500 font-black uppercase tracking-[0.4em] mt-1">Live Queue Management</p>
          </div>
        </div>
        <div className="flex flex-col md:flex-row items-center gap-6">
            <ExportActions 
              onExportPDF={() => exportVisualToPDF('waiting-list-container', 'Waiting_List_Report')}
              onExportHTML={() => exportVisualToHTML('waiting-list-container', 'Waiting_List_Report')}
              onExportImage={() => exportVisualToImage('waiting-list-container', 'Waiting_List_Report')}
              onShareWA={() => exportVisualToPDF('waiting-list-container', 'Waiting_List_Report', true)}
            />
            <div className={`px-10 py-4 rounded-3xl border flex flex-col items-center min-w-[180px] shadow-lg ${isDarkMode ? 'bg-dark-900 border-gold-800 text-gold-500' : 'bg-gray-50 border-gray-200 text-gray-700'}`}>
                <span className="text-[9px] uppercase font-black text-gray-500 tracking-widest mb-1">QUEUE VOLUME</span>
                <span className="font-sans text-4xl font-black">{activeWaiting.length}</span>
            </div>
        </div>
      </div>

      <div id="waiting-list-container" className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className={`lg:col-span-1 p-8 rounded-[2.5rem] border shadow-xl h-fit sticky top-32 ${isDarkMode ? 'bg-dark-800 border-white/5' : 'bg-white border-gray-200'}`}>
           <div className="flex items-center gap-3 mb-8">
              <div className="p-2 bg-amber-500 text-black rounded-lg shadow-lg"><UserPlus size={18}/></div>
              <h3 className="text-sm font-black uppercase tracking-widest">Register New Queue</h3>
           </div>
           
           <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-gray-500 tracking-widest">Nama Tamu</label>
                <input required type="text" value={formData.guestName} onChange={(e) => setFormData({...formData, guestName: e.target.value.toUpperCase()})} className="w-full bg-dark-900 border border-white/10 rounded-xl px-4 py-4 text-white font-sans font-black text-sm focus:border-gold-500 outline-none" placeholder="MR. GUEST..." />
              </div>

              <div className="space-y-3">
                <label className="text-[10px] font-black uppercase text-gray-500 tracking-widest">Pilih Area Prioritas</label>
                <div className="grid grid-cols-1 gap-2">
                    {settings.zones.map(z => (
                        <button 
                            key={z.id} 
                            type="button" 
                            onClick={() => setFormData({...formData, preferredTable: z.name})}
                            className={`p-4 rounded-xl border text-left flex items-center justify-between transition-all ${formData.preferredTable === z.name ? 'bg-gold-500 text-black border-gold-500 shadow-lg' : 'bg-black/20 border-white/5 text-gray-500 hover:border-gold-500/50'}`}
                        >
                            <div className="flex items-center gap-3">
                                <MapPin size={16} className={formData.preferredTable === z.name ? 'text-black' : 'text-gold-500'} />
                                <span className="text-[10px] font-sans font-black uppercase tracking-widest">{z.name}</span>
                            </div>
                            {formData.preferredTable === z.name && <Check size={14} strokeWidth={4} />}
                        </button>
                    ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-gray-500 tracking-widest">Pax</label>
                  <input required type="number" min="1" value={formData.guestCount} onChange={(e) => setFormData({...formData, guestCount: parseInt(e.target.value) || 0})} className="w-full bg-dark-900 border border-white/10 rounded-xl px-4 py-4 text-white font-sans font-black text-lg focus:border-gold-500 outline-none" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-gray-500 tracking-widest">Phone</label>
                  <input type="text" value={formData.phoneNumber} onChange={(e) => setFormData({...formData, phoneNumber: e.target.value})} className="w-full bg-dark-900 border border-white/10 rounded-xl px-4 py-4 text-white text-sm font-sans focus:border-gold-500 outline-none" placeholder="08..." />
                </div>
              </div>

              <button type="submit" className="w-full py-5 bg-amber-600 hover:bg-amber-500 text-white rounded-2xl font-black uppercase text-[11px] tracking-[0.2em] shadow-2xl transition-all active:scale-95 flex items-center justify-center gap-3">
                <Check size={18} /> Join Waiting List
              </button>
           </form>
        </div>

        <div className="lg:col-span-2 space-y-6">
           {activeWaiting.length === 0 ? (
             <div className={`p-24 text-center border-2 border-dashed rounded-[3.5rem] flex flex-col items-center justify-center gap-4 ${isDarkMode ? 'border-white/5 bg-black/20 opacity-20' : 'bg-gray-50'}`}>
                <Clock size={80} strokeWidth={1} className="text-gray-400" />
                <p className="font-black uppercase tracking-[0.5em] text-xs">No Guests in Queue</p>
             </div>
           ) : (
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {activeWaiting.map((guest, index) => {
                  const waitTime = getWaitTime(guest.joinedAt);
                  const isFirst = index === 0;
                  
                  let urgencyColor = 'text-emerald-500';
                  let urgencyBg = 'bg-emerald-500/10';
                  let urgencyBorder = 'border-emerald-500/20';
                  let isOverLimit = false;

                  if (waitTime >= 10) { urgencyColor = 'text-red-500'; urgencyBg = 'bg-red-500/10'; urgencyBorder = 'border-red-500/50 shadow-red-500/20'; isOverLimit = true; }
                  else if (waitTime >= 5) { urgencyColor = 'text-amber-500'; urgencyBg = 'bg-amber-500/10'; urgencyBorder = 'border-amber-500/30'; }

                  return (
                    <div key={guest.id} className={`group p-8 rounded-[2.5rem] border transition-all duration-300 relative overflow-hidden shadow-xl ${isDarkMode ? 'bg-dark-800 border-white/5 hover:border-gold-500/20' : 'bg-white border-gray-200'} ${isFirst ? 'ring-2 ring-gold-500/30 ring-offset-4 ring-offset-dark-950' : ''}`}>
                        <div className={`absolute top-0 right-0 px-6 py-2 rounded-bl-[2rem] font-sans font-black text-[10px] tracking-widest flex items-center gap-1.5 shadow-lg ${isFirst ? (isOverLimit ? 'bg-red-600 text-white' : 'bg-gold-500 text-black') : 'bg-white/5 text-gray-500'}`}>
                           <Hash size={12}/> {index + 1} {isFirst ? (isOverLimit ? 'CRITICAL' : 'NEXT') : ''}
                        </div>
                        <div className={`absolute top-0 left-0 bottom-0 w-1.5 ${urgencyColor.replace('text', 'bg')}`}></div>
                        <div className="flex justify-between items-start mb-8 mt-2">
                           <div className="space-y-2">
                              <h4 className={`text-2xl font-serif font-black uppercase tracking-tight truncate max-w-[200px] ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{guest.guestName}</h4>
                              <div className="flex flex-wrap items-center gap-2">
                                <span className={`text-[9px] font-sans font-black uppercase tracking-widest flex items-center gap-1.5 px-3 py-1 rounded-lg bg-white/5 text-gray-400`}><Users size={12}/> {guest.guestCount} PAX</span>
                                <span className="text-[9px] font-sans font-black text-gold-500 uppercase tracking-widest flex items-center gap-1.5 px-3 py-1 rounded-lg bg-gold-500/10 border border-gold-500/20"><MapPin size={12}/> {guest.preferredTable}</span>
                                {guest.phoneNumber && (
                                  <span className="text-[9px] font-sans font-black text-cyan-500 uppercase tracking-widest flex items-center gap-1.5 px-3 py-1 rounded-lg bg-cyan-500/10 border border-cyan-500/20">
                                    <Phone size={12}/> {guest.phoneNumber}
                                  </span>
                                )}
                              </div>
                           </div>
                           <div className="flex flex-col items-end gap-2">
                              <button onClick={() => handleShareTicket(guest)} disabled={sharingId === guest.id} className="p-2.5 bg-emerald-600/10 text-emerald-500 rounded-xl border border-emerald-600/20 hover:bg-emerald-600 hover:text-white transition-all shadow-lg active:scale-95">{sharingId === guest.id ? <Loader2 size={16} className="animate-spin" /> : <Share2 size={16} />}</button>
                              <div className={`flex flex-col items-end gap-1 ${urgencyColor}`}><div className={`p-2 rounded-xl ${urgencyBg} ${urgencyBorder} border`}><Timer size={20}/></div><span className="text-lg font-sans font-black leading-none">{waitTime}m</span></div>
                           </div>
                        </div>
                        <div className={`mb-8 p-4 rounded-2xl flex justify-between items-center border ${isDarkMode ? 'bg-black/20 border-white/5' : 'bg-gray-50 border-gray-100'}`}>
                           <div className="flex flex-col"><span className="text-[8px] font-black text-gray-500 uppercase tracking-widest mb-1">Joined At</span><div className="flex items-center gap-1.5"><Clock size={12} className="text-blue-400" /><span className={`text-sm font-sans font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{formatTime(guest.joinedAt)}</span></div></div>
                           <div className="h-8 w-px bg-white/5"></div>
                           <div className="flex flex-col items-end text-right"><span className="text-[8px] font-black text-gray-500 uppercase tracking-widest mb-1">Waiting For</span><div className="flex items-center gap-1.5"><Hourglass size={12} className={urgencyColor} /><span className={`text-sm font-sans font-black ${urgencyColor}`}>{waitTime} Minutes</span></div></div>
                        </div>
                        <div className="grid grid-cols-2 gap-4 pt-2">
                           <button onClick={() => setIsAssigningId(guest.id)} className={`py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest flex items-center justify-center gap-2 transition-all shadow-lg active:scale-95 ${isOverLimit ? 'bg-red-600 hover:bg-red-500 text-white' : isFirst ? 'bg-gold-500 hover:bg-gold-400 text-black' : 'bg-emerald-600 hover:bg-emerald-500 text-white'}`}><LayoutGrid size={14}/> Seat Guest</button>
                           <button onClick={() => onCancelWaiting(guest.id)} className="py-4 bg-white/5 text-gray-500 hover:text-red-500 rounded-2xl font-black uppercase text-[10px] tracking-widest flex items-center justify-center gap-2 border border-white/5"><X size={14}/> Cancel</button>
                        </div>
                    </div>
                  );
                })}
             </div>
           )}
        </div>
      </div>

      {isAssigningId && activeAssignGuest && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 backdrop-blur-xl p-4 animate-fade-in">
           <div className={`w-full max-w-6xl rounded-[3rem] border border-gold-500/30 bg-dark-900 shadow-2xl overflow-hidden flex flex-col max-h-[95vh]`}>
              <div className="p-6 border-b border-white/5 bg-dark-800/50 flex justify-between items-center">
                 <div className="flex items-center gap-4">
                    <div className="p-3 rounded-2xl bg-gold-500/10 text-gold-500 shadow-inner"><LayoutGrid size={24} /></div>
                    <div>
                       <h4 className="text-xl font-serif font-black uppercase tracking-tighter text-white">Table Navigator: Seating</h4>
                       <div className="flex items-center gap-3 mt-0.5">
                          <p className="text-[10px] font-sans font-black text-gold-500 uppercase tracking-widest flex items-center gap-1.5"><MapPin size={12}/> Preferred: {activeAssignGuest.preferredTable}</p>
                          <div className="h-3 w-px bg-white/10"></div>
                          <p className="text-[10px] font-sans font-black text-gray-400 uppercase tracking-widest flex items-center gap-1.5"><Users size={12}/> {activeAssignGuest.guestName} ({activeAssignGuest.guestCount} PAX)</p>
                       </div>
                    </div>
                 </div>
                 <button onClick={() => { setIsAssigningId(null); setSelectedTable(''); }} className="p-2 bg-white/5 text-gray-500 hover:text-red-500 rounded-full transition-all border border-white/5"><X size={24} /></button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 custom-scrollbar bg-dark-900/50 space-y-8">
                 <div className="bg-red-900/10 border border-red-500/20 p-3 rounded-xl flex items-center gap-3 shadow-inner">
                    <AlertCircle size={18} className="text-red-500 shrink-0" />
                    <p className="text-[9px] font-sans font-black uppercase text-red-400 tracking-wider leading-relaxed">PENTING: Meja dengan status 'BUSY' sedang melayani tamu lain atau reservasi yang akan datang dalam 2 jam.</p>
                 </div>
                 
                 {settings.zones.map((zone) => {
                    const isPreferred = zone.name === activeAssignGuest.preferredTable;
                    return (
                        <div key={zone.id} className="space-y-4">
                           <div className="flex items-center justify-between border-b border-white/10 pb-2">
                              <div className="flex items-center gap-3">
                                 <div className="w-1.5 h-4 bg-gold-500 rounded-full"></div>
                                 <h4 className={`text-[11px] font-black uppercase tracking-tight ${isPreferred ? 'text-gold-500' : 'text-white'}`}>{zone.name}</h4>
                              </div>
                              {isPreferred && <div className="flex items-center gap-2 bg-gold-500 text-black px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest animate-pulse font-sans"><Star size={10} fill="currentColor" /> Choice</div>}
                           </div>
                           <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-2">
                                {Array.from({ length: zone.tableEnd - zone.tableStart + 1 }, (_, i) => (zone.tableStart + i).toString()).map(num => {
                                    const isActive = occupiedTablesSet.has(num);
                                    const isPicked = selectedTable === num;
                                    return (
                                        <button 
                                            key={num} 
                                            disabled={isActive}
                                            onClick={() => setSelectedTable(num)}
                                            className={`h-16 rounded-xl font-black border-2 transition-all relative flex flex-col items-center justify-center gap-0.5 active:scale-90 ${
                                                isActive ? 'bg-black/40 border-white/5 text-gray-700 cursor-not-allowed opacity-30 grayscale' :
                                                isPicked ? 'bg-gold-500 text-black border-gold-500 shadow-xl scale-105' : 
                                                'bg-dark-800 border-white/5 text-gray-400 hover:border-gold-500/60'
                                            }`}
                                        >
                                            <span className="text-[7px] font-sans font-black opacity-60 uppercase tracking-tighter">TBL</span>
                                            <span className="text-xl font-sans font-black">{num}</span>
                                            {isActive && <span className="text-[6px] font-sans font-black uppercase text-red-900 mt-0.5">BUSY</span>}
                                            {isPicked && <div className="absolute top-1 right-1 bg-black text-gold-500 p-0.5 rounded-full"><Check size={8} strokeWidth={4} /></div>}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    );
                 })}
              </div>

              <div className="p-6 border-t border-white/5 bg-dark-800/80 flex gap-3">
                 <button onClick={() => { setIsAssigningId(null); setSelectedTable(''); }} className="flex-1 py-4 bg-white/5 text-gray-500 hover:text-white rounded-[1.5rem] font-black uppercase text-[9px] tracking-[0.2em]">Cancel Seating</button>
                 <button disabled={!selectedTable} onClick={() => { onSeatWaiting(isAssigningId!, selectedTable); setIsAssigningId(null); setSelectedTable(''); }} className="flex-[2] py-4 bg-gold-500 text-black rounded-[1.5rem] font-black uppercase text-[10px] tracking-[0.2em] shadow-xl disabled:opacity-30 flex items-center justify-center gap-2"><Check size={18} strokeWidth={3} /> Finalize Table {selectedTable || '?'}</button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default WaitingListView;
