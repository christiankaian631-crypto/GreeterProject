
export enum UserRole {
  MANAGER = 'Restaurant Manager',
  ASST_MANAGER = 'Assistant Manager',
  SUPERVISOR = 'Supervisor',
  CAPTAIN = 'Restaurant Captain',
  GREETER = 'Greeter'
}

export interface StaffUser {
  name: string;
  role: UserRole;
  title?: string;
  allowedOutlet: string;
}

export const AUTHORIZED_PIC: StaffUser[] = [];

export const OUTLETS_JAKARTA = [
  "SH THE BARN",
  "SH LB BULUS",
  "SH KEMANG",
  "SH CIPETE",
  "SH ALSUT",
  "SH BINTARO",
  "SH SMB SUMMARECON"
];

export const OUTLETS_BANDUNG = [
  "SH DAGO",
  "SH CIWALK",
  "SH MIM",
  "SH FCL",
  "SH CIMANUK",
  "SH PASKAL",
  "SH PVJ",
  "SH BUBAT",
  "SH MIKO",
  "SH JAWA"
];

export const ALL_OUTLETS = [...OUTLETS_JAKARTA, ...OUTLETS_BANDUNG];

export interface AuthState {
  isLoggedIn: boolean;
  role: UserRole | null;
  username: string;
  title?: string;
  outlet?: string;
  allowedOutlet?: string;
}

export enum LocationPreference {
  NON_SMOKING = 'Non-Smoking',
  SMOKING = 'Smoking',
  VIP = 'VIP Room',
  OUTDOOR = 'Outdoor'
}

export enum GuestSegment {
  FAMILY = 'Family',
  COUPLE = 'Couple',
  BUSINESS = 'Business',
  FRIENDS = 'Friends'
}

export enum Shift {
  LUNCH = 'LUNCH',
  IFTAR = 'IFTAR',
  DINNER = 'DINNER'
}

export enum MenuOrderType {
  PRE_ORDER = 'Menu di Awal',
  IFTAR_MENU = 'Buka Puasa',
  ON_THE_SPOT = 'On The Spot'
}

export enum ReservationStatus {
  CONFIRMED = 'Confirmed',
  CHECKED_IN = 'Checked In', 
  COMPLETED = 'Completed',   
  CANCELLED = 'Cancelled'
}

export enum WaitingStatus {
  WAITING = 'Waiting',
  SEATED = 'Seated',
  CANCELLED = 'Cancelled'
}

export interface WaitingListEntry {
  id: string;
  guestName: string;
  guestCount: number;
  phoneNumber?: string;
  preferredTable?: string;
  joinedAt: number;
  seatedAt?: number; 
  status: WaitingStatus;
  reservationDate: string;
}

export type PaymentMethod = string; // Changed from enum to string to support specific bank methods

export interface MenuItem {
  name: string;
  category: string;
  price: number;
}

export interface Reservation {
  id: string;
  reservationDate: string; 
  guestName: string;
  guestCount: number;
  arrivalTime: string; 
  shift: Shift;
  locationPreference: LocationPreference;
  tableNumber?: string; 
  mergedTables?: string[]; 
  phoneNumber: string;
  otherRequirements: string;
  companyOrPersonalName: string;
  hasDownPayment: boolean;
  isFullPayment?: boolean; 
  downPaymentAmount: number; 
  totalBillAmount?: number;
  paymentMethod?: PaymentMethod;
  paymentBank?: string; // e.g., BCA, BRI, MANDIRI
  paymentSubMethod?: string; // e.g., QRIS, DEBIT, CREDIT
  status: ReservationStatus;
  cancellationReason?: string;
  isWalkIn?: boolean; 
  segmentation?: GuestSegment;
  menuOrderType?: MenuOrderType;
  createdAt: number;
  hasInputtedMenu?: boolean;
  orderedMenuItems?: string[]; 
  menuNotes?: string;
  picIncharge: string;
  isHarrySalesManager?: boolean;
  isNurulSalesManager?: boolean;
  waitingListRefId?: string;
  discountPercent?: number;
  discountAmount?: number;
  fixedDeduction?: number;
  checkedInAt?: number;
  completedAt?: number;
}

export interface DailyStats {
  totalReservations: number;
  totalGuests: number;
  smokingCount: number;
  nonSmokingCount: number;
  totalDeposit: number; 
  activeTables: number; 
  walkInCount: number; 
}

export interface Zone {
  id: string;
  name: string;
  description: string;
  tableStart: number;
  tableEnd: number;
}

export interface CondimentGroup {
  id: string;
  name: string;
  options: string[];
}

export interface CategoryModifierMapping {
  categoryName: string;
  condimentGroupIds: string[];
}

export interface ThemeSettings {
  fontColor: string;
  backgroundColor: string;
  surfaceColor: string;
  primaryColor: string;
  tableIdleColor: string;
  tableActiveColor: string;
  tableUpcomingColor: string;
  tableCompletedColor: string;
  successColor: string;
  dangerColor: string;
}

export interface AppSettings {
  totalTables: number;
  zones: Zone[];
  condimentGroups: CondimentGroup[];
  categoryMappings: CategoryModifierMapping[];
  customMenu: MenuItem[];
  soldOutItems: string[];
  theme: ThemeSettings;
  menuPriceOverrides?: Record<string, number>;
}

export interface Backup {
  id: string;
  timestamp: number;
  label: string;
  totalReservations: number;
  data: Reservation[];
  waitingList?: WaitingListEntry[];
}

export interface ChatMessage {
  id: string;
  senderName: string;
  senderRole: string;
  text: string;
  timestamp: number;
  outletId: string;
}
