
// @ts-nocheck
import React, { useState, useEffect, useMemo } from 'react';
import { 
  Reservation, 
  DailyStats, 
  ReservationStatus, 
  AppSettings, 
  GuestSegment, 
  Shift, 
  ThemeSettings, 
  UserRole, 
  AuthState, 
  WaitingListEntry, 
  WaitingStatus, 
  LocationPreference, 
  StaffUser,
  ALL_OUTLETS,
  OUTLETS_JAKARTA,
  OUTLETS_BANDUNG
} from './types.ts';
import { io, Socket } from 'socket.io-client';
import { 
  collection, 
  doc, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  onSnapshot, 
  query, 
  where, 
  getDocs,
  Timestamp,
  writeBatch
} from 'firebase/firestore';
import { 
  signInWithPopup, 
  GoogleAuthProvider, 
  onAuthStateChanged,
  signOut,
  User as FirebaseUser
} from 'firebase/auth';
import { db, auth as firebaseAuth, handleFirestoreError, OperationType } from './firebase';
import { ErrorBoundary } from './components/ErrorBoundary';
import ReservationForm from './components/ReservationForm';
import ReservationList from './components/ReservationList';
import FloorPlan from './components/FloorPlan';
import DateSummary from './components/DateSummary';
import SettingsModal from './components/SettingsModal';
import BackupModal from './components/BackupModal'; 
import MenuList from './components/MenuList';
import CheckBill from './components/CheckBill';
import MenuCheckmark from './components/MenuCheckmark';
import MenuInputSummary from './components/MenuInputSummary';
import AdminDashboard from './components/AdminDashboard';
import SMRevenueView from './components/SMRevenueView';
import TutorialModal from './components/TutorialModal';
import WaitingListView from './components/WaitingListView';
import OrderTallyView from './components/OrderTallyView';
import ChatModal from './components/ChatModal';
import { 
  ArrowRight,
  BookOpen,
  LogOut,
  Plus,
  Settings,
  Footprints,
  MessageSquare,
  Database,
  Sun,
  Moon,
  CheckSquare,
  User,
  ShieldCheck,
  Key,
  X,
  AlertCircle,
  Receipt,
  LayoutGrid,
  CalendarDays,
  ClipboardList,
  MenuSquare,
  MenuCheck,
  Lock,
  TrendingUp,
  Calendar,
  Users,
  Calculator,
  Bell,
  BarChart3,
  Home,
  Store,
  Sparkles,
  Utensils,
  Coffee,
  Check,
  Quote,
  CalendarRange,
  RotateCcw,
  HelpCircle,
  Clock,
  Shield,
  Maximize,
  Minimize,
  MapPin,
  ArrowLeft,
  ChevronRight,
  Building2,
  Navigation,
  ListChecks,
  Target,
  Hash,
  MessageCircle
} from 'lucide-react';

const HOSPITALITY_QUOTES = [
  "Hospitality is not just a service, it's a feeling. Treat every guest like they are coming home.",
  "The perfect steak starts with precision. Ensure every product meets our gold standard before it hits the table.",
  "A comfortable dining area is our silent ambassador. Keep every corner clean and every table inviting.",
  "Service with a smile is your superpower. Let your positive energy transform a simple meal into a memory.",
  "Consistency is the soul of hospitality. The right product, the right service, and the right atmosphere—every single time.",
  "Details matter. From a polished glass to a warm greeting, excellence is found in the little things we do.",
  "Great teams make great experiences. Support each other, and our guests will feel the harmony of our service.",
  "The dining room is our stage. Maintain its charm and comfort to ensure our guests enjoy every second of their stay.",
  "Hospitality means always being one step ahead of the guest's needs. Anticipate, act, and amaze.",
  "Success in this industry is built on trust. Trust in our quality, trust in our cleanliness, and trust in our care.",
  "Your passion is the ingredient that can't be bought. Cook with heart, serve with soul, and manage with pride.",
  "A clean restaurant is a respectful restaurant. Show our guests they matter by keeping their environment pristine.",
  "Every table is a new story. Make sure it has a happy beginning, a delicious middle, and a perfect ending.",
  "We don't just serve food; we serve comfort. Make the dining area a sanctuary of relaxation for every customer."
];

const INITIAL_DATA: Reservation[] = [];

// Socket instance
let socket: Socket;

const DIGITAL_THEME: ThemeSettings = {
  fontColor: '#FFFFFF',
  backgroundColor: '#050505',
  surfaceColor: '#0A0A0A',
  primaryColor: '#D4AF37',
  tableIdleColor: '#333333', 
  tableActiveColor: '#2563EB',
  tableUpcomingColor: '#D4AF37',
  tableCompletedColor: '#9333EA',
  successColor: '#10B981',
  dangerColor: '#EF4444'
};

export const DEFAULT_SETTINGS: AppSettings = {
  totalTables: 40,
  zones: [
    { id: '1', name: "Dine In 1st Floor", description: "Main Area", tableStart: 1, tableEnd: 15 },
    { id: '2', name: "Smoking Area", description: "Outdoor", tableStart: 16, tableEnd: 20 },
    { id: '3', name: "Dine In 2nd Floor", description: "Level 2", tableStart: 21, tableEnd: 32 },
    { id: '4', name: "VIP Room", description: "Private", tableStart: 34, tableEnd: 40 }
  ],
  condimentGroups: [
    { id: 'g_kem', name: 'TINGKAT KEMATANGAN', options: ['RARE', 'MEDIUM RARE', 'MEDIUM', 'MEDIUM WELL', 'WELDONE'] },
    { id: 'g_pot_std', name: 'PILIHAN KENTANG', options: ['WEDGES POTATO', 'WAFFLE POTATO', 'MASHED POTATO', 'STRAIGHT CUT'] },
    { id: 'g_pot_prime', name: 'PILIHAN KENTANG (PRIME)', options: ['WEDGES POTATO', 'WAFFLE POTATO', 'MASHED POTATO', 'STRAIGHT CUT', 'TRUFFLE FRIES'] },
    { id: 'g_pot_big', name: 'PILIHAN KENTANG (BIG CUT)', options: ['WEDGES POTATO BIG CUT', 'WAFFLE FRIES BIG CUT', 'MASHED POTATO BIG CUT', 'MASHED PUREE BIG CUT', 'TRUFFLE FRIES BIG CUT', 'TRUFFLE MAC AND CHEESE'] },
    { id: 'g_veg_std', name: 'PILIHAN VEGETABLE', options: ['MUSHROOM PARMESAN', 'CAESAR SALAD', 'BALSAMIC SALAD', 'MIX VEGETABLE', 'STRING BEAN', 'ROASTED VEGETABLE'] },
    { id: 'g_veg_prime', name: 'PILIHAN VEGETABLE (PRIME)', options: ['CREAMY SPINACH', 'CREAMY CORN', 'MUSHROOM PARMESAN', 'CAESAR SALAD', 'BALSAMIC SALAD', 'MIX VEGETABLE', 'STRING BEAN', 'ROASTED VEGETABLE'] },
    { id: 'g_veg_big', name: 'PILIHAN VEGETABLE (BIG CUT)', options: ['CREAMY SPINACH BIG CUT', 'CREAMY CORN BIG CUT', 'MUSHROOM PARMESAN BIG CUT', 'CAESAR SALAD BIG CUT', 'ORGANIC GARDEN SALAD BIG CUT', 'MIX VEGETABLE BIG CUT', 'STRING BEAN BIG CUT', 'ROASTED VEGETABLE BIG CUT'] },
    { id: 'g_sauce_std', name: 'PILIHAN SAUCE', options: ['MUSHROOM', 'BLACKPEPPER', 'BARBEQUE', 'WHITE TRUFFLE'] },
    { id: 'g_sauce_prime', name: 'PILIHAN SAUCE (PRIME)', options: ['MUSHROOM', 'BLACKPEPPER', 'BARBEQUE', 'WHITE TRUFFLE', 'CHIMICURI', 'BLUE CHEESE'] }
  ],
  categoryMappings: [
    { categoryName: 'SPECIALTY STEAK', condimentGroupIds: ['g_kem', 'g_pot_std', 'g_veg_std', 'g_sauce_std'] },
    { categoryName: 'PRIME SELECTION', condimentGroupIds: ['g_kem', 'g_pot_prime', 'g_veg_prime', 'g_sauce_prime'] },
    { categoryName: 'BIG CUT', condimentGroupIds: ['g_kem', 'g_pot_big', 'g_veg_big', 'g_sauce_prime'] },
    { categoryName: 'FAMILY SET', condimentGroupIds: ['g_kem', 'g_pot_std', 'g_veg_std', 'g_sauce_std'] },
    { categoryName: 'WESTERN DELIGHT', condimentGroupIds: ['g_pot_std', 'g_veg_std', 'g_sauce_std'] },
    { categoryName: 'BURGER & SANDWICH', condimentGroupIds: ['g_pot_std'] }
  ],
  customMenu: [],
  soldOutItems: [],
  theme: DIGITAL_THEME
};

