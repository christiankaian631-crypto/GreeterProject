
import React, { useMemo } from 'react';
import { Reservation, AppSettings, ReservationStatus } from '../types';
import { 
  MENU_DATA_BANDUNG, 
  MENU_DATA_JAKARTA, 
  OUTLETS_JAKARTA 
} from './MenuList';
import { 
  ArrowLeft, 
  Printer, 
  Download, 
  Table as TableIcon, 
  ClipboardList,
  Search,
  FileSpreadsheet,
  FileDown,
  Share2
} from 'lucide-react';
import { 
  generateTallyPDF, 
  generateTallyExcel, 
  shareTallyWhatsApp 
} from '../services/pdfService';

interface Props {
  reservations: Reservation[];
  dateRange: { start: string; end: string };
  settings: AppSettings;
  isDarkMode?: boolean;
  onBack?: () => void;
  outletName?: string;
}

interface TallyItem {
  category: string;
  name: string;
  qty: number;
  tables: string[];
}

const CATEGORY_ORDER = [
  'SALAD', 'SOUP', 'LIGHT MEAL', 'KIDS MEAL', 'SPECIALTY STEAK', 
  'PRIME SELECTION', 'BIG CUT', 'FAMILY SET', 'WESTERN DELIGHT', 
  'PASTA LOVERS', 'ASIAN DELIGHT', 'INDONESIAN FAVORITE', 'NPD', 
  'BURGER & SANDWICH', 'DESSERT', 'JUICE', 'SMOOTHIES', 
  'DRINKING & MINERAL WATER', 'MILKSHAKE', 'SOFT DRINK', 'FRAPPE', 
  'ARTISAN TEA', 'TEA', 'COFFEE', 'MANUAL BREW', 'CHOCOLATE', 
  'ICED BLENDED', 'MOCKTAIL', 'FREE MENU', 'OTHER'
];

