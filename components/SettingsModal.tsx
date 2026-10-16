
import React, { useState, useMemo, useEffect } from 'react';
import { AppSettings, Zone, CondimentGroup, CategoryModifierMapping, ThemeSettings, MenuItem, ALL_OUTLETS } from '../types';
import { X, Save, Plus, Trash2, LayoutGrid, MapPin, Utensils, Settings2, CheckCircle2, Palette, Type, Square, ShieldCheck, AlertCircle, DollarSign, Tag, ListPlus, Pencil, RotateCcw, Ban, Search, Store, Loader2 } from 'lucide-react';
import { MENU_DATA_BANDUNG, MENU_DATA_JAKARTA, OUTLETS_JAKARTA } from './MenuList';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { DEFAULT_SETTINGS } from '../App';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  settings: AppSettings;
  onSave: (newSettings: AppSettings, outlet?: string) => void;
  isDarkMode?: boolean;
  outletName: string;
  allowedOutlet?: string;
}

const COLOR_OPTIONS = [
  { name: 'White', hex: '#FFFFFF' },
  { name: 'Purple', hex: '#8B5CF6' },
  { name: 'Black', hex: '#000000' },
  { name: 'Gold', hex: '#D4AF37' },
  { name: 'Sky Blue', hex: '#0EA5E9' },
  { name: 'Red', hex: '#EF4444' }
];

