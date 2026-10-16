
// @ts-nocheck
import React, { useState, useEffect } from 'react';
import { Reservation, LocationPreference, ReservationStatus, AppSettings, Shift, PaymentMethod, MenuOrderType } from '../types';
import { X, Users, LayoutGrid, Clock, Save, Tag, Banknote, MapPin, Calendar, UserCheck, Check, Phone, ClipboardCheck, Utensils, Sun, Moon, Coffee, Star, Crown, User, Sparkles, ClipboardList, AlertCircle, Map, Flame, CreditCard, QrCode, Landmark, UserPlus } from 'lucide-react';

interface Props {
  onSubmit: (reservation: Omit<Reservation, 'id' | 'createdAt' | 'picIncharge'>) => void;
  onCancel: () => void;
  initialDate?: string;
  isWalkInMode?: boolean; 
  existingReservations?: Reservation[]; 
  initialData?: Reservation | null; 
  settings?: AppSettings;
  isDarkMode?: boolean;
}

const BANK_METHODS = {
  'BCA': ['QRIS', 'DEBIT', 'CREDIT', 'QR MERCHANT BCA'],
  'BRI': ['QRIS', 'DEBIT', 'CREDIT', 'QR MERCHANT BRI'],
  'MANDIRI': ['QRIS', 'DEBIT', 'CREDIT', 'QR MERCHANT MANDIRI'],
  'CASH': ['TUNAI']
};

