
import React, { useState, useMemo, useEffect } from 'react';
import { Reservation, AppSettings, MenuItem } from '../types';
import { Search, CheckSquare, X, User, Calendar, Clock, MapPin, Users, Check, Save, UtensilsCrossed, Settings2, Plus, Minus, Receipt, ArrowLeft, Printer, Share2, MessageSquare, Banknote, Edit3, Loader2, Ban, ChevronDown, ChevronRight } from 'lucide-react';
import { MENU_DATA_BANDUNG, MENU_DATA_JAKARTA, OUTLETS_JAKARTA } from './MenuList';
import { generateOrderChecklistPDF } from '../services/pdfService';

interface Props {
  reservations: Reservation[];
  isDarkMode?: boolean;
  onSave?: (guestId: string, menuList: string[], menuNotes: string) => void;
  onBack?: () => void;
  settings: AppSettings;
  outletName?: string;
  initialGuestId?: string;
}

interface ModifierSelection {
  name: string;
  qty: number;
}

interface CheckedItem {
  id: string; 
  name: string;
  qty: number;
  category: string;
  details?: string; 
  note?: string; 
}

interface ModifierState {
  item: MenuItem | null;
  groups: { [groupId: string]: ModifierSelection[] };
}

const MenuCheckmark: React.FC<Props> = ({ reservations, isDarkMode, onSave, onBack, settings, outletName, initialGuestId }) => {
  const [search, setSearch] = useState('');
  const [selectedGuestId, setSelectedGuestId] = useState<string>(() => {
    if (initialGuestId) return initialGuestId;
    return localStorage.getItem('menu_checkmark_guest_id') || '';
  });
  const [checkedItems, setCheckedItems] = useState<CheckedItem[]>(() => {
    const saved = localStorage.getItem('menu_checkmark_items');
    return saved ? JSON.parse(saved) : [];
  });
  const [menuNotes, setMenuNotes] = useState<string>(() => {
    return localStorage.getItem('menu_checkmark_notes') || '';
  }); 
  const [currentItemNote, setCurrentItemNote] = useState<string>(''); 
  
  const [showPreview, setShowPreview] = useState(false);
  const [isSharingPdf, setIsSharingPdf] = useState(false);
  const [lastSavedData, setLastSavedData] = useState<{
    guest: any, 
    items: CheckedItem[], 
    notes: string,
    tableNumber: string,
    paymentStatus: string,
    originalRes: Reservation
  } | null>(null);
  
  const [qtyPickerItem, setQtyPickerItem] = useState<{ item: MenuItem, qty: number } | null>(null);

  const [activeModifier, setActiveModifier] = useState<ModifierState>({
    item: null, groups: {}
  });
  const [editingItemIndex, setEditingItemIndex] = useState<number | null>(null);
  const [expandedCategories, setExpandedCategories] = useState<string[]>([]);

  const [guestInfo, setGuestInfo] = useState({
    date: new Date().toISOString().split('T')[0],
    name: '', pax: 2, time: '19:00', location: 'Non-Smoking', opNotes: ''
  });

  const activeRegionMenu = useMemo(() => {
    const isJakarta = outletName && OUTLETS_JAKARTA.includes(outletName);
    return isJakarta ? MENU_DATA_JAKARTA : MENU_DATA_BANDUNG;
  }, [outletName]);

  const allMenu = useMemo(() => {
    const baseMenu = [...activeRegionMenu, ...(settings?.customMenu || [])];
    if (settings?.menuPriceOverrides) {
      return baseMenu.map(item => ({
        ...item,
        price: settings.menuPriceOverrides[item.name] !== undefined ? settings.menuPriceOverrides[item.name] : item.price
      }));
    }
    return baseMenu;
  }, [settings?.customMenu, settings?.menuPriceOverrides, activeRegionMenu]);

  // Helper to get effective category for modifiers
  const getEffectiveCategory = (item: MenuItem) => {
    if (item.name === 'FREE COWBOY STEAK 400 GRAM') return 'FAMILY SET';
    return item.category;
  };

  const getItemMapping = (item: MenuItem) => {
    const cat = getEffectiveCategory(item);
    return settings.categoryMappings.find(m => m.categoryName === cat);
  };

  const lastLoadedGuestId = React.useRef<string | null>(null);

  useEffect(() => {
    if (selectedGuestId) {
      // Only load from reservations if the guest ID has changed
      if (lastLoadedGuestId.current === selectedGuestId) return;

      const found = reservations.find(r => r.id === selectedGuestId);
      if (found) {
        setGuestInfo({
          date: found.reservationDate,
          name: found.guestName,
          pax: found.guestCount,
          time: found.arrivalTime,
          location: found.locationPreference,
          opNotes: found.otherRequirements || '-'
        });
        setMenuNotes(found.menuNotes || '');
        if (found.orderedMenuItems && found.orderedMenuItems.length > 0) {
           const parsed = found.orderedMenuItems.map(str => {
              const qtyMatch = str.match(/^(\d+)x\s+/);
              const qty = qtyMatch ? parseInt(qtyMatch[1]) : 1;
              const contentWithoutQty = str.replace(/^\d+x\s+/, '');
              
              const noteMatch = contentWithoutQty.match(/\s\[Note:\s(.*)\]$/);
              const note = noteMatch ? noteMatch[1] : undefined;
              const contentWithoutNote = note ? contentWithoutQty.replace(/\s\[Note:\s.*\]$/, '') : contentWithoutQty;

              const mainName = contentWithoutNote.replace(/\(\s*\d+\s*PERSON\s*\)/gi, '').trim().split(' (')[0];
              const detailContent = contentWithoutNote.replace(/\(\s*\d+\s*PERSON\s*\)/gi, '').trim().includes('(') ? contentWithoutNote.replace(/\(\s*\d+\s*PERSON\s*\)/gi, '').trim().split(' (')[1].replace(')', '') : undefined;
              
              return {
                id: contentWithoutNote,
                name: mainName,
                qty: qty,
                category: '',
                details: detailContent,
                note: note
              };
           });
           setCheckedItems(parsed);
        } else setCheckedItems([]);
        
        lastLoadedGuestId.current = selectedGuestId;
      }
    } else {
      setCheckedItems([]);
      setMenuNotes('');
      lastLoadedGuestId.current = null;
    }
  }, [selectedGuestId, reservations]);

  useEffect(() => {
    localStorage.setItem('menu_checkmark_guest_id', selectedGuestId);
    localStorage.setItem('menu_checkmark_items', JSON.stringify(checkedItems));
    localStorage.setItem('menu_checkmark_notes', menuNotes);
  }, [selectedGuestId, checkedItems, menuNotes]);

  const sortedCheckedItems = useMemo(() => {
    const foodPriority = [
      'SALAD', 'SOUP', 'LIGHT MEAL', 'KIDS MEAL', 'SPECIALTY STEAK', 'PRIME SELECTION', 
      'BIG CUT', 'FAMILY SET', 'WESTERN DELIGHT', 'PASTA LOVERS', 'ASIAN DELIGHT', 
      'INDONESIAN FAVORITE', 'BURGER & SANDWICH', 'NPD', 'DESSERT'
    ];
    const beveragePriority = [
      'JUICE', 'SMOOTHIES', 'DRINKING & MINERAL WATER', 'MILKSHAKE', 'SOFT DRINK', 
      'FRAPPE', 'ARTISAN TEA', 'TEA', 'COFFEE', 'MANUAL BREW', 'CHOCOLATE', 
      'ICED BLENDED', 'MOCKTAIL', 'FREE MENU'
    ];

    const getItemData = (item: CheckedItem) => {
      let category = (item.category || 'OTHERS').toUpperCase();
      
      // If category is empty or OTHERS, try to find it in settings
      if (!category || category === 'OTHERS') {
        const menuItem = allMenu.find(m => m.name === item.name);
        if (menuItem) category = menuItem.category.toUpperCase();
      }

      const foodIdx = foodPriority.indexOf(category);
      const bevIdx = beveragePriority.indexOf(category);

      return {
        isBeverage: bevIdx !== -1,
        priorityIndex: foodIdx !== -1 ? foodIdx : (bevIdx !== -1 ? bevIdx : 999),
        condimentCount: item.details ? item.details.split(', ').length : 0
      };
    };

    return [...checkedItems].sort((a, b) => {
      const dataA = getItemData(a);
      const dataB = getItemData(b);

      // 1. Food vs Beverage (Food first)
      if (dataA.isBeverage !== dataB.isBeverage) return dataA.isBeverage ? 1 : -1;
      
      // 2. Within Food: Fewer condiments first
      if (!dataA.isBeverage && dataA.condimentCount !== dataB.condimentCount) {
        return dataA.condimentCount - dataB.condimentCount;
      }
      
      // 3. Then by priority index
      if (dataA.priorityIndex !== dataB.priorityIndex) return dataA.priorityIndex - dataB.priorityIndex;
      
      // 4. Finally by name
      return a.name.localeCompare(b.name);
    });
  }, [checkedItems, allMenu]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount);
  };

  const handleGuestNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputName = e.target.value;
    setGuestInfo(prev => ({ ...prev, name: inputName }));
    const found = reservations.find(r => 
      !r.isWalkIn &&
      r.guestName.toLowerCase() === inputName.toLowerCase() && 
      r.reservationDate === guestInfo.date
    );
    if (found) setSelectedGuestId(found.id);
    else setSelectedGuestId('');
  };

  const updateItemQtyById = (id: string, delta: number, itemNote?: string) => {
    setCheckedItems(prev => {
      const existing = prev.find(i => i.id === id && i.note === itemNote);
      if (existing) {
        const newQty = existing.qty + delta;
        if (newQty <= 0) return prev.filter(i => !(i.id === id && i.note === itemNote));
        return prev.map(i => (i.id === id && i.note === itemNote) ? { ...i, qty: newQty } : i);
      }
      return prev;
    });
  };

  const handleEditItem = (index: number) => {
    const itemToEdit = sortedCheckedItems[index];
    const menuItem = allMenu.find(m => m.name === itemToEdit.name);
    if (!menuItem) return;

    setEditingItemIndex(index);
    setCurrentItemNote(itemToEdit.note || '');
    setQtyPickerItem({ item: menuItem, qty: itemToEdit.qty });

    const mapping = getItemMapping(menuItem);
    if (mapping && mapping.condimentGroupIds.length > 0 && itemToEdit.details) {
      const groups: { [groupId: string]: ModifierSelection[] } = {};
      const detailParts = itemToEdit.details.split(', ');
      
      detailParts.forEach(part => {
        const match = part.match(/^(\d+)x\s+(.*)$/);
        if (match) {
          const qty = parseInt(match[1]);
          const name = match[2];
          
          // Find which group this option belongs to
          mapping.condimentGroupIds.forEach(gid => {
            const group = settings.condimentGroups.find(g => g.id === gid);
            if (group && group.options.includes(name)) {
              if (!groups[gid]) groups[gid] = [];
              groups[gid].push({ name, qty });
            }
          });
        }
      });
      setActiveModifier({ item: menuItem, groups });
    } else {
      setActiveModifier({ item: menuItem, groups: {} });
    }
  };

  const handleInitialItemClick = (item: MenuItem) => {
    if (settings.soldOutItems?.includes(item.name)) return;
    setCurrentItemNote('');
    setQtyPickerItem({ item, qty: 1 });
  };

  const confirmQty = () => {
    if (!qtyPickerItem) return;
    const { item, qty } = qtyPickerItem;
    const mapping = getItemMapping(item);

    if (mapping && mapping.condimentGroupIds.length > 0) {
      setActiveModifier({ item, groups: activeModifier.groups || {} });
    } else {
      setCheckedItems(prev => {
        if (editingItemIndex !== null) {
          const newItems = [...prev];
          // We need to find the item in the original array that corresponds to the sorted index
          const itemToReplace = sortedCheckedItems[editingItemIndex];
          const originalIndex = prev.findIndex(i => i === itemToReplace);
          if (originalIndex !== -1) {
            newItems[originalIndex] = { id: item.name, name: item.name, qty, category: item.category, note: currentItemNote || undefined };
            return newItems;
          }
        }
        const existing = prev.find(i => i.id === item.name && i.note === currentItemNote);
        if (existing) return prev.map(i => (i.id === item.name && i.note === currentItemNote) ? { ...i, qty: i.qty + qty } : i);
        return [...prev, { id: item.name, name: item.name, qty, category: item.category, note: currentItemNote || undefined }];
      });
      setQtyPickerItem(null);
      setCurrentItemNote('');
      setEditingItemIndex(null);
    }
  };

  const handleUpdateModifierQty = (groupId: string, name: string, delta: number) => {
    setActiveModifier(prev => {
      const groupList = prev.groups[groupId] ? [...prev.groups[groupId]] : [];
      const index = groupList.findIndex(i => i.name === name);
      if (index >= 0) {
        const newQty = groupList[index].qty + delta;
        if (newQty <= 0) groupList.splice(index, 1);
        else groupList[index] = { ...groupList[index], qty: newQty };
      } else if (delta > 0) {
        groupList.push({ name, qty: 1 });
      }
      return { ...prev, groups: { ...prev.groups, [groupId]: groupList } };
    });
  };

  const confirmModifier = () => {
    if (!activeModifier.item || !qtyPickerItem) return;
    const allSelections: string[] = [];
    Object.values(activeModifier.groups).forEach((list: any) => {
        list.forEach((sel: any) => allSelections.push(`${sel.qty}x ${sel.name}`));
    });
    const details = allSelections.join(', ');
    const id = details ? `${activeModifier.item.name} (${details})` : activeModifier.item.name;
    const qtyToAdd = qtyPickerItem.qty;
    setCheckedItems(prev => {
      if (editingItemIndex !== null) {
        const newItems = [...prev];
        const itemToReplace = sortedCheckedItems[editingItemIndex];
        const originalIndex = prev.findIndex(i => i === itemToReplace);
        if (originalIndex !== -1) {
          newItems[originalIndex] = { id, name: activeModifier.item!.name, qty: qtyToAdd, category: activeModifier.item!.category, details, note: currentItemNote || undefined };
          return newItems;
        }
      }
      const existing = prev.find(i => i.id === id && i.note === currentItemNote);
      if (existing) return prev.map(i => (i.id === id && i.note === currentItemNote) ? { ...i, qty: i.qty + qtyToAdd } : i);
      return [...prev, { id, name: activeModifier.item!.name, qty: qtyToAdd, category: activeModifier.item!.category, details, note: currentItemNote || undefined }];
    });
    setActiveModifier({ item: null, groups: {} });
    setQtyPickerItem(null);
    setCurrentItemNote('');
    setEditingItemIndex(null);
  };

  const handleSave = () => {
    if (!selectedGuestId) return alert("Please select a guest name.");
    const foundRes = reservations.find(r => r.id === selectedGuestId);
    if (!foundRes) return;
    if (onSave) {
      const formattedList = sortedCheckedItems.map(i => {
          let base = `${i.qty}x ${i.id}`;
          if (i.note) base += ` [Note: ${i.note}]`;
          return base;
      });
      onSave(selectedGuestId, formattedList, menuNotes);
      const paymentStatusText = foundRes.isFullPayment ? "PAID / FULL PAYMENT" : (foundRes.hasDownPayment ? `DEPOSIT (DP) - ${formatCurrency(foundRes.downPaymentAmount)}` : "UNPAID");
      
      // Clear draft after successful save
      localStorage.removeItem('menu_checkmark_guest_id');
      localStorage.removeItem('menu_checkmark_items');
      localStorage.removeItem('menu_checkmark_notes');

      setLastSavedData({ 
        guest: { ...guestInfo, opNotes: foundRes.otherRequirements || '-' }, 
        items: sortedCheckedItems, 
        notes: menuNotes,
        tableNumber: foundRes.tableNumber || "N/A",
        paymentStatus: paymentStatusText,
        originalRes: { ...foundRes, orderedMenuItems: formattedList, menuNotes: menuNotes }
      });
      setShowPreview(true);
      setSelectedGuestId('');
      setGuestInfo(prev => ({ ...prev, name: '', opNotes: '' }));
      setCheckedItems([]);
      setMenuNotes('');
    }
  };

  const handleShareChecklistPDF = async () => {
    if (!lastSavedData) return;
    setIsSharingPdf(true);
    await generateOrderChecklistPDF(lastSavedData.originalRes, true, outletName, settings);
    setIsSharingPdf(false);
  };

  const filteredMenu = useMemo(() => {
    return allMenu.filter(item => 
      item.name.toLowerCase().includes(search.toLowerCase()) ||
      item.category.toLowerCase().includes(search.toLowerCase())
    );
  }, [search, allMenu]);

  const categories = useMemo(() => {
    const foodPriority = [
      'SALAD', 'SOUP', 'LIGHT MEAL', 'KIDS MEAL', 'SPECIALTY STEAK', 'PRIME SELECTION', 
      'BIG CUT', 'FAMILY SET', 'WESTERN DELIGHT', 'PASTA LOVERS', 'ASIAN DELIGHT', 
      'INDONESIAN FAVORITE', 'BURGER & SANDWICH', 'NPD', 'DESSERT'
    ];
    const beveragePriority = [
      'JUICE', 'SMOOTHIES', 'DRINKING & MINERAL WATER', 'MILKSHAKE', 'SOFT DRINK', 
      'FRAPPE', 'ARTISAN TEA', 'TEA', 'COFFEE', 'MANUAL BREW', 'CHOCOLATE', 
      'ICED BLENDED', 'MOCKTAIL', 'FREE MENU'
    ];
    
    const uniqueCategories = Array.from(new Set(allMenu.map(m => m.category))) as string[];
    
    return uniqueCategories.sort((a, b) => {
      const aUpper = a.toUpperCase();
      const bUpper = b.toUpperCase();
      
      const aFoodIdx = foodPriority.indexOf(aUpper);
      const bFoodIdx = foodPriority.indexOf(bUpper);
      
      const aBevIdx = beveragePriority.indexOf(aUpper);
      const bBevIdx = beveragePriority.indexOf(bUpper);
      
      // If both are in foodPriority, sort by foodPriority
      if (aFoodIdx !== -1 && bFoodIdx !== -1) return aFoodIdx - bFoodIdx;
      // If a is food and b is not, a comes first
      if (aFoodIdx !== -1) return -1;
      if (bFoodIdx !== -1) return 1;
      
      // If both are in beveragePriority, sort by beveragePriority
      if (aBevIdx !== -1 && bBevIdx !== -1) return aBevIdx - bBevIdx;
      // If a is beverage and b is not (and not food), a comes first (after food)
      if (aBevIdx !== -1) return -1;
      if (bBevIdx !== -1) return 1;
      
      return a.localeCompare(b);
    });
  }, [allMenu]);

  const toggleCategory = (cat: string) => {
    setExpandedCategories(prev => 
      prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat]
    );
  };

  // Auto-expand categories when searching
  useEffect(() => {
    if (search.trim()) {
      const matchingCats = categories.filter(cat => 
        filteredMenu.some(item => item.category === cat)
      );
      setExpandedCategories(matchingCats);
    }
  }, [search, categories, filteredMenu]);

  if (showPreview && lastSavedData) {
    return (
        <div className="fixed inset-0 z-[200] bg-black/80 backdrop-blur-md overflow-y-auto cursor-pointer no-print flex justify-center py-10 px-4" onClick={() => setShowPreview(false)}>
            <div className="animate-fade-in space-y-6 w-full max-w-2xl" onClick={(e) => e.stopPropagation()}>
                <div id="printable-bill" className={`p-8 rounded-3xl border shadow-2xl ${isDarkMode ? 'bg-dark-900 border-gold-600/50' : 'bg-white border-gray-200'}`}>
                    <div className="flex flex-col items-center text-center mb-8">
                        <div className="bg-emerald-500 text-white p-4 rounded-full shadow-lg mb-4 no-print"><Check size={32} /></div>
                        <h2 className={`text-3xl font-serif font-black uppercase tracking-tighter ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Input Menu Success</h2>
                        <p className="text-gold-600 font-bold uppercase text-[10px] tracking-[0.3em]">{outletName} Order Summary</p>
                    </div>
                    <div className={`grid grid-cols-2 gap-4 p-5 rounded-2xl mb-6 border border-dashed ${isDarkMode ? 'bg-dark-800 border-gold-900/30' : 'bg-gray-50 border-gray-300'}`}>
                        <div className="space-y-3">
                        <div><p className="text-[9px] text-gray-500 uppercase font-bold tracking-widest">GUEST NAME</p><p className={`font-bold text-lg leading-tight ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{lastSavedData.guest.name}</p></div>
                        <div><p className="text-[9px] text-gray-500 uppercase font-bold tracking-widest">TABLE NUMBER</p><p className={`font-bold text-lg ${isDarkMode ? 'text-gold-500' : 'text-gold-600'}`}>TABLE {lastSavedData.tableNumber}</p></div>
                        </div>
                        <div className="text-right space-y-3">
                        <div><p className="text-[9px] text-gray-500 uppercase font-bold tracking-widest">ARRIVAL / PAX</p><p className={`font-bold text-lg ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{lastSavedData.guest.time} - {lastSavedData.guest.pax} Pax</p></div>
                        <div><p className="text-[9px] text-gray-500 uppercase font-bold tracking-widest">OPERATIONAL NOTES</p><p className={`font-bold text-[10px] ${isDarkMode ? 'text-gold-400' : 'text-gold-700'}`}>{lastSavedData.guest.opNotes.toUpperCase()}</p></div>
                        </div>
                    </div>
                    <div className="space-y-6 mb-6">
                        {(() => {
                            const foodPriority = [
                              'SALAD', 'SOUP', 'LIGHT MEAL', 'KIDS MEAL', 'SPECIALTY STEAK', 'PRIME SELECTION', 
                              'BIG CUT', 'FAMILY SET', 'WESTERN DELIGHT', 'PASTA LOVERS', 'ASIAN DELIGHT', 
                              'INDONESIAN FAVORITE', 'BURGER & SANDWICH', 'NPD', 'DESSERT'
                            ];
                            const beveragePriority = [
                              'JUICE', 'SMOOTHIES', 'DRINKING & MINERAL WATER', 'MILKSHAKE', 'SOFT DRINK', 
                              'FRAPPE', 'ARTISAN TEA', 'TEA', 'COFFEE', 'MANUAL BREW', 'CHOCOLATE', 
                              'ICED BLENDED', 'MOCKTAIL', 'FREE MENU'
                            ];

                            const getItemData = (item: any) => {
                              let category = (item.category || 'OTHERS').toUpperCase();
                              if (!category || category === 'OTHERS') {
                                const menuItem = allMenu.find(m => m.name === item.name);
                                if (menuItem) category = menuItem.category.toUpperCase();
                                else {
                                  const upperName = item.name.toUpperCase();
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
                              }
                              const foodIdx = foodPriority.indexOf(category);
                              const bevIdx = beveragePriority.indexOf(category);
                              const isDessert = category === 'DESSERT';

                              return {
                                isBeverage: bevIdx !== -1,
                                isDessert,
                                priorityIndex: foodIdx !== -1 ? foodIdx : (bevIdx !== -1 ? bevIdx : 999),
                                condimentCount: item.details ? item.details.split(', ').length : 0
                               };
                            };

                            const sorted = [...lastSavedData.items].sort((a, b) => {
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
                              return a.name.localeCompare(b.name);
                            });

                            const foodItems = sorted.filter(i => {
                              const d = getItemData(i);
                              return !d.isBeverage && !d.isDessert;
                            });
                            const dessertItems = sorted.filter(i => getItemData(i).isDessert);
                            const beverageItems = sorted.filter(i => getItemData(i).isBeverage);

                            const renderSection = (title: string, items: any[], color: string) => (
                              <div className="space-y-4">
                                <div className="flex items-center gap-3">
                                  <div className={`h-px flex-1 ${isDarkMode ? 'bg-white/10' : 'bg-gray-200'}`}></div>
                                  <p className={`text-[10px] font-black uppercase tracking-[0.4em] ${color}`}>{title}</p>
                                  <div className={`h-px flex-1 ${isDarkMode ? 'bg-white/10' : 'bg-gray-200'}`}></div>
                                </div>
                                {items.map((item, i) => (
                                  <div key={i} className="flex gap-4">
                                      <div className="bg-gold-500 text-black h-8 w-12 rounded-lg flex items-center justify-center font-black text-sm shrink-0">{item.qty}x</div>
                                      <div className="flex-1">
                                          <p className={`font-black uppercase text-base ${isDarkMode ? 'text-gray-100' : 'text-gray-800'}`}>{item.name.replace(/\(\s*\d+\s*PERSON\s*\)/gi, '').trim()}</p>
                                          {item.details && (
                                              <div className="mt-2 space-y-1.5 pl-4 border-l-2 border-gold-900/10">
                                                  {item.details.split(', ').map((condiment, idx) => (
                                                  <div key={idx} className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-emerald-500/40 shrink-0"></div><p className="text-[11px] font-bold text-emerald-600 uppercase tracking-tight italic">{condiment}</p></div>))}
                                              </div>
                                          )}
                                          {item.note && (<div className="mt-2 bg-gold-500/10 p-3 rounded-xl border border-gold-500/30"><p className="text-[10px] font-black text-gold-600 uppercase tracking-tighter mb-1">ITEM NOTE:</p><p className={`text-sm italic font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>"{item.note}"</p></div>)}
                                      </div>
                                  </div>
                                ))}
                              </div>
                            );

                            return (
                              <div className="space-y-8">
                                {foodItems.length > 0 && renderSection("FOOD", foodItems, "text-gold-500")}
                                {dessertItems.length > 0 && renderSection("DESSERT", dessertItems, "text-emerald-500")}
                                {beverageItems.length > 0 && renderSection("BEVERAGE", beverageItems, "text-blue-500")}
                              </div>
                            );
                        })()}
                    </div>
                    {(lastSavedData.notes) && (<div className={`mb-10 p-4 rounded-xl border border-dashed ${isDarkMode ? 'bg-black/40 border-gold-900/40' : 'bg-gray-50 border-gray-200'}`}><p className="text-[10px] font-black text-gold-600 uppercase tracking-widest mb-1 flex items-center gap-1"><MessageSquare size={10}/> GLOBAL NOTES:</p><p className={`text-sm italic font-bold ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>"{lastSavedData.notes}"</p></div>)}
                    <div className="flex flex-col gap-3 no-print">
                        <button onClick={handleShareChecklistPDF} disabled={isSharingPdf} className="w-full py-4 bg-green-700 hover:bg-green-600 text-white rounded-2xl font-black uppercase tracking-widest text-sm flex items-center justify-center gap-2 shadow-xl transition-all active:scale-95">{isSharingPdf ? <Loader2 size={18} className="animate-spin" /> : <Share2 size={18} />} SHARE WHATSAPP</button>
                        <button onClick={(e) => { e.stopPropagation(); setShowPreview(false); }} className="w-full py-4 bg-gold-600 hover:bg-gold-500 text-black rounded-2xl font-black uppercase tracking-widest text-sm flex items-center justify-center gap-2 shadow-xl transition-all active:scale-95"><ArrowLeft size={18} /> KEMBALI</button>
                    </div>
                </div>
            </div>
        </div>
    );
  }

  return (
    <div className="animate-fade-in relative min-h-[70vh] pb-56 px-4 sm:px-0">
      <div className="space-y-6">
        <div className={`p-6 rounded-lg border flex flex-col gap-6 shadow-xl ${isDarkMode ? 'bg-dark-800 border-gold-900/30' : 'bg-white border-gray-200'}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {onBack && (<button onClick={onBack} className="p-3 hover:bg-gold-500 hover:text-black rounded-full transition-all border border-transparent hover:border-gold-500 text-gold-500 flex items-center gap-2 font-black uppercase text-[10px]"><ArrowLeft size={24} /> KEMBALI</button>)}
              <div className={`p-3 rounded-full border shadow-sm ${isDarkMode ? 'bg-gold-500/20 border-gold-500' : 'bg-gold-50 border-gold-400'}`}><CheckSquare className="text-gold-500" size={24} /></div>
              <div><h2 className={`text-2xl font-serif font-bold tracking-wide uppercase ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Input Menu</h2><p className="text-xs text-gold-600 uppercase tracking-widest font-bold">Configuring for {outletName}</p></div>
            </div>
          </div>
          <div className={`grid grid-cols-1 md:grid-cols-2 gap-4 p-4 rounded-xl border ${isDarkMode ? 'bg-dark-900/50 border-gold-900/20' : 'bg-gray-50 border-gray-200'}`}>
             <div className="space-y-1"><label className="text-[10px] uppercase text-gold-600 font-bold flex items-center gap-1"><Calendar size={10}/> Date</label><input type="date" value={guestInfo.date} onChange={(e) => setGuestInfo({...guestInfo, date: e.target.value})} className={`w-full border rounded px-3 py-2 text-xs outline-none focus:border-gold-500 ${isDarkMode ? 'bg-dark-800 border-gold-900/30 text-white color-scheme-dark' : 'bg-white border-gray-300 text-gray-900'}`} /></div>
             <div className="space-y-1"><label className="text-[10px] uppercase text-gold-600 font-bold flex items-center gap-1"><User size={10}/> Guest Name</label><input list="guest-names-checkmark" type="text" placeholder="Search guest..." value={guestInfo.name} onChange={handleGuestNameChange} className={`w-full border rounded px-3 py-2 text-xs outline-none focus:border-gold-500 font-bold ${isDarkMode ? 'bg-dark-800 border-gold-900/30 text-white' : 'bg-white border-gray-300 text-gray-900'}`} /><datalist id="guest-names-checkmark">{reservations.filter(r => r.reservationDate === guestInfo.date && !r.isWalkIn).map(r => (<option key={r.id} value={r.guestName}>{r.arrivalTime} - {r.guestCount} Pax - Tbl {r.tableNumber || '?'}</option>))}</datalist></div>
          </div>
          <div className="relative w-full"><Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gold-600" size={18} /><input type="text" placeholder="Search menu item..." value={search} onChange={(e) => setSearch(e.target.value)} className={`w-full border rounded-full py-3.5 pl-12 pr-4 focus:border-gold-500 focus:outline-none transition-all text-sm placeholder-gray-600 shadow-inner ${isDarkMode ? 'bg-dark-900 border-gold-900/50 text-white' : 'bg-gray-100 border-gray-300 text-gray-900'}`} /></div>
        </div>
        <div className="max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar space-y-4">
           {categories.map(cat => {
             const items = filteredMenu.filter(i => i.category === cat);
             if (items.length === 0) return null;
             const isExpanded = expandedCategories.includes(cat);
             const selectedCountInCat = checkedItems.filter(ci => items.some(mi => mi.name === ci.name)).reduce((sum, i) => sum + i.qty, 0);

             return (
               <div key={cat} className={`rounded-xl border overflow-hidden transition-all ${isDarkMode ? 'border-gold-900/20' : 'border-gray-200'}`}>
                 <button 
                  onClick={() => toggleCategory(cat)}
                  className={`w-full flex items-center justify-between p-4 transition-all ${isDarkMode ? 'hover:bg-gold-500/5' : 'hover:bg-gray-50'} ${isExpanded ? (isDarkMode ? 'bg-gold-500/10' : 'bg-gold-50') : ''}`}
                 >
                   <div className="flex items-center gap-3">
                     {isExpanded ? <ChevronDown size={18} className="text-gold-500" /> : <ChevronRight size={18} className="text-gold-500" />}
                     <h3 className={`text-sm font-bold uppercase tracking-widest ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{cat}</h3>
                     {selectedCountInCat > 0 && (
                       <span className="bg-emerald-500 text-white text-[9px] font-black px-2 py-0.5 rounded-full">{selectedCountInCat} SELECTED</span>
                     )}
                   </div>
                   <span className="text-[10px] font-bold text-gray-500 uppercase">{items.length} ITEMS</span>
                 </button>

                 {isExpanded && (
                   <div className={`p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 animate-slide-down ${isDarkMode ? 'bg-dark-900/30' : 'bg-gray-50/30'}`}>
                     {items.map((item, idx) => {
                       const totalQty = checkedItems.filter(i => i.name === item.name).reduce((sum, i) => sum + i.qty, 0);
                       const isSelected = totalQty > 0;
                       const isSoldOut = settings.soldOutItems?.includes(item.name);
                       const itemMapping = getItemMapping(item);
                       const itemHasModifiers = itemMapping && itemMapping.condimentGroupIds.length > 0;
                       
                       return (
                         <div key={idx} onClick={() => !isSoldOut && handleInitialItemClick(item)} className={`relative flex items-center justify-between p-4 rounded-xl border transition-all text-left group ${isSoldOut ? 'opacity-40 grayscale cursor-not-allowed border-red-500/50' : 'cursor-pointer hover:border-gold-400'} ${isSelected ? (isDarkMode ? 'bg-emerald-900/20 border-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.1)]' : 'bg-emerald-50 border-emerald-500 shadow-sm') : (isDarkMode ? 'bg-dark-800 border-gold-900/20 hover:border-gold-500/50 hover:bg-dark-700' : 'bg-white border-gray-200')}`}>
                           {isSoldOut && <div className="absolute inset-0 bg-red-900/20 flex items-center justify-center z-10"><span className="bg-red-600 text-white text-[8px] font-black uppercase px-2 py-1 rounded shadow-lg flex items-center gap-1"><Ban size={10}/> SOLD OUT</span></div>}
                           <div className="flex-1 mr-2 overflow-hidden"><div className="flex items-center gap-2"><p className={`text-xs font-bold uppercase truncate ${isSelected ? 'text-emerald-500' : (isDarkMode ? 'text-gray-100' : 'text-gray-800')}`}>{item.name}</p>{itemHasModifiers && <Settings2 size={12} className="text-gold-500 opacity-50"/>}</div><p className="text-[10px] text-gray-500 uppercase mt-0.5">{item.category}</p></div>
                           {isSelected && (<div className="bg-emerald-500 text-white px-3 py-1 rounded-full text-[10px] font-black">{totalQty}</div>)}
                         </div>
                       );
                     })}
                   </div>
                 )}
               </div>
             );
           })}
        </div>
      </div>
      {qtyPickerItem && !activeModifier.item && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/90 backdrop-blur-sm p-4 animate-fade-in">
           <div className={`w-full max-w-xs rounded-2xl border shadow-2xl overflow-hidden flex flex-col ${isDarkMode ? 'bg-dark-900 border-gold-600' : 'bg-white border-gray-200'}`}>
              <div className="p-4 bg-gold-600 text-black text-center"><p className="text-[10px] font-black uppercase tracking-widest">Select Quantity</p><h4 className="font-serif font-black text-sm truncate px-4">{qtyPickerItem.item.name}</h4></div>
              <div className="p-6 flex flex-col gap-6">
                 <div className="flex items-center justify-center gap-8"><button onClick={() => setQtyPickerItem(p => p ? {...p, qty: Math.max(1, p.qty - 1)} : null)} className="w-12 h-12 rounded-full border-2 border-gold-600 flex items-center justify-center text-gold-500 hover:bg-gold-500 hover:text-black transition-all"><Minus size={24}/></button><span className="text-5xl font-black font-mono text-white">{qtyPickerItem.qty}</span><button onClick={() => setQtyPickerItem(p => p ? {...p, qty: p.qty + 1} : null)} className="w-12 h-12 rounded-full border-2 border-gold-600 flex items-center justify-center text-gold-500 hover:bg-gold-500 hover:text-black transition-all"><Plus size={24}/></button></div>
                 <div className="space-y-2"><label className="text-[10px] font-black uppercase text-gold-500 tracking-widest flex items-center gap-2"><Edit3 size={12}/> Menu Note (Optional)</label><input type="text" value={currentItemNote} onChange={(e) => setCurrentItemNote(e.target.value)} placeholder="e.g. No Mayo..." className="w-full bg-dark-800 border border-gold-900/50 rounded-lg px-4 py-3 text-xs text-white outline-none focus:border-gold-500" /></div>
                 <div className="w-full flex flex-col gap-2"><button onClick={confirmQty} className="w-full py-4 bg-emerald-600 text-white rounded-xl font-black uppercase text-xs shadow-xl flex items-center justify-center gap-2">{(getItemMapping(qtyPickerItem.item)?.condimentGroupIds.length) ? 'Select Condiments' : 'Add to List'}</button><button onClick={() => { setQtyPickerItem(null); setEditingItemIndex(null); }} className="w-full py-2 text-gray-500 text-[10px] font-black uppercase">Cancel</button></div>
              </div>
           </div>
        </div>
      )}
      {activeModifier.item && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-sm p-4 animate-fade-in">
              <div className={`w-full max-w-3xl rounded-2xl border shadow-2xl overflow-hidden flex flex-col max-h-[90vh] ${isDarkMode ? 'bg-dark-900 border-gold-600' : 'bg-white border-gray-200'}`}>
                  <div className="p-6 border-b flex justify-between items-center bg-gold-600 text-black"><div><h4 className="text-xl font-serif font-black uppercase tracking-tighter">CONFIGURATION (FOR {qtyPickerItem?.qty}x)</h4><p className="text-xs font-bold opacity-80">{activeModifier.item.name}</p></div><button onClick={() => { setActiveModifier({ item: null, groups: {} }); setQtyPickerItem(null); setEditingItemIndex(null); }} className="hover:rotate-90 transition-transform"><X size={28}/></button></div>
                  <div className="p-6 overflow-y-auto custom-scrollbar flex-1 space-y-8">
                      <section className="space-y-2"><label className="text-[10px] font-black text-gold-500 uppercase tracking-widest block">Additional Item Note</label><input type="text" value={currentItemNote} onChange={(e) => setCurrentItemNote(e.target.value)} placeholder="e.g. Separate Sauce, No Salt..." className="w-full bg-dark-800 border border-gold-900/50 rounded-xl px-4 py-3 text-xs text-white outline-none focus:border-gold-500" /></section>
                      {getItemMapping(activeModifier.item!)?.condimentGroupIds.map(gid => {
                          const group = settings.condimentGroups.find(g => g.id === gid);
                          if (!group) return null;
                          return (
                            <section key={group.id} className="space-y-3">
                                <label className="text-[10px] font-black text-gold-500 uppercase tracking-widest block">{group.name}</label>
                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                                    {group.options.map(opt => {
                                        const selections = activeModifier.groups[group.id] || [];
                                        const selection = selections.find(s => s.name === opt);
                                        const hasQty = selection && selection.qty > 0;
                                        return (
                                            <div key={opt} className={`flex flex-col gap-2 p-2 rounded-xl border transition-all ${hasQty ? 'bg-gold-500/10 border-gold-500 shadow-md' : 'bg-dark-800 border-gray-800 text-gray-400'}`}>
                                                <span className={`text-[10px] font-bold uppercase leading-tight text-center ${hasQty ? 'text-gold-500' : ''}`}>{opt}</span>
                                                <div className="flex items-center justify-center gap-3 mt-auto">{hasQty ? (<><button onClick={() => handleUpdateModifierQty(group.id, opt, -1)} className="p-1.5 bg-gold-600 rounded text-black hover:bg-gold-400 transition-colors"><Minus size={10} /></button><span className="text-xs font-black text-white">{selection.qty}</span><button onClick={() => handleUpdateModifierQty(group.id, opt, 1)} className="p-1.5 bg-gold-600 rounded text-black hover:bg-gold-400 transition-colors"><Plus size={10} /></button></>) : <button onClick={() => handleUpdateModifierQty(group.id, opt, 1)} className="w-full py-1 rounded bg-dark-700 hover:bg-dark-600 text-[10px] font-bold uppercase text-gray-500 transition-colors">Select</button>}</div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </section>
                          );
                      })}
                  </div>
                  <div className="p-4 border-t flex justify-between items-center bg-dark-900/50"><div className="flex gap-3 ml-auto"><button onClick={() => { setActiveModifier({ item: null, groups: {} }); setQtyPickerItem(null); setEditingItemIndex(null); }} className="px-6 py-3 text-xs font-bold uppercase text-gray-500 hover:text-red-500 transition-colors">Cancel</button><button onClick={confirmModifier} className="bg-emerald-600 hover:bg-emerald-500 text-white px-10 py-3 rounded-xl font-bold uppercase text-xs shadow-xl flex items-center gap-2"><Check size={18} /> Save Item</button></div></div>
              </div>
          </div>
      )}
      <div className="fixed bottom-4 left-1/2 -translate-x-1/2 w-full max-w-5xl px-4 z-[40] animate-fade-in-up no-print">
         <div className={`border rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] p-4 flex flex-col gap-4 backdrop-blur-md ${isDarkMode ? 'bg-dark-800/90 border-gold-600/50' : 'bg-white/95 border-gray-200'}`}>
            <div className="flex items-center gap-3 px-2"><MessageSquare size={18} className="text-gold-500 shrink-0" /><input type="text" value={menuNotes} onChange={(e) => setMenuNotes(e.target.value)} placeholder="General Reservation Notes (Allergies, Birthdays, Area preference)..." className={`flex-1 bg-transparent border-b outline-none text-xs py-1 focus:border-gold-500 transition-colors ${isDarkMode ? 'border-gold-900/40 text-white placeholder-gray-600' : 'border-gray-200 text-gray-900 placeholder-gray-400'}`} /></div>
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-4 flex-1 min-w-0">
                  <div className="bg-gold-500 text-black p-3 rounded-xl shadow-lg shrink-0"><UtensilsCrossed size={24} /></div>
                  <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-3">
                          <p className="text-[10px] text-gold-500 uppercase font-black tracking-widest">Active Checklist</p>
                          <span className="bg-emerald-500/20 text-emerald-500 px-2 py-0.5 rounded text-[10px] font-black">{sortedCheckedItems.reduce((a,b) => a+b.qty, 0)} Items</span>
                        </div>
                        {sortedCheckedItems.length > 0 && (
                          <button onClick={() => setCheckedItems([])} className="text-[9px] font-black text-red-500 uppercase hover:text-red-400 transition-colors flex items-center gap-1">
                            <Ban size={10}/> Clear All
                          </button>
                        )}
                      </div>
                      
                      <div className="max-h-[120px] overflow-y-auto custom-scrollbar pr-2">
                        {sortedCheckedItems.length === 0 ? (
                          <p className="text-gray-500 text-xs italic py-2">No items selected yet...</p>
                        ) : (
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                            {sortedCheckedItems.map((item, i) => (
                              <div key={i} className="flex items-center gap-2 bg-dark-900/50 border border-gold-900/20 hover:border-emerald-500/40 p-2 rounded-xl transition-all group animate-scale-in">
                                <div className="flex flex-col items-center gap-0.5 border-r border-gold-900/20 pr-2 shrink-0">
                                  <button onClick={() => updateItemQtyById(item.id, 1, item.note)} className="text-emerald-500 hover:text-emerald-300"><Plus size={10}/></button>
                                  <span className="text-[11px] font-black text-white">{item.qty}x</span>
                                  <button onClick={() => updateItemQtyById(item.id, -1, item.note)} className="text-red-500 hover:text-red-300"><Minus size={10}/></button>
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-[10px] font-black text-gray-200 uppercase truncate leading-tight">{item.name}</p>
                                  {item.note && <p className="text-[8px] text-gold-500 italic truncate tracking-tighter">Note: {item.note}</p>}
                                  {item.details && <p className="text-[8px] text-emerald-500/70 italic truncate">{item.details}</p>}
                                </div>
                                <div className="flex items-center gap-1 shrink-0 ml-1">
                                  <button onClick={() => handleEditItem(i)} className="p-1.5 hover:bg-gold-500/10 text-gold-500 rounded-lg transition-colors" title="Edit Item"><Edit3 size={12}/></button>
                                  <button onClick={() => setCheckedItems(prev => prev.filter(p => p.id === item.id ? p.note !== item.note : true))} className="p-1.5 hover:bg-red-500/10 text-red-500 rounded-lg transition-colors"><X size={12}/></button>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                  </div>
              </div>
              <button onClick={handleSave} disabled={!selectedGuestId || checkedItems.length === 0} className={`px-10 py-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold uppercase tracking-[0.1em] text-xs flex items-center justify-center gap-3 shadow-xl transition-all active:scale-95 disabled:opacity-50 disabled:grayscale`}><Save size={18} /> Save Checklist</button>
            </div>
         </div>
      </div>
    </div>
  );
};

export default MenuCheckmark;