const App: React.FC = () => {
  const isRemoteUpdate = React.useRef(false);
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [auth, setAuth] = useState<AuthState>(() => {
    const saved = localStorage.getItem('auth_session');
    return saved ? JSON.parse(saved) : { isLoggedIn: false, role: null, username: '', title: '', outlet: '' };
  });

  const [loginModal, setLoginModal] = useState({ 
    isOpen: false, 
    usernameInput: '', 
    roleInput: UserRole.GREETER as UserRole,
    error: false, 
    errorMessage: '', 
    target: '', 
    selectedRegion: null as 'JAKARTA' | 'BANDUNG' | null 
  });

  const [greeting, setGreeting] = useState<{ isOpen: boolean, quote: string, userName: string, fullGreeting: string, icon: React.ReactNode } | null>(null);
  const [selectedOutlet, setSelectedOutlet] = useState<string>(() => {
    return localStorage.getItem('selectedOutlet') || '';
  });
  const [currentPage, setCurrentPage] = useState<'DASHBOARD' | 'BOOK' | 'MENU_LIST' | 'CHECK_BILL' | 'MENU_INPUT_SUMMARY' | 'MENU_CHECKMARK' | 'ADMIN_PANEL' | 'SM_REVENUE' | 'FLOOR_PLAN' | 'WAITING_LIST' | 'ORDER_TALLY'>(() => {
    const saved = localStorage.getItem('currentPage');
    return (saved as any) || 'DASHBOARD';
  });
  const [isFullscreen, setIsFullscreen] = useState(false);
  
  const [settings, setSettings] = useState<AppSettings>(() => JSON.parse(JSON.stringify(DEFAULT_SETTINGS)));

  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showChatModal, setShowChatModal] = useState(false);
  const [unreadChatCount, setUnreadChatCount] = useState(0);
  const [showBackupModal, setShowBackupModal] = useState(false); 
  const [showTutorial, setShowTutorial] = useState(false);
  const [showGlobalSummary, setShowGlobalSummary] = useState(false);
  const [activeUsers, setActiveUsers] = useState<any[]>([]);
  const [isSynced, setIsSynced] = useState(false);
  const isInitialized = React.useRef(false);

  const [users, setUsers] = useState<any[]>([]);
  const [reservations, setReservations] = useState<Reservation[]>(() => {
    const saved = localStorage.getItem('reservations_cache');
    return saved ? JSON.parse(saved) : [];
  });
  const [waitingList, setWaitingList] = useState<WaitingListEntry[]>(() => {
    const saved = localStorage.getItem('waiting_list_cache');
    return saved ? JSON.parse(saved) : [];
  });
  
  const [view, setView] = useState<'list' | 'form'>(() => {
    const saved = localStorage.getItem('currentView');
    return (saved as any) || 'list';
  });
  const [dateRange, setDateRange] = useState(() => {
    const saved = localStorage.getItem('dateRange');
    if (saved) return JSON.parse(saved);
    const today = new Date().toISOString().split('T')[0];
    return { start: today, end: today };
  });
  
  const [showWalkInModal, setShowWalkInModal] = useState(false);
  const [preSelectedTable, setPreSelectedTable] = useState<string>('');
  const [editingReservation, setEditingReservation] = useState<Reservation | null>(null);
  const [billPreSelect, setBillPreSelect] = useState<{name: string, date: string} | null>(null);
  const [menuEditPreSelect, setMenuEditPreSelect] = useState<string>('');

  const isManagementRole = (role: UserRole | null) => {
    if (!role) return false;
    return [UserRole.MANAGER, UserRole.ASST_MANAGER, UserRole.SUPERVISOR].includes(role);
  };

  useEffect(() => {
    socket = io();

    socket.on('connect', () => {
      console.log('Connected to server');
      setIsSynced(true);
      if (auth.outlet) {
        socket.emit('join-outlet', { outlet: auth.outlet, user: auth });
      }
    });

    socket.on('disconnect', () => {
      setIsSynced(false);
    });

    socket.on('presence-updated', (users) => {
      setActiveUsers(users);
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  useEffect(() => {
    if (auth.isLoggedIn && auth.outlet && socket) {
      socket.emit('join-outlet', { outlet: auth.outlet, user: auth });
    }
  }, [auth.outlet, auth.isLoggedIn]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(firebaseAuth, (user) => {
      setFirebaseUser(user);
      if (!user) {
        setAuth({ isLoggedIn: false, role: null, username: '', title: '', outlet: '' });
      }
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (firebaseUser?.uid && auth.isLoggedIn && auth.username) {
      const match = users.find(u => u.name === auth.username);
      if (match) {
        setDoc(doc(db, 'users', firebaseUser.uid), {
          name: match.name,
          role: match.role,
          title: match.title || match.role,
          allowedOutlet: match.allowedOutlet
        }).catch(err => {
          console.warn("Could not sync user profile to UID doc in users collection:", err);
        });
      }
    }
  }, [firebaseUser, auth, users]);

  const handleGoogleLogin = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(firebaseAuth, provider);
    } catch (error) {
      console.error("Google Login Error:", error);
    }
  };

  useEffect(() => {
    if (!firebaseUser || !auth.outlet) {
      isInitialized.current = false;
      return;
    }

    // Reset initialization flag for the new outlet
    isInitialized.current = false;

    // Sync Reservations
    const qReservations = query(collection(db, `outlets/${auth.outlet}/reservations`));
    const unsubReservations = onSnapshot(qReservations, (snapshot) => {
      isRemoteUpdate.current = true;
      const data = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as Reservation));
      setReservations(data);
      setTimeout(() => { isRemoteUpdate.current = false; }, 100);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, `outlets/${auth.outlet}/reservations`);
    });

    // Sync Waiting List
    const qWaiting = query(collection(db, `outlets/${auth.outlet}/waitingList`));
    const unsubWaiting = onSnapshot(qWaiting, (snapshot) => {
      isRemoteUpdate.current = true;
      const data = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as WaitingListEntry));
      setWaitingList(data);
      setTimeout(() => { isRemoteUpdate.current = false; }, 100);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, `outlets/${auth.outlet}/waitingList`);
    });

    // Sync Settings
    const unsubSettings = onSnapshot(doc(db, `outlets/${auth.outlet}/settings`, 'current'), (snapshot) => {
      isRemoteUpdate.current = true;
      if (snapshot.exists()) {
        setSettings(prev => ({ ...prev, ...snapshot.data() }));
      } else {
        // If no settings exist for this outlet, reset to defaults to avoid carrying over from previous outlet
        setSettings(JSON.parse(JSON.stringify(DEFAULT_SETTINGS)));
      }
      isInitialized.current = true;
      setTimeout(() => { isRemoteUpdate.current = false; }, 100);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, `outlets/${auth.outlet}/settings/current`);
      isInitialized.current = true;
    });



    // Chat Notifications Listener
    let lastRead = Number(localStorage.getItem('lastChatReadTimestamp') || 0);
    if (lastRead === 0) {
      // Initialize with a default of 12 hours ago to prevent massive historic fetches
      lastRead = Date.now() - 12 * 60 * 60 * 1000;
      localStorage.setItem('lastChatReadTimestamp', lastRead.toString());
    }
    const qChat = query(
      collection(db, 'chats'),
      where('timestamp', '>', new Date(lastRead))
    );

    const unsubChat = onSnapshot(qChat, (snapshot) => {
      // Only count messages if modal is closed
      if (!showChatModal) {
        setUnreadChatCount(snapshot.size);
      } else {
        setUnreadChatCount(0);
        localStorage.setItem('lastChatReadTimestamp', Date.now().toString());
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'chats');
    });

    return () => {
      unsubReservations();
      unsubWaiting();
      unsubSettings();
      unsubChat();
    };
  }, [firebaseUser, auth.outlet, showChatModal]);

  // Real-time listener for registered users across outlets
  useEffect(() => {
    if (!firebaseUser) {
      setUsers([]);
      return;
    }
    const qUsers = query(collection(db, 'users'));
    const unsubUsers = onSnapshot(qUsers, (snapshot) => {
      const data = snapshot.docs.map(doc => doc.data() as any);
      setUsers(data);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'users');
    });
    return () => unsubUsers();
  }, [firebaseUser]);

  useEffect(() => {
    if (auth.isLoggedIn && auth.outlet && !isRemoteUpdate.current && isInitialized.current) {
      // We don't need to emit to socket anymore for data, but we keep it for presence
      // socket.emit('update-reservations', { outlet: auth.outlet, reservations });
    }
  }, [reservations]);

  useEffect(() => {
    if (auth.isLoggedIn && auth.outlet && socket && !isRemoteUpdate.current && isInitialized.current) {
      socket.emit('update-waiting-list', { outlet: auth.outlet, waitingList });
    }
  }, [waitingList]);

  useEffect(() => {
    if (auth.isLoggedIn && auth.outlet && !isRemoteUpdate.current && isInitialized.current && isSynced) {
      const settingsRef = doc(db, `outlets/${auth.outlet}/settings`, 'current');
      setDoc(settingsRef, settings).catch(err => handleFirestoreError(err, OperationType.WRITE, `outlets/${auth.outlet}/settings/current`));
    }
  }, [settings, auth.outlet, isSynced]);

  useEffect(() => { localStorage.setItem('currentPage', currentPage); }, [currentPage]);
  useEffect(() => { localStorage.setItem('currentView', view); }, [view]);
  useEffect(() => { localStorage.setItem('dateRange', JSON.stringify(dateRange)); }, [dateRange]);
  useEffect(() => { localStorage.setItem('selectedOutlet', selectedOutlet); }, [selectedOutlet]);
  useEffect(() => { localStorage.setItem('reservations_cache', JSON.stringify(reservations)); }, [reservations]);
  useEffect(() => { localStorage.setItem('waiting_list_cache', JSON.stringify(waitingList)); }, [waitingList]);

  useEffect(() => {
    const root = window.document.documentElement;
    const theme = settings.theme;
    root.style.setProperty('--app-bg', theme.backgroundColor);
    root.style.setProperty('--app-font', theme.fontColor);
    root.style.setProperty('--app-surface', theme.surfaceColor);
    root.style.setProperty('--app-primary', theme.primaryColor);
    root.style.setProperty('--tbl-idle', theme.tableIdleColor);
    root.style.setProperty('--tbl-active', theme.tableActiveColor);
    root.style.setProperty('--tbl-upcoming', theme.tableUpcomingColor);
    root.style.setProperty('--tbl-completed', theme.tableCompletedColor);
    root.style.setProperty('--app-success', theme.successColor);
    root.style.setProperty('--app-danger', theme.dangerColor);
  }, [settings.theme]);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  // Global Notification Trigger Logic
  const globalSummaryStats = useMemo(() => {
    const filtered = reservations.filter(r => 
        r.reservationDate >= dateRange.start && 
        r.reservationDate <= dateRange.end &&
        !r.isWalkIn &&
        r.status !== ReservationStatus.CANCELLED
    );
    return {
        groups: filtered.length,
        pax: filtered.reduce((s, r) => s + r.guestCount, 0)
    };
  }, [reservations, dateRange]);

  useEffect(() => {
      if (auth.isLoggedIn && globalSummaryStats.groups > 0) {
          setShowGlobalSummary(true);
          const timer = setTimeout(() => setShowGlobalSummary(false), 7000);
          return () => clearTimeout(timer);
      }
  }, [dateRange.start, dateRange.end, auth.isLoggedIn]);

  // Reservation Alerts Logic (Mirroring Waiting List notification)
  const reservationAlerts = useMemo(() => {
    const todayStr = new Date().toISOString().split('T')[0];
    const todayConfirmed = reservations.filter(r => 
        r.reservationDate === todayStr && 
        r.status === ReservationStatus.CONFIRMED && 
        !r.isWalkIn
    );

    const now = new Date();
    const hasUrgentArrivals = todayConfirmed.some(r => {
        if (!r.arrivalTime) return false;
        const [hours, minutes] = r.arrivalTime.split(':').map(Number);
        const arrival = new Date();
        arrival.setHours(hours, minutes, 0, 0);
        
        const diffMs = arrival.getTime() - now.getTime();
        const diffMin = diffMs / 60000;
        
        // Urgent if arrival is within 30 mins or has already passed (late)
        return diffMin <= 30;
    });

    return {
        count: todayConfirmed.length,
        isUrgent: hasUrgentArrivals
    };
  }, [reservations]);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(e => {
        console.error(`Error attempting to enable full-screen mode: ${e.message}`);
      });
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
  };

  const getCurrentShiftIcon = () => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 11) return <Coffee className="text-gold-500" size={32} />;
    if (hour >= 11 && hour < 15) return <Utensils className="text-gold-500" size={32} />;
    if (hour >= 15 && hour < 18) return <Sun className="text-gold-500" size={32} />;
    if (hour >= 18 && hour < 19.5) return <Moon className="text-gold-500" size={32} />;
    return <Sparkles className="text-gold-500" size={32} />;
  };

  const getEnglishTimeGreeting = () => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) return "good morning";
    if (hour >= 12 && hour < 18) return "good afternoon";
    if (hour >= 18 && hour < 22) return "good evening";
    return "good night";
  };

  const handleLogin = (pic: StaffUser) => {
    if (loginModal.target === 'ADMIN') {
        setCurrentPage('ADMIN_PANEL');
        return;
    }
    const newAuthState = { isLoggedIn: true, role: pic.role, username: pic.name, title: pic.title, outlet: selectedOutlet, allowedOutlet: pic.allowedOutlet };
    setAuth(newAuthState);
    localStorage.setItem('auth_session', JSON.stringify(newAuthState));
    
    const randomQuote = HOSPITALITY_QUOTES[Math.floor(Math.random() * HOSPITALITY_QUOTES.length)];
    const timeGreeting = getEnglishTimeGreeting();
    const finalGreeting = `Hi ${timeGreeting}, ${pic.name.split(' ')[0]}!`;
    const shiftIcon = getCurrentShiftIcon();
    
    setGreeting({ isOpen: true, quote: randomQuote, userName: pic.name, fullGreeting: finalGreeting, icon: shiftIcon });
    setCurrentPage('DASHBOARD');
  };

  const handleAuthAttempt = async (usernameToAuth?: string) => {
    const rawUsername = (usernameToAuth !== undefined ? usernameToAuth : loginModal.usernameInput).trim();
    if (!rawUsername) {
      setLoginModal(prev => ({ ...prev, error: true, errorMessage: 'Ketik Username terlebih dahulu' }));
      return;
    }

    if (!selectedOutlet && loginModal.target !== 'ADMIN') {
      setLoginModal(prev => ({ ...prev, error: true, errorMessage: 'Pilih Outlet terlebih dahulu' }));
      return;
    }

    const cleanName = rawUsername.toUpperCase();
    const foundUser = users.find(u => u.name && u.name.trim().toUpperCase() === cleanName);

    if (loginModal.target === 'ADMIN') {
      if (!foundUser) {
        setLoginModal(prev => ({ ...prev, error: true, errorMessage: 'Username Manager/Supervisor tidak ditemukan' }));
        return;
      }
      if (!isManagementRole(foundUser.role)) {
        setLoginModal(prev => ({ ...prev, error: true, errorMessage: 'Akses khusus Restaurant Manager & Supervisor' }));
        return;
      }
      setLoginModal({ isOpen: false, usernameInput: '', roleInput: UserRole.GREETER, error: false, errorMessage: '', target: '', selectedRegion: null });
      handleLogin(foundUser);
      return;
    }

    // Staff Login & Auto-Registration
    if (foundUser) {
      if (foundUser.allowedOutlet !== 'ALL' && foundUser.allowedOutlet !== selectedOutlet) {
        setLoginModal(prev => ({ ...prev, error: true, errorMessage: `User "${foundUser.name}" sudah terdaftar di ${foundUser.allowedOutlet}` }));
        return;
      }
      setLoginModal({ isOpen: false, usernameInput: '', roleInput: UserRole.GREETER, error: false, errorMessage: '', target: '', selectedRegion: null });
      handleLogin(foundUser);
    } else {
      // First time login! Automatically register staff to selectedOutlet
      const newStaff = {
        name: cleanName,
        role: loginModal.roleInput || UserRole.GREETER,
        title: loginModal.roleInput || 'Greeter',
        allowedOutlet: selectedOutlet
      };
      try {
        await setDoc(doc(db, 'users', cleanName), newStaff);
        if (firebaseUser?.uid) {
          await setDoc(doc(db, 'users', firebaseUser.uid), newStaff).catch(() => {});
        }
        setUsers(prev => [...prev.filter(u => u.name !== cleanName), newStaff]);
        setLoginModal({ isOpen: false, usernameInput: '', roleInput: UserRole.GREETER, error: false, errorMessage: '', target: '', selectedRegion: null });
        handleLogin(newStaff);
      } catch (err) {
        console.error("Error registering staff:", err);
        handleFirestoreError(err, OperationType.WRITE, `users/${cleanName}`);
      }
    }
  };

  const handleLogout = () => {
    setAuth({ isLoggedIn: false, role: null, username: '', title: '', outlet: '', allowedOutlet: '' });
    setReservations([]);
    setWaitingList([]);
    setSettings(JSON.parse(JSON.stringify(DEFAULT_SETTINGS)));
    isInitialized.current = false;
    localStorage.removeItem('auth_session');
    setCurrentPage('DASHBOARD');
    setGreeting(null);
  };

  const handleSaveReservation = async (data: Omit<Reservation, 'id' | 'createdAt' | 'picIncharge'>) => {
    if (!auth.outlet) return;
    try {
      if (editingReservation) {
        const resRef = doc(db, `outlets/${auth.outlet}/reservations`, editingReservation.id);
        const cleanData = Object.fromEntries(Object.entries(data).filter(([_, v]) => v !== undefined));
        try {
          await updateDoc(resRef, cleanData);
        } catch (e) {
          handleFirestoreError(e, OperationType.UPDATE, `outlets/${auth.outlet}/reservations/${editingReservation.id}`);
        }
        setEditingReservation(null);
      } else {
        const id = Math.random().toString(36).substring(7);
        const newRes: Reservation = { 
          ...data, 
          id, 
          createdAt: Date.now(), 
          picIncharge: auth.username,
        };
        if (data.status === ReservationStatus.CHECKED_IN) newRes.checkedInAt = Date.now();
        if (data.status === ReservationStatus.COMPLETED) newRes.completedAt = Date.now();

        // Remove undefined fields for Firestore
        const cleanRes = Object.fromEntries(Object.entries(newRes).filter(([_, v]) => v !== undefined));
        const resRef = doc(db, `outlets/${auth.outlet}/reservations`, id);
        try {
          await setDoc(resRef, cleanRes);
        } catch (e) {
          handleFirestoreError(e, OperationType.CREATE, `outlets/${auth.outlet}/reservations/${id}`);
        }
      }
      setView('list');
      setShowWalkInModal(false);
      setPreSelectedTable('');
    } catch (error) {
      console.error("Error saving reservation:", error);
    }
  };

  const handleToggleMenuStatus = async (id: string) => {
    if (!auth.outlet) return;
    const res = reservations.find(r => r.id === id);
    if (!res) return;
    const resRef = doc(db, `outlets/${auth.outlet}/reservations`, id);
    try {
      await updateDoc(resRef, { hasInputtedMenu: !res.hasInputtedMenu });
    } catch (e) {
      handleFirestoreError(e, OperationType.UPDATE, `outlets/${auth.outlet}/reservations/${id}`);
    }
  };

  const handleTogglePayment = async (id: string) => {
    if (!auth.outlet) return;
    const res = reservations.find(r => r.id === id);
    if (!res) return;
    const resRef = doc(db, `outlets/${auth.outlet}/reservations`, id);
    try {
      await updateDoc(resRef, { hasDownPayment: !res.hasDownPayment });
    } catch (e) {
      handleFirestoreError(e, OperationType.UPDATE, `outlets/${auth.outlet}/reservations/${id}`);
    }
  };

  const handleToggleFullPayment = async (id: string) => {
    if (!auth.outlet) return;
    const res = reservations.find(r => r.id === id);
    if (!res) return;
    const resRef = doc(db, `outlets/${auth.outlet}/reservations`, id);
    try {
      await updateDoc(resRef, { isFullPayment: !res.isFullPayment });
    } catch (e) {
      handleFirestoreError(e, OperationType.UPDATE, `outlets/${auth.outlet}/reservations/${id}`);
    }
  };

  const handleUpdateTotalBill = async (id: string, amount: number, discountPercent?: number, discountAmount?: number, fixedDeduction?: number) => {
    if (!auth.outlet) return;
    const resRef = doc(db, `outlets/${auth.outlet}/reservations`, id);
    const updates: any = { 
      totalBillAmount: amount
    };
    if (discountPercent !== undefined) updates.discountPercent = discountPercent;
    if (discountAmount !== undefined) updates.discountAmount = discountAmount;
    if (fixedDeduction !== undefined) updates.fixedDeduction = fixedDeduction;
    try {
      await updateDoc(resRef, updates);
    } catch (e) {
      handleFirestoreError(e, OperationType.UPDATE, `outlets/${auth.outlet}/reservations/${id}`);
    }
  };

  const handleSaveCheckedMenu = async (guestId: string, menuList: string[], menuNotes: string) => {
    if (!auth.outlet) return;
    const resRef = doc(db, `outlets/${auth.outlet}/reservations`, guestId);
    try {
      await updateDoc(resRef, { hasInputtedMenu: true, orderedMenuItems: menuList, menuNotes: menuNotes });
    } catch (e) {
      handleFirestoreError(e, OperationType.UPDATE, `outlets/${auth.outlet}/reservations/${guestId}`);
    }
    setCurrentPage('MENU_INPUT_SUMMARY');
  };

  const handleMarkMenuInputted = async (guestName: string, date: string) => {
    if (!auth.outlet) return;
    const res = reservations.find(r => r.guestName.toLowerCase() === guestName.toLowerCase() && r.reservationDate === date);
    if (res) {
      const resRef = doc(db, `outlets/${auth.outlet}/reservations`, res.id);
      try {
        await updateDoc(resRef, { hasInputtedMenu: true });
      } catch (e) {
        handleFirestoreError(e, OperationType.UPDATE, `outlets/${auth.outlet}/reservations/${res.id}`);
      }
    }
    setCurrentPage('MENU_INPUT_SUMMARY');
    setBillPreSelect(null);
  };

  const handleRemoveMenuStatus = async (id: string) => {
    if (!auth.outlet) return;
    const resRef = doc(db, `outlets/${auth.outlet}/reservations`, id);
    try {
      await updateDoc(resRef, { hasInputtedMenu: false, orderedMenuItems: [], menuNotes: '' });
    } catch (e) {
      handleFirestoreError(e, OperationType.UPDATE, `outlets/${auth.outlet}/reservations/${id}`);
    }
  };

  const handleQuickWalkIn = (tableNum: string) => { setPreSelectedTable(tableNum); setShowWalkInModal(true); };

  const handleTableChange = async (id: string, newTable: string, newMergedTables?: string[]) => {
    if (!auth.outlet) return;
    const resRef = doc(db, `outlets/${auth.outlet}/reservations`, id);
    const updates: any = { 
      tableNumber: newTable
    };
    if (newMergedTables !== undefined) {
      updates.mergedTables = newMergedTables;
    }
    try {
      await updateDoc(resRef, updates);
    } catch (e) {
      handleFirestoreError(e, OperationType.UPDATE, `outlets/${auth.outlet}/reservations/${id}`);
    }
  };

  const handleMergeTable = async (id: string, tablesToMerge: string[]) => {
    if (!auth.outlet) return;
    const res = reservations.find(r => r.id === id);
    if (!res) return;
    const resRef = doc(db, `outlets/${auth.outlet}/reservations`, id);
    try {
      await updateDoc(resRef, { mergedTables: [...new Set([...(res.mergedTables || []), ...tablesToMerge])] });
    } catch (e) {
      handleFirestoreError(e, OperationType.UPDATE, `outlets/${auth.outlet}/reservations/${id}`);
    }
  };

  const handleGoToBill = (guestName: string, date: string) => { setBillPreSelect({ name: guestName, date }); setCurrentPage('CHECK_BILL'); };
  const handleEditMenu = (id: string) => { setMenuEditPreSelect(id); setCurrentPage('MENU_CHECKMARK'); };

  const handleMutateCrew = async (name: string, newOutlet: string) => {
    try {
      const userRef = doc(db, 'users', name);
      await updateDoc(userRef, { allowedOutlet: newOutlet });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${name}`);
    }
  };

  const handleCloseDay = async (date: string) => {
    if (!auth.outlet) return;
    try {
      const toArchive = reservations.filter(r => r.reservationDate === date);
      if (toArchive.length > 0) {
        const batch = writeBatch(db);
        toArchive.forEach(res => {
          const historyRef = doc(db, `outlets/${auth.outlet}/history`, res.id);
          const resRef = doc(db, `outlets/${auth.outlet}/reservations`, res.id);
          batch.set(historyRef, res);
          batch.delete(resRef);
        });
        try {
          await batch.commit();
        } catch (e) {
          handleFirestoreError(e, OperationType.WRITE, `outlets/${auth.outlet}/history/batch`);
        }
        alert(`Day ${date} successfully closed and archived. ${toArchive.length} reservations moved to history.`);
      }
    } catch (error) {
      console.error("Error closing day:", error);
    }
  };

  const handleStatusChange = async (id: string, status: ReservationStatus, reason?: string) => {
    if (!auth.outlet) return;
    const r = reservations.find(res => res.id === id);
    if (!r) return;
    
    const updates: any = { status, cancellationReason: reason || r.cancellationReason || '' };
    if (status === ReservationStatus.CHECKED_IN && !r.checkedInAt) {
      updates.checkedInAt = Date.now();
    } else if (status === ReservationStatus.COMPLETED && !r.completedAt) {
      updates.completedAt = Date.now();
      if (!r.checkedInAt) {
        updates.checkedInAt = r.createdAt || Date.now();
      }
    }
    
    const resRef = doc(db, `outlets/${auth.outlet}/reservations`, id);
    try {
      await updateDoc(resRef, updates);
    } catch (e) {
      handleFirestoreError(e, OperationType.UPDATE, `outlets/${auth.outlet}/reservations/${id}`);
    }
  };

  const handleResetDate = () => {
    const today = new Date().toISOString().split('T')[0];
    setDateRange({ start: today, end: today });
  };

  const handleAddWaiting = async (entry: Omit<WaitingListEntry, 'id' | 'joinedAt' | 'status' | 'reservationDate'>) => {
    if (!auth.outlet) return;
    const id = Math.random().toString(36).substring(7);
    const newEntry: WaitingListEntry = {
        ...entry,
        id,
        joinedAt: Date.now(),
        status: WaitingStatus.WAITING,
        reservationDate: new Date().toISOString().split('T')[0]
    };
    // Remove undefined fields for Firestore
    const cleanEntry = Object.fromEntries(Object.entries(newEntry).filter(([_, v]) => v !== undefined));
    const waitRef = doc(db, `outlets/${auth.outlet}/waitingList`, id);
    try {
      await setDoc(waitRef, cleanEntry);
    } catch (e) {
      handleFirestoreError(e, OperationType.CREATE, `outlets/${auth.outlet}/waitingList/${id}`);
    }
  };

  const handleSeatWaiting = async (entryId: string, tableNum: string) => {
      if (!auth.outlet) return;
      const entry = waitingList.find(w => w.id === entryId);
      if (!entry) return;

      const now = new Date();
      const timeStr = now.getHours().toString().padStart(2, '0') + ':' + now.getMinutes().toString().padStart(2, '0');

      const resId = Math.random().toString(36).substring(7);
      const newReservation: Reservation = {
          id: resId,
          reservationDate: entry.reservationDate,
          guestName: `${entry.guestName}`,
          guestCount: entry.guestCount,
          arrivalTime: timeStr,
          shift: Shift.DINNER, 
          locationPreference: LocationPreference.NON_SMOKING,
          tableNumber: tableNum,
          phoneNumber: entry.phoneNumber || '-',
          otherRequirements: `Seated from Waiting List. Phone: ${entry.phoneNumber || '-'}`,
          companyOrPersonalName: '-',
          hasDownPayment: false,
          downPaymentAmount: 0,
          status: ReservationStatus.CHECKED_IN,
          isWalkIn: true,
          segmentation: GuestSegment.FAMILY,
          createdAt: Date.now(),
          checkedInAt: Date.now(),
          picIncharge: auth.username,
          waitingListRefId: entryId
      };

      const batch = writeBatch(db);
      const resRef = doc(db, `outlets/${auth.outlet}/reservations`, resId);
      const waitRef = doc(db, `outlets/${auth.outlet}/waitingList`, entryId);
      
      batch.set(resRef, newReservation);
      batch.update(waitRef, { status: WaitingStatus.SEATED, seatedAt: Date.now() });
      try {
        await batch.commit();
      } catch (e) {
        handleFirestoreError(e, OperationType.WRITE, `outlets/${auth.outlet}/reservations/batch`);
      }
  };

  const handleCancelWaiting = async (entryId: string) => {
      if (!auth.outlet) return;
      const waitRef = doc(db, `outlets/${auth.outlet}/waitingList`, entryId);
      try {
        await updateDoc(waitRef, { status: WaitingStatus.CANCELLED });
      } catch (e) {
        handleFirestoreError(e, OperationType.UPDATE, `outlets/${auth.outlet}/waitingList/${entryId}`);
      }
  };

  const DashboardCard = ({ icon: Icon, title, sub, color, onClick, count, isWarning }: any) => (
    <button onClick={onClick} className={`group relative p-6 rounded-[2rem] bg-dark-800 border transition-all text-left overflow-hidden shadow-lg hover:-translate-y-1 duration-300 ${isWarning ? 'border-red-500 shadow-red-500/20' : 'border-white/5 hover:border-white/10'}`}>
        <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:scale-125 transition-transform"><Icon size={80}/></div>
        {count !== undefined && (
            <div className={`absolute top-6 right-6 px-3 py-1 rounded-full font-sans font-black text-[10px] shadow-lg animate-pulse ${isWarning ? 'bg-red-500 text-white' : 'bg-gold-500 text-black'}`}>{count}</div>
        )}
        <div className={`w-12 h-12 rounded-2xl bg-white/5 ${isWarning ? 'text-red-500' : color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform shadow-inner`}>
            <Icon size={24}/>
        </div>
        <h3 className={`text-lg font-black uppercase tracking-tight mb-1 leading-tight ${isWarning ? 'text-red-500' : 'text-white'}`}>{title}</h3>
        <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest opacity-70">{sub}</p>
    </button>
  );

  const activeWaitingCount = useMemo(() => 
    waitingList.filter(w => w.status === WaitingStatus.WAITING && w.reservationDate === new Date().toISOString().split('T')[0]).length
  , [waitingList]);

  const otherUsers = useMemo(() => {
    return activeUsers.filter(u => u.username !== auth.username);
  }, [activeUsers, auth.username]);

  const hasLongWaiting = useMemo(() => {
    const now = Date.now();
    return waitingList.some(w => w.status === WaitingStatus.WAITING && (now - w.joinedAt) > 600000); 
  }, [waitingList]);

  const getAvatarColor = (role: UserRole | null) => {
    if (!role) return 'bg-gray-600 text-white';
    if ([UserRole.MANAGER, UserRole.ASST_MANAGER].includes(role)) return 'bg-gold-500 text-black';
    if (role === UserRole.SUPERVISOR) return 'bg-emerald-600 text-white';
    if (role === UserRole.CAPTAIN) return 'bg-blue-600 text-white';
    return 'bg-dark-700 text-gray-300';
  };

  if (!auth.isLoggedIn) {
    return (
      <div className="min-h-screen bg-dark-950 flex items-center justify-center p-4">
        <div className="glass-card p-10 rounded-[3rem] w-full max-w-[340px] shadow-2xl text-center border-gold-500/20">
          <div className="w-20 h-20 bg-gold-500 rounded-[1.5rem] flex items-center justify-center mx-auto mb-8 shadow-[0_10px_30px_rgba(212,175,55,0.4)] border border-white/10 glow-gold">
            <span className="text-4xl font-serif font-black text-black tracking-tighter leading-none">JS</span>
          </div>
          <h1 className="text-2xl font-serif font-black text-white uppercase tracking-tight mb-1">Justus Group</h1>
          <p className="text-gold-500 text-[9px] font-black uppercase tracking-[0.4em] opacity-60 mb-10">GREETER CONTROL APP</p>
          
          <div className="space-y-4">
            {!firebaseUser ? (
              <button onClick={handleGoogleLogin} className="w-full py-4 bg-white hover:bg-gray-100 text-black font-black uppercase text-[11px] rounded-xl transition-all shadow-xl flex items-center justify-center gap-3 active:scale-95 tracking-widest">
                <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="w-5 h-5" /> Sign in with Google
              </button>
            ) : (
              <>
                <div className="flex items-center justify-center gap-2 mb-2">
                  <img src={firebaseUser.photoURL || ''} alt="Avatar" className="w-6 h-6 rounded-full" />
                  <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">{firebaseUser.displayName}</span>
                  <button onClick={() => signOut(firebaseAuth)} className="text-red-500 hover:text-red-400 transition-colors"><LogOut size={12} /></button>
                </div>
                <button onClick={() => setLoginModal({ isOpen: true, usernameInput: '', error: false, errorMessage: '', target: 'STAFF', selectedRegion: null })} className="w-full py-4 bg-gold-500 hover:bg-gold-400 text-black font-black uppercase text-[11px] rounded-xl transition-all shadow-xl flex items-center justify-center gap-3 active:scale-95 glow-gold tracking-widest">
                  <User size={16} /> Staff Access
                </button>
              </>
            )}
            <div className="pt-2">
              <p className="text-gold-500 text-[8px] font-black uppercase tracking-[0.4em] opacity-80 glow-text">SUPPORT BY CHRISTIAN KAIAN</p>
            </div>
          </div>
          <p className="mt-8 text-[8px] text-gray-600 font-mono uppercase tracking-widest">SECURE SESSION V8.5</p>
        </div>

        {loginModal.isOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-md p-4 animate-fade-in">
             <div className="glass-card p-8 rounded-[2.5rem] w-full max-w-md border-gold-500/30 shadow-[0_0_50px_rgba(212,175,55,0.1)] transition-all duration-500">
                <div className="flex justify-between items-center mb-6">
                   <div>
                      <h3 className="text-xl font-serif font-black text-white uppercase tracking-tighter">
                        {loginModal.target === 'ADMIN' ? 'Management Access' : 'Staff Gateway'}
                      </h3>
                      <p className="text-[10px] text-gold-500 font-bold uppercase tracking-widest">
                        {loginModal.target === 'ADMIN' ? 'Masukkan Username Manager / SPV' : 'Login Menggunakan Username'}
                      </p>
                   </div>
                   <button onClick={() => setLoginModal({ ...loginModal, isOpen: false, usernameInput: '', error: false, selectedRegion: null })} className="p-2 text-gray-500 hover:text-white transition-colors bg-white/5 rounded-full"><X size={24}/></button>
                </div>

                {loginModal.target === 'STAFF' && !loginModal.selectedRegion ? (
                  <div className="space-y-6 animate-fade-in">
                    <p className="text-[10px] font-black text-gray-500 uppercase tracking-[0.4em] text-center mb-4">PILIH REGIONAL OUTLET</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <button 
                            onClick={() => { setLoginModal({ ...loginModal, selectedRegion: 'JAKARTA' }); setSelectedOutlet(OUTLETS_JAKARTA[0]); }}
                            className="group p-8 bg-dark-800 border border-white/5 rounded-[2rem] hover:border-gold-500/50 transition-all flex flex-col items-center gap-4 text-center shadow-lg active:scale-95"
                        >
                            <div className="p-4 bg-gold-500/10 rounded-2xl group-hover:bg-gold-500 group-hover:text-black transition-all">
                                <Navigation size={32} />
                            </div>
                            <div>
                                <h4 className="text-lg font-serif font-black text-white uppercase tracking-tight">JAKARTA</h4>
                                <p className="text-[8px] text-gray-500 font-bold uppercase tracking-widest mt-1">Metropolitan Area</p>
                            </div>
                        </button>
                        <button 
                            onClick={() => { setLoginModal({ ...loginModal, selectedRegion: 'BANDUNG' }); setSelectedOutlet(OUTLETS_BANDUNG[0]); }}
                            className="group p-8 bg-dark-800 border border-white/5 rounded-[2rem] hover:border-gold-500/50 transition-all flex flex-col items-center gap-4 text-center shadow-lg active:scale-95"
                        >
                            <div className="p-4 bg-emerald-500/10 rounded-2xl group-hover:bg-emerald-500 group-hover:text-white transition-all text-emerald-500">
                                <Building2 size={32} />
                            </div>
                            <div>
                                <h4 className="text-lg font-serif font-black text-white uppercase tracking-tight">BANDUNG</h4>
                                <p className="text-[8px] text-gray-500 font-bold uppercase tracking-widest mt-1">The Heritage City</p>
                            </div>
                        </button>
                    </div>
                  </div>
                ) : (
                  <div className="animate-fade-in space-y-5">
                    {loginModal.target === 'STAFF' && (
                        <div className="space-y-3">
                            <button 
                                onClick={() => { setLoginModal({ ...loginModal, selectedRegion: null, usernameInput: '', error: false }); setSelectedOutlet(''); }}
                                className="text-[9px] font-black text-gold-500 uppercase tracking-widest flex items-center gap-2 hover:text-white transition-colors"
                            >
                                <ArrowLeft size={12} /> Ganti Regional
                            </button>
                            <div className="p-4 bg-dark-800 rounded-2xl border border-white/5">
                                <label className="text-[8px] font-black text-gray-500 uppercase tracking-widest block mb-2 flex items-center gap-1.5"><MapPin size={10} /> Outlet {loginModal.selectedRegion}</label>
                                <select 
                                    value={selectedOutlet} 
                                    onChange={(e) => {
                                      setSelectedOutlet(e.target.value);
                                      setLoginModal(p => ({ ...p, usernameInput: '', error: false }));
                                    }} 
                                    className="w-full bg-dark-900 text-white border border-gold-900/30 rounded-xl px-4 py-3 text-[11px] font-sans font-bold outline-none focus:ring-1 focus:ring-gold-500 transition-all cursor-pointer appearance-none"
                                >
                                    {(loginModal.selectedRegion === 'JAKARTA' ? OUTLETS_JAKARTA : OUTLETS_BANDUNG).map(outlet => (
                                        <option key={outlet} value={outlet}>{outlet}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    )}

                    {loginModal.error && (
                      <div className="p-3 bg-red-900/20 border border-red-500/30 rounded-xl text-red-400 text-[10px] font-black uppercase flex items-center gap-2 animate-pulse font-sans">
                        <AlertCircle size={14}/> {loginModal.errorMessage}
                      </div>
                    )}

                    {/* Username Input Field */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-1.5">
                          <User size={12} className="text-gold-500" /> Username Staff
                        </label>
                        {loginModal.usernameInput.trim() && (
                          users.some(u => u.name?.trim().toUpperCase() === loginModal.usernameInput.trim().toUpperCase()) ? (
                            <span className="text-[9px] font-black text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                              Sudah Terdaftar
                            </span>
                          ) : (
                            <span className="text-[9px] font-black text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
                              Pendaftaran Baru
                            </span>
                          )
                        )}
                      </div>
                      <div className="relative">
                        <input
                          type="text"
                          placeholder="Masukkan Username..."
                          value={loginModal.usernameInput}
                          onChange={(e) => setLoginModal(p => ({ ...p, usernameInput: e.target.value, error: false }))}
                          onKeyDown={(e) => { if (e.key === 'Enter') handleAuthAttempt(); }}
                          className="w-full bg-dark-900 text-white border border-gold-900/40 focus:border-gold-500 rounded-xl px-4 py-3.5 text-xs font-bold outline-none focus:ring-1 focus:ring-gold-500 uppercase tracking-wider placeholder:normal-case placeholder:text-gray-600 transition-all"
                          autoFocus
                        />
                        {loginModal.usernameInput && (
                          <button 
                            type="button"
                            onClick={() => setLoginModal(p => ({ ...p, usernameInput: '', error: false }))}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white p-1"
                          >
                            <X size={14} />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Role Selection for registration */}
                    {loginModal.target === 'STAFF' && (
                      <div className="space-y-1.5">
                        <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-1.5">
                          <Shield size={12} className="text-gold-500" /> Jabatan / Role Staff
                        </label>
                        <select
                          value={loginModal.roleInput}
                          onChange={(e) => setLoginModal(p => ({ ...p, roleInput: e.target.value as UserRole }))}
                          className="w-full bg-dark-900 text-white border border-gold-900/30 focus:border-gold-500 rounded-xl px-4 py-3 text-xs font-bold outline-none focus:ring-1 focus:ring-gold-500 transition-all cursor-pointer"
                        >
                          <option value={UserRole.GREETER}>Greeter</option>
                          <option value={UserRole.CAPTAIN}>Restaurant Captain</option>
                          <option value={UserRole.SUPERVISOR}>Restaurant Supervisor</option>
                          <option value={UserRole.ASST_MANAGER}>Assistant Manager</option>
                          <option value={UserRole.MANAGER}>Restaurant Manager</option>
                        </select>
                        <p className="text-[9px] text-gray-500">
                          Nama staff otomatis terdaftar di outlet <span className="text-gold-400 font-bold">{selectedOutlet}</span> saat pertama kali login.
                        </p>
                      </div>
                    )}

                    {/* Quick Select Staff Pills for existing staff */}
                    {(() => {
                      const filteredCrew = loginModal.target === 'ADMIN'
                        ? users.filter(u => isManagementRole(u.role))
                        : users.filter(u => u.allowedOutlet === 'ALL' || u.allowedOutlet === selectedOutlet);

                      if (filteredCrew.length === 0) return null;

                      return (
                        <div className="space-y-2 pt-1">
                          <label className="text-[8px] font-black text-gray-500 uppercase tracking-widest block">
                            Staff Terdaftar di {loginModal.target === 'ADMIN' ? 'Sistem' : selectedOutlet}:
                          </label>
                          <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto pr-1">
                            {filteredCrew.map(u => {
                              const isSelected = loginModal.usernameInput.trim().toUpperCase() === u.name.toUpperCase();
                              return (
                                <button
                                  key={u.name}
                                  type="button"
                                  onClick={() => {
                                    setLoginModal(p => ({ ...p, usernameInput: u.name, roleInput: u.role || UserRole.GREETER, error: false }));
                                  }}
                                  className={`px-3 py-2 rounded-xl text-[10px] font-bold uppercase transition-all flex items-center gap-1.5 border ${
                                    isSelected
                                      ? 'bg-gold-500 text-black border-gold-400 font-black shadow-md scale-105'
                                      : 'bg-dark-800 text-gray-300 border-white/5 hover:border-gold-500/40 hover:text-white'
                                  }`}
                                >
                                  <User size={12} className={isSelected ? 'text-black' : 'text-gold-500'} />
                                  <span>{u.name}</span>
                                  <span className={`text-[8px] opacity-70 ${isSelected ? 'text-black font-bold' : 'text-gray-400'}`}>• {u.role}</span>
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })()}

                    {/* Submit Button */}
                    <button 
                      onClick={() => handleAuthAttempt()} 
                      disabled={!loginModal.usernameInput.trim()}
                      className="w-full py-4 bg-gold-500 hover:bg-gold-400 disabled:opacity-40 disabled:cursor-not-allowed text-black text-[11px] font-black uppercase rounded-2xl shadow-xl active:scale-95 flex items-center justify-center gap-2 transition-all tracking-widest glow-gold mt-4"
                    >
                      <User size={15} /> 
                      {loginModal.usernameInput.trim() 
                        ? (users.some(u => u.name?.trim().toUpperCase() === loginModal.usernameInput.trim().toUpperCase())
                            ? `MASUK • ${loginModal.usernameInput.trim().toUpperCase()}`
                            : `DAFTAR & MASUK • ${loginModal.usernameInput.trim().toUpperCase()}`)
                        : 'MASUK SEBAGAI STAFF'} 
                      <ChevronRight size={16}/>
                    </button>
                  </div>
                )}
             </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-dark-950 text-white font-sans selection:bg-gold-500 selection:text-black">
      {/* GLOBAL SUMMARY NOTIFICATION (Moved Outside specific feature) */}
      {showGlobalSummary && (
        <div className="fixed top-28 left-1/2 -translate-x-1/2 z-[100] animate-fade-in-down w-full max-w-lg px-4 no-print">
          <div className="glass-card p-8 rounded-[2.5rem] border-white/10 shadow-[0_30px_100px_rgba(0,0,0,0.7)] relative overflow-hidden transition-all duration-300 group ring-1 ring-gold-500/20">
              {/* Corner Badge */}
              <div className="absolute top-0 right-0 px-6 py-2 rounded-bl-[2rem] bg-gold-500 text-black font-sans font-black text-[10px] tracking-widest flex items-center gap-1.5 shadow-lg">
                 <Hash size={12}/> SYSTEM INSIGHT
              </div>

              {/* Side Strip */}
              <div className="absolute top-0 left-0 bottom-0 w-1.5 bg-gold-500 shadow-[0_0_15px_rgba(212,175,55,0.4)]"></div>

              {/* Content Area */}
              <div className="flex justify-between items-start mb-6 mt-2">
                 <div className="space-y-2">
                    <p className="text-[10px] font-black text-gold-500 uppercase tracking-[0.4em]">Daily Forecast Detected</p>
                    <h4 className={`text-3xl font-serif font-black uppercase tracking-tight text-white`}>
                      Reservation <span className="text-gold-500">Overview</span>
                    </h4>
                    <div className="flex flex-wrap items-center gap-3">
                      <span className="text-[10px] font-sans font-black uppercase tracking-widest flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gold-500/10 text-gold-500 border border-gold-500/20">
                        <Target size={14} /> {globalSummaryStats.groups} GROUPS
                      </span>
                      <span className="text-[10px] font-sans font-black uppercase tracking-widest flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                        <Users size={14} /> {globalSummaryStats.pax} TOTAL PAX
                      </span>
                    </div>
                 </div>
                 <div className="flex flex-col items-end gap-3">
                    <button 
                      onClick={() => setShowGlobalSummary(false)} 
                      className="p-3 bg-white/5 text-gray-500 hover:text-red-500 rounded-2xl transition-all border border-white/5 hover:border-red-500/30 shadow-lg"
                    >
                      <X size={20} />
                    </button>
                    <div className="p-3 bg-gold-500/10 border border-gold-500/20 rounded-2xl animate-pulse">
                       <Sparkles className="text-gold-500" size={24} />
                    </div>
                 </div>
              </div>

              <div className="p-4 rounded-2xl bg-black/40 border border-white/5 flex items-center gap-4 shadow-inner">
                  <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-gray-500 shrink-0 border border-white/5">
                    <CalendarRange size={20} />
                  </div>
                  <div className="flex-1">
                    <p className="text-[8px] font-black text-gray-500 uppercase tracking-widest mb-0.5">Summary Period</p>
                    <p className="text-[11px] font-sans font-black text-white uppercase tracking-tight">
                       {new Date(dateRange.start).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })} 
                       <span className="mx-2 text-gray-600">—</span>
                       {new Date(dateRange.end).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-[8px] font-black text-gray-500 uppercase tracking-widest mb-0.5">Status</p>
                    <p className="text-[10px] font-sans font-black text-emerald-500 uppercase tracking-widest flex items-center gap-1">
                      <Check size={10} strokeWidth={4} /> DATA READY
                    </p>
                  </div>
              </div>
          </div>
        </div>
      )}

      <header className="p-6 md:p-8 flex flex-col lg:flex-row justify-between items-center border-b border-white/5 sticky top-0 z-[50] backdrop-blur-2xl bg-dark-950/80 gap-6">
          <div className="flex items-center gap-6">
            <div className="w-12 h-12 bg-gold-500/10 border border-gold-500/20 rounded-2xl flex items-center justify-center glow-gold shrink-0">
               <span className="text-xl font-serif font-black text-gold-500 tracking-tighter">JS</span>
            </div>
            <div>
                <div className="flex items-center gap-3">
                  <h1 className="text-2xl md:text-3xl font-serif font-black uppercase tracking-tighter leading-none text-white">Justus <span className="text-gold-500">{auth.outlet ? auth.outlet.replace('SH ', '') : 'STEAKHOUSE'}</span></h1>
                </div>
                <p className="text-[10px] font-black uppercase tracking-[0.5em] mt-1.5">Greeter Operational Control</p>
            </div>
         </div>
         <div className="flex items-center gap-4 flex-wrap justify-center">
            <div className={`flex items-center gap-2 px-4 py-2 rounded-2xl border transition-all shadow-lg ${isSynced ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500' : 'bg-red-500/10 border-red-500/20 text-red-500 animate-pulse'}`}>
                <div className={`w-2 h-2 rounded-full ${isSynced ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)]' : 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.6)]'}`}></div>
                <span className="text-[10px] font-black uppercase tracking-widest">{isSynced ? 'Cloud Synced' : 'Offline Mode'}</span>
            </div>
            {auth.isLoggedIn && (
                <div className="flex items-center gap-4 px-6 py-2.5 bg-dark-800 rounded-[1.5rem] border border-gold-900/30 shadow-xl mr-2 group">
                    <div className={`w-11 h-11 rounded-2xl flex items-center justify-center font-black text-sm shadow-inner transition-transform group-hover:scale-105 ${getAvatarColor(auth.role)}`}>
                      {auth.username.substring(0, 1).toUpperCase()}
                    </div>
                    <div className="text-left hidden md:block">
                      <p className="text-sm font-black text-white leading-none tracking-wide uppercase">{auth.username.split(' ')[0]}</p>
                      <div className="flex items-center gap-1.5 mt-1.5">
                        <Shield size={10} className={isManagementRole(auth.role) ? 'text-gold-500' : 'text-blue-400'} />
                        <p className={`text-[9px] font-black uppercase tracking-[0.1em] ${isManagementRole(auth.role) ? 'text-gold-500' : 'text-blue-400'}`}>
                          {auth.title || auth.role}
                        </p>
                      </div>
                    </div>
                </div>
            )}
            
            {currentPage !== 'DASHBOARD' && (<button onClick={() => { setCurrentPage('DASHBOARD'); setView('list'); }} className="p-3 bg-white/5 hover:bg-gold-500 hover:text-black rounded-xl transition-all border border-white/10 group"><Home size={20} /></button>)}
            
            <div className="flex items-center gap-3 bg-white/5 px-4 py-3 rounded-2xl border border-white/10 shadow-inner group">
                <CalendarRange size={16} className="text-gold-500" />
                <div className="flex items-center gap-2">
                  <input 
                    type="date" 
                    value={dateRange.start} 
                    onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))} 
                    className="bg-transparent border-none text-sm font-black outline-none color-scheme-dark uppercase tracking-widest text-white w-[115px] font-sans" 
                  />
                  <span className="text-[10px] font-black text-gray-600">TO</span>
                  <input 
                    type="date" 
                    value={dateRange.end} 
                    onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))} 
                    className="bg-transparent border-none text-sm font-black outline-none color-scheme-dark uppercase tracking-widest text-white w-[115px] font-sans" 
                  />
                  <button onClick={handleResetDate} className="p-1.5 hover:bg-gold-500 hover:text-black text-gray-500 rounded-lg transition-all" title="Reset to Today">
                    <RotateCcw size={14} />
                  </button>
                </div>
            </div>

            <div className="h-10 w-px bg-white/10 mx-2 hidden md:block"></div>
            
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full border text-[9px] font-black uppercase tracking-widest transition-all ${isSynced ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500' : 'bg-red-500/10 border-red-500/20 text-red-500 animate-pulse'}`}>
              <Database size={12} /> {isSynced ? 'Cloud Synced' : 'Offline'}
            </div>

            {otherUsers.length > 0 && (
              <div className="hidden md:flex items-center -space-x-2 mr-2">
                {otherUsers.map((u, i) => (
                  <div 
                    key={i} 
                    title={`${u.username.split(' ')[0]} (${u.role})`}
                    className={`w-8 h-8 rounded-full border-2 border-dark-950 flex items-center justify-center text-[10px] font-black uppercase shadow-lg ${getAvatarColor(u.role)}`}
                  >
                    {u.username.charAt(0)}
                  </div>
                ))}
                <div className="pl-4 text-[9px] font-black text-emerald-500 uppercase tracking-widest animate-pulse">
                  {otherUsers.length} Online
                </div>
              </div>
            )}

            <button 
              onClick={toggleFullscreen} 
              className="p-3 bg-white/5 hover:bg-gold-500 hover:text-black rounded-xl transition-all border border-white/10 group shadow-lg"
              title={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}
            >
              {isFullscreen ? <Minimize size={20} /> : <Maximize size={20} />}
            </button>

            <button onClick={handleLogout} className="flex items-center gap-2 bg-red-900/20 hover:bg-red-900/40 text-red-500 px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all shadow-lg active:scale-95"><LogOut size={16} /> Logout</button>
         </div>
      </header>

      <main className="p-6 md:p-8 max-w-[1600px] mx-auto pb-32">
        {view === 'form' ? (
          <div className="max-w-4xl mx-auto animate-fade-in"><ReservationForm onSubmit={handleSaveReservation} onCancel={() => {setView('list'); setEditingReservation(null);}} initialDate={dateRange.start} existingReservations={reservations} initialData={editingReservation} settings={settings} isDarkMode={true} /></div>
        ) : (
          <>
            {currentPage === 'DASHBOARD' && (
               <div className="space-y-12 animate-fade-in">
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6">
                      <DashboardCard 
                          icon={Calendar} 
                          title="Reservasi Book" 
                          sub="Forecast List" 
                          color="text-blue-500" 
                          count={reservationAlerts.count > 0 ? reservationAlerts.count : undefined}
                          isWarning={reservationAlerts.isUrgent}
                          onClick={() => setCurrentPage('BOOK')} 
                      />
                      <DashboardCard icon={Plus} title="New Reservation" sub="Create Booking" color="text-gold-500" onClick={() => { setEditingReservation(null); setView('form'); }} />
                      <DashboardCard icon={Footprints} title="Walk-In Entry" sub="Quick Assign" color="text-emerald-500" onClick={() => { setPreSelectedTable(''); setShowWalkInModal(true); }} />
                      <DashboardCard icon={Clock} title="Waiting List" sub="Guest Queue" color="text-amber-500" count={activeWaitingCount > 0 ? activeWaitingCount : undefined} isWarning={hasLongWaiting} onClick={() => setCurrentPage('WAITING_LIST')} />
                      <DashboardCard icon={LayoutGrid} title="LAY OUT TABLE ACTIVE" sub="Live Map View" color="text-indigo-500" onClick={() => setCurrentPage('FLOOR_PLAN')} />
                      <DashboardCard icon={TrendingUp} title="Sales Manager Revenue" sub="Sales Monitor" color="text-amber-500" onClick={() => setCurrentPage('SM_REVENUE')} />
                      <DashboardCard icon={CheckSquare} title="Input Menu" sub="Checkmark" color="text-teal-400" onClick={() => setCurrentPage('MENU_CHECKMARK')} />
                      <DashboardCard icon={Calculator} title="Billing" sub="Check Bill" color="text-green-400" onClick={() => setCurrentPage('CHECK_BILL')} />
                      <DashboardCard icon={MenuSquare} title="Menu List" sub="Digital Menu" color="text-cyan-400" onClick={() => setCurrentPage('MENU_LIST')} />
                      <DashboardCard icon={ClipboardList} title="Rekap Pesanan Iftar" sub="Tally Menu" color="text-blue-400" onClick={() => setCurrentPage('ORDER_TALLY')} />
                      <DashboardCard icon={ListChecks} title="Checkmark Order" sub="Order Logs" color="text-lime-400" onClick={() => setCurrentPage('MENU_INPUT_SUMMARY')} />
                      <DashboardCard icon={ShieldCheck} title="Admin Panel" sub="Auth Personnel Only" color="text-purple-500" onClick={() => { if(isManagementRole(auth.role)) setCurrentPage('ADMIN_PANEL'); else setLoginModal({ isOpen: true, usernameInput: '', error: false, errorMessage: '', target: 'ADMIN', selectedRegion: null }); }} />
                      <DashboardCard icon={HelpCircle} title="Quick Tutorial" sub="Guide System" color="text-purple-400" onClick={() => setShowTutorial(true)} />
                      <DashboardCard icon={Settings} title="Settings" sub="Config App" color="text-gray-400" onClick={() => setShowSettingsModal(true)} />
                      <DashboardCard icon={Database} title="Backup Data" sub="Safe Restore" color="text-orange-400" onClick={() => setShowBackupModal(true)} />
                  </div>
                  
                  <ReservationList reservations={reservations} dateRange={dateRange} onDelete={(id) => setReservations(prev => prev.filter(r => r.id !== id))} onEdit={(res) => {setEditingReservation(res); setView('form');}} onStatusChange={handleStatusChange} onTableChange={handleTableChange} onDateChange={(id, date) => setReservations(prev => prev.map(r => r.id === id ? {...r, reservationDate: date} : r))} onEditMenu={handleEditMenu} isDarkMode={true} outletName={auth.outlet} />
               </div>
            )}
            {currentPage === 'WAITING_LIST' && (
              <div className="max-w-6xl mx-auto">
                <WaitingListView 
                  waitingList={waitingList} 
                  reservations={reservations}
                  onAddWaiting={handleAddWaiting} 
                  onSeatWaiting={handleSeatWaiting} 
                  onCancelWaiting={handleCancelWaiting}
                  settings={settings}
                  isDarkMode={true}
                  onBack={() => setCurrentPage('DASHBOARD')}
                />
              </div>
            )}
            {currentPage === 'FLOOR_PLAN' && (
                <div className="max-w-[1600px] mx-auto animate-fade-in">
                    <FloorPlan 
                        reservations={reservations.filter(r => r.reservationDate === dateRange.start)} 
                        onStatusChange={handleStatusChange} 
                        onQuickWalkIn={handleQuickWalkIn} 
                        onTableChange={handleTableChange} 
                        onMergeTable={handleMergeTable} 
                        onEditMenu={handleEditMenu}
                        settings={settings} 
                        isDarkMode={true}
                        onBack={() => setCurrentPage('DASHBOARD')}
                        outletName={auth.outlet}
                    />
                </div>
            )}
            {currentPage === 'BOOK' && <div className="max-w-5xl mx-auto"><DateSummary reservations={reservations} dateRange={dateRange} onEdit={(res) => {setEditingReservation(res); setView('form');}} onTableChange={handleTableChange} onDateChange={(id, reservationDate) => setReservations(prev => prev.map(r => r.id === id ? { ...r, reservationDate } : r))} onToggleMenuStatus={handleToggleMenuStatus} onTogglePayment={handleTogglePayment} onToggleFullPayment={handleToggleFullPayment} onStatusChange={handleStatusChange} onEditMenu={handleEditMenu} settings={settings} isDarkMode={true} outletName={auth.outlet} /></div>}
            {currentPage === 'ADMIN_PANEL' && (
              <AdminDashboard 
                reservations={reservations} 
                waitingList={waitingList} 
                currentUsername={auth.username} 
                currentOutlet={auth.outlet} 
                onBackToApp={() => setCurrentPage('DASHBOARD')} 
                onUpdateTotalBill={handleUpdateTotalBill} 
                isDarkMode={true} 
                users={users}
                onMutateCrew={handleMutateCrew}
                onEODClose={handleCloseDay}
              />
            )}
            {currentPage === 'MENU_CHECKMARK' && <div className="max-w-5xl mx-auto"><MenuCheckmark reservations={reservations} isDarkMode={true} onSave={handleSaveCheckedMenu} onBack={() => { setCurrentPage('DASHBOARD'); setMenuEditPreSelect(''); }} settings={settings} outletName={auth.outlet} initialGuestId={menuEditPreSelect} /></div>}
            {currentPage === 'CHECK_BILL' && <div className="max-w-5xl mx-auto"><CheckBill reservations={reservations} isDarkMode={true} onDone={handleMarkMenuInputted} onBack={() => setCurrentPage('DASHBOARD')} onUpdateTotalBill={handleUpdateTotalBill} settings={settings} outletName={auth.outlet} initialGuestName={billPreSelect?.name} initialDate={billPreSelect?.date} /></div>}
            {currentPage === 'MENU_LIST' && (
              <div className="max-w-6xl mx-auto">
                <MenuList 
                  isDarkMode={true} 
                  settings={settings} 
                  outletName={auth.outlet} 
                  userRole={auth.role}
                  onUpdateSettings={async (updatedSettings) => {
                    setSettings(updatedSettings);
                    if (auth.outlet) {
                      try {
                        const settingsRef = doc(db, `outlets/${auth.outlet}/settings`, 'current');
                        await setDoc(settingsRef, updatedSettings);
                      } catch (err) {
                        console.error("Failed to save menu price overrides to settings:", err);
                      }
                    }
                  }}
                />
              </div>
            )}
            {currentPage === 'ORDER_TALLY' && <div className="max-w-5xl mx-auto"><OrderTallyView reservations={reservations} dateRange={dateRange} settings={settings} isDarkMode={true} onBack={() => setCurrentPage('DASHBOARD')} outletName={auth.outlet} /></div>}
            {currentPage === 'MENU_INPUT_SUMMARY' && <div className="max-w-5xl mx-auto"><MenuInputSummary reservations={reservations} isDarkMode={true} onRemoveStatus={handleRemoveMenuStatus} onGoToBill={handleGoToBill} onEdit={handleEditMenu} onBack={() => setCurrentPage('DASHBOARD')} settings={settings} outletName={auth.outlet} /></div>}
            {currentPage === 'SM_REVENUE' && <SMRevenueView reservations={reservations} isDarkMode={true} onBack={() => setCurrentPage('DASHBOARD')} onUpdateTotalBill={handleUpdateTotalBill} />}
          </>
        )}
      </main>

      {greeting && greeting.isOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 backdrop-blur-xl animate-fade-in p-4">
           <div className="glass-card p-10 rounded-[3rem] w-full max-w-lg border-gold-500/30 text-center shadow-[0_0_100px_rgba(212,175,55,0.2)]">
              <div className="bg-gold-500/10 p-6 rounded-full inline-block mb-6 border border-gold-500/20">
                {greeting.icon}
              </div>
              <h2 className="text-3xl font-serif font-bold text-white tracking-tighter mb-4 leading-tight">
                {greeting.fullGreeting}
              </h2>
              <div className="flex flex-col items-center justify-center gap-4 mb-10">
                <div className="w-10 h-0.5 bg-gold-500/30"></div>
                <div className="relative px-8">
                  <Quote size={32} className="absolute -top-4 -left-2 text-gold-500/20 rotate-180" />
                  <p className="text-xl font-serif italic text-white leading-relaxed tracking-tight">"{greeting.quote}"</p>
                  <Quote size={32} className="absolute -bottom-4 -right-2 text-gold-500/20" />
                </div>
                <div className="w-10 h-0.5 bg-gold-500/30"></div>
              </div>
              <button 
                onClick={() => setGreeting(null)} 
                className="w-full py-4 bg-gold-500 hover:bg-gold-400 text-black font-black uppercase text-xs rounded-2xl transition-all shadow-xl flex items-center justify-center gap-3 active:scale-95"
              >
                <Check size={18} strokeWidth={3} /> Start today's mission
              </button>
           </div>
        </div>
      )}

      {showWalkInModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm p-4 animate-fade-in">
           <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-[2.5rem] shadow-2xl relative"><ReservationForm onSubmit={handleSaveReservation} onCancel={() => { setShowWalkInModal(false); setPreSelectedTable(''); }} isWalkInMode={true} existingReservations={reservations} settings={settings} initialData={preSelectedTable ? { tableNumber: preSelectedTable } as any : null} isDarkMode={true} /></div>
        </div>
      )}
      
      {showChatModal && <ChatModal isOpen={showChatModal} onClose={() => setShowChatModal(false)} auth={auth} isDarkMode={true} />}
      <SettingsModal 
        isOpen={showSettingsModal} 
        onClose={() => setShowSettingsModal(false)} 
        settings={settings} 
        outletName={auth.outlet}
        allowedOutlet={auth.allowedOutlet}
        onSave={async (s, outlet) => {
          const targetOutlet = outlet || auth.outlet;
          if (!targetOutlet) return;

          try {
            const settingsRef = doc(db, `outlets/${targetOutlet}/settings`, 'current');
            await setDoc(settingsRef, s);
            
            // If we saved to the current outlet, update local state
            if (targetOutlet === auth.outlet) {
              setSettings(s);
            }
          } catch (err) {
            handleFirestoreError(err, OperationType.WRITE, `outlets/${targetOutlet}/settings/current`);
          }
        }} 
        isDarkMode={true} 
      />
      <BackupModal 
        isOpen={showBackupModal} 
        onClose={() => setShowBackupModal(false)} 
        currentData={reservations} 
        onRestore={async (d) => {
          if (!auth.outlet) return;
          setReservations(d);
          // Sync to cloud
          const batch = writeBatch(db);
          // This is a bit risky for large datasets, but for local restore it's okay
          // Better: delete all current and set new
          // But Firestore doesn't have a "delete collection" easily
          // For now, just set each
          d.forEach(res => {
            const resRef = doc(db, `outlets/${auth.outlet}/reservations`, res.id);
            batch.set(resRef, res);
          });
          await batch.commit();
        }} 
        isDarkMode={true} 
        socket={socket}
        outlet={auth.outlet}
      />
      <TutorialModal isOpen={showTutorial} onClose={() => setShowTutorial(false)} />

      {/* Floating Live Chat Button */}
      {auth.isLoggedIn && (
        <button
          id="floating-chat-button"
          onClick={() => {
            setShowChatModal(true);
            setUnreadChatCount(0);
            localStorage.setItem('lastChatReadTimestamp', Date.now().toString());
          }}
          className="fixed bottom-6 right-6 md:bottom-8 md:right-8 z-[90] w-14 h-14 bg-gradient-to-tr from-amber-600 via-gold-500 to-amber-500 hover:scale-105 active:scale-95 text-black rounded-full flex items-center justify-center shadow-[0_8px_30px_rgba(212,175,55,0.4)] hover:shadow-[0_12px_40px_rgba(212,175,55,0.6)] border border-gold-400 transition-all duration-300 group"
          title="Inter-Outlet Live Chat"
        >
          <MessageCircle size={26} className="text-black transform transition-transform group-hover:rotate-12 duration-300" />
          {unreadChatCount > 0 && (
            <span className="absolute -top-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-red-600 border-2 border-dark-950 text-[10px] font-black text-white shadow-md animate-bounce">
              {unreadChatCount}
            </span>
          )}
        </button>
      )}
    </div>
  );
};

export default App;
