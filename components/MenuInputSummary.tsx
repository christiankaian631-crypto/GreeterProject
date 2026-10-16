
import React, { useMemo, useState } from 'react';
import { Reservation, AppSettings } from '../types';
import { MENU_DATA_BANDUNG, MENU_DATA_JAKARTA } from './MenuList';
import { 
  Calendar, 
  Clock, 
  MapPin, 
  Users, 
  CheckCircle, 
  Trash2, 
  Receipt, 
  Utensils, 
  ChevronRight, 
  Calculator, 
  Printer, 
  Loader2, 
  MessageSquare, 
  Share2, 
  ArrowLeft,
  Eye,
  X,
  Tag,
  Check,
  Pencil
} from 'lucide-react';
import { generateOrderChecklistPDF } from '../services/pdfService';

interface Props {
  reservations: Reservation[];
  isDarkMode?: boolean;
  onRemoveStatus: (id: string) => void;
  onGoToBill?: (guestName: string, date: string) => void;
  onEdit?: (id: string) => void;
  onBack?: () => void;
  settings?: AppSettings;
  outletName?: string;
}

const MenuInputSummary: React.FC<Props> = ({ reservations, isDarkMode, onRemoveStatus, onGoToBill, onEdit, onBack, settings, outletName }) => {
  const [isPrintingId, setIsPrintingId] = useState<string | null>(null);
  const [isSharingId, setIsSharingId] = useState<string | null>(null);
  const [previewData, setPreviewData] = useState<Reservation | null>(null);

  const groupedInputtedGuests = useMemo(() => {
    const inputted = reservations.filter(r => r.hasInputtedMenu);
    const groups: Record<string, Reservation[]> = {};
    inputted.forEach(res => {
      if (!groups[res.reservationDate]) groups[res.reservationDate] = [];
      groups[res.reservationDate].push(res);
    });
    return Object.keys(groups).sort().map(date => ({
      date,
      items: groups[date].sort((a, b) => a.arrivalTime.localeCompare(b.arrivalTime))
    }));
  }, [reservations]);

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  };

  const handlePrintOrderPDF = async (res: Reservation) => {
    setIsPrintingId(res.id);
    await generateOrderChecklistPDF(res, false, outletName, settings);
    setIsPrintingId(null);
  };

  const handleShareOrderPDF = async (res: Reservation) => {
    setIsSharingId(res.id);
    await generateOrderChecklistPDF(res, true, outletName, settings);
    setIsSharingId(null);
  };

  const sortMenuStringsByCondiments = (menuList: string[]) => {
    const foodPriority = [
      'SALAD',
      'SOUP',
      'LIGHT MEAL',
      'KIDS MEAL',
      'SPECIALTY STEAK',
      'PRIME SELECTION',
      'BIG CUT',
      'FAMILY SET',
      'WESTERN DELIGHT',
      'PASTA LOVERS',
      'ASIAN DELIGHT',
      'INDONESIAN FAVORITE',
      'BURGER & SANDWICH',
      'NPD',
      'DESSERT'
    ];
    const beveragePriority = [
      'JUICE',
      'SMOOTHIES',
      'DRINKING & MINERAL WATER',
      'MILKSHAKE',
      'SOFT DRINK',
      'FRAPPE',
      'ARTISAN TEA',
      'TEA',
      'COFFEE',
      'MANUAL BREW',
      'CHOCOLATE',
      'ICED BLENDED',
      'MOCKTAIL',
      'FREE MENU'
    ];

    const getCondimentCount = (str: string) => {
      const match = str.match(/\((.*?)\)/);
      if (!match || !match[1]) return 0;
      return match[1].split(', ').length;
    };

    const getItemData = (itemStr: string) => {
      const cleanStr = itemStr.replace(/\s\[Note:\s.*\]$/, '');
      const [mainPart] = cleanStr.replace(/\(\s*\d+\s*PERSON\s*\)/gi, '').trim().split(' (');
      const baseName = mainPart.replace(/^\d+x\s+/, '').trim();
      
      let category = 'OTHERS';
      const allPossibleMenu = [...MENU_DATA_JAKARTA, ...MENU_DATA_BANDUNG, ...(settings?.customMenu || [])];
      const menuItem = allPossibleMenu.find(m => m.name === baseName);
      if (menuItem) category = menuItem.category.toUpperCase();
      else {
        const upperName = baseName.toUpperCase();
        const freeBeverages = ['FREE ICE TEA', 'FREE ICE LEMON TEA', 'FREE CASSAVANOVA', 'FREE ORANG JUICE', 'FREE SWEET LAVANDULA'];
        const freeDesserts = ['FREE BROWNIES CHEEZIE SUNDAE', 'FREE ICE CREAM VANILA', 'FREE ICE CREAM COKELAT', 'FREE ICE CREAM STAWBERRY'];

        if (freeBeverages.some(f => upperName.includes(f))) category = 'TEA';
        else if (freeDesserts.some(f => upperName.includes(f))) category = 'DESSERT';
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
        isBeverage: bevIdx !== -1,
        isDessert,
        priorityIndex: foodIdx !== -1 ? foodIdx : (bevIdx !== -1 ? bevIdx : 999),
        condimentCount: getCondimentCount(itemStr)
      };
    };

    return [...menuList].sort((a, b) => {
      const dataA = getItemData(a);
      const dataB = getItemData(b);

      const getGroupOrder = (d: any) => {
        if (!d.isBeverage && !d.isDessert) return 0;
        if (d.isDessert) return 1;
        return 2;
      };

      const orderA = getGroupOrder(dataA);
      const orderB = getGroupOrder(dataB);

      if (orderA !== orderB) return orderA - orderB;
      
      // 2. Within Food/Dessert: Fewer condiments first
      if (!dataA.isBeverage && dataA.condimentCount !== dataB.condimentCount) {
        return dataA.condimentCount - dataB.condimentCount;
      }
      
      // 3. Then by priority index
      if (dataA.priorityIndex !== dataB.priorityIndex) return dataA.priorityIndex - dataB.priorityIndex;
      
      // 4. Finally by name
      return a.localeCompare(b);
    });
  };

  return (
    <div className="space-y-8 animate-fade-in pb-20">
      <div className={`p-8 rounded-[2.5rem] border flex flex-col md:flex-row justify-between items-center gap-6 shadow-2xl ${isDarkMode ? 'bg-dark-800 border-gold-900/30' : 'bg-white border-gray-200'}`}>
        <div className="flex items-center gap-6">
          {onBack && (
             <button onClick={onBack} className="p-4 hover:bg-gold-500 hover:text-black rounded-2xl transition-all border border-gold-500/20 text-gold-500 bg-gold-500/5">
               <ArrowLeft size={24} />
             </button>
          )}
          <div className={`p-4 rounded-2xl border shadow-lg ${isDarkMode ? 'bg-emerald-900/20 border-emerald-500' : 'bg-emerald-50 border-emerald-200'}`}>
            <Receipt className="text-emerald-500" size={32} />
          </div>
          <div>
            <h2 className={`text-3xl font-serif font-black uppercase tracking-tighter ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Checkmark Order</h2>
            <p className="text-[10px] text-emerald-600 uppercase tracking-[0.4em] font-black mt-1">{outletName || 'Digital Kitchen Queue'}</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
            <div className={`px-6 py-3 rounded-2xl border flex flex-col items-center ${isDarkMode ? 'bg-dark-900 border-gold-800 text-gold-500' : 'bg-gray-50 border-gray-200 text-gray-700'}`}>
                <span className="text-[9px] uppercase font-black text-gray-500 tracking-widest mb-1">TOTAL QUEUE</span>
                <span className="font-mono text-2xl font-black">{reservations.filter(r => r.hasInputtedMenu).length}</span>
            </div>
        </div>
      </div>

      {groupedInputtedGuests.length === 0 ? (
        <div className={`py-32 text-center border border-dashed rounded-[3rem] ${isDarkMode ? 'border-dark-700 bg-dark-900/50' : 'border-gray-200 bg-gray-50'}`}>
          <div className="flex flex-col items-center gap-4 opacity-30">
            <Utensils size={64} className="text-gray-500" />
            <p className="text-gray-500 font-black uppercase tracking-[0.5em] text-xs">Belum ada antrean menu</p>
          </div>
        </div>
      ) : (
        <div className="space-y-16">
          {groupedInputtedGuests.map((group) => (
            <div key={group.date} className="space-y-6">
              <div className="flex items-center gap-6">
                 <div className={`h-[1px] flex-1 ${isDarkMode ? 'bg-white/5' : 'bg-gray-200'}`}></div>
                 <h3 className={`text-[10px] font-black uppercase tracking-[0.4em] px-8 py-2 rounded-full border shadow-xl ${isDarkMode ? 'bg-dark-950 border-gold-900/40 text-gold-400' : 'bg-white border-gray-200 text-gray-600'}`}>{formatDate(group.date)}</h3>
                 <div className={`h-[1px] flex-1 ${isDarkMode ? 'bg-white/5' : 'bg-gray-200'}`}></div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {group.items.map((res) => (
                  <div key={res.id} className={`group border rounded-[2.5rem] p-8 relative overflow-hidden transition-all duration-500 hover:shadow-2xl hover:border-emerald-500/30 ${isDarkMode ? 'bg-dark-800 border-white/5' : 'bg-white border-gray-200'}`}>
                    <div className="absolute top-0 right-0 p-6 flex gap-3">
                      <button 
                        onClick={() => setPreviewData(res)} 
                        className="bg-blue-600 hover:bg-blue-500 text-white p-3 rounded-xl shadow-lg transition-all active:scale-95 flex items-center justify-center" 
                        title="Live Preview"
                      >
                        <Eye size={18} />
                      </button>
                      {onEdit && (
                        <button 
                          onClick={() => onEdit(res.id)} 
                          className="bg-indigo-600 hover:bg-indigo-500 text-white p-3 rounded-xl shadow-lg transition-all active:scale-95 flex items-center justify-center" 
                          title="Edit Menu"
                        >
                          <Pencil size={18} />
                        </button>
                      )}
                      <button onClick={() => handleShareOrderPDF(res)} className={`p-3 rounded-xl shadow-lg bg-green-700 hover:bg-green-600 text-white transition-all active:scale-95`} title="Share Order PDF">{isSharingId === res.id ? <Loader2 size={18} className="animate-spin" /> : <Share2 size={18} />}</button>
                      <button onClick={() => handlePrintOrderPDF(res)} className={`p-3 rounded-xl shadow-lg bg-gray-900 hover:bg-black text-white transition-all active:scale-95 border border-white/5`} title="Download Order PDF">{isPrintingId === res.id ? <Loader2 size={18} className="animate-spin" /> : <Printer size={18} />}</button>
                      {onGoToBill && <button onClick={() => onGoToBill(res.guestName, res.reservationDate)} className="bg-gold-500 hover:bg-gold-400 text-black p-3 rounded-xl shadow-lg transition-all active:scale-95" title="Generate Bill"><Calculator size={18} /></button>}
                    </div>
                    
                    <div className="space-y-6">
                      <div className="border-b pb-6 border-white/5">
                        <p className="text-[9px] font-black text-emerald-500 uppercase tracking-[0.3em] mb-1">Guest Identification</p>
                        <h4 className={`font-serif font-black text-2xl uppercase truncate pr-40 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{res.guestName}</h4>
                        <div className="flex items-center gap-3 mt-3">
                            <span className={`text-[10px] font-black px-3 py-1 rounded-lg border uppercase tracking-widest ${isDarkMode ? 'bg-dark-900 border-gold-800/40 text-gold-500' : 'bg-gray-50 border-gray-200 text-gray-600'}`}>
                                {res.tableNumber ? `TABLE ${res.tableNumber}` : res.locationPreference}
                            </span>
                            <span className="text-[10px] font-black px-3 py-1 rounded-lg border uppercase tracking-widest bg-emerald-500/10 text-emerald-500 border-emerald-500/20">
                                {res.guestCount} PAX • {res.arrivalTime} WIB
                            </span>
                        </div>
                      </div>

                      <div className="space-y-3">
                        {sortMenuStringsByCondiments(res.orderedMenuItems || []).slice(0, 3).map((itemStr, idx) => {
                          const noteMatch = itemStr.match(/\s\[Note:\s(.*)\]$/);
                          const noteText = noteMatch ? noteMatch[1] : null;
                          const stringWithoutNote = noteText ? itemStr.replace(/\s\[Note:\s.*\]$/, '') : itemStr;
                          const [main, detail] = stringWithoutNote.split(' (');
                          return (
                            <div key={idx} className={`p-4 rounded-2xl border ${isDarkMode ? 'bg-black/20 border-white/5' : 'bg-gray-50 border-gray-100'}`}>
                              <p className={`text-sm font-black uppercase ${isDarkMode ? 'text-gray-100' : 'text-gray-800'}`}>{main.replace(/\(\s*\d+\s*PERSON\s*\)/gi, '').trim()}</p>
                              {detail && <p className="text-[10px] text-emerald-500 italic uppercase font-bold tracking-tight mt-1">{detail.replace(/\(\s*\d+\s*PERSON\s*\)/gi, '').replace(')', '').trim()}</p>}
                            </div>
                          );
                        })}
                        {(res.orderedMenuItems?.length || 0) > 3 && (
                            <p className="text-center text-[10px] font-black text-gray-500 uppercase tracking-widest py-2">
                                + {(res.orderedMenuItems?.length || 0) - 3} Items Lainnya
                            </p>
                        )}
                        {res.menuNotes && <div className={`mt-4 p-4 rounded-2xl border border-dashed ${isDarkMode ? 'bg-black/30 border-gold-900/50' : 'bg-gray-50 border-gray-200'}`}><p className="text-[9px] font-black text-gold-600 uppercase mb-1 flex items-center gap-1"><MessageSquare size={10}/> Order Instructions</p><p className={`text-xs italic font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>"{res.menuNotes}"</p></div>}
                      </div>

                      <div className={`pt-6 border-t flex justify-end items-center ${isDarkMode ? 'border-white/5' : 'border-gray-100'}`}>
                          <button onClick={() => onRemoveStatus(res.id)} className="px-4 py-2 text-gray-500 hover:text-red-500 transition-colors flex items-center gap-2 text-[10px] font-black uppercase tracking-widest">
                            <Trash2 size={14} /> Clear Status
                          </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* PREVIEW MODAL */}
      {previewData && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/90 backdrop-blur-xl p-4 animate-fade-in" onClick={() => setPreviewData(null)}>
            <div className={`w-full max-w-lg rounded-[3rem] border shadow-[0_0_100px_rgba(212,175,55,0.15)] overflow-hidden flex flex-col max-h-[90vh] ${isDarkMode ? 'bg-dark-900 border-gold-800' : 'bg-white border-gray-200'}`} onClick={(e) => e.stopPropagation()}>
                {/* Header Modal */}
                <div className={`p-8 border-b flex justify-between items-center ${isDarkMode ? 'bg-dark-800 border-gold-900/40' : 'bg-gray-50 border-gray-200'}`}>
                   <div className="flex items-center gap-4">
                      <div className="p-3 bg-gold-500 rounded-2xl text-black shadow-lg">
                         <Eye size={24} />
                      </div>
                      <div>
                         <h4 className="text-xl font-serif font-black uppercase tracking-tighter text-white">Order Preview</h4>
                         <p className="text-[9px] text-gold-600 font-black uppercase tracking-widest mt-1">Checking data before export</p>
                      </div>
                   </div>
                   <button onClick={() => setPreviewData(null)} className="text-gray-500 hover:text-white transition-transform hover:rotate-90">
                      <X size={28} />
                   </button>
                </div>

                {/* Content Modal */}
                <div className="flex-1 overflow-y-auto p-8 space-y-8 custom-scrollbar">
                    {/* Guest Summary Card */}
                    <div className="bg-black/40 p-6 rounded-3xl border border-white/5 shadow-inner">
                        <div className="grid grid-cols-2 gap-6">
                           <div className="space-y-1">
                              <span className="text-[9px] font-black text-gray-500 uppercase tracking-widest">GUEST NAME</span>
                              <p className="text-xl font-serif font-black uppercase text-white truncate">{previewData.guestName}</p>
                           </div>
                           <div className="text-right space-y-1">
                              <span className="text-[9px] font-black text-gray-500 uppercase tracking-widest">LOCATION</span>
                              <p className="text-xl font-serif font-black uppercase text-gold-500">{previewData.tableNumber ? `TABLE ${previewData.tableNumber}` : previewData.locationPreference}</p>
                           </div>
                           <div className="space-y-1">
                              <span className="text-[9px] font-black text-gray-500 uppercase tracking-widest">DATE / TIME</span>
                              <p className="font-mono text-sm font-bold text-white">{previewData.reservationDate} • {previewData.arrivalTime}</p>
                           </div>
                           <div className="text-right space-y-1">
                              <span className="text-[9px] font-black text-gray-500 uppercase tracking-widest">CAPACITY</span>
                              <p className="font-mono text-sm font-bold text-white">{previewData.guestCount} PAX</p>
                           </div>
                        </div>
                    </div>

                    {/* Menu Checklist */}
                    <div className="space-y-4">
                        <h5 className="text-[10px] font-black text-gold-600 uppercase tracking-[0.3em] border-b pb-2 border-gold-900/20">Ordered Menu Items</h5>
                        <div className="space-y-3">
                           {sortMenuStringsByCondiments(previewData.orderedMenuItems || []).map((itemStr, idx) => {
                               const noteMatch = itemStr.match(/\s\[Note:\s(.*)\]$/);
                               const itemNote = noteMatch ? noteMatch[1] : null;
                               const cleanStr = itemNote ? itemStr.replace(/\s\[Note:\s.*\]$/, '') : itemStr;
                               
                               const qtyMatch = cleanStr.match(/^(\d+)x\s+/);
                               const qty = qtyMatch ? qtyMatch[1] : "1";
                               const nameOnly = cleanStr.replace(/^\d+x\s+/, '');
                               
                               const [title, condiments] = nameOnly.split(' (');

                               return (
                                  <div key={idx} className="flex gap-4 group">
                                     <div className="h-10 w-10 rounded-xl bg-gold-500/10 border border-gold-500/20 flex items-center justify-center font-black text-gold-500 shrink-0">
                                        {qty}
                                     </div>
                                     <div className="flex-1 pb-4 border-b border-white/5">
                                        <p className="text-base font-black uppercase text-white tracking-tight">{title.replace(/\(\s*\d+\s*PERSON\s*\)/gi, '').trim()}</p>
                                        {condiments && (
                                            <div className="mt-2 pl-4 border-l-2 border-emerald-500/30 space-y-1">
                                                {condiments.replace(/\(\s*\d+\s*PERSON\s*\)/gi, '').replace(')', '').split(', ').map((c, ci) => (
                                                    <p key={ci} className="text-[11px] font-bold text-emerald-500 uppercase italic leading-none">{c}</p>
                                                ))}
                                            </div>
                                        )}
                                        {itemNote && (
                                            <p className="mt-2 text-[11px] font-bold text-amber-500 uppercase flex items-center gap-1.5 bg-amber-500/5 px-2 py-1 rounded-lg border border-amber-500/10">
                                                <Tag size={10} /> Note: "{itemNote}"
                                            </p>
                                        )}
                                     </div>
                                  </div>
                               );
                           })}
                        </div>
                    </div>

                    {/* Global Notes Section */}
                    {previewData.menuNotes && (
                       <div className="bg-emerald-500/5 p-6 rounded-3xl border border-emerald-500/20 border-dashed">
                          <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest mb-2 flex items-center gap-2">
                             <MessageSquare size={14} /> Global Order Notes
                          </p>
                          <p className="text-sm italic font-medium text-gray-300 leading-relaxed">
                             "{previewData.menuNotes}"
                          </p>
                       </div>
                    )}
                </div>

                {/* Footer Modal Actions */}
                <div className={`p-8 border-t flex flex-col gap-3 ${isDarkMode ? 'bg-dark-800 border-gold-900/40' : 'bg-gray-50 border-gray-200'}`}>
                    <div className="grid grid-cols-2 gap-4">
                        <button 
                            onClick={() => handleShareOrderPDF(previewData!)}
                            className="flex-1 py-4 bg-green-700 hover:bg-green-600 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] flex items-center justify-center gap-2 transition-all shadow-xl"
                        >
                            <Share2 size={16} /> SHARE WHATSAPP
                        </button>
                        <button 
                            onClick={() => handlePrintOrderPDF(previewData!)}
                            className="flex-1 py-4 bg-gray-900 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] flex items-center justify-center gap-2 transition-all shadow-xl border border-white/5"
                        >
                            <Printer size={16} /> PRINT PDF
                        </button>
                    </div>
                    <button 
                        onClick={() => setPreviewData(null)}
                        className="w-full py-4 text-gray-500 hover:text-white font-black uppercase tracking-widest text-[10px] transition-colors"
                    >
                        Close Preview
                    </button>
                </div>
            </div>
          </div>
      )}
    </div>
  );
};

export default MenuInputSummary;
