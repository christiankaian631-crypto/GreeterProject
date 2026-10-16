// @ts-nocheck
import React, {
  useState,
  useMemo,
  useEffect,
  useCallback,
  useRef,
} from "react";
import {
  Reservation,
  AppSettings,
  MenuItem,
  UserRole,
  ReservationStatus,
} from "../types";
import {
  Search,
  Plus,
  Minus,
  Trash2,
  Receipt,
  X,
  Calculator,
  Printer,
  FileDown,
  Loader2,
  User,
  Calendar,
  Clock,
  MapPin,
  Users,
  Check,
  ClipboardList,
  LayoutGrid,
  ArrowLeft,
  Share2,
  Eye,
  ShieldCheck,
  AlertCircle,
  ChevronRight,
  Ban,
  Wallet,
  Banknote,
  CreditCard,
  Landmark,
  Utensils,
} from "lucide-react";
import {
  MENU_DATA_BANDUNG,
  MENU_DATA_JAKARTA,
  OUTLETS_JAKARTA,
} from "./MenuList";
import {
  generateBillReceiptPDF,
  exportVisualToHTML,
  exportVisualToImage,
} from "../services/pdfService";
import { ExportActions } from "./ExportActions";

interface BillItem {
  name: string;
  category: string;
  price: number;
  quantity: number;
  isDiscounted?: boolean;
}

interface Props {
  reservations: Reservation[];
  isDarkMode?: boolean;
  onDone?: (guestName: string, date: string) => void;
  onBack?: () => void;
  onUpdateTotalBill?: (
    id: string,
    amount: number,
    discountPercent?: number,
    discountAmount?: number,
    fixedDeduction?: number,
  ) => void;
  settings: AppSettings;
  outletName?: string;
  initialGuestName?: string;
  initialDate?: string;
}

