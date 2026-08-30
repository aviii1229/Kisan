import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  ProcurementCentre,
  DigitalToken,
  MspCatalogItem,
  Announcement,
  AnalyticsData,
  TokenStatus,
  CentreStatus,
  Farmer,
  AppNotification,
  SlotAvailability
} from '../types';
import { playQueueChime, playSuccessSound } from '../utils/sound';
import { INITIAL_CENTRES, INITIAL_TOKENS, MSP_CATALOG, INITIAL_ANNOUNCEMENTS } from '../seedData';
import { logoutFirebaseUser } from '../lib/firebaseAuth';

// Mirrors server/db.js's STANDARD_SLOTS — kept here too so the offline
// fallback path can still render a sensible slot picker without a network call.
export const STANDARD_SLOTS = [
  '08:30 AM - 09:30 AM',
  '09:30 AM - 10:30 AM',
  '10:30 AM - 11:30 AM',
  '11:30 AM - 12:30 PM',
  '02:00 PM - 03:00 PM',
  '03:00 PM - 04:00 PM'
];


interface AppContextType {
  centres: ProcurementCentre[];
  activeToken: DigitalToken | null;
  myActiveTokens: DigitalToken[];
  allTokens: DigitalToken[];
  mspCatalog: MspCatalogItem[];
  announcements: Announcement[];
  analytics: AnalyticsData | null;
  userLocation: { lat: number; lng: number } | null;
  isLocating: boolean;
  userRole: 'farmer' | 'admin';
  setUserRole: (role: 'farmer' | 'admin') => void;
  // Farmer registration & login
  farmer: Farmer | null;
  requestFarmerOtp: (phone: string) => Promise<{ demoOtp: string; isNewFarmer: boolean }>;
  verifyFarmerOtp: (phone: string, otp: string, profile?: Partial<Farmer>) => Promise<Farmer>;
  logoutFarmer: () => void;
  // In-app notification centre (SMS/App notification log)
  notifications: AppNotification[];
  unreadNotificationCount: number;
  fetchNotifications: () => Promise<void>;
  markNotificationRead: (id: string) => Promise<void>;
  markAllNotificationsRead: () => Promise<void>;
  // Officer Portal PIN gate
  isAdminAuthed: boolean;
  adminPinError: string;
  verifyAdminPin: (pin: string) => Promise<boolean>;
  logoutAdmin: () => void;
  selectedCentre: ProcurementCentre | null;
  setSelectedCentre: (c: ProcurementCentre | null) => void;
  bookingCentre: ProcurementCentre | null;
  setBookingCentre: (c: ProcurementCentre | null) => void;
  viewPassToken: DigitalToken | null;
  setViewPassToken: (t: DigitalToken | null) => void;
  activeTab: 'centres' | 'map' | 'prices' | 'queue' | 'analytics' | 'admin';
  setActiveTab: (tab: 'centres' | 'map' | 'prices' | 'queue' | 'analytics' | 'admin') => void;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  selectedCrop: string;
  setSelectedCrop: (c: string) => void;
  selectedDistrict: string;
  setSelectedDistrict: (d: string) => void;
  selectedStatus: string;
  setSelectedStatus: (s: string) => void;
  selectedRadius: string;
  setSelectedRadius: (r: string) => void;
  loading: boolean;
  refreshAll: () => Promise<void>;
  detectUserLocation: () => Promise<void>;
  bookToken: (data: Partial<DigitalToken>) => Promise<DigitalToken>;
  fetchSlotAvailability: (centreId: string, date: string) => Promise<SlotAvailability[]>;
  updateTokenStatus: (tokenNumber: string, updateData: Partial<DigitalToken>) => Promise<DigitalToken>;
  callNextToken: (centreId: string) => Promise<DigitalToken | null>;
  updateCentreStatus: (id: string, status: CentreStatus, statusReason?: string, statusReason_te?: string) => Promise<ProcurementCentre>;
  updateCentreCrop: (centreId: string, cropData: Record<string, unknown>) => Promise<ProcurementCentre>;
  broadcastAnnouncement: (data: Partial<Announcement>) => Promise<Announcement>;
  resetDemoData: () => Promise<void>;
  setActiveToken: (token: DigitalToken | null) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [centres, setCentres] = useState<ProcurementCentre[]>([]);
  const [allTokens, setAllTokens] = useState<DigitalToken[]>([]);
  const [activeToken, setActiveTokenState] = useState<DigitalToken | null>(() => {
    const saved = localStorage.getItem('kisanh_active_token');
    return saved ? JSON.parse(saved) : null;
  });
  const [mspCatalog, setMspCatalog] = useState<MspCatalogItem[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);

