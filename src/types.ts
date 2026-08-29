export type CentreStatus = 'open' | 'closed' | 'break' | 'quota_full';

export type TokenStatus = 'BOOKED' | 'CHECKED_IN' | 'TESTING' | 'WEIGHING' | 'PAID' | 'COMPLETED' | 'CANCELLED';

export interface Timings {
  open: string;
  close: string;
  lunchBreak: string;
  workingDays: string;
}

export interface AcceptedCrop {
  cropId: string;
  name: string;
  name_te?: string;
  name_hi?: string;
  msp: number;
  bonus: number;
  dailyQuotaQuintals: number;
  procuredTodayQuintals: number;
  maxMoisture: number;
  status: 'accepting' | 'full' | 'paused';
}

export interface QueueMetrics {
  totalTokensIssuedToday: number;
  currentlyServingToken: string | null;
  activeQueueCount: number;
  avgMinutesPerToken: number;
  estimatedWaitTimeMinutes: number;
}

export interface Facilities {
  coveredYard: boolean;
  electronicWeighbridge: boolean;
  moistureTestingLab: boolean;
  drinkingWater: boolean;
  canteen: boolean;
  restingShed: boolean;
  gunnyBagsStock: number;
  storageCapacityQuintals: number;
  occupiedCapacityQuintals: number;
}

export interface ContactInfo {
  officerName: string;
  phone: string;
  helpdesk: string;
}

export interface ProcurementCentre {
  id: string;
  name: string;
  name_te?: string;
  name_hi?: string;
  type: string;
  type_te?: string;
  type_hi?: string;
  district: string;
  mandal: string;
  state: string;
  address: string;
  lat: number;
  lng: number;
  status: CentreStatus;
  statusReason: string;
  statusReason_te?: string;
  statusReason_hi?: string;
  timings: Timings;
  acceptedCrops: AcceptedCrop[];
  queue: QueueMetrics;
  facilities: Facilities;
  contact: ContactInfo;
  rating: number;
  reviewsCount: number;
  distanceKm?: number;
}

export interface DigitalToken {
  tokenNumber: string;
  centreId: string;
  centreName: string;
  farmerName: string;
  farmerName_te?: string;
  phone: string;
  aadhaarLast4: string;
  passbookNo: string;
  cropId: string;
  cropName: string;
  quantityQuintals: number;
  vehicleType: string;
  vehicleNumber: string;
  slotDate: string;
  slotTime: string;
  status: TokenStatus;
  moistureMeasured?: number | null;
  gradeAssigned?: string | null;
  totalWeightQuintals?: number | null;
  netPayableAmount?: number | null;
  issuedAt: string;
  completedAt?: string;
  updatedAt?: string;
}

export interface MspCatalogItem {
  id: string;
  name: string;
  name_te?: string;
  name_hi?: string;
  msp: number;
  marketAvg: number;
  unit: string;
  category: string;
  maxMoisture: number;
  season: string;
  priceTrend: string;
  icon: string;
}

export interface Announcement {
  id: string;
  centreId: string;
  centreName: string;
  title: string;
  title_te?: string;
  title_hi?: string;
  message: string;
  message_te?: string;
  message_hi?: string;
  severity: 'info' | 'warning' | 'success' | 'alert';
  timestamp: string;
  active: boolean;
}

export interface AnalyticsData {
  totalCentres: number;
  openCentresCount: number;
  totalProcuredQuintals: number;
  totalDailyQuota: number;
  procurementPercentage: number;
  totalActiveTokens: number;
  cropStats: {
    name: string;
    name_te?: string;
    name_hi?: string;
    totalProcured: number;
  }[];
}

export interface Farmer {
  id: string;
  name: string;
  phone: string;
  village?: string;
  district?: string;
  preferredLanguage?: 'en' | 'te' | 'hi';
  createdAt: string;
}

export interface AppNotification {
  id: string;
  phone: string;
  title: string;
  title_te?: string;
  title_hi?: string;
  message: string;
  message_te?: string;
  message_hi?: string;
  type: 'booking' | 'queue' | 'alert' | 'payment';
  read: boolean;
  timestamp: string;
}

export interface SlotAvailability {
  slotTime: string;
  capacity: number;
  booked: number;
  remaining: number;
  isFull: boolean;
}