const CheckBill: React.FC<Props> = ({
  reservations,
  isDarkMode,
  onDone,
  onBack,
  onUpdateTotalBill,
  settings,
  outletName,
  initialGuestName,
  initialDate,
}) => {
  const [search, setSearch] = useState("");
  const [isSettled, setIsSettled] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [discountPercent, setDiscountPercent] = useState(0);
  const [fixedDeduction, setFixedDeduction] = useState(0);
  const lastLoadedGuestId = useRef<string>("");


  const billKey = useMemo(
    () => `currentVirtualBill_${outletName || "default"}`,
    [outletName],
  );

  const [bill, setBill] = useState<BillItem[]>(() => {
    const saved = localStorage.getItem(billKey);
    return saved ? JSON.parse(saved) : [];
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

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(amount || 0);
  };

  const [guestInfo, setGuestInfo] = useState({
    id: "",
    date: initialDate || new Date().toISOString().split("T")[0],
    name: initialGuestName || "",
    pax: 0,
    time: "",
    tableNumber: "",
    paymentBank: "",
    paymentSubMethod: "",
    dpAmount: 0,
    isFullPayment: false,
    hasDownPayment: false,
  });

  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [isSharingPdf, setIsSharingPdf] = useState(false);

  const syncChecklistToBill = useCallback(
    (orderedItems: string[]) => {
      const accumulated: Record<string, BillItem> = {};

      orderedItems.forEach((itemStr) => {
        // Improved parsing:
        // 1. Remove notes
        let content = itemStr.split(" [Note:")[0];

        // 2. Extract quantity
        const qtyMatch = content.match(/^(\d+)x\s+/);
        const qty = qtyMatch ? parseInt(qtyMatch[1]) : 1;
        let nameWithModifiers = content.replace(/^\d+x\s+/, "").trim();

        // 3. Find the matching menu item by checking if any menu name is a prefix
        // We sort by length descending to match the longest name first (e.g. "Steak (Big Cut)" before "Steak")
        const sortedAllMenu = [...allMenu].sort(
          (a, b) => b.name.length - a.name.length,
        );

        // Normalize name for matching: remove (X PERSON) and other common suffixes that might be added
        const normalizedInput = nameWithModifiers
          .toLowerCase()
          .replace(/\(\s*\d+\s*person\s*\)/gi, "")
          .trim();

        let menuRef = sortedAllMenu.find((m) => {
          const normalizedMenuName = m.name
            .toLowerCase()
            .replace(/\(\s*\d+\s*person\s*\)/gi, "")
            .trim();
          return normalizedInput.startsWith(normalizedMenuName);
        });

        if (menuRef) {
          if (accumulated[menuRef.name]) {
            accumulated[menuRef.name].quantity += qty;
          } else {
            accumulated[menuRef.name] = {
              name: menuRef.name,
              category: menuRef.category,
              price: menuRef.price,
              quantity: qty,
            };
          }
        }
      });

      const sortedBill = Object.values(accumulated).sort((a, b) => {
        const foodPriority = [
          "SALAD",
          "SOUP",
          "LIGHT MEAL",
          "KIDS MEAL",
          "SPECIALTY STEAK",
          "PRIME SELECTION",
          "BIG CUT",
          "FAMILY SET",
          "WESTERN DELIGHT",
          "PASTA LOVERS",
          "ASIAN DELIGHT",
          "INDONESIAN FAVORITE",
          "BURGER & SANDWICH",
          "NPD",
          "DESSERT",
        ];
        const beveragePriority = [
          "JUICE",
          "SMOOTHIES",
          "DRINKING & MINERAL WATER",
          "MILKSHAKE",
          "SOFT DRINK",
          "FRAPPE",
          "ARTISAN TEA",
          "TEA",
          "COFFEE",
          "MANUAL BREW",
          "CHOCOLATE",
          "ICE BLENDED",
          "MOCKTAIL",
          "FREE MENU",
        ];

        const catA = a.category.toUpperCase();
        const catB = b.category.toUpperCase();

        const foodIdxA = foodPriority.indexOf(catA);
        const foodIdxB = foodPriority.indexOf(catB);
        const bevIdxA = beveragePriority.indexOf(catA);
        const bevIdxB = beveragePriority.indexOf(catB);

        const isDessertA = catA === "DESSERT";
        const isDessertB = catB === "DESSERT";
        const isBevA = bevIdxA !== -1;
        const isBevB = bevIdxB !== -1;

        const getGroupOrder = (isBev: boolean, isDessert: boolean) => {
          if (!isBev && !isDessert) return 0;
          if (isDessert) return 1;
          return 2;
        };

        const orderA = getGroupOrder(isBevA, isDessertA);
        const orderB = getGroupOrder(isBevB, isDessertB);

        if (orderA !== orderB) return orderA - orderB;

        const pIdxA =
          foodIdxA !== -1 ? foodIdxA : bevIdxA !== -1 ? bevIdxA : 999;
        const pIdxB =
          foodIdxB !== -1 ? foodIdxB : bevIdxB !== -1 ? bevIdxB : 999;

        if (pIdxA !== pIdxB) return pIdxA - pIdxB;
        return a.name.localeCompare(b.name);
      });

      setBill((prev) => {
        return sortedBill.map((item) => {
          const existing = prev.find((p) => p.name === item.name);
          return {
            ...item,
            isDiscounted: existing ? !!existing.isDiscounted : false,
          };
        });
      });
    },
    [allMenu],
  );

  useEffect(() => {
    if (guestInfo.name) {
      const found = reservations.find(
        (r) =>
          !r.isWalkIn &&
          r.guestName.toLowerCase() === guestInfo.name.toLowerCase() &&
          r.reservationDate === guestInfo.date,
      );
      if (found) {
        setGuestInfo((prev) => ({
          ...prev,
          id: found.id,
          pax: found.guestCount,
          time: found.arrivalTime,
          tableNumber: found.tableNumber || "",
          paymentBank: found.paymentBank || "CASH",
          paymentSubMethod: found.paymentSubMethod || "TUNAI",
          dpAmount: found.downPaymentAmount || 0,
          isFullPayment: found.isFullPayment || false,
          hasDownPayment: found.hasDownPayment || false,
        }));

        // Always sync with checklist to reflect changes in Input Menu
        syncChecklistToBill(found.orderedMenuItems || []);
      }
    }
  }, [guestInfo.name, guestInfo.date, reservations, syncChecklistToBill]);

  useEffect(() => {
    if (guestInfo.id && guestInfo.id !== lastLoadedGuestId.current) {
      lastLoadedGuestId.current = guestInfo.id;
      const found = reservations.find((r) => r.id === guestInfo.id);
      if (found) {
        setDiscountPercent(found.discountPercent || 0);
        setFixedDeduction(found.fixedDeduction || 0);
      }
    } else if (!guestInfo.id) {
      lastLoadedGuestId.current = "";
    }
  }, [guestInfo.id, reservations]);

  useEffect(() => {
    if (bill.length > 0) localStorage.setItem(billKey, JSON.stringify(bill));
    else localStorage.removeItem(billKey);
  }, [bill, billKey]);

  // Auto-refresh order summary after leaving the feature
  useEffect(() => {
    return () => {
      localStorage.removeItem(billKey);
    };
  }, [billKey]);

  const subtotal = bill.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0,
  );
  const hasItemLevelDiscount = bill.some((item) => item.isDiscounted);
  const discountableSubtotal = hasItemLevelDiscount
    ? bill.reduce(
        (sum, item) =>
          sum + (item.isDiscounted ? item.price * item.quantity : 0),
        0,
      )
    : subtotal;
  const discountAmount = discountableSubtotal * (discountPercent / 100);
  const netSubtotal = subtotal - discountAmount - fixedDeduction;
  const serviceCharge = Math.max(0, netSubtotal) * 0.05;
  const tax = (Math.max(0, netSubtotal) + serviceCharge) * 0.1;
  const grandTotal = Math.max(0, netSubtotal) + serviceCharge + tax;
  const remainingBalance = grandTotal - guestInfo.dpAmount;

  const triggerAuth = (action: "PREVIEW" | "PDF" | "SHARE") => {
    if (action === "PREVIEW") setShowPreview(true);
    else if (action === "PDF") executeDownloadPDF();
    else if (action === "SHARE") executeSharePDF();
  };

  const executeDownloadPDF = async () => {
    setIsGeneratingPdf(true);
    await generateBillReceiptPDF(
      bill,
      guestInfo,
      subtotal,
      serviceCharge,
      tax,
      grandTotal,
      guestInfo.dpAmount,
      remainingBalance,
      false,
      outletName,
      discountPercent,
      discountAmount,
      fixedDeduction,
    );
    setIsGeneratingPdf(false);
  };

  const executeSharePDF = async () => {
    setIsSharingPdf(true);
    await generateBillReceiptPDF(
      bill,
      guestInfo,
      subtotal,
      serviceCharge,
      tax,
      grandTotal,
      guestInfo.dpAmount,
      remainingBalance,
      true,
      outletName,
      discountPercent,
      discountAmount,
      fixedDeduction,
    );
    setIsSharingPdf(false);
  };

  const handleFinalize = () => {
    if (guestInfo.id && onUpdateTotalBill) {
      onUpdateTotalBill(
        guestInfo.id,
        grandTotal,
        discountPercent,
        discountAmount,
        fixedDeduction,
      );
      setIsSettled(true);
      setTimeout(() => {
        setIsSettled(false);
        if (onDone) onDone(guestInfo.name, guestInfo.date);
      }, 1500);
    }
  };

  const addToBill = (item: MenuItem) => {
    if (settings.soldOutItems?.includes(item.name)) return;
    setBill((prev) => {
      const existing = prev.find((i) => i.name === item.name);
      if (existing)
        return prev.map((i) =>
          i.name === item.name ? { ...i, quantity: i.quantity + 1 } : i,
        );
      return [...prev, { ...item, quantity: 1 }];
    });
  };

  return (
    <div className="animate-fade-in pb-32">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left: Menu Selection (For Extras) */}
        <div className="lg:col-span-2 space-y-6">
          <div
            className={`p-8 rounded-[2.5rem] border shadow-2xl ${isDarkMode ? "bg-dark-800 border-gold-900/30" : "bg-white border-gray-200"}`}
          >
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-4">
                {onBack && (
                  <button
                    onClick={onBack}
                    className="p-3 bg-gold-500/10 text-gold-500 rounded-2xl hover:bg-gold-500 hover:text-black transition-all"
                  >
                    <ArrowLeft size={24} />
                  </button>
                )}
                <div className="p-3 bg-gold-500 rounded-2xl text-black shadow-lg">
                  <Calculator size={28} />
                </div>
                <div>
                  <h2 className="text-3xl font-serif font-black uppercase tracking-tighter text-white">
                    Bill Verification
                  </h2>
                  <p className="text-[10px] text-gold-600 font-black uppercase tracking-[0.4em]">
                    Frozen Quantity - Sync with Input Menu
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
              <div className="p-4 bg-dark-900/50 rounded-2xl border border-white/5">
                <label className="text-[9px] font-black text-gray-500 uppercase tracking-widest block mb-2">
                  Pilih Tanggal
                </label>
                <input
                  type="date"
                  value={guestInfo.date}
                  onChange={(e) =>
                    setGuestInfo({
                      ...guestInfo,
                      date: e.target.value,
                      name: "",
                    })
                  }
                  className="w-full bg-transparent text-white font-sans font-black text-sm outline-none color-scheme-dark"
                />
              </div>
              <div className="p-4 bg-dark-900/50 rounded-2xl border border-white/5">
                <label className="text-[9px] font-black text-gray-500 uppercase tracking-widest block mb-2">
                  Pilih Nama Tamu
                </label>
                <input
                  list="bill-guests"
                  value={guestInfo.name}
                  onChange={(e) =>
                    setGuestInfo({ ...guestInfo, name: e.target.value })
                  }
                  placeholder="Ketik nama tamu..."
                  className="w-full bg-transparent text-white font-sans font-black text-sm outline-none placeholder:text-gray-700"
                />
                <datalist id="bill-guests">
                  {reservations
                    .filter(
                      (r) =>
                        r.reservationDate === guestInfo.date && !r.isWalkIn,
                    )
                    .map((r) => (
                      <option key={r.id} value={r.guestName}>
                        {r.arrivalTime} | T-{r.tableNumber || "?"}
                      </option>
                    ))}
                </datalist>
              </div>
            </div>

            <div className="relative">
              <Search
                className="absolute left-5 top-1/2 -translate-y-1/2 text-gold-500"
                size={20}
              />
              <input
                type="text"
                placeholder="Cari menu tambahan (extra)..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-14 pr-6 py-5 bg-dark-900 border border-gold-900/30 rounded-[1.5rem] focus:border-gold-500 outline-none text-white font-bold"
              />
            </div>
          </div>

          <div className="max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar space-y-8">
            {Array.from(new Set(allMenu.map((m) => m.category))).map((cat) => {
              const items = allMenu.filter(
                (i) =>
                  i.category === cat &&
                  (i.name.toLowerCase().includes(search.toLowerCase()) ||
                    i.category.toLowerCase().includes(search.toLowerCase())),
              );
              if (items.length === 0) return null;
              return (
                <div key={cat} className="animate-fade-in">
                  <h3 className="text-xs font-black text-gold-600 uppercase tracking-[0.3em] mb-4 border-l-2 border-gold-600 pl-3">
                    {cat}
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {items.map((item, idx) => {
                      const isSold = settings.soldOutItems?.includes(item.name);
                      return (
                        <button
                          key={idx}
                          disabled={isSold}
                          onClick={() => addToBill(item)}
                          className={`p-4 rounded-2xl border text-left flex justify-between items-center transition-all ${isSold ? "opacity-30 grayscale cursor-not-allowed border-red-500/20" : "bg-dark-800 border-white/5 hover:border-gold-500/50 hover:bg-dark-700"}`}
                        >
                          <div>
                            <p className="text-xs font-black text-white uppercase">
                              {item.name}
                            </p>
                            <p className="text-[10px] text-gold-500 font-bold mt-1">
                              {formatCurrency(item.price)}
                            </p>
                          </div>
                          <Plus
                            size={18}
                            className="text-gray-600 group-hover:text-gold-500"
                          />
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: Bill Summary */}
        <div className="lg:col-span-1 space-y-6">
          <div
            className={`p-8 rounded-[3rem] border shadow-2xl sticky top-32 ${isDarkMode ? "bg-dark-800 border-gold-600/30 shadow-gold-500/5" : "bg-white border-gray-200"}`}
          >
            <div className="flex items-center gap-3 mb-8 border-b border-white/5 pb-4">
              <Receipt className="text-gold-500" size={24} />
              <h3 className="text-xl font-serif font-black uppercase text-white tracking-tight">
                Order Recap
              </h3>
            </div>

            {guestInfo.name && (
              <div className="mb-8 p-5 bg-black/40 rounded-[2rem] border border-gold-500/20 space-y-4">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-[9px] font-black text-gray-500 uppercase tracking-widest">
                      Guest Identification
                    </p>
                    <p className="text-lg font-serif font-black text-white uppercase tracking-tight">
                      {guestInfo.name}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-[9px] font-black text-gray-500 uppercase tracking-widest">
                      Table
                    </p>
                    <p className="text-lg font-black text-gold-500">
                      #{guestInfo.tableNumber || "?"}
                    </p>
                  </div>
                </div>

                <div className="h-px bg-white/5"></div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-[8px] font-black text-gray-600 uppercase tracking-widest mb-1">
                      Payment Method
                    </p>
                    <div className="flex items-center gap-2 text-emerald-500">
                      {guestInfo.paymentBank === "CASH" ? (
                        <Banknote size={14} />
                      ) : (
                        <Landmark size={14} />
                      )}
                      <span className="text-[10px] font-black uppercase">
                        {guestInfo.paymentBank} ({guestInfo.paymentSubMethod})
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-[8px] font-black text-gray-600 uppercase tracking-widest mb-1">
                      Status
                    </p>
                    <span
                      className={`text-[9px] font-black px-2 py-0.5 rounded border uppercase tracking-tighter ${guestInfo.isFullPayment ? "bg-emerald-500 text-black border-emerald-400" : "bg-gold-500/10 text-gold-500 border-gold-500/20"}`}
                    >
                      {guestInfo.isFullPayment ? "FULL PAID" : "DEPOSIT DONE"}
                    </span>
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-4 mb-8 max-h-[30vh] overflow-y-auto custom-scrollbar pr-2">
              {bill.length === 0 ? (
                <div className="text-center py-10 opacity-20">
                  <Utensils size={48} className="mx-auto mb-2" />
                  <p className="text-[10px] font-black uppercase tracking-widest">
                    No Items Selected
                  </p>
                </div>
              ) : (
                bill.map((item, i) => (
                  <div
                    key={i}
                    className={`flex justify-between items-center group p-2 rounded-2xl transition-all ${isDarkMode ? "hover:bg-white/5" : "hover:bg-gray-50"}`}
                  >
                    <div className="flex-1 pr-4">
                      <p
                        className={`text-xs font-black uppercase leading-tight flex items-center flex-wrap gap-2 ${isDarkMode ? "text-white" : "text-gray-900"}`}
                      >
                        {item.name}
                        {item.isDiscounted && (
                          <span className="text-[8px] border border-emerald-500/20 bg-emerald-500/10 text-emerald-500 px-1.5 py-0.5 rounded-md font-sans font-black tracking-widest uppercase">
                            % DISC ACTIVE
                          </span>
                        )}
                      </p>
                      <p className="text-[9px] text-gray-500 mt-0.5">
                        {item.quantity} x {formatCurrency(item.price)}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          setBill((prev) =>
                            prev.map((bItem, idx) =>
                              idx === i
                                ? {
                                    ...bItem,
                                    isDiscounted: !bItem.isDiscounted,
                                  }
                                : bItem,
                            ),
                          )
                        }
                        className={`px-2.5 py-1.5 border rounded-xl text-[9px] font-sans font-black uppercase tracking-wider transition-all cursor-pointer ${item.isDiscounted ? "bg-emerald-500 text-black border-emerald-400 font-bold shadow-[0_2px_10px_rgba(16,185,129,0.3)] hover:scale-105 active:scale-95" : `${isDarkMode ? "bg-white/5 text-gray-400 border-white/10" : "bg-gray-100 text-gray-500 border-gray-200"} hover:border-emerald-500/30 hover:text-emerald-500 hover:scale-105 active:scale-95`}`}
                        title="Toggle Item Discount"
                      >
                        % Disc
                      </button>
                      <div
                        className={`flex items-center justify-center border rounded-lg px-3 py-1 ${isDarkMode ? "bg-dark-900 border-white/5" : "bg-gray-100 border-gray-300"}`}
                      >
                        <span className="text-xs font-black text-gold-500 min-w-[20px] text-center">
                          {item.quantity}x
                        </span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div
              id="bill-preview-section"
              className="space-y-3 pt-6 border-t border-white/5"
            >
              {/* Discount Buttons */}
              <div className="space-y-3 mb-4">
                <div className="flex justify-between items-center">
                  <p className="text-[9px] font-black text-gold-500 uppercase tracking-[0.2em]">
                    Input Discount (%)
                  </p>
                  <span className="text-[9px] font-mono font-bold text-gray-500">
                    Preset / Manual
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  {[5, 7.5, 10, 20, 30, 50].map((pct) => (
                    <button
                      key={pct}
                      type="button"
                      onClick={() =>
                        setDiscountPercent(discountPercent === pct ? 0 : pct)
                      }
                      className={`px-3 py-1.5 rounded-lg text-[10px] font-black transition-all border ${discountPercent === pct ? "bg-gold-500 text-black border-gold-500" : `${isDarkMode ? "bg-white/5 text-gold-500 border-white/10" : "bg-gray-100 text-gold-600 border-gray-200"} hover:border-gold-500/50`}`}
                    >
                      {pct}%
                    </button>
                  ))}
                  <div
                    className={`flex items-center gap-1 rounded-lg border px-3 py-1 h-8 max-w-[120px] ${isDarkMode ? "bg-white/5 border-white/10" : "bg-gray-100 border-gray-300"}`}
                  >
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      max="100"
                      placeholder="Manaul %"
                      value={discountPercent || ""}
                      onChange={(e) => {
                        const val = parseFloat(e.target.value);
                        setDiscountPercent(isNaN(val) ? 0 : val);
                      }}
                      className={`w-full bg-transparent text-[10px] font-sans font-black outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${isDarkMode ? "text-white placeholder:text-gray-600" : "text-gray-900 placeholder:text-gray-400"}`}
                    />
                    <span className="text-[10px] text-gold-500 font-bold">
                      %
                    </span>
                  </div>
                </div>
              </div>

              {/* Fixed Deduction Buttons */}
              <div className="space-y-3 mb-6">
                <div className="flex justify-between items-center">
                  <p className="text-[9px] font-black text-gold-500 uppercase tracking-[0.2em]">
                    Potongan Harga (Nominal)
                  </p>
                  <span className="text-[9px] font-mono font-bold text-gray-500">
                    Preset / Manual
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  {[100000, 150000, 300000, 500000].map((amt) => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() =>
                        setFixedDeduction(fixedDeduction === amt ? 0 : amt)
                      }
                      className={`px-3 py-1.5 rounded-lg text-[10px] font-black transition-all border ${fixedDeduction === amt ? "bg-gold-500 text-black border-gold-500" : `${isDarkMode ? "bg-white/5 text-gold-500 border-white/10" : "bg-gray-100 text-gold-600 border-gray-200"} hover:border-gold-500/50`}`}
                    >
                      {(amt / 1000).toLocaleString("id-ID")}K
                    </button>
                  ))}
                  <div
                    className={`flex items-center gap-1 rounded-lg border px-3 py-1 h-8 max-w-[140px] ${isDarkMode ? "bg-white/5 border-white/10" : "bg-gray-100 border-gray-300"}`}
                  >
                    <span className="text-[10px] text-gold-500 font-bold">
                      Rp
                    </span>
                    <input
                      type="number"
                      step="1000"
                      min="0"
                      placeholder="Nominal"
                      value={fixedDeduction || ""}
                      onChange={(e) => {
                        const val = parseInt(e.target.value);
                        setFixedDeduction(isNaN(val) ? 0 : val);
                      }}
                      className={`w-full bg-transparent text-[10px] font-sans font-black outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${isDarkMode ? "text-white placeholder:text-gray-600" : "text-gray-900 placeholder:text-gray-400"}`}
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-between items-center text-xs font-bold text-gray-500">
                <span>Subtotal</span>
                <span>{formatCurrency(subtotal)}</span>
              </div>

              {discountPercent > 0 && (
                <div className="flex justify-between items-center text-xs font-bold text-emerald-500">
                  <span>Discount ({discountPercent}%)</span>
                  <span>-{formatCurrency(discountAmount)}</span>
                </div>
              )}

              {fixedDeduction > 0 && (
                <div className="flex justify-between items-center text-xs font-bold text-emerald-500">
                  <span>Potongan Harga</span>
                  <span>-{formatCurrency(fixedDeduction)}</span>
                </div>
              )}

              <div className="flex justify-between items-center text-xs font-bold text-gray-500">
                <span>Service Charge (5%)</span>
                <span>{formatCurrency(serviceCharge)}</span>
              </div>
              <div className="flex justify-between items-center text-xs font-bold text-gray-500">
                <span>PB1 Tax (10%)</span>
                <span>{formatCurrency(tax)}</span>
              </div>
              <div className="flex justify-between items-center py-4 border-y border-white/5">
                <span className="text-sm font-black text-white uppercase tracking-widest">
                  Grand Total
                </span>
                <span className="text-2xl font-sans font-black text-gold-500">
                  {formatCurrency(grandTotal)}
                </span>
              </div>

              {guestInfo.hasDownPayment && (
                <div className="space-y-3 animate-fade-in">
                  <div className="flex justify-between items-center text-xs font-bold text-emerald-500">
                    <span className="flex items-center gap-2">
                      <Wallet size={14} /> Paid Downpayment
                    </span>
                    <span>- {formatCurrency(guestInfo.dpAmount)}</span>
                  </div>
                  <div className="flex justify-between items-center py-4 px-6 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl">
                    <span className="text-xs font-black text-emerald-500 uppercase tracking-widest">
                      Sisa Tagihan
                    </span>
                    <span className="text-2xl font-sans font-black text-white">
                      {formatCurrency(Math.max(0, remainingBalance))}
                    </span>
                  </div>
                </div>
              )}
            </div>

            <div className="flex flex-col items-end gap-3 mt-8">
              <ExportActions
                onExportPDF={() => triggerAuth("PDF")}
                onExportHTML={() =>
                  exportVisualToHTML(
                    "bill-preview-section",
                    `Bill_${guestInfo.name}`,
                  )
                }
                onExportImage={() =>
                  exportVisualToImage(
                    "bill-preview-section",
                    `Bill_${guestInfo.name}`,
                  )
                }
                onShareWA={() => triggerAuth("SHARE")}
              />
              <button
                onClick={handleFinalize}
                disabled={!guestInfo.id || bill.length === 0}
                className={`w-full py-5 rounded-2xl font-black uppercase text-xs tracking-widest flex items-center justify-center gap-3 shadow-2xl transition-all active:scale-95 ${isSettled ? "bg-emerald-600 text-white" : "bg-gold-500 hover:bg-gold-400 text-black"}`}
              >
                {isSettled ? (
                  <Check size={20} strokeWidth={4} />
                ) : (
                  <Calculator size={20} />
                )}{" "}
                {isSettled ? "BILL FINALIZED" : "FINALIZE & SAVE BILL"}
              </button>
            </div>
          </div>
        </div>
      </div>


    </div>
  );
};

export default CheckBill;