  // Default coordinate: Gorakhpur, Uttar Pradesh
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>({
    lat: 26.7606,
    lng: 83.3732
  });
  const [isLocating, setIsLocating] = useState<boolean>(false);
  const [userRole, setUserRole] = useState<'farmer' | 'admin'>('farmer');

  // --- Farmer registration & login ---
  const [farmer, setFarmerState] = useState<Farmer | null>(() => {
    const saved = localStorage.getItem('kisanh_farmer');
    return saved ? JSON.parse(saved) : null;
  });
  const setFarmer = (f: Farmer | null) => {
    setFarmerState(f);
    if (f) {
      localStorage.setItem('kisanh_farmer', JSON.stringify(f));
    } else {
      localStorage.removeItem('kisanh_farmer');
    }
  };

  // --- Notification centre ---
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const unreadNotificationCount = notifications.filter(n => !n.read).length;

  // --- Officer Portal PIN gate ---
  const [isAdminAuthed, setIsAdminAuthed] = useState<boolean>(() => {
    return sessionStorage.getItem('kisanh_admin_pin') !== null;
  });
  const [adminPinError, setAdminPinError] = useState<string>('');

  const adminHeaders = (): Record<string, string> => {
    const pin = sessionStorage.getItem('kisanh_admin_pin') || '';
    return { 'Content-Type': 'application/json', 'x-admin-pin': pin };
  };

  const authHeaders = (): Record<string, string> => {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    const token = localStorage.getItem('kisanh_auth_token');
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    const pin = sessionStorage.getItem('kisanh_admin_pin');
    if (pin) {
      headers['x-admin-pin'] = pin;
    }
    return headers;
  };

  const [selectedCentre, setSelectedCentre] = useState<ProcurementCentre | null>(null);
  const [bookingCentre, setBookingCentre] = useState<ProcurementCentre | null>(null);
  const [viewPassToken, setViewPassToken] = useState<DigitalToken | null>(null);
  const [activeTab, setActiveTab] = useState<'centres' | 'map' | 'prices' | 'queue' | 'analytics' | 'admin'>('centres');