const SettingsModal: React.FC<Props> = ({ isOpen, onClose, settings, onSave, isDarkMode, outletName, allowedOutlet }) => {
  const [formData, setFormData] = useState<AppSettings>(() => JSON.parse(JSON.stringify(settings)));
  const [activeTab, setActiveTab] = useState<'general' | 'zones' | 'modifiers' | 'menu' | 'availability' | 'theme'>('general');
  const [availabilitySearch, setAvailabilitySearch] = useState('');
  const [currentOutlet, setCurrentOutlet] = useState(outletName);
  const [isLoading, setIsLoading] = useState(false);

  // Fetch settings when currentOutlet changes
  useEffect(() => {
    if (!isOpen || currentOutlet === outletName) return;

    const fetchSettings = async () => {
      setIsLoading(true);
      try {
        const settingsRef = doc(db, `outlets/${currentOutlet}/settings`, 'current');
        const snapshot = await getDoc(settingsRef);
        if (snapshot.exists()) {
          setFormData({ ...JSON.parse(JSON.stringify(DEFAULT_SETTINGS)), ...snapshot.data() });
        } else {
          // If no settings exist for this outlet, use default settings
          setFormData(JSON.parse(JSON.stringify(DEFAULT_SETTINGS))); 
        }
      } catch (error) {
        handleFirestoreError(error, OperationType.GET, `outlets/${currentOutlet}/settings/current`);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSettings();
  }, [currentOutlet, isOpen]);

  // Reset to initial settings when modal opens with initial outlet
  useEffect(() => {
    if (isOpen) {
      setFormData(JSON.parse(JSON.stringify(settings)));
      setCurrentOutlet(outletName);
    }
  }, [isOpen, settings, outletName]);

  // Form state for new/editing menu item
  const [newItem, setNewItem] = useState<MenuItem>({ name: '', category: '', price: 0 });
  const [editingIndex, setEditingIndex] = useState<number | null>(null);

  // Determine current region menu
  const regionMenu = useMemo(() => {
    // We check if current outlet name is in Jakarta, but settings are global. 
    // Usually availability is outlet specific, but for simplicity we show all unique items.
    const allSystem = Array.from(new Set([...MENU_DATA_BANDUNG, ...MENU_DATA_JAKARTA].map(m => m.name)))
      .map(name => [...MENU_DATA_BANDUNG, ...MENU_DATA_JAKARTA].find(m => m.name === name)!);
    return allSystem;
  }, []);

  const allAvailableItems = useMemo(() => {
    return [...regionMenu, ...(formData.customMenu || [])];
  }, [regionMenu, formData.customMenu]);

  const filteredAvailability = useMemo(() => {
    return allAvailableItems.filter(item => 
      item.name.toLowerCase().includes(availabilitySearch.toLowerCase()) ||
      item.category.toLowerCase().includes(availabilitySearch.toLowerCase())
    );
  }, [availabilitySearch, allAvailableItems]);

  const systemCategories = useMemo(() => Array.from(new Set(regionMenu.map(m => m.category))).sort(), [regionMenu]);
  const customCategories = useMemo(() => Array.from(new Set((formData.customMenu || []).map(m => m.category))).sort(), [formData.customMenu]);
  const allCategories = Array.from(new Set([...systemCategories, ...customCategories])).sort();

  if (!isOpen) return null;

  const handleZoneChange = (index: number, field: keyof Zone, value: string | number) => {
    const newZones = [...formData.zones];
    newZones[index] = { ...newZones[index], [field]: value };
    setFormData({ ...formData, zones: newZones });
  };

  const addZone = () => {
    const newZone: Zone = {
      id: Date.now().toString(),
      name: 'New Area',
      description: 'Description',
      tableStart: 1,
      tableEnd: 5
    };
    setFormData({ ...formData, zones: [...formData.zones, newZone] });
  };

  const removeZone = (index: number) => {
    const newZones = formData.zones.filter((_, i) => i !== index);
    setFormData({ ...formData, zones: newZones });
  };

  const addCondimentGroup = () => {
      const newGroup: CondimentGroup = {
          id: 'g' + Date.now(),
          name: 'NEW GROUP',
          options: ['Option 1']
      };
      setFormData({...formData, condimentGroups: [...formData.condimentGroups, newGroup]});
  };

  const updateCondimentGroup = (id: string, field: keyof CondimentGroup, value: any) => {
      setFormData({
          ...formData,
          condimentGroups: formData.condimentGroups.map(g => g.id === id ? {...g, [field]: value} : g)
      });
  };

  const deleteCondimentGroup = (id: string) => {
      setFormData({
          ...formData,
          condimentGroups: formData.condimentGroups.filter(g => g.id !== id),
          categoryMappings: formData.categoryMappings.map(m => ({
              ...m,
              condimentGroupIds: m.condimentGroupIds.filter(gid => gid !== id)
          }))
      });
  };

  const toggleCategoryMapping = (categoryName: string, groupId: string) => {
      const existing = formData.categoryMappings.find(m => m.categoryName === categoryName);
      let newMappings = [...formData.categoryMappings];
      
      if (existing) {
          const hasGroup = existing.condimentGroupIds.includes(groupId);
          newMappings = newMappings.map(m => {
              if (m.categoryName === categoryName) {
                  return {
                      ...m,
                      condimentGroupIds: hasGroup 
                        ? m.condimentGroupIds.filter(id => id !== groupId)
                        : [...m.condimentGroupIds, groupId]
                  };
              }
              return m;
          });
      } else {
          newMappings.push({ categoryName, condimentGroupIds: [groupId] });
      }
      
      setFormData({ ...formData, categoryMappings: newMappings });
  };

  const saveMenuItem = () => {
    if (!newItem.name || !newItem.category) return alert("Lengkapi Nama dan Kategori");
    const updatedMenu = [...formData.customMenu];
    if (editingIndex !== null) updatedMenu[editingIndex] = newItem;
    else updatedMenu.push(newItem);
    setFormData({ ...formData, customMenu: updatedMenu });
    setNewItem({ name: '', category: '', price: 0 });
    setEditingIndex(null);
  };

  const startEditMenuItem = (index: number) => {
    setEditingIndex(index);
    setNewItem(formData.customMenu[index]);
    document.getElementById('menu-form-top')?.scrollIntoView({ behavior: 'smooth' });
  };

  const deleteMenuItem = (index: number) => {
    if (confirm("Hapus menu ini dari daftar kustom?")) {
        setFormData({
          ...formData,
          customMenu: formData.customMenu.filter((_, i) => i !== index)
        });
        if (editingIndex === index) {
            setEditingIndex(null);
            setNewItem({ name: '', category: '', price: 0 });
        }
    }
  };

  const toggleSoldOut = (itemName: string) => {
    const current = formData.soldOutItems || [];
    const isSold = current.includes(itemName);
    const updated = isSold 
        ? current.filter(n => n !== itemName) 
        : [...current, itemName];
    setFormData({ ...formData, soldOutItems: updated });
  };

  const updateTheme = (field: keyof ThemeSettings, hex: string) => {
    setFormData({ ...formData, theme: { ...formData.theme, [field]: hex } });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData, currentOutlet);
    onClose();
  };

  const ColorPickerSection = ({ label, icon, field }: { label: string, icon: React.ReactNode, field: keyof ThemeSettings }) => (
    <div className={`p-4 rounded-xl border border-gold-900/30 bg-dark-800`}>
      <div className="flex items-center gap-2 mb-4">
        {icon}
        <span className="text-[10px] font-black uppercase tracking-widest text-gold-500">{label}</span>
      </div>
      <div className="flex flex-wrap gap-2">
        {COLOR_OPTIONS.map(opt => (
          <button 
            key={opt.hex}
            onClick={() => updateTheme(field, opt.hex)}
            className={`w-10 h-10 rounded-lg border-2 transition-all relative group flex items-center justify-center ${formData.theme[field] === opt.hex ? 'border-gold-500 scale-110 shadow-lg' : 'border-transparent opacity-60 hover:opacity-100'}`}
            style={{ backgroundColor: opt.hex }}
            title={opt.name}
          >
            {formData.theme[field] === opt.hex && <CheckCircle2 size={16} className={opt.hex === '#FFFFFF' ? 'text-black' : 'text-white'} />}
          </button>
        ))}
      </div>
    </div>
  );

  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm p-4 animate-fade-in bg-black/90`}>
      <div className={`border rounded-lg shadow-2xl w-full max-w-5xl max-h-[90vh] flex flex-col bg-dark-900 border-gold-800`}>
        
        <div className={`p-6 border-b flex justify-between items-center bg-dark-800 border-gold-900`}>
          <div className="flex items-center gap-4">
            <div className="bg-gold-500/10 p-3 rounded-2xl border border-gold-500/20">
              <Settings2 className="text-gold-500" size={24} />
            </div>
            <div>
              <h2 className={`text-xl font-serif font-bold text-white`}>Application Settings</h2>
              <p className="text-sm text-gold-600">Advanced Configuration & Theme Engine</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 bg-dark-900/50 border border-white/5 rounded-xl px-4 py-2 opacity-80">
              <Store size={16} className="text-gold-500/50" />
              <span className="text-xs font-black uppercase text-gray-400">{currentOutlet}</span>
            </div>
            <button onClick={onClose} className="text-gray-500 hover:text-white transition-colors p-2 hover:bg-white/5 rounded-full">
              <X size={24} />
            </button>
          </div>
        </div>

        <div className={`flex border-b overflow-x-auto no-scrollbar border-gold-900/50`}>
          <button onClick={() => setActiveTab('general')} className={`flex-1 min-w-[100px] py-3 text-[10px] font-bold uppercase tracking-wider transition-colors ${activeTab === 'general' ? 'bg-gold-900/20 text-gold-500 border-b-2 border-gold-500' : 'text-gray-500 hover:text-white'}`}>General</button>
          <button onClick={() => setActiveTab('zones')} className={`flex-1 min-w-[100px] py-3 text-[10px] font-bold uppercase tracking-wider transition-colors ${activeTab === 'zones' ? 'bg-gold-900/20 text-gold-500 border-b-2 border-gold-500' : 'text-gray-500 hover:text-white'}`}>Lay out Table ACTIVE</button>
          <button onClick={() => setActiveTab('menu')} className={`flex-1 min-w-[100px] py-3 text-[10px] font-bold uppercase tracking-wider transition-colors ${activeTab === 'menu' ? 'bg-gold-900/20 text-gold-500 border-b-2 border-gold-500' : 'text-gray-500 hover:text-white'}`}>Menu (Add/Edit)</button>
          <button onClick={() => setActiveTab('availability')} className={`flex-1 min-w-[100px] py-3 text-[10px] font-bold uppercase tracking-wider transition-colors ${activeTab === 'availability' ? 'bg-gold-900/20 text-gold-500 border-b-2 border-gold-500' : 'text-gray-500 hover:text-white'}`}>Availability</button>
          <button onClick={() => setActiveTab('modifiers')} className={`flex-1 min-w-[100px] py-3 text-[10px] font-bold uppercase tracking-wider transition-colors ${activeTab === 'modifiers' ? 'bg-gold-900/20 text-gold-500 border-b-2 border-gold-500' : 'text-gray-500 hover:text-white'}`}>Modifiers</button>
          <button onClick={() => setActiveTab('theme')} className={`flex-1 min-w-[100px] py-3 text-[10px] font-bold uppercase tracking-wider transition-colors ${activeTab === 'theme' ? 'bg-gold-900/20 text-gold-500 border-b-2 border-gold-500' : 'text-gray-500 hover:text-white'}`}>Theme</button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === 'general' && (
            <div className="space-y-6 animate-fade-in">
              <div className={`p-4 rounded border border-gold-900/30 bg-dark-800`}>
                <label className="block text-sm font-bold text-gold-500 uppercase tracking-widest mb-2 flex items-center gap-2"><LayoutGrid size={18} /> Total Number of Tables</label>
                <input type="number" value={formData.totalTables} onChange={(e) => setFormData({ ...formData, totalTables: parseInt(e.target.value) || 0 })} className={`w-full rounded px-4 py-3 text-lg font-bold outline-none focus:border-gold-500 border bg-dark-900 border-gold-800 text-white`} />
              </div>
            </div>
          )}

          {activeTab === 'menu' && (
            <div className="space-y-8 animate-fade-in">
               <div id="menu-form-top" className={`p-6 rounded-xl border transition-all ${editingIndex !== null ? 'border-blue-500 bg-blue-900/10' : 'border-gold-900/30 bg-dark-800'}`}>
                  <h3 className="text-sm font-bold text-gold-500 uppercase tracking-widest flex items-center gap-2 mb-6">
                    {editingIndex !== null ? <Pencil size={18} className="text-blue-500" /> : <ListPlus size={18}/>} 
                    {editingIndex !== null ? 'Edit Menu Kustom' : 'Tambah Menu Baru'}
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                     <div className="space-y-1">
                        <label className="text-[10px] font-black uppercase text-gray-500 tracking-widest">Nama Menu</label>
                        <input type="text" placeholder="Contoh: RIBEYE STEAK..." value={newItem.name} onChange={e => setNewItem({...newItem, name: e.target.value.toUpperCase()})} className="w-full bg-dark-900 border border-gold-900/40 rounded-lg px-4 py-2 text-white text-sm outline-none focus:border-gold-500" />
                     </div>
                     <div className="space-y-1">
                        <label className="text-[10px] font-black uppercase text-gray-500 tracking-widest">Kategori</label>
                        <input list="cat-list" type="text" placeholder="Pilih atau Ketik Baru..." value={newItem.category} onChange={e => setNewItem({...newItem, category: e.target.value.toUpperCase()})} className="w-full bg-dark-900 border border-gold-900/40 rounded-lg px-4 py-2 text-white text-sm outline-none focus:border-gold-500" />
                        <datalist id="cat-list">{allCategories.map(cat => <option key={cat} value={cat} />)}</datalist>
                     </div>
                     <div className="space-y-1">
                        <label className="text-[10px] font-black uppercase text-gray-500 tracking-widest">Harga (Rp)</label>
                        <input type="number" placeholder="0" value={newItem.price} onChange={e => setNewItem({...newItem, price: parseInt(e.target.value) || 0})} className="w-full bg-dark-900 border border-gold-900/40 rounded-lg px-4 py-2 text-white text-sm outline-none focus:border-gold-500" />
                     </div>
                  </div>
                  <div className="flex gap-2">
                      <button onClick={saveMenuItem} className={`flex-1 py-3 rounded-lg font-black uppercase text-xs shadow-lg transition-all active:scale-95 flex items-center justify-center gap-2 ${editingIndex !== null ? 'bg-blue-600 hover:bg-blue-500 text-white' : 'bg-gold-600 hover:bg-gold-500 text-black'}`}>
                         {editingIndex !== null ? <CheckCircle2 size={18}/> : <Plus size={18}/>} {editingIndex !== null ? 'SIMPAN PERUBAHAN' : 'TAMBAH KE DAFTAR'}
                      </button>
                      {editingIndex !== null && <button onClick={() => {setEditingIndex(null); setNewItem({name:'', category:'', price:0});}} className="px-6 py-3 bg-dark-800 hover:bg-dark-700 text-gray-400 rounded-lg font-black uppercase text-xs border border-white/5 transition-all flex items-center gap-2"><RotateCcw size={16} /> Batal</button>}
                  </div>
               </div>
               <div className="space-y-4">
                  <h4 className="text-xs font-black text-gold-500 uppercase tracking-widest border-l-2 border-gold-500 pl-3">Daftar Menu Kustom ({formData.customMenu.length})</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                     {formData.customMenu.map((item, idx) => (
                        <div key={idx} className={`flex items-center justify-between p-4 rounded-xl border transition-all group ${editingIndex === idx ? 'bg-blue-900/20 border-blue-500/50' : 'border-white/5 bg-black/40 hover:border-gold-500/30'}`}>
                           <div className="flex-1"><p className="font-black text-white text-sm uppercase">{item.name}</p><div className="flex items-center gap-3 mt-1"><span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${editingIndex === idx ? 'text-blue-400 bg-blue-500/10 border-blue-500/20' : 'text-gold-500 bg-gold-500/10 border-gold-500/20'}`}>{item.category}</span><span className="text-xs font-mono text-gray-500">Rp {item.price.toLocaleString('id-ID')}</span></div></div>
                           <div className="flex items-center gap-1"><button onClick={() => startEditMenuItem(idx)} className={`p-2 rounded-lg transition-all ${editingIndex === idx ? 'text-blue-400 bg-blue-500/10' : 'text-gray-600 hover:text-blue-500 hover:bg-blue-500/10 opacity-0 group-hover:opacity-100'}`} title="Edit Menu"><Pencil size={18}/></button><button onClick={() => deleteMenuItem(idx)} className="p-2 text-gray-600 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-all opacity-0 group-hover:opacity-100" title="Hapus Menu"><Trash2 size={18}/></button></div>
                        </div>
                     ))}
                  </div>
               </div>
            </div>
          )}

          {activeTab === 'availability' && (
            <div className="space-y-6 animate-fade-in">
               <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                  <div className="flex items-center gap-3"><div className="p-3 rounded-2xl bg-red-600/10 text-red-500 border border-red-500/20"><Ban size={24}/></div><div><h3 className="text-lg font-serif font-black uppercase tracking-tight text-white">Menu Hold / Sold Out</h3><p className="text-[10px] text-red-600 font-bold uppercase tracking-widest">Kunci menu yang tidak tersedia hari ini</p></div></div>
                  <div className="relative w-full md:w-64"><Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={16}/><input type="text" placeholder="Cari menu..." value={availabilitySearch} onChange={e => setAvailabilitySearch(e.target.value)} className="w-full pl-10 pr-4 py-3 bg-dark-800 border border-white/5 rounded-xl text-xs text-white outline-none focus:border-gold-500" /></div>
               </div>
               
               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {filteredAvailability.map((item, idx) => {
                      const isSold = formData.soldOutItems?.includes(item.name);
                      return (
                        <button key={idx} onClick={() => toggleSoldOut(item.name)} className={`p-4 rounded-xl border transition-all text-left flex justify-between items-center group relative overflow-hidden ${isSold ? 'bg-red-900/10 border-red-500 shadow-[0_0_15px_rgba(239,68,68,0.1)]' : 'bg-dark-800 border-white/5 hover:border-gold-500/30'}`}>
                           {isSold && <div className="absolute top-0 left-0 bottom-0 w-1 bg-red-600"></div>}
                           <div className="flex-1 overflow-hidden">
                              <p className={`text-xs font-black uppercase truncate ${isSold ? 'text-red-500' : 'text-white'}`}>{item.name}</p>
                              <p className="text-[9px] text-gray-500 uppercase mt-1">{item.category}</p>
                           </div>
                           <div className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border transition-all ${isSold ? 'bg-red-600 text-white border-red-600' : 'bg-black/40 text-gray-500 border-white/5 group-hover:text-gold-500 group-hover:border-gold-500'}`}>
                              {isSold ? 'SOLD OUT' : 'AVAILABLE'}
                           </div>
                        </button>
                      );
                  })}
               </div>
            </div>
          )}

          {activeTab === 'theme' && (
            <div className="space-y-8 animate-fade-in">
               <div className="space-y-4">
                  <h4 className="text-xs font-black text-gold-600 uppercase tracking-[0.2em] border-l-2 border-gold-600 pl-3">Global Application Interface</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <ColorPickerSection label="Global Font" icon={<Type size={16}/>} field="fontColor" />
                    <ColorPickerSection label="Main Background" icon={<Palette size={16}/>} field="backgroundColor" />
                    <ColorPickerSection label="Card Surface" icon={<Square size={16}/>} field="surfaceColor" />
                    <ColorPickerSection label="Primary Accent" icon={<Palette size={16} className="text-gold-500"/>} field="primaryColor" />
                  </div>
               </div>
               <div className="space-y-4">
                  <h4 className="text-xs font-black text-gold-600 uppercase tracking-[0.2em] border-l-2 border-gold-600 pl-3">Table & Floor Plan Features</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <ColorPickerSection label="Table Available" icon={<Square size={16}/>} field="tableIdleColor" />
                    <ColorPickerSection label="Table Active" icon={<Square size={16} className="text-sky-500 fill-sky-500"/>} field="tableActiveColor" />
                    <ColorPickerSection label="Table Upcoming" icon={<Square size={16} className="text-gold-500 fill-gold-500"/>} field="tableUpcomingColor" />
                    <ColorPickerSection label="Table Completed" icon={<Square size={16} className="text-purple-500 fill-purple-500"/>} field="tableCompletedColor" />
                  </div>
               </div>
            </div>
          )}

          {activeTab === 'zones' && (
            <div className="space-y-4 animate-fade-in">
              <div className="flex justify-between items-center mb-2">
                <p className="text-xs text-gray-500 uppercase tracking-widest">Floor Plan Configuration</p>
                <button type="button" onClick={addZone} className="bg-blue-600 hover:bg-blue-500 text-white px-3 py-1.5 rounded text-xs font-bold uppercase tracking-wider flex items-center gap-2"><Plus size={14} /> Add Area</button>
              </div>
              {formData.zones.map((zone, index) => (
                <div key={zone.id} className={`p-4 rounded border relative group transition-colors bg-dark-800 border-gray-700 hover:border-gold-600`}>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                    <div><label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Zone Name</label><input type="text" value={zone.name} onChange={(e) => handleZoneChange(index, 'name', e.target.value)} className={`w-full rounded px-3 py-2 text-sm border bg-dark-900 border-gray-700 text-white`} /></div>
                    <div><label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Description</label><input type="text" value={zone.description} onChange={(e) => handleZoneChange(index, 'description', e.target.value)} className={`w-full rounded px-3 py-2 text-sm border bg-dark-900 border-gray-700 text-gray-300`} /></div>
                  </div>
                  <div className="grid grid-cols-2 gap-4"><input type="number" value={zone.tableStart} onChange={(e) => handleZoneChange(index, 'tableStart', parseInt(e.target.value) || 0)} className={`w-full rounded px-3 py-2 text-sm border bg-dark-900 border-gray-700 text-white`} /><input type="number" value={zone.tableEnd} onChange={(e) => handleZoneChange(index, 'tableEnd', parseInt(e.target.value) || 0)} className={`w-full rounded px-3 py-2 text-sm border bg-dark-900 border-gray-700 text-white`} /></div>
                  <button onClick={() => removeZone(index)} className="absolute top-4 right-4 text-gray-600 hover:text-red-500"><Trash2 size={16} /></button>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'modifiers' && (
            <div className="space-y-10 animate-fade-in">
              <section>
                <div className="flex justify-between items-center mb-4"><h3 className="text-sm font-bold text-gold-500 uppercase tracking-widest flex items-center gap-2"><Settings2 size={16}/> 1. Condiment Groups</h3><button onClick={addCondimentGroup} className="bg-gold-600 text-black px-4 py-1.5 rounded text-[10px] font-black uppercase flex items-center gap-2 transition-all active:scale-95"><Plus size={14}/> New Group</button></div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {formData.condimentGroups.map(group => (
                        <div key={group.id} className={`p-4 rounded-xl border border-gold-900/30 bg-dark-800`}>
                            <div className="flex justify-between items-center mb-3 pb-2 border-b border-gold-900/10"><input value={group.name} onChange={(e) => updateCondimentGroup(group.id, 'name', e.target.value.toUpperCase())} className="bg-transparent font-black text-xs text-gold-500 outline-none w-full uppercase" placeholder="Group Name (e.g. SAUCE)" /><button onClick={() => deleteCondimentGroup(group.id)} className="text-gray-600 hover:text-red-500 transition-colors"><Trash2 size={14}/></button></div>
                            <div className="space-y-2"><label className="text-[9px] font-bold text-gray-500 uppercase tracking-widest block mb-1">Options (Comma separated)</label><textarea value={group.options.join(', ')} onChange={(e) => updateCondimentGroup(group.id, 'options', e.target.value.split(',').map(s => s.trim()).filter(s => s !== ''))} className={`w-full p-2 text-xs rounded border outline-none h-20 resize-none bg-dark-900 border-gold-900/40 text-white`} /></div>
                        </div>
                    ))}
                </div>
              </section>
              <section className="pt-6 border-t border-gold-900/20"><h3 className="text-sm font-bold text-gold-500 uppercase tracking-widest flex items-center gap-2 mb-6"><Utensils size={16}/> 2. Category Modifier Mapping</h3><div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">{allCategories.map(cat => {const mapping = formData.categoryMappings.find(m => m.categoryName === cat);const isActive = mapping && mapping.condimentGroupIds.length > 0;return (<div key={cat} className={`p-3 rounded-lg border flex flex-col gap-2 transition-all ${isActive ? 'bg-emerald-900/10 border-emerald-500/50' : 'bg-dark-800 border-gold-900/10'}`}><p className={`text-[10px] font-black truncate uppercase ${isActive ? 'text-emerald-400' : 'text-gray-500'}`}>{cat}</p><div className="flex flex-wrap gap-1 mt-1">{formData.condimentGroups.map(group => {const isSelected = mapping?.condimentGroupIds.includes(group.id);return (<button key={group.id} onClick={() => toggleCategoryMapping(cat, group.id)} className={`px-2 py-1 rounded text-[8px] font-black uppercase border transition-all ${isSelected ? 'bg-emerald-500 text-white border-emerald-500' : 'bg-dark-900 text-gray-500 border-gold-900/20 hover:border-gold-500'}`}>{group.name}</button>);})}</div></div>);})}</div></section>
            </div>
          )}
        </div>

        <div className={`p-6 border-t flex justify-end gap-3 bg-dark-800 border-gold-900`}>
          <button onClick={onClose} className="px-6 py-2 rounded text-gray-400 font-medium hover:text-white uppercase tracking-wider text-[10px]">Cancel</button>
          <button onClick={handleSubmit} className="bg-gold-600 hover:bg-gold-500 text-black px-8 py-2 rounded font-black uppercase tracking-wider text-[10px] flex items-center gap-2 shadow-lg"><Save size={16} /> Save Changes</button>
        </div>
      </div>
    </div>
  );
};

export default SettingsModal;
