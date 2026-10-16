
import React, { useState } from 'react';
import { X, ChevronRight, ChevronLeft, Sparkles, CalendarCheck, Calculator, Check, MessageCircle, FileText, ClipboardList } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

const steps = [
  {
    title: "Welcome to Greeter Control",
    desc: "Pusat kendali digital operasional Justus Steakhouse. Panduan ini akan membantu Anda memahami alur standar pelayanan reservasi dan billing.",
    icon: <Sparkles className="text-gold-500" size={48} />,
    color: "gold"
  },
  {
    title: "Urutan Konfirmasi Reservasi",
    isList: true,
    list: [
      "1. Greeter menghubungi Customer dan memberikan Form Reservasi",
      "2. Customer mengisi data yang perlu di isi",
      "3. Greeter input data Reservasi kedalam Aplikasi",
      "4. Salin draf Reservasi di Reservasi Book. (Jika Iftar, klik tombol S&K Iftar secara terpisah)",
      "5. Paste Konfirmasi & S&K kepada Tamu melalui WhatsApp"
    ],
    icon: <MessageCircle className="text-blue-500" size={48} />,
    color: "blue"
  },
  {
    title: "Urutan Input Reservasi - Bill",
    isList: true,
    list: [
      "1. Input Data Reservasi ke dalam sistem",
      "2. Input Menu yang sudah dipilih oleh Customer di menu 'Input Menu'",
      "3. Share PDF Menu yang sudah di-input dan konfirmasi kesesuaian pesanan ke tamu",
      "4. Cek Billing dan berikan TOTAL PEMBAYARAN saja kepada customer untuk keperluan DP"
    ],
    icon: <Calculator className="text-emerald-500" size={48} />,
    color: "emerald"
  },
  {
    title: "Tips Operasional",
    desc: "Selalu perbarui status meja di 'Lay Out Table Active'. Gunakan fitur AI Quick Assist untuk mempercepat input data reservasi dari teks WhatsApp.",
    icon: <CalendarCheck className="text-purple-500" size={48} />,
    color: "purple"
  }
];

const TutorialModal: React.FC<Props> = ({ isOpen, onClose }) => {
  const [currentStep, setCurrentStep] = useState(0);

  if (!isOpen) return null;

  const step = steps[currentStep];

  const handleNext = () => {
    if (currentStep < steps.length - 1) setCurrentStep(currentStep + 1);
    else onClose();
  };

  const handlePrev = () => {
    if (currentStep > 0) setCurrentStep(currentStep - 1);
  };

  return (
    <div className="fixed inset-0 z-[250] flex items-center justify-center bg-black/95 backdrop-blur-xl animate-fade-in p-4">
      <div className="glass-card w-full max-w-2xl rounded-[3rem] border border-gold-500/20 shadow-[0_0_100px_rgba(212,175,55,0.15)] overflow-hidden flex flex-col h-[650px] relative">
        
        <div className="absolute top-0 left-0 right-0 h-1.5 flex gap-1 p-0.5">
          {steps.map((_, i) => (
            <div key={i} className={`flex-1 h-full rounded-full transition-all duration-500 ${i <= currentStep ? 'bg-gold-500' : 'bg-white/5'}`}></div>
          ))}
        </div>

        <button onClick={onClose} className="absolute top-8 right-8 text-gray-500 hover:text-white transition-colors z-10">
          <X size={24} />
        </button>

        <div className="flex-1 flex flex-col items-center justify-center text-center p-8 sm:p-12 space-y-8">
           <div className={`p-8 rounded-[2rem] bg-white/5 border border-white/10 shadow-2xl transform scale-110`}>
              {step.icon}
           </div>
           
           <div className="space-y-4 w-full">
             <h3 className="text-3xl font-serif font-black uppercase tracking-tight text-white leading-none">{step.title}</h3>
             
             {step.isList ? (
               <div className="text-left space-y-3 bg-black/30 p-6 rounded-3xl border border-white/5 mx-auto max-w-md">
                 {step.list.map((item, idx) => (
                   <div key={idx} className="flex gap-3">
                     <span className="text-gold-500 shrink-0 font-black">•</span>
                     <p className="text-xs sm:text-sm text-gray-300 font-bold leading-relaxed">{item}</p>
                   </div>
                 ))}
               </div>
             ) : (
               <p className="text-sm text-gray-400 font-bold uppercase tracking-widest leading-relaxed opacity-80 max-w-sm mx-auto">{step.desc}</p>
             )}
           </div>
        </div>

        <div className="p-10 border-t border-white/5 flex items-center justify-between gap-4">
           <button 
             onClick={handlePrev}
             disabled={currentStep === 0}
             className={`px-8 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${currentStep === 0 ? 'opacity-0 cursor-default' : 'text-gray-500 hover:text-white'}`}
           >
             <div className="flex items-center gap-2"><ChevronLeft size={16}/> Kembali</div>
           </button>

           <button 
             onClick={handleNext}
             className="px-12 py-4 bg-gold-500 hover:bg-gold-400 text-black rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl flex items-center gap-3 active:scale-95 transition-all"
           >
             {currentStep === steps.length - 1 ? (
               <><Check size={16} strokeWidth={3}/> Selesai</>
             ) : (
               <>Lanjut <ChevronRight size={16}/></>
             )}
           </button>
        </div>

        <div className="absolute bottom-4 left-1/2 -translate-x-1/2">
           <p className="text-[8px] font-black text-gray-700 uppercase tracking-[0.5em]">OPERATIONAL GUIDE V2.0</p>
        </div>
      </div>
    </div>
  );
};

export default TutorialModal;