  // Search and filter states
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCrop, setSelectedCrop] = useState<string>('all');
  const [selectedDistrict, setSelectedDistrict] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedRadius, setSelectedRadius] = useState<string>('all');
  const [loading, setLoading] = useState<boolean>(false);

  const registerMyTokenNumber = (tokenNumber: string) => {
    if (!farmer?.phone) return;
    try {
      const key = `kisanh_my_tokens_${farmer.phone}`;
      const myTokenNumbers: string[] = JSON.parse(localStorage.getItem(key) || '[]');
      if (!myTokenNumbers.includes(tokenNumber)) {
        myTokenNumbers.unshift(tokenNumber);
        localStorage.setItem(key, JSON.stringify(myTokenNumbers));
      }
    } catch (e) {}
  };

  const setActiveToken = (token: DigitalToken | null) => {
    setActiveTokenState(token);
    if (farmer?.phone) {
      const key = `kisanh_active_token_${farmer.phone}`;
      if (token) {
        localStorage.setItem(key, JSON.stringify(token));
        registerMyTokenNumber(token.tokenNumber);
      } else {
        localStorage.removeItem(key);
      }
    }
  };

  // Compute list of all active tokens belonging strictly to this logged in farmer
  const myActiveTokens = React.useMemo(() => {
    if (!farmer?.phone) return [];
    const farmerPhone = farmer.phone;
    let myTokenNumbers: string[] = [];
    try {
      myTokenNumbers = JSON.parse(localStorage.getItem(`kisanh_my_tokens_${farmerPhone}`) || '[]');
    } catch (e) {}

    return allTokens.filter(t => {
      if (t.status === 'COMPLETED' || t.status === 'CANCELLED') return false;
      if (t.phone === farmerPhone) return true;
      if (myTokenNumbers.includes(t.tokenNumber)) return true;
      return false;
    });
  }, [allTokens, farmer?.phone]);

  // Fetch Centres
  const fetchCentres = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (searchQuery) params.append('query', searchQuery);
      if (selectedCrop && selectedCrop !== 'all') params.append('cropId', selectedCrop);
      if (selectedDistrict && selectedDistrict !== 'all') params.append('district', selectedDistrict);
      if (selectedStatus && selectedStatus !== 'all') params.append('status', selectedStatus);
      if (selectedRadius && selectedRadius !== 'all') params.append('maxDistance', selectedRadius);
      if (userLocation) {
        params.append('userLat', userLocation.lat.toString());
        params.append('userLng', userLocation.lng.toString());
      }

      const res = await fetch(`/api/centres?${params.toString()}`);
      if (!res.ok) throw new Error('API not available, using client store');
      const json = await res.json();
      if (json.success) {
        setCentres(json.data);
      }
    } catch (e) {
      // Fallback for static Netlify hosting
      let list = [...(INITIAL_CENTRES as unknown as ProcurementCentre[])];
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        list = list.filter(c => c.name.toLowerCase().includes(q) || c.district.toLowerCase().includes(q));
      }
      if (selectedCrop && selectedCrop !== 'all') {
        list = list.filter(c => c.acceptedCrops.some((ac: any) => ac.cropId === selectedCrop));
      }
      if (selectedDistrict && selectedDistrict !== 'all') {
        list = list.filter(c => c.district.toLowerCase() === selectedDistrict.toLowerCase());
      }
      if (selectedStatus && selectedStatus !== 'all') {
        list = list.filter(c => c.status === selectedStatus);
      }
      setCentres(list);
    }
  }, [searchQuery, selectedCrop, selectedDistrict, selectedStatus, selectedRadius, userLocation]);

  // Fetch Tokens
  const fetchTokens = useCallback(async () => {
    let tokensList: DigitalToken[] = [];
    const currentPhone = farmer?.phone;
    const adminPin = sessionStorage.getItem('kisanh_admin_pin');
    const authToken = localStorage.getItem('kisanh_auth_token');

    // Without logged in farmer/token and without officer admin PIN, keep tokens empty
    if (!currentPhone && !adminPin && !authToken) {
      setAllTokens([]);
      setActiveTokenState(null);
      return;
    }

    try {
      const url = currentPhone ? `/api/tokens?phone=${encodeURIComponent(currentPhone)}` : '/api/tokens';
      const res = await fetch(url, { headers: authHeaders() });

      if (res.status === 401 && !adminPin) {
        // Token expired or unauthenticated
        setAllTokens([]);
        setActiveTokenState(null);
        return;
      }

      if (res.ok) {
        const json = await res.json();
        if (json.success && Array.isArray(json.data)) {
          tokensList = json.data;
        }
      }
    } catch (e) {
      // offline fallback
    }

    setAllTokens(tokensList);

    if (currentPhone) {
      const savedActiveRaw = localStorage.getItem(`kisanh_active_token_${currentPhone}`);
      const savedActive: DigitalToken | null = savedActiveRaw ? JSON.parse(savedActiveRaw) : null;
      let matched = tokensList.find(t => t.phone === currentPhone && !['COMPLETED', 'CANCELLED'].includes(t.status));
      if (!matched && savedActive && savedActive.phone === currentPhone) {
        matched = savedActive;
      }
      setActiveTokenState(matched || null);
    } else {
      setActiveTokenState(null);
    }
  }, [farmer?.phone]);

  // Fetch Announcements
  const fetchAnnouncements = useCallback(async () => {
    try {
      const res = await fetch('/api/announcements');
      if (!res.ok) throw new Error('API not available');
      const json = await res.json();
      if (json.success) {
        setAnnouncements(json.data);
      }
    } catch (e) {
      setAnnouncements(INITIAL_ANNOUNCEMENTS as unknown as Announcement[]);
    }
  }, []);

  // Fetch per-slot capacity/availability for a centre on a given date, used by
  // the booking modal so farmers can see (and are blocked from) full slots
  // instead of finding out only after the queue backs up on-site.
  const fetchSlotAvailability = useCallback(async (centreId: string, date: string): Promise<SlotAvailability[]> => {
    try {
      const res = await fetch(`/api/centres/${centreId}/slots?date=${encodeURIComponent(date)}`);
      if (!res.ok) throw new Error('API not available');
      const json = await res.json();
      if (json.success) return json.data as SlotAvailability[];
      return [];
    } catch (e) {
      // Offline fallback: assume every standard slot has room so the form
      // still works without a backend; the server re-validates on submit.
      return STANDARD_SLOTS.map(slotTime => ({ slotTime, capacity: 15, booked: 0, remaining: 15, isFull: false }));
    }
  }, []);

  // Fetch MSP Catalog
  const fetchPrices = useCallback(async () => {
    try {
      const res = await fetch('/api/prices');
      if (!res.ok) throw new Error('API not available');
      const json = await res.json();
      if (json.success) {
        setMspCatalog(json.data);
      }
    } catch (e) {
      setMspCatalog(MSP_CATALOG as unknown as MspCatalogItem[]);
    }
  }, []);

  // Fetch Analytics
  const fetchAnalytics = useCallback(async () => {
    try {
      const res = await fetch('/api/analytics');
      if (!res.ok) throw new Error('API not available');
      const json = await res.json();
      if (json.success) {
        setAnalytics(json.data);
      }
    } catch (e) {
      setAnalytics({
        totalCentres: 7,
        openCentresCount: 5,
        totalProcuredQuintals: 15400,
        totalDailyQuota: 22000,
        procurementPercentage: 70,
        totalActiveTokens: 38,
        cropStats: [
          { name: "Paddy (Grade A / Sona Masoori)", name_te: "వరి (గ్రేడ్-ఎ)", totalProcured: 6800 },
          { name: "Wheat (Sharbati)", name_te: "గోధుమలు", totalProcured: 3950 },
          { name: "Bengal Gram (Chana)", name_te: "శనగలు", totalProcured: 2800 },
          { name: "Maize (Corn)", name_te: "మొక్కజొన్న", totalProcured: 1850 }
        ]
      });
    }
  }, []);

  const refreshAll = useCallback(async (showLoading = false) => {
    if (showLoading) setLoading(true);
    await Promise.all([
      fetchCentres(),
      fetchTokens(),
      fetchAnnouncements(),
      fetchPrices(),
      fetchAnalytics()
    ]);
    if (showLoading) setLoading(false);
  }, [fetchCentres, fetchTokens, fetchAnnouncements, fetchPrices, fetchAnalytics]);

  // Initial load once on mount
  useEffect(() => {
    refreshAll(true);
  }, []);

  // Update centres when filters change (without setting global loading state)
  useEffect(() => {
    fetchCentres();
  }, [fetchCentres]);

  // Periodic background refresh for live queue
  useEffect(() => {
    const interval = setInterval(() => {
      fetchCentres();
      fetchTokens();
    }, 8000);
    return () => clearInterval(interval);
  }, [fetchCentres, fetchTokens]);

  // Detect GPS User Location
  const detectUserLocation = async (): Promise<void> => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser.');
      return;
    }
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserLocation({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude
        });
        setIsLocating(false);
      },
      (err) => {
        console.warn('Geolocation failed or denied, keeping default Gorakhpur region:', err.message);
        setIsLocating(false);
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  // Book Token (Requires Farmer Authentication)
  const bookToken = async (data: Partial<DigitalToken>): Promise<DigitalToken> => {
    if (!farmer) {
      throw new Error('Authentication Required: You must be logged in with your phone number to book a procurement slot pass.');
    }
    let response: Response;
    try {
      response = await fetch('/api/tokens', {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({
          ...data,
          phone: farmer.phone,
          farmerName: data.farmerName || farmer.name
        })
      });
    } catch (networkErr) {
      // The fetch itself failed (server unreachable / offline) — fall through
      // to local fallback.
      response = null as unknown as Response;
    }

    if (response) {
      // We got a real response from the API. If it's a rejection (slot full,
      // duplicate booking, validation error, etc.) that is a genuine answer
      // from the server and must be shown to the farmer — NOT silently
      // replaced with a fake local booking.
      let json: any = null;
      try { json = await response.json(); } catch { /* non-JSON body */ }

      if (response.ok && json && json.success) {
        const token = json.data as DigitalToken;
        setActiveToken(token);
        playSuccessSound();
        await refreshAll();
        return token;
      }

      if (json && json.message) {
        throw new Error(json.message);
      }
      if (!response.ok) {
        throw new Error(`Booking failed (server responded with status ${response.status}).`);
      }
    }

    // Client-side fallback — only reached when the server was truly unreachable.
    const tokenSeq = Math.floor(40 + Math.random() * 50);
    const newToken: DigitalToken = {
      tokenNumber: `KST-0${tokenSeq}`,
      centreId: data.centreId || 'PPC-TS-01',
      centreName: data.centreName || 'Gorakhpur Krishi Utpadan Mandi Samiti (PPC-01)',
      farmerName: data.farmerName || 'Farmer',
      farmerName_te: data.farmerName_te || data.farmerName,
      phone: data.phone || '9876543210',
      aadhaarLast4: data.aadhaarLast4 || '3210',
      passbookNo: data.passbookNo || 'TS-WGL-2026-8812',
      cropId: data.cropId || 'paddy-grade-a',
      cropName: data.cropName || 'Paddy (Grade A / Sona Masoori)',
      quantityQuintals: data.quantityQuintals || 50,
      vehicleType: data.vehicleType || 'Tractor-Trolley (ట్రాక్టర్)',
      vehicleNumber: data.vehicleNumber || 'UP 53 AA 5555',
      slotDate: data.slotDate || new Date().toISOString().split('T')[0],
      slotTime: data.slotTime || '11:00 AM - 12:00 PM',
      status: 'BOOKED',
      issuedAt: new Date().toISOString()
    };
    const existing = JSON.parse(localStorage.getItem('kisanh_tokens_list') || '[]');
    existing.unshift(newToken);
    localStorage.setItem('kisanh_tokens_list', JSON.stringify(existing));
    setActiveToken(newToken);
    playSuccessSound();
    setAllTokens(existing);
    return newToken;
  };

  // Update Token Status
  const updateTokenStatus = async (tokenNumber: string, updateData: Partial<DigitalToken>): Promise<DigitalToken> => {
    try {
      const res = await fetch(`/api/tokens/${tokenNumber}/status`, {
        method: 'PATCH',
        headers: adminHeaders(),
        body: JSON.stringify(updateData)
      });
      if (!res.ok) throw new Error('API offline');
      const json = await res.json();
      if (!json.success) throw new Error(json.message);
      await refreshAll();
      return json.data;
    } catch (err) {
      if (activeToken && activeToken.tokenNumber === tokenNumber) {
        const updated = { ...activeToken, ...updateData };
        setActiveToken(updated);
      }
      setAllTokens(prev => prev.map(t => t.tokenNumber === tokenNumber ? { ...t, ...updateData } : t));
      return { ...(activeToken || {}), ...updateData } as DigitalToken;
    }
  };

  // Admin: Call Next Token
  const callNextToken = async (centreId: string): Promise<DigitalToken | null> => {
    try {
      const res = await fetch(`/api/queue/${centreId}/call-next`, {
        method: 'POST',
        headers: adminHeaders()
      });
      if (!res.ok) throw new Error('API offline');
      const json = await res.json();
      if (!json.success) throw new Error(json.message);
      playQueueChime();
      await refreshAll();
      return json.data.token;
    } catch (err) {
      playQueueChime();
      const waiting = allTokens.find(t => t.centreId === centreId && ['BOOKED', 'CHECKED_IN'].includes(t.status));
      if (waiting) {
        updateTokenStatus(waiting.tokenNumber, { status: 'TESTING' });
        setCentres(prev => prev.map(c => c.id === centreId ? {
          ...c,
          queue: { ...c.queue, currentlyServingToken: waiting.tokenNumber }
        } : c));
        return waiting;
      }
      return null;
    }
  };

  // Admin: Update Centre Status
  const updateCentreStatus = async (
    id: string,
    status: CentreStatus,
    statusReason?: string,
    statusReason_te?: string
  ): Promise<ProcurementCentre> => {
    try {
      const res = await fetch(`/api/centres/${id}/status`, {
        method: 'PATCH',
        headers: adminHeaders(),
        body: JSON.stringify({ status, statusReason, statusReason_te })
      });
      if (!res.ok) throw new Error('API offline');
      const json = await res.json();
      if (!json.success) throw new Error(json.message);
      await refreshAll();
      return json.data;
    } catch (err) {
      setCentres(prev => prev.map(c => c.id === id ? {
        ...c,
        status,
        statusReason: statusReason || c.statusReason,
        statusReason_te: statusReason_te || c.statusReason_te
      } : c));
      return centres.find(c => c.id === id)!;
    }
  };

  // Admin: Update Crop Configuration
  const updateCentreCrop = async (centreId: string, cropData: Record<string, unknown>): Promise<ProcurementCentre> => {
    const res = await fetch(`/api/centres/${centreId}/crops`, {
      method: 'POST',
      headers: adminHeaders(),
      body: JSON.stringify(cropData)
    });
    const json = await res.json();
    if (!json.success) {
      throw new Error(json.message || 'Failed to update crop');
    }
    await refreshAll();
    return json.data;
  };

  // Broadcast Alert
  const broadcastAnnouncement = async (data: Partial<Announcement>): Promise<Announcement> => {
    const res = await fetch('/api/announcements', {
      method: 'POST',
      headers: adminHeaders(),
      body: JSON.stringify(data)
    });
    const json = await res.json();
    if (!json.success) {
      throw new Error(json.message || 'Failed to broadcast announcement');
    }
    await refreshAll();
    return json.data;
  };

  // Reset Demo Data
  const resetDemoData = async (): Promise<void> => {
    await fetch('/api/reset', { method: 'POST', headers: adminHeaders() });
    await refreshAll();
  };

  // --- Farmer OTP registration/login ---
  const requestFarmerOtp = async (phone: string): Promise<{ demoOtp: string; isNewFarmer: boolean }> => {
    const res = await fetch('/api/farmers/otp/request', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone })
    });
    const json = await res.json();
    if (!json.success) throw new Error(json.message || 'Could not request OTP');
    return { demoOtp: json.demoOtp, isNewFarmer: json.isNewFarmer };
  };

  const verifyFarmerOtp = async (phone: string, otp: string, profile?: Partial<Farmer>): Promise<Farmer> => {
    const res = await fetch('/api/farmers/otp/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone, otp, ...profile })
    });
    const json = await res.json();
    if (!json.success) throw new Error(json.message || 'OTP verification failed');

    if (json.token) {
      localStorage.setItem('kisanh_auth_token', json.token);
    }

    // Wipe previous session's active tokens and token numbers
    localStorage.removeItem('kisanh_active_token');
    localStorage.removeItem('kisanh_my_token_numbers');

    setFarmer(json.data);

    // Auto-select active token belonging to the new logged in farmer if exists
    const newFarmerPhone = json.data.phone;
    const newFarmerToken = allTokens.find(t => t.phone === newFarmerPhone && !['COMPLETED', 'CANCELLED'].includes(t.status));
    setActiveToken(newFarmerToken || null);

    await fetchNotifications(json.data.phone);
    return json.data;
  };

  const logoutFarmer = async () => {
    try {
      await fetch('/api/farmers/logout', {
        method: 'POST',
        headers: authHeaders()
      });
    } catch (e) {}

    setFarmer(null);
    setActiveToken(null);
    setViewPassToken(null);
    setAllTokens([]);
    setNotifications([]);
    localStorage.removeItem('kisanh_farmer');
    localStorage.removeItem('kisanh_auth_token');
    try {
      await logoutFirebaseUser();
    } catch (e) {
      // ignore
    }
  };

  // --- Notification centre ---
  const fetchNotifications = async (phoneOverride?: string): Promise<void> => {
    const phone = phoneOverride || farmer?.phone;
    if (!phone) return;
    try {
      const res = await fetch(`/api/notifications`, { headers: authHeaders() });
      if (!res.ok) return;
      const json = await res.json();
      if (json.success) setNotifications(json.data);
    } catch (e) {
      // Silently ignore - notification centre is a non-critical enhancement
    }
  };

  const markNotificationRead = async (id: string): Promise<void> => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    try {
      await fetch(`/api/notifications/${id}/read`, { method: 'PATCH', headers: authHeaders() });
    } catch (e) {
      // best-effort
    }
  };

  const markAllNotificationsRead = async (): Promise<void> => {
    if (!farmer) return;
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    try {
      await fetch('/api/notifications/read-all', {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({ phone: farmer.phone })
      });
    } catch (e) {
      // best-effort
    }
  };

  // --- Officer Portal PIN gate ---
  const verifyAdminPin = async (pin: string): Promise<boolean> => {
    try {
      // The PIN itself is validated lazily by the first real admin request; we do a
      // lightweight check here against the reset endpoint's auth guard so the officer
      // gets instant feedback without side effects on failure.
      const res = await fetch('/api/queue/__pin_check__/call-next', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-admin-pin': pin }
      });
      if (res.status === 401) {
        setAdminPinError('Incorrect PIN. Please try again.');
        return false;
      }
      sessionStorage.setItem('kisanh_admin_pin', pin);
      setIsAdminAuthed(true);
      setAdminPinError('');
      return true;
    } catch (e) {
      setAdminPinError('Could not reach the server to verify the PIN.');
      return false;
    }
  };

  const logoutAdmin = () => {
    sessionStorage.removeItem('kisanh_admin_pin');
    setIsAdminAuthed(false);
  };

  // Poll notifications for a logged-in farmer alongside the other live data
  useEffect(() => {
    if (!farmer) return;
    fetchNotifications(farmer.phone);
    const interval = setInterval(() => fetchNotifications(farmer.phone), 8000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [farmer?.phone]);

  return (
    <AppContext.Provider
      value={{
        centres,
        activeToken,
        myActiveTokens,
        allTokens,
        mspCatalog,
        announcements,
        analytics,
        userLocation,
        isLocating,
        userRole,
        setUserRole,
        farmer,
        requestFarmerOtp,
        verifyFarmerOtp,
        logoutFarmer,
        notifications,
        unreadNotificationCount,
        fetchNotifications: () => fetchNotifications(),
        markNotificationRead,
        markAllNotificationsRead,
        isAdminAuthed,
        adminPinError,
        verifyAdminPin,
        logoutAdmin,
        selectedCentre,
        setSelectedCentre,
        bookingCentre,
        setBookingCentre,
        viewPassToken,
        setViewPassToken,
        activeTab,
        setActiveTab,
        searchQuery,
        setSearchQuery,
        selectedCrop,
        setSelectedCrop,
        selectedDistrict,
        setSelectedDistrict,
        selectedStatus,
        setSelectedStatus,
        selectedRadius,
        setSelectedRadius,
        loading,
        refreshAll,
        detectUserLocation,
        bookToken,
        fetchSlotAvailability,
        updateTokenStatus,
        callNextToken,
        updateCentreStatus,
        updateCentreCrop,
        broadcastAnnouncement,
        resetDemoData,
        setActiveToken
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