const ReservationForm: React.FC<Props> = ({ onSubmit, onCancel, initialDate, isWalkInMode = false, existingReservations = [], initialData = null, settings, isDarkMode = true }) => {
  const [showTablePicker, setShowTablePicker] = useState(false);
  const [hasCustomName, setHasCustomName] = useState(() => {
    if (isWalkInMode) {
      if (initialData?.guestName && !initialData.guestName.startsWith('Walk-In')) {
        return true;
      }
      return false;
    }
    return true;
  });
  
  const getCurrentTimeStr = () => {
    const now = new Date();
    return now.getHours().toString().padStart(2, '0') + ':' + now.getMinutes().toString().padStart(2, '0');
  };

  const [formData, setFormData] = useState(() => {
    const saved = localStorage.getItem('reservation_form_draft');
    if (saved && !initialData) {
      return JSON.parse(saved);
    }
    return {
      reservationDate: initialDate || new Date().toISOString().split('T')[0],
      guestName: '',
      guestCount: 2,
      arrivalTime: isWalkInMode ? getCurrentTimeStr() : '19:00',
      shift: Shift.DINNER,
      locationPreference: LocationPreference.NON_SMOKING,
      tableNumber: '', 
      mergedTables: [] as string[], 
      phoneNumber: '',
      otherRequirements: '',
      companyOrPersonalName: '',
      hasDownPayment: false,
      isFullPayment: false,
      downPaymentAmount: 0,
      paymentBank: 'CASH',
      paymentSubMethod: 'TUNAI',
      paymentMethod: 'CASH (TUNAI)',
      status: isWalkInMode ? ReservationStatus.CHECKED_IN : ReservationStatus.CONFIRMED,
      isWalkIn: isWalkInMode,
      isHarrySalesManager: false,
      isNurulSalesManager: false,
      menuOrderType: MenuOrderType.ON_THE_SPOT
    };
  });

  useEffect(() => {
    if (!initialData) {
      localStorage.setItem('reservation_form_draft', JSON.stringify(formData));
    }
  }, [formData, initialData]);

  useEffect(() => {
    if (initialData) {
      setFormData({
        ...formData,
        ...initialData,
        isFullPayment: initialData.isFullPayment || false,
        mergedTables: initialData.mergedTables || [],
        paymentBank: initialData.paymentBank || 'CASH',
        paymentSubMethod: initialData.paymentSubMethod || 'TUNAI'
      });
      if (isWalkInMode) {
        setHasCustomName(!!(initialData.guestName && !initialData.guestName.startsWith('Walk-In')));
      }
    }
  }, [initialData, isWalkInMode]);

  useEffect(() => {
    if (!initialData && !isWalkInMode) {
        const hour = parseInt(formData.arrivalTime.split(':')[0]);
        const minutes = parseInt(formData.arrivalTime.split(':')[1]);
        const totalMinutes = hour * 60 + minutes;
        let autoShift = Shift.DINNER;
        if (totalMinutes >= 1020 && totalMinutes < 1140) autoShift = Shift.IFTAR;
        else if (totalMinutes < 1020) autoShift = Shift.LUNCH;
        setFormData(prev => ({ ...prev, shift: autoShift }));
    }
  }, [formData.arrivalTime, isWalkInMode, initialData]);

  useEffect(() => {
      if (formData.shift === Shift.IFTAR) {
          setFormData(prev => ({ ...prev, menuOrderType: MenuOrderType.IFTAR_MENU }));
      }
  }, [formData.shift]);

  // Sync combined paymentMethod string
  useEffect(() => {
    if (formData.paymentBank === 'CASH') {
        setFormData(prev => ({ ...prev, paymentMethod: 'CASH' }));
    } else {
        setFormData(prev => ({ ...prev, paymentMethod: `${prev.paymentBank} (${prev.paymentSubMethod})` }));
    }
  }, [formData.paymentBank, formData.paymentSubMethod]);

  const occupiedTablesSet = React.useMemo(() => {
    const set = new Set<string>();
    const targetTimeMinutes = parseInt(formData.arrivalTime.split(':')[0]) * 60 + parseInt(formData.arrivalTime.split(':')[1]);
    
    existingReservations?.forEach(r => {
        if (r.reservationDate !== formData.reservationDate) return;
        if (initialData && r.id === initialData.id) return;
        if (r.status === ReservationStatus.CANCELLED || r.status === ReservationStatus.COMPLETED) return;

        const bookingTimeMinutes = parseInt(r.arrivalTime.split(':')[0]) * 60 + parseInt(r.arrivalTime.split(':')[1]);
        if (Math.abs(targetTimeMinutes - bookingTimeMinutes) < 120) {
            if (r.tableNumber) set.add(r.tableNumber);
            r.mergedTables?.forEach(t => set.add(t));
        }
    });
    return set;
  }, [existingReservations, formData.reservationDate, formData.arrivalTime, initialData]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isWalkInMode && !formData.guestName) return alert("Nama Tamu harus diisi.");
    if (isWalkInMode && hasCustomName && !formData.guestName.trim()) return alert("Nama Tamu harus diisi.");
    if (!formData.tableNumber) return alert("Nomor Meja harus dipilih.");
    
    let finalData = { ...formData };
    if (isWalkInMode) {
        if (!hasCustomName || !formData.guestName.trim()) {
            finalData.guestName = `Walk-In (Tbl-${formData.tableNumber || '?'})`;
        }
        finalData.phoneNumber = formData.phoneNumber || '-';
        finalData.arrivalTime = formData.arrivalTime || getCurrentTimeStr();
    }
    onSubmit(finalData);
    localStorage.removeItem('reservation_form_draft');
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    if (type === 'checkbox') setFormData(prev => ({ ...prev, [name]: (e.target as HTMLInputElement).checked }));
    else if (name === 'guestCount') setFormData(prev => ({ ...prev, [name]: parseInt(value) || 0 }));
    else setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleBankSelect = (bank: string) => {
    setFormData(prev => ({
        ...prev,
        paymentBank: bank,
        paymentSubMethod: BANK_METHODS[bank][0]
    }));
  };

  const inputClasses = `w-full px-5 py-4 rounded-2xl transition-all outline-none border font-bold text-sm ${isDarkMode ? 'bg-dark-800 border-white/5 text-white focus:border-gold-500 color-scheme-dark shadow-inner' : 'bg-white border-gray-200 text-gray-900 focus:border-gold-500'}`;
  const labelClasses = `flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] mb-3 ${isDarkMode ? 'text-gold-500/80' : 'text-gray-500'}`;

  return (
    <div className={`rounded-[3rem] shadow-2xl border overflow-hidden relative w-full transition-all duration-300 ${isDarkMode ? 'bg-dark-900 border-gold-800/30' : 'bg-white border-gray-200'}`}>
      <div className={`absolute top-0 left-0 right-0 h-2 ${isWalkInMode ? 'bg-blue-600' : 'bg-gold-500'}`}></div>
      
      <div className={`px-10 py-6 flex justify-between items-center border-b transition-colors duration-300 ${isDarkMode ? 'bg-dark-800/50 border-gold-900/10' : 'bg-gray-50 border-gray-200'}`}>
        <div>
            <h2 className={`text-2xl font-serif font-black uppercase tracking-tighter ${isWalkInMode ? 'text-blue-500' : (isDarkMode ? 'text-gold-400' : 'text-gold-600')}`}>
            {isWalkInMode ? 'Input Walk-In' : (initialData?.guestName ? 'Update Data' : 'Reservasi Baru')}
            </h2>
            <p className="text-[9px] font-black text-gray-500 uppercase tracking-[0.3em] mt-0.5">{isWalkInMode ? 'Input cepat tamu walk-in hari ini' : 'Lengkapi data operasional tamu'}</p>
        </div>
        <button onClick={onCancel} className="p-2 bg-white/5 text-gray-500 hover:text-red-500 transition-all rounded-full"><X size={24} /></button>
      </div>

      <div className="p-8 md:p-10 max-h-[85vh] overflow-y-auto custom-scrollbar">
        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-8">
          
          <div className="space-y-1">
            <label className={labelClasses}><Calendar size={14} /> 1. Tanggal</label>
            <input required type="date" name="reservationDate" value={formData.reservationDate} onChange={handleChange} className={inputClasses} />
          </div>

          {isWalkInMode ? (
            <div className="space-y-1">
              <label className={labelClasses}><UserCheck size={14} /> 2. Nama Tamu Walk-In</label>
              {!hasCustomName ? (
                <button
                  type="button"
                  onClick={() => {
                    setHasCustomName(true);
                    setFormData(prev => ({ ...prev, guestName: '' }));
                  }}
                  className="w-full py-4 bg-blue-600/10 hover:bg-blue-600/20 text-blue-400 border border-blue-500/30 rounded-2xl font-black uppercase text-xs transition-all flex items-center justify-center gap-2 active:scale-95 cursor-pointer"
                >
                  <UserPlus size={16} /> TAMBAH NAMA TAMU WALK-IN
                </button>
              ) : (
                <div className="relative">
                  <input
                    required
                    type="text"
                    name="guestName"
                    value={formData.guestName}
                    onChange={handleChange}
                    placeholder="CONTOH: BPK. REZA WALK-IN"
                    className={inputClasses + " uppercase pr-12 placeholder:text-gray-700"}
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setHasCustomName(false);
                      setFormData(prev => ({ ...prev, guestName: '' }));
                    }}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-red-500 p-1.5 rounded-full hover:bg-white/5 transition-all"
                    title="Gunakan Nama Otomatis"
                  >
                    <X size={16} />
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-1">
              <label className={labelClasses}><UserCheck size={14} /> 2. Nama Tamu</label>
              <input required type="text" name="guestName" value={formData.guestName} onChange={handleChange} placeholder="CONTOH: BPK. JAJANG" className={inputClasses + " uppercase placeholder:text-gray-700"} />
            </div>
          )}

          <div className="space-y-1">
            <label className={labelClasses}><Users size={14} /> {isWalkInMode ? '2. Jumlah Pax' : '3. Jumlah Tamu (Cover)'}</label>
            <div className="relative">
                <input required type="number" min="1" name="guestCount" value={formData.guestCount} onChange={handleChange} className={inputClasses + " text-xl pr-16"} />
                <span className="absolute right-6 top-1/2 -translate-y-1/2 text-[10px] font-black text-gray-600 uppercase">PAX</span>
            </div>
          </div>

          {!isWalkInMode && (
            <div className="space-y-1">
              <label className={labelClasses}><Clock size={14} /> 4. Jam Kedatangan</label>
              <input required type="time" name="arrivalTime" value={formData.arrivalTime} onChange={handleChange} className={inputClasses} />
            </div>
          )}

          {!isWalkInMode && (
            <div className="md:col-span-2 space-y-4">
              <label className={labelClasses}><Clock size={14} /> 5. Waktu Reservasi</label>
              <div className="grid grid-cols-3 gap-3">
                  <button type="button" onClick={() => setFormData({...formData, shift: Shift.LUNCH})} className={`py-4 rounded-2xl border transition-all flex flex-col items-center gap-2 font-black text-[11px] uppercase tracking-widest shadow-lg ${formData.shift === Shift.LUNCH ? 'bg-blue-600 text-white border-blue-500 scale-105' : 'bg-dark-800 border-white/5 text-gray-500'}`}><Sun size={20} /> Lunch</button>
                  <button type="button" onClick={() => setFormData({...formData, shift: Shift.IFTAR})} className={`py-4 rounded-2xl border transition-all flex flex-col items-center gap-2 font-black text-[11px] uppercase tracking-widest shadow-lg ${formData.shift === Shift.IFTAR ? 'bg-emerald-600 text-white border-emerald-500 scale-105' : 'bg-dark-800 border-white/5 text-gray-500'}`}><Sparkles size={20} /> Iftar</button>
                  <button type="button" onClick={() => setFormData({...formData, shift: Shift.DINNER})} className={`py-4 rounded-2xl border transition-all flex flex-col items-center gap-2 font-black text-[11px] uppercase tracking-widest shadow-lg ${formData.shift === Shift.DINNER ? 'bg-indigo-600 text-white border-indigo-500 scale-105' : 'bg-dark-800 border-white/5 text-gray-500'}`}><Moon size={20} /> Dinner</button>
              </div>
            </div>
          )}

          <div className="space-y-1">
            <label className={labelClasses}><LayoutGrid size={14} /> {isWalkInMode ? '3. Pilih Meja' : '6. Pilih Meja (Layout)'}</label>
            <button 
                type="button" 
                onClick={() => setShowTablePicker(true)}
                className={`w-full py-4 rounded-2xl border flex items-center justify-between px-6 transition-all ${formData.tableNumber ? 'bg-gold-500/10 border-gold-500 shadow-lg' : 'bg-dark-800 border-white/5 hover:border-gold-500/50'}`}
            >
                <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${formData.tableNumber ? 'bg-gold-500 text-black' : 'bg-white/5 text-gray-600'}`}><LayoutGrid size={20}/></div>
                    <span className={`text-lg font-serif font-black uppercase ${formData.tableNumber ? 'text-white' : 'text-gray-500'}`}>{formData.tableNumber ? `MEJA ${formData.tableNumber}` : 'PILIH NOMOR MEJA'}</span>
                </div>
            </button>
          </div>

          <div className="space-y-1">
            <label className={labelClasses}><Map size={14} /> Area (Otomatis)</label>
            <div className={`w-full px-5 py-4 rounded-2xl border font-black text-sm transition-all flex items-center gap-3 ${formData.tableNumber ? 'bg-emerald-500/10 border-emerald-500 text-emerald-500 shadow-md' : 'bg-dark-800 border-white/5 text-gray-700'}`}>
                <MapPin size={16} />
                <span className="uppercase tracking-widest">{formData.locationPreference}</span>
            </div>
          </div>

          {!isWalkInMode && (
            <>
              <div className="md:col-span-2 h-px bg-white/5 my-2"></div>
              
              <div className="md:col-span-2 space-y-4">
                <label className={labelClasses}><Utensils size={14} /> Kategori Pesanan</label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <button type="button" onClick={() => setFormData({...formData, menuOrderType: MenuOrderType.PRE_ORDER})} className={`py-4 rounded-2xl border flex flex-col items-center gap-2 transition-all shadow-lg ${formData.menuOrderType === MenuOrderType.PRE_ORDER ? 'bg-gold-500 border-gold-500 text-black scale-105' : 'bg-dark-800 border-white/5 text-gray-500'}`}><ClipboardList size={24} /><span className="text-[10px] font-black uppercase tracking-widest">Menu di Awal</span></button>
                    <button type="button" onClick={() => setFormData({...formData, menuOrderType: MenuOrderType.IFTAR_MENU})} className={`py-4 rounded-2xl border flex flex-col items-center gap-2 transition-all shadow-lg ${formData.menuOrderType === MenuOrderType.IFTAR_MENU ? 'bg-emerald-600 border-emerald-500 text-white scale-105' : 'bg-dark-800 border-white/5 text-gray-500'}`}><Flame size={24} /><span className="text-[10px] font-black uppercase tracking-widest">Buka Puasa</span></button>
                    <button type="button" onClick={() => setFormData({...formData, menuOrderType: MenuOrderType.ON_THE_SPOT})} className={`py-4 rounded-2xl border flex flex-col items-center gap-2 transition-all shadow-lg ${formData.menuOrderType === MenuOrderType.ON_THE_SPOT ? 'bg-indigo-600 border-indigo-500 text-white scale-105' : 'bg-dark-800 border-white/5 text-gray-500'}`}><Utensils size={24} /><span className="text-[10px] font-black uppercase tracking-widest">On The Spot</span></button>
                </div>
              </div>

              <div className={`md:col-span-2 p-8 rounded-[2.5rem] border border-dashed transition-all ${formData.hasDownPayment ? 'bg-emerald-500/5 border-emerald-500/40 shadow-xl' : 'bg-black/20 border-white/10'}`}>
                <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-4">
                        <div className={`p-4 rounded-2xl ${formData.hasDownPayment ? 'bg-emerald-500 text-white' : 'bg-white/5 text-gray-500'}`}><Banknote size={28} /></div>
                        <div>
                            <p className="text-sm font-black uppercase text-white tracking-widest leading-none">Pembayaran Downpayment / Lunas</p>
                            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mt-2">Aktifkan untuk input nominal & metode</p>
                        </div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer scale-125">
                        <input type="checkbox" name="hasDownPayment" checked={formData.hasDownPayment} onChange={handleChange} className="sr-only peer" />
                        <div className="w-14 h-7 bg-dark-700 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-emerald-600 shadow-inner"></div>
                    </label>
                </div>

                {formData.hasDownPayment && (
                  <div className="space-y-8 animate-fade-in">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                          <div className="space-y-3">
                              <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest flex items-center gap-2"><Tag size={12}/> Kategori Pembayaran</label>
                              <div className="grid grid-cols-2 gap-3">
                                  <button type="button" onClick={() => setFormData({...formData, isFullPayment: false})} className={`py-4 text-[11px] font-black rounded-xl uppercase border transition-all ${!formData.isFullPayment ? 'bg-gold-500 text-black border-gold-500 shadow-lg' : 'bg-dark-900 text-gray-500 border-white/5'}`}>Downpayment (DP)</button>
                                  <button type="button" onClick={() => setFormData({...formData, isFullPayment: true})} className={`py-4 text-[11px] font-black rounded-xl uppercase border transition-all ${formData.isFullPayment ? 'bg-emerald-600 text-white border-emerald-500 shadow-lg' : 'bg-dark-900 text-gray-500 border-white/5'}`}>Lunas (Full)</button>
                              </div>
                          </div>
                          <div className="space-y-3">
                              <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest flex items-center gap-2"><Banknote size={12}/> Nominal (Rp)</label>
                              <div className="relative">
                                  <span className="absolute left-6 top-1/2 -translate-y-1/2 text-emerald-500 font-black text-sm">Rp</span>
                                  <input type="number" value={formData.downPaymentAmount} onChange={(e) => setFormData({...formData, downPaymentAmount: parseInt(e.target.value) || 0})} className="w-full pl-14 pr-8 py-4 bg-dark-900 border border-emerald-500/20 rounded-2xl focus:border-emerald-500 outline-none text-white font-mono font-black text-lg shadow-inner" placeholder="0" />
                              </div>
                          </div>
                      </div>

                      <div className="space-y-4">
                          <label className="text-[10px] font-black text-gray-500 uppercase tracking-[0.3em] flex items-center gap-2 border-b border-white/5 pb-2"><Landmark size={14} className="text-gold-500"/> Pilih Bank & Metode</label>
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                              {Object.keys(BANK_METHODS).map(bank => (
                                  <button 
                                      key={bank} 
                                      type="button" 
                                      onClick={() => handleBankSelect(bank)}
                                      className={`py-4 px-2 rounded-xl border flex flex-col items-center justify-center gap-2 transition-all font-black text-[10px] uppercase tracking-widest ${formData.paymentBank === bank ? 'bg-gold-500 text-black border-gold-400 shadow-xl scale-105' : 'bg-dark-900 border-white/5 text-gray-500'}`}
                                  >
                                      {bank === 'CASH' ? <Banknote size={18}/> : <Landmark size={18}/>}
                                      {bank}
                                  </button>
                              ))}
                          </div>

                          {formData.paymentBank !== 'CASH' && (
                              <div className="animate-fade-in space-y-3 mt-6 p-6 bg-black/30 rounded-3xl border border-white/5">
                                  <label className="text-[9px] font-black text-gold-500 uppercase tracking-widest flex items-center gap-2"><CreditCard size={12}/> Pilih Tipe Pembayaran {formData.paymentBank}</label>
                                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                                      {BANK_METHODS[formData.paymentBank].map(sub => (
                                          <button 
                                              key={sub} 
                                              type="button" 
                                              onClick={() => setFormData({...formData, paymentSubMethod: sub})}
                                              className={`py-3 px-4 rounded-xl border flex items-center justify-center gap-2 text-[9px] font-black uppercase tracking-tighter transition-all ${formData.paymentSubMethod === sub ? 'bg-emerald-600 text-white border-emerald-500 shadow-md' : 'bg-dark-800 border-white/5 text-gray-600 hover:text-white'}`}
                                          >
                                              {sub.includes('QRIS') || sub.includes('QR') ? <QrCode size={12}/> : <CreditCard size={12}/>}
                                              {sub}
                                          </button>
                                      ))}
                                  </div>
                              </div>
                          )}
                      </div>
                  </div>
                )}
              </div>

              <div className="md:col-span-2 h-px bg-white/5 my-2"></div>

              <div className="md:col-span-2 space-y-4">
                <label className={labelClasses}><Crown size={14} /> Klasifikasi Reservasi</label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <button type="button" onClick={() => setFormData({...formData, isHarrySalesManager: false, isNurulSalesManager: false})} className={`py-4 rounded-2xl border transition-all flex items-center justify-center gap-3 font-black text-[11px] uppercase tracking-widest ${!formData.isHarrySalesManager && !formData.isNurulSalesManager ? 'bg-white text-black border-white shadow-xl scale-[1.02]' : 'bg-dark-800 border-white/5 text-gray-500'}`}><User size={18} /> Regular Guest</button>
                    <button type="button" onClick={() => setFormData({...formData, isHarrySalesManager: true, isNurulSalesManager: false})} className={`py-4 rounded-2xl border transition-all flex items-center justify-center gap-3 font-black text-[11px] uppercase tracking-widest ${formData.isHarrySalesManager ? 'bg-gold-500 text-black border-gold-500 shadow-xl scale-[1.02]' : 'bg-dark-800 border-white/5 text-gray-500'}`}><Star size={18} /> Harry SM</button>
                    <button type="button" onClick={() => setFormData({...formData, isHarrySalesManager: false, isNurulSalesManager: true})} className={`py-4 rounded-2xl border transition-all flex items-center justify-center gap-3 font-black text-[11px] uppercase tracking-widest ${formData.isNurulSalesManager ? 'bg-pink-600 text-white border-pink-500 shadow-xl scale-[1.02]' : 'bg-dark-800 border-white/5 text-gray-500'}`}><Crown size={18} /> Nurul SM</button>
                </div>
              </div>

              <div className="md:col-span-1 space-y-1">
                <label className={labelClasses}><Phone size={14} /> No. Telepon</label>
                <input type="text" name="phoneNumber" value={formData.phoneNumber} onChange={handleChange} placeholder="08..." className={inputClasses + " placeholder:text-gray-700"} />
              </div>

              <div className="md:col-span-1 space-y-1">
                <label className={labelClasses}><ClipboardCheck size={14} /> Kebutuhan Lainnya</label>
                <input type="text" name="otherRequirements" value={formData.otherRequirements} onChange={handleChange} placeholder="Alergi, Cake, dsb..." className={inputClasses + " placeholder:text-gray-700"} />
              </div>
            </>
          )}

          <div className={`md:col-span-2 pt-8 flex flex-col sm:flex-row justify-end gap-4 border-t transition-colors duration-300 ${isDarkMode ? 'border-white/5' : 'border-gray-100'}`}>
            <button type="button" onClick={onCancel} className="px-10 py-4 text-gray-500 hover:text-white uppercase text-xs font-black tracking-widest transition-colors">Batal</button>
            <button type="submit" className={`px-16 py-4 rounded-[1.5rem] font-black uppercase text-xs shadow-2xl flex items-center justify-center gap-4 transition-all active:scale-95 ${isWalkInMode ? 'bg-blue-600 hover:bg-blue-500 text-white' : 'bg-gold-500 hover:bg-gold-400 text-black'}`}>
              <Save size={20} strokeWidth={3}/> {isWalkInMode ? 'Simpan Walk-In' : 'Simpan Reservasi'}
            </button>
          </div>
        </form>
      </div>

      {showTablePicker && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/95 backdrop-blur-xl p-4 animate-fade-in">
           <div className={`w-full max-w-5xl rounded-[3rem] border border-gold-500/30 bg-dark-900 shadow-2xl flex flex-col max-h-[95vh] overflow-hidden`}>
              <div className="p-6 border-b border-white/5 flex justify-between items-center bg-dark-800/50">
                 <div>
                    <h3 className="text-xl font-serif font-black text-white uppercase tracking-tighter">Table Navigator</h3>
                    <p className="text-[9px] text-gold-500 font-bold uppercase tracking-widest mt-0.5">Status real-time untuk {formData.reservationDate} @ {formData.arrivalTime}</p>
                 </div>
                 <button onClick={() => setShowTablePicker(false)} className="p-3 bg-white/5 text-gray-500 rounded-full hover:bg-red-500 hover:text-white transition-all"><X size={24}/></button>
              </div>
              <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar">
                 {settings?.zones.map(zone => (
                    <div key={zone.id} className="space-y-4">
                       <div className="flex items-center gap-3 border-b border-white/10 pb-2">
                          <div className="w-1.5 h-4 bg-gold-500 rounded-full"></div>
                          <h4 className="text-[11px] font-black text-white uppercase tracking-[0.2em]">{zone.name}</h4>
                       </div>
                       <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-2">
                          {Array.from({ length: zone.tableEnd - zone.tableStart + 1 }, (_, i) => (zone.tableStart + i).toString()).map(num => {
                             const isBusy = occupiedTablesSet.has(num);
                             const isSelected = formData.tableNumber === num;
                             return (
                                <button 
                                  key={num} 
                                  type="button"
                                  disabled={isBusy}
                                  onClick={() => {
                                      let loc = LocationPreference.NON_SMOKING;
                                      if (zone.name.toLowerCase().includes('smoking')) loc = LocationPreference.SMOKING;
                                      if (zone.name.toLowerCase().includes('vip')) loc = LocationPreference.VIP;
                                      if (zone.name.toLowerCase().includes('outdoor')) loc = LocationPreference.OUTDOOR;
                                      setFormData({...formData, tableNumber: num, locationPreference: loc});
                                      setShowTablePicker(false);
                                  }}
                                  className={`h-16 rounded-xl border-2 transition-all flex flex-col items-center justify-center gap-0.5 active:scale-90 ${
                                      isBusy ? 'bg-black/40 border-white/5 text-gray-800 opacity-40 cursor-not-allowed grayscale' :
                                      isSelected ? 'bg-gold-500 border-gold-500 text-black shadow-lg scale-105' : 
                                      'bg-dark-800 border-white/5 text-gray-400 hover:border-gold-500/60'
                                  }`}
                                >
                                   <span className="text-[7px] font-black opacity-60 uppercase tracking-tighter">TBL</span>
                                   <span className="text-xl font-black">{num}</span>
                                   {isBusy && <span className="text-[6px] font-black uppercase text-red-900">BUSY</span>}
                                   {isSelected && <div className="absolute top-1 right-1 bg-black text-gold-500 p-0.5 rounded-full"><Check size={8} strokeWidth={4} /></div>}
                                </button>
                             );
                          })}
                       </div>
                    </div>
                 ))}
              </div>
              <div className="p-4 border-t border-white/5 bg-dark-800/80 flex justify-end">
                 <button onClick={() => setShowTablePicker(false)} className="px-8 py-3 bg-white/5 hover:bg-white/10 text-white rounded-xl font-black uppercase text-[9px] tracking-widest transition-all">Close Navigator</button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default ReservationForm;