const OrderTallyView: React.FC<Props> = ({ reservations, dateRange, settings, isDarkMode, onBack, outletName }) => {
  const [showOnlyOrdered, setShowOnlyOrdered] = React.useState(true);
  
  const tallyData = useMemo(() => {
    const tally: Record<string, { qty: number; tableDetails: Record<string, number> }> = {};
    
    // Process all reservations that match date range, are IFTAR shift, and are not cancelled or completed
    reservations
      .filter(r => 
        r.reservationDate >= dateRange.start && 
        r.reservationDate <= dateRange.end &&
        r.shift === 'IFTAR' &&
        r.status !== ReservationStatus.CANCELLED &&
        r.status !== ReservationStatus.COMPLETED &&
        (r.hasInputtedMenu || (r.orderedMenuItems && r.orderedMenuItems.length > 0))
      )
      .forEach(res => {
        const tableNum = res.tableNumber ? `T${res.tableNumber}` : (res.locationPreference || 'N/A');
        
        res.orderedMenuItems?.forEach(itemStr => {
          // Parse string like "2x Tenderloin (MEDIUM) [Note: Well Done]"
          const qtyMatch = itemStr.match(/^(\d+)x\s+/);
          const qty = qtyMatch ? parseInt(qtyMatch[1]) : 1;
          
          const noteMatch = itemStr.match(/\s\[Note:\s(.*)\]$/);
          const note = noteMatch ? noteMatch[1] : undefined;
          
          // Remove qty and note from string
          let cleanName = itemStr.replace(/^\d+x\s+/, '').replace(/\s\[Note:\s.*\]$/, '').trim();
          
          // Remove condiments (anything in parentheses) - USER REQUEST: CONDIMENT TIDAK PERLU DI TAMPILKAN
          cleanName = cleanName.replace(/\s*\(.*?\)/g, '').trim();
          
          // Clean Family Set description specifically if needed
          cleanName = cleanName.replace(/\(\s*\d+\s*PERSON\s*\)/gi, '').trim();

          // If note exists, append it to the name for separate tallying - USER REQUEST: MENU YANG ADA NOTES AKAN AUTOMATIS TERPISAH
          const tallyKey = note ? `${cleanName} [NOTE: ${note.toUpperCase()}]` : cleanName;

          if (!tally[tallyKey]) {
            tally[tallyKey] = { qty: 0, tableDetails: {} };
          }
          tally[tallyKey].qty += qty;
          tally[tallyKey].tableDetails[tableNum] = (tally[tallyKey].tableDetails[tableNum] || 0) + qty;
        });
      });

    return tally;
  }, [reservations, dateRange]);

  const filteredTemplate = useMemo(() => {
    const categories: Record<string, string[]> = {};
    
    // Get all ordered items
    const orderedItems = Object.keys(tallyData);
    
    // Combine all possible menu sources for category lookup
    const isJakarta = outletName && OUTLETS_JAKARTA.includes(outletName);
    const regionalMenu = isJakarta ? MENU_DATA_JAKARTA : MENU_DATA_BANDUNG;
    const allPossibleMenu = [...regionalMenu, ...(settings.customMenu || [])];

    orderedItems.forEach(itemName => {
      // itemName might be "Tenderloin" or "Tenderloin [NOTE: WELL DONE]"
      // We need the base name to find the category
      const baseName = itemName.split(' [')[0].split(' (')[0].trim();
      const menuItem = allPossibleMenu.find(m => m.name === baseName);
      let category = menuItem ? menuItem.category : 'OTHER';
      
      if (category === 'OTHER') {
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

      if (!categories[category]) {
        categories[category] = [];
      }
      categories[category].push(itemName);
    });

    // Convert to array format and sort by CATEGORY_ORDER
    return Object.keys(categories)
      .sort((a, b) => {
        const indexA = CATEGORY_ORDER.indexOf(a);
        const indexB = CATEGORY_ORDER.indexOf(b);
        if (indexA === -1 && indexB === -1) return a.localeCompare(b);
        if (indexA === -1) return 1;
        if (indexB === -1) return -1;
        return indexA - indexB;
      })
      .map(catName => ({
        category: catName,
        items: categories[catName].sort()
      }));
  }, [tallyData, settings.customMenu, outletName]);

  const handlePrint = () => {
    window.print();
  };

  const formatTableDetails = (tableDetails: Record<string, number>) => {
    return Object.entries(tableDetails)
      .map(([table, qty]) => qty > 1 ? `${table}(${qty})` : table)
      .join(', ');
  };

  return (
    <div className="space-y-8 animate-fade-in pb-20 print:p-0 print:pb-0">
      {/* Header - Hidden on Print */}
      <div className={`p-8 rounded-[2.5rem] border flex flex-col md:flex-row justify-between items-center gap-6 shadow-2xl print:hidden ${isDarkMode ? 'bg-dark-800 border-gold-900/30' : 'bg-white border-gray-200'}`}>
        <div className="flex items-center gap-6">
          {onBack && (
             <button onClick={onBack} className="p-4 hover:bg-gold-500 hover:text-black rounded-2xl transition-all border border-gold-500/20 text-gold-500 bg-gold-500/5">
               <ArrowLeft size={24} />
             </button>
          )}
          <div className={`p-4 rounded-2xl border shadow-lg ${isDarkMode ? 'bg-blue-900/20 border-blue-500' : 'bg-blue-50 border-blue-200'}`}>
            <ClipboardList className="text-blue-500" size={32} />
          </div>
          <div>
            <h2 className={`text-3xl font-serif font-black uppercase tracking-tighter ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Tally Menu Iftar</h2>
            <p className="text-[10px] text-blue-600 uppercase tracking-[0.4em] font-black mt-1">{outletName || 'Justus Steakhouse'}</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-3">
            <button 
              onClick={() => generateTallyExcel(tallyData, filteredTemplate, dateRange, outletName)}
              className="flex items-center gap-2 px-5 py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl font-black uppercase tracking-widest text-[9px] transition-all shadow-lg active:scale-95"
            >
              <FileSpreadsheet size={14} /> Excel
            </button>
            <button 
              onClick={() => generateTallyPDF(tallyData, filteredTemplate, dateRange, outletName)}
              className="flex items-center gap-2 px-5 py-3 bg-red-600 hover:bg-red-500 text-white rounded-2xl font-black uppercase tracking-widest text-[9px] transition-all shadow-lg active:scale-95"
            >
              <FileDown size={14} /> PDF
            </button>
            <button 
              onClick={() => shareTallyWhatsApp(tallyData, filteredTemplate, dateRange, outletName)}
              className="flex items-center gap-2 px-5 py-3 bg-green-500 hover:bg-green-400 text-white rounded-2xl font-black uppercase tracking-widest text-[9px] transition-all shadow-lg active:scale-95"
            >
              <Share2 size={14} /> WhatsApp
            </button>
            <button 
              onClick={handlePrint}
              className="flex items-center gap-2 px-5 py-3 bg-gold-500 hover:bg-gold-400 text-black rounded-2xl font-black uppercase tracking-widest text-[9px] transition-all shadow-lg active:scale-95"
            >
              <Printer size={14} /> Print
            </button>
        </div>
      </div>

      {/* Tally Tables - Separated by Category */}
      <div className="space-y-12 print:space-y-8">
        <div className="text-center mb-8 hidden print:block">
          <h1 className="text-2xl font-black uppercase tracking-widest border-b-2 border-black pb-2 inline-block">
            TALLY MENU FOOD IFTAR {outletName?.toUpperCase() || 'SH THE BARN'}
          </h1>
          <p className="text-sm font-bold mt-2">PERIOD: {dateRange.start} - {dateRange.end}</p>
        </div>

        {filteredTemplate.length === 0 ? (
          <div className={`p-20 rounded-[2.5rem] border shadow-2xl text-center ${isDarkMode ? 'bg-dark-800 border-white/5' : 'bg-white border-gray-200'}`}>
            <div className="flex flex-col items-center gap-4 opacity-30">
              <ClipboardList size={64} className="text-gray-500" />
              <p className="text-gray-500 font-black uppercase tracking-[0.5em] text-xs">Tidak ada pesanan Iftar pada periode ini</p>
            </div>
          </div>
        ) : (
          filteredTemplate.map((cat) => (
            <div key={cat.category} className={`overflow-hidden rounded-[2.5rem] border shadow-2xl print:border-none print:shadow-none print:rounded-none animate-scale-in ${isDarkMode ? 'bg-dark-800 border-white/5' : 'bg-white border-gray-200'}`}>
              <div className={`px-8 py-4 border-b flex items-center justify-between ${isDarkMode ? 'bg-dark-900/50 border-white/5' : 'bg-gray-50 border-gray-200'} print:bg-gray-100 print:border-black`}>
                <h3 className="text-sm font-black uppercase tracking-[0.3em] text-gold-500">{cat.category}</h3>
                <span className="text-[10px] font-bold text-gray-500 uppercase">{cat.items.length} Items</span>
              </div>
              <div className="p-8 print:p-0">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className={`${isDarkMode ? 'bg-dark-900' : 'bg-gray-100'} print:bg-gray-200`}>
                      <th className="border border-gray-400 p-3 text-[11px] font-black uppercase tracking-widest text-center">NAMA MENU</th>
                      <th className="border border-gray-400 p-3 text-[11px] font-black uppercase tracking-widest text-center w-20">Qty</th>
                      <th className="border border-gray-400 p-3 text-[11px] font-black uppercase tracking-widest text-center">No Table</th>
                    </tr>
                  </thead>
                  <tbody>
                    {cat.items.map((itemName) => {
                      const data = tallyData[itemName] || { qty: 0, tableDetails: {} };
                      const hasData = data.qty > 0;
                      
                      return (
                        <tr key={itemName} className={`${hasData ? (isDarkMode ? 'bg-gold-500/5' : 'bg-gold-50') : ''} print:bg-transparent`}>
                          <td className={`border border-gray-400 p-3 text-[11px] font-bold uppercase ${hasData ? 'text-gold-600' : (isDarkMode ? 'text-gray-400' : 'text-gray-600')}`}>
                            {itemName}
                          </td>
                          <td className={`border border-gray-400 p-3 text-[12px] font-black text-center ${hasData ? 'text-black bg-gold-500/20' : (isDarkMode ? 'text-gray-600' : 'text-gray-300')}`}>
                            {hasData ? data.qty : ''}
                          </td>
                          <td className={`border border-gray-400 p-3 text-[10px] font-medium uppercase ${hasData ? (isDarkMode ? 'text-gray-200' : 'text-gray-800') : 'text-transparent'}`}>
                            {hasData ? formatTableDetails(data.tableDetails) : ''}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          ))
        )}
        
        <div className="mt-8 flex justify-between items-end hidden print:flex">
          <div className="text-[10px] font-bold uppercase">
            Printed at: {new Date().toLocaleString('id-ID')}
          </div>
          <div className="text-center space-y-12">
            <p className="text-[10px] font-black uppercase tracking-widest">Kitchen Manager</p>
            <div className="w-32 border-b border-black"></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderTallyView;
