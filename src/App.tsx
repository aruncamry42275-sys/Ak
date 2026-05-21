/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, ReactNode } from 'react';
import { 
  User, 
  Car, 
  Fuel, 
  Milestone, 
  Settings, 
  Nfc, 
  Plus, 
  UserPlus, 
  MapPin, 
  FileText, 
  Download,
  ChevronLeft,
  Wrench,
  Shield,
  Lock,
  LogOut,
  Edit,
  Trash2,
  Save,
  RefreshCw,
  UserCog,
  HardDrive,
  Bell,
  AlertTriangle,
  Clock,
  Calendar,
  Printer,
  ArrowUpRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

type View = 'login' | 'role-select' | 'dashboard' | 'fleet-overview' | 'vehicle' | 'fuel' | 'driver-details' | 'master-control';
type UserRole = 'admin' | 'driver';

// --- MASTER NO-CODE CONSOLE CONFIG HELPERS ---
export function getNoCodeBudgetLimit(): number {
  const saved = localStorage.getItem('no_code_monthly_budget');
  return saved ? parseFloat(saved) : 80;
}

export function getNoCodeServiceInterval(): number {
  const saved = localStorage.getItem('no_code_service_interval');
  return saved ? parseInt(saved, 10) : 10000;
}

export function getNoCodeServiceCategories(): string[] {
  const saved = localStorage.getItem('no_code_service_categories');
  return saved ? JSON.parse(saved) : [
    "General Service (ஜெனரல் சர்வீஸ்)",
    "Oil Service (ஆயில் சர்வீஸ்)",
    "Tyre Changing (டயர் சேஞ்சிங்)",
    "Glass Changing (கிளாஸ் சேஞ்சிங்)",
    "Bulb Changing (பல்ப் சேஞ்சிங்)",
    "Electrical Work (எலக்ட்ரிக்கல் ஒர்க்)",
    "Mechanical Work (மெக்கானிக்கல் ஒர்க்)",
    "Brake Pad Replacement (பிரேக் பேட் ரீபிளேஸ்மென்ட்)"
  ];
}

export function isSectionVisible(id: string): boolean {
  const saved = localStorage.getItem('no_code_hidden_sections');
  if (!saved) return true;
  const hidden = JSON.parse(saved);
  return hidden[id] !== true;
}

export function EditableText({
  id,
  defaultText,
  className = "",
}: {
  id: string,
  defaultText: string,
  className?: string,
}) {
  const [isEditor, setIsEditor] = useState(() => localStorage.getItem('no_code_ui_editor_active') === 'true');
  const [customText, setCustomText] = useState(() => {
    const customStrSaved = localStorage.getItem('no_code_custom_strings');
    if (!customStrSaved) return defaultText;
    const customStrings = JSON.parse(customStrSaved);
    return customStrings[id] !== undefined ? customStrings[id] : defaultText;
  });

  useEffect(() => {
    const handleStorageChange = () => {
      setIsEditor(localStorage.getItem('no_code_ui_editor_active') === 'true');
      const customStrSaved = localStorage.getItem('no_code_custom_strings');
      if (customStrSaved) {
        const customStrings = JSON.parse(customStrSaved);
        if (customStrings[id] !== undefined) {
          setCustomText(customStrings[id]);
          return;
        }
      }
      setCustomText(defaultText);
    };

    window.addEventListener('no-code-config-updated', handleStorageChange);
    window.addEventListener('storage', handleStorageChange);
    
    // Poll to keep in sync during active editing
    const interval = setInterval(handleStorageChange, 500);

    return () => {
      window.removeEventListener('no-code-config-updated', handleStorageChange);
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(interval);
    };
  }, [id, defaultText]);

  const handleEditClick = (e: React.MouseEvent) => {
    if (!isEditor) return;
    e.stopPropagation();
    e.preventDefault();
    
    const event = new CustomEvent('open-no-code-editor', {
      detail: { id, originalText: defaultText, currentText: customText }
    });
    window.dispatchEvent(event);
  };

  if (isEditor) {
    return (
      <span 
        onClick={handleEditClick}
        className={`inline-block border-2 border-dashed border-rose-500 rounded px-1.5 py-0.5 cursor-pointer bg-rose-500/5 hover:bg-rose-500/20 transition-all ${className}`}
        title="Click to rename using Master UI Editor"
      >
        {customText}
      </span>
    );
  }

  return <span className={className}>{customText}</span>;
}

interface Company {
  id: string;
  name: string;
  tagline: string;
  logoUrl: string;
  adminEmail: string;
}

interface DailyTrip {
  startKm: number | null;
  currentKm: number | null;
  endKm: number | null;
  active: boolean;
}

interface TripHistory {
  date: string;
  startKm: number;
  endKm: number;
  distance: number;
  companyDeleted?: boolean;
  companyPermanentDelete?: boolean;
  masterArchiveDate?: string;
  deletedAt?: string;
  deletedBy?: string;
}

interface Location {
  lat: number;
  lng: number;
}

interface DutyLog {
  id: string;
  date: string;
  inTime: string;
  outTime: string | null;
  totalHours: number;
  regularHours: number;
  otHours: number;
  inLocation?: Location;
  outLocation?: Location;
  companyDeleted?: boolean;
  companyPermanentDelete?: boolean;
  masterArchiveDate?: string;
  deletedAt?: string;
  deletedBy?: string;
}

interface FuelEntry {
  id: string;
  date: string;
  prevOdo: number;
  currOdo: number;
  distance: number;
  amount: number;
  liters?: number;
  efficiency: number; // KM/KWD
  companyDeleted?: boolean;
  companyPermanentDelete?: boolean;
  masterArchiveDate?: string;
  deletedAt?: string;
  deletedBy?: string;
}

interface ServiceRecord {
  id: string;
  date: string;
  km: number;
  cost: number;
  type: string;
  companyDeleted?: boolean;
  companyPermanentDelete?: boolean;
  masterArchiveDate?: string;
  deletedAt?: string;
  deletedBy?: string;
}

interface MaintenanceInfo {
  lastServiceDate: string | null;
  lastServiceKm: number | null;
  nextServiceKm: number | null;
  nextServiceDate: string | null;
  serviceHistory: ServiceRecord[];
}

interface DriverStat {
  id: string;
  name: string;
  email: string;
  vehicle: string;
  role: UserRole;
  odometer: number;
  fuelBalance: number;
  status: 'active' | 'warning' | 'error';
  dailyTrip: DailyTrip;
  trips: TripHistory[];
  dutyLogs: DutyLog[];
  fuelEntries: FuelEntry[];
  maintenance: MaintenanceInfo;
  nfcId: string;
  companyId: string;
  vehiclePlate?: string;
  fileNumber?: string;
  password?: string;
  currentSession: {
    active: boolean;
    startId: string | null;
    startTime: string | null;
    startLocation?: Location;
  };
  companyDeleted?: boolean;
  companyPermanentDelete?: boolean;
  masterArchiveDate?: string;
  deletedAt?: string;
  deletedBy?: string;
}

export function getVehiclePlate(driver: DriverStat | null | undefined): string {
  if (!driver) return 'N/A';
  if (driver.vehiclePlate) return driver.vehiclePlate;
  const hash = driver.id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const num = (hash % 90000) + 10000;
  return `KW-${num}`;
}

export function globalDownloadBlob(content: string, filename: string, contentType: string) {
  const blob = new Blob([content], { type: `${contentType};charset=utf-8;` });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", filename);
  link.style.visibility = "hidden";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export function globalPrintPDF(title: string, htmlBody: string) {
  const iframe = document.createElement('iframe');
  iframe.style.position = 'fixed';
  iframe.style.right = '0';
  iframe.style.bottom = '0';
  iframe.style.width = '0';
  iframe.style.height = '0';
  iframe.style.border = '0';
  document.body.appendChild(iframe);
  
  const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
  if (iframeDoc) {
    iframeDoc.open();
    iframeDoc.write(`
      <html>
      <head>
        <title>\${title}</title>
        <style>
          body { font-family: 'Segoe UI', Arial, sans-serif; color: #1f2937; padding: 40px; margin: 0; background-color: #ffffff; }
          .header-table { width: 100%; margin-bottom: 25px; border-bottom: 3px solid #111827; padding-bottom: 15px; }
          .header-title { font-size: 26px; font-weight: 900; letter-spacing: -0.03em; text-transform: uppercase; color: #111827; }
          .header-meta { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.15em; color: #4b5563; margin-top: 4px; }
          .meta-grid { display: grid; grid-template-cols: repeat(2, 1fr); gap: 15px; margin-bottom: 30px; background-color: #f9fafb; padding: 15px; border-radius: 12px; border: 1px solid #f3f4f6; }
          .meta-item { border-left: 2px solid #e5e7eb; padding-left: 10px; }
          .meta-label { font-size: 9px; font-weight: 800; text-transform: uppercase; color: #9ca3af; letter-spacing: 0.05em; }
          .meta-val { font-size: 13px; font-weight: 800; color: #111827; margin-top: 2px; }
          .data-table { width: 100%; border-collapse: collapse; margin-top: 15px; }
          .data-table th { background-color: #f9fafb; border-bottom: 2px solid #e5e7eb; padding: 12px 10px; font-size: 10px; font-weight: 800; text-transform: uppercase; text-align: left; color: #4b5563; letter-spacing: 0.05em; }
          .data-table td { border-bottom: 1px solid #f3f4f6; padding: 12px 10px; font-size: 11px; color: #374151; vertical-align: middle; }
          .badge-ot { background-color: #fef2f2; color: #991b1b; padding: 2px 6px; border-radius: 4px; font-size: 10px; font-weight: 700; border: 1px solid #fee2e2; }
          .summary-container { display: grid; grid-template-cols: repeat(3, 1fr); gap: 15px; margin-top: 30px; }
          .summary-card { border: 1px dashed #e5e7eb; padding: 15px; border-radius: 12px; text-align: left; }
          @media print {
            body { padding: 0; }
            .no-print { display: none !important; }
          }
        </style>
      </head>
      <body>
        <div class="container">
          \${htmlBody}
        </div>
      </body>
      </html>
    `);
    iframeDoc.close();
    
    setTimeout(() => {
      iframe.contentWindow?.focus();
      iframe.contentWindow?.print();
      setTimeout(() => {
        document.body.removeChild(iframe);
      }, 500);
    }, 350);
  }
}

export interface SplitFuelEntry extends FuelEntry {
  companyAmount: number;
  additionalAmount: number;
  companyDistance: number;
  additionalDistance: number;
  isCustomAdditional: boolean;
  isSplit: boolean;
}

export function computeFuelSplit(entries: FuelEntry[], companyLimit?: number): SplitFuelEntry[] {
  const currentBudgetLimit = companyLimit !== undefined ? companyLimit : getNoCodeBudgetLimit();
  const parseToDateHelper = (dateStr: string): Date => {
    if (!dateStr) return new Date();
    if (dateStr.includes('/')) {
      const parts = dateStr.split('/');
      if (parts.length === 3) {
        const p0 = parseInt(parts[0], 10);
        const p1 = parseInt(parts[1], 10);
        const p2 = parseInt(parts[2], 10);
        if (p0 > 12) {
          return new Date(p2, p1 - 1, p0); // D/M/Y
        }
        return new Date(p2, p0 - 1, p1); // M/D/Y
      }
    }
    return new Date(dateStr);
  };

  // Sort entries chronologically to correctly track cumulative budget spend
  const sorted = [...entries].sort((a, b) => {
    return parseToDateHelper(a.date).getTime() - parseToDateHelper(b.date).getTime();
  });

  let cumulativeCovered = 0;

  const mapped = sorted.map(e => {
    const amount = e.amount || 0;
    const distance = e.distance || 0;
    let companyAmount = 0;
    let additionalAmount = 0;
    let companyDistance = 0;
    let additionalDistance = 0;
    let isSplit = false;

    if (cumulativeCovered >= currentBudgetLimit) {
      additionalAmount = amount;
      additionalDistance = distance;
    } else if (cumulativeCovered + amount <= currentBudgetLimit) {
      companyAmount = amount;
      companyDistance = distance;
      cumulativeCovered += amount;
    } else {
      // Split entry
      companyAmount = currentBudgetLimit - cumulativeCovered;
      additionalAmount = amount - companyAmount;
      const ratio = companyAmount / amount;
      companyDistance = Number((distance * ratio).toFixed(1));
      additionalDistance = Number((distance - companyDistance).toFixed(1));
      cumulativeCovered = currentBudgetLimit;
      isSplit = true;
    }

    return {
      ...e,
      companyAmount,
      additionalAmount,
      companyDistance,
      additionalDistance,
      isCustomAdditional: additionalAmount > 0,
      isSplit
    };
  });

  const resultMap = new Map<string, typeof mapped[0]>();
  mapped.forEach(m => resultMap.set(m.id, m));

  return entries.map(e => {
    const split = resultMap.get(e.id);
    if (split) return split;
    return {
      ...e,
      companyAmount: e.amount || 0,
      additionalAmount: 0,
      companyDistance: e.distance || 0,
      additionalDistance: 0,
      isCustomAdditional: false,
      isSplit: false
    };
  });
}

export default function App() {
  const [currentView, setCurrentView] = useState<View>('login');
  
  const [companies, setCompanies] = useState<Company[]>(() => {
    const saved = localStorage.getItem('fleet_hub_companies');
    if (saved) return JSON.parse(saved);
    return [
      {
        id: 'c1',
        name: 'Kuwait Logistics',
        tagline: 'Enterprise Fleet Hub',
        logoUrl: '',
        adminEmail: 'Arun965560@gmail.com'
      }
    ];
  });

  const [drivers, setDrivers] = useState<DriverStat[]>(() => {
    const saved = localStorage.getItem('fleet_hub_drivers');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error("Failed to parse saved drivers", e);
      }
    }
    return [
      { 
        id: '1', 
        name: "AK", 
        email: "Arun965560@gmail.com", 
        vehicle: "Toyota Fortuner", 
        role: 'admin', 
        odometer: 15420, 
        fuelBalance: 95.0, 
        status: 'active',
        fileNumber: 'F-1001',
        password: '123',
        dailyTrip: { startKm: null, currentKm: null, endKm: null, active: false },
        trips: [
          { date: '2026-05-18', startKm: 15150, endKm: 15300, distance: 150 },
          { date: '2026-05-19', startKm: 15300, endKm: 15420, distance: 120 }
        ],
        dutyLogs: [
          { id: 'sh-ak-1', date: '2026-05-18', inTime: '08:00:00 AM', outTime: '04:30:00 PM', totalHours: 8.5, regularHours: 8, otHours: 0.5 },
          { id: 'sh-ak-2', date: '2026-05-19', inTime: '07:45:00 AM', outTime: '03:45:00 PM', totalHours: 8.0, regularHours: 8, otHours: 0 }
        ],
        fuelEntries: [
          { id: 'fe-ak-1', date: '2026-05-18', prevOdo: 15150, currOdo: 15300, distance: 150, amount: 12.5, efficiency: 12.0 }
        ],
        maintenance: {
          lastServiceDate: '2024-03-10',
          lastServiceKm: 12500,
          nextServiceKm: 17500,
          nextServiceDate: '2024-09-10',
          serviceHistory: [
            { id: 'srv-1', date: '2024-03-10', km: 12500, cost: 45.0, type: 'Full Service' }
          ]
        },
        nfcId: 'NFC-AK-001',
        companyId: 'c1',
        vehiclePlate: 'KW-48192',
        currentSession: { active: false, startId: null, startTime: null }
      },
      { 
        id: '2', 
        name: "Driver_2", 
        email: "driver2@example.com", 
        vehicle: "Nissan Patrol", 
        role: 'driver', 
        odometer: 12100, 
        fuelBalance: 40.0, 
        status: 'warning',
        fileNumber: 'F-1002',
        password: '123',
        dailyTrip: { startKm: 12050, currentKm: 12100, endKm: null, active: true },
        trips: [
          { date: '2026-05-18', startKm: 11950, endKm: 12050, distance: 100 },
          { date: '2026-05-19', startKm: 12050, endKm: 12100, distance: 50 }
        ],
        dutyLogs: [
          { id: 'sh-d2-1', date: '2026-05-18', inTime: '08:15:00 AM', outTime: '04:45:00 PM', totalHours: 8.5, regularHours: 8, otHours: 0.5 },
          { id: 'sh-d2-2', date: '2026-05-19', inTime: '08:00:00 AM', outTime: '04:00:00 PM', totalHours: 8.0, regularHours: 8, otHours: 0 }
        ],
        fuelEntries: [
          { id: 'fe-d2-1', date: '2026-05-18', prevOdo: 11950, currOdo: 12050, distance: 100, amount: 8.5, efficiency: 11.7 }
        ],
        maintenance: {
          lastServiceDate: '2024-01-15',
          lastServiceKm: 10000,
          nextServiceKm: 15000,
          nextServiceDate: '2024-07-15',
          serviceHistory: [
            { id: 'srv-2', date: '2024-01-15', km: 10000, cost: 35.0, type: 'Oil Change' }
          ]
        },
        nfcId: 'NFC-D2-002',
        companyId: 'c1',
        vehiclePlate: 'KW-98214',
        currentSession: { active: false, startId: null, startTime: null }
      },
      { 
        id: '3', 
        name: "Driver_3", 
        email: "driver3@example.com", 
        vehicle: "Mitsubishi Pajero", 
        role: 'driver', 
        odometer: 8500, 
        fuelBalance: 120.0, 
        status: 'active',
        fileNumber: 'F-1003',
        password: '123',
        dailyTrip: { startKm: null, currentKm: null, endKm: null, active: false },
        trips: [
          { date: '2026-05-18', startKm: 8300, endKm: 8500, distance: 200 }
        ],
        dutyLogs: [
          { id: 'sh-d3-1', date: '2026-05-18', inTime: '07:30:00 AM', outTime: '03:30:00 PM', totalHours: 8.0, regularHours: 8, otHours: 0 }
        ],
        fuelEntries: [
          { id: 'fe-d3-1', date: '2026-05-18', prevOdo: 8300, currOdo: 8500, distance: 200, amount: 14.0, efficiency: 14.2 }
        ],
        maintenance: {
          lastServiceDate: '2024-02-20',
          lastServiceKm: 7500,
          nextServiceKm: 12500,
          nextServiceDate: '2024-08-20',
          serviceHistory: [
            { id: 'srv-3', date: '2024-02-20', km: 7500, cost: 50.0, type: 'Brake Pad Replacement' }
          ]
        },
        nfcId: 'NFC-D3-003',
        companyId: 'c1',
        vehiclePlate: 'KW-37652',
        currentSession: { active: false, startId: null, startTime: null }
      },
    ];
  });

  const [adminAuth, setAdminAuth] = useState(() => {
    const saved = localStorage.getItem('fleet_hub_admin_auth');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error("Failed to parse saved admin auth", e);
      }
    }
    return { username: 'Arun965560@gmail.com', password: 'Arun965560@gmail.com' };
  });

  const [hourlyRate, setHourlyRate] = useState(() => {
    const saved = localStorage.getItem('fleet_hub_hourly_rate');
    if (saved) {
      return parseFloat(saved);
    }
    return 5.0;
  });
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false);
  const [showAdminAuthModal, setShowAdminAuthModal] = useState(false);
  const [showNfcScanner, setShowNfcScanner] = useState(false);

  const [logoUrl, setLogoUrl] = useState(() => localStorage.getItem('fleet_hub_logo_url') || '');
  const [companyName, setCompanyName] = useState(() => localStorage.getItem('fleet_hub_company_name') || 'Kuwait Logistics');
  const [companyTagline, setCompanyTagline] = useState(() => localStorage.getItem('fleet_hub_company_tagline') || 'Enterprise Fleet Hub');
  
  const [masterAuthStatus, setMasterAuthStatus] = useState(false);
  const [showMasterAuthModal, setShowMasterMasterAuthModal] = useState(false);
  const [masterNotifications, setMasterNotifications] = useState<{id: string, time: string, company: string, device?: string, type: 'intrusion' | 'deletion', message: string, read?: boolean}[]>(() => {
    const saved = localStorage.getItem('master_notifications');
    return saved ? JSON.parse(saved) : [];
  });

  // Sync State hooks
  const [isOnline, setIsOnline] = useState<boolean>(true);
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'synced' | 'offline' | 'error'>('idle');
  const [lastSyncedTime, setLastSyncedTime] = useState<string | null>(() => localStorage.getItem('fleet_hub_last_synced') || null);
  const [isInitialLoad, setIsInitialLoad] = useState<boolean>(true);

  // Cloud Sync trigger
  const triggerCloudSync = async (currentStateOverride?: any) => {
    if (!navigator.onLine) {
      setIsOnline(false);
      setSyncStatus('offline');
      return;
    }

    setSyncStatus('syncing');
    try {
      const stateToSync = currentStateOverride || {
        companies,
        drivers,
        adminAuth,
        hourlyRate,
        logoUrl,
        companyName,
        companyTagline,
        masterNotifications
      };

      const res = await fetch('/api/sync-state', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(stateToSync)
      });

      if (res.ok) {
        const now = new Date().toLocaleTimeString();
        setLastSyncedTime(now);
        localStorage.setItem('fleet_hub_last_synced', now);
        setSyncStatus('synced');
      } else {
        setSyncStatus('error');
      }
    } catch (e) {
      setSyncStatus('error');
    }
  };

  // Local Storage Mirroring (Safe fallback cache)
  useEffect(() => {
    localStorage.setItem('fleet_hub_companies', JSON.stringify(companies));
  }, [companies]);

  useEffect(() => {
    localStorage.setItem('master_notifications', JSON.stringify(masterNotifications));
  }, [masterNotifications]);

  // Persistence Effects
  useEffect(() => {
    localStorage.setItem('fleet_hub_drivers', JSON.stringify(drivers));
  }, [drivers]);

  useEffect(() => {
    localStorage.setItem('fleet_hub_admin_auth', JSON.stringify(adminAuth));
  }, [adminAuth]);

  useEffect(() => {
    localStorage.setItem('fleet_hub_hourly_rate', hourlyRate.toString());
  }, [hourlyRate]);

  useEffect(() => {
    localStorage.setItem('fleet_hub_logo_url', logoUrl);
  }, [logoUrl]);

  useEffect(() => {
    localStorage.setItem('fleet_hub_company_name', companyName);
  }, [companyName]);

  useEffect(() => {
    localStorage.setItem('fleet_hub_company_tagline', companyTagline);
  }, [companyTagline]);

  // Setup actual network connection state and trigger initial fetch
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setSyncStatus('syncing');
      triggerCloudSync();
    };
    const handleOffline = () => {
      setIsOnline(false);
      setSyncStatus('offline');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    const initialFetchState = async () => {
      try {
        const healthRes = await fetch('/api/health');
        if (healthRes.ok) {
          setIsOnline(true);
          setSyncStatus('syncing');
          const stateRes = await fetch('/api/get-state');
          if (stateRes.ok) {
            const serverState = await stateRes.json();
            if (serverState.companies) setCompanies(serverState.companies);
            if (serverState.drivers) setDrivers(serverState.drivers);
            if (serverState.adminAuth) setAdminAuth(serverState.adminAuth);
            if (typeof serverState.hourlyRate === 'number') setHourlyRate(serverState.hourlyRate);
            if (typeof serverState.logoUrl === 'string') setLogoUrl(serverState.logoUrl);
            if (typeof serverState.companyName === 'string') setCompanyName(serverState.companyName);
            if (typeof serverState.companyTagline === 'string') setCompanyTagline(serverState.companyTagline);
            if (serverState.masterNotifications) setMasterNotifications(serverState.masterNotifications);
            
            const now = new Date().toLocaleTimeString();
            setLastSyncedTime(now);
            localStorage.setItem('fleet_hub_last_synced', now);
            setSyncStatus('synced');
          } else {
            setSyncStatus('error');
          }
        } else {
          setIsOnline(false);
          setSyncStatus('offline');
        }
      } catch (err) {
        setIsOnline(false);
        setSyncStatus('offline');
      } finally {
        setIsInitialLoad(false);
      }
    };

    initialFetchState();

    const interval = setInterval(async () => {
      try {
        const healthRes = await fetch('/api/health');
        if (healthRes.ok) {
          setIsOnline(true);
        } else {
          setIsOnline(false);
          setSyncStatus('offline');
        }
      } catch (e) {
        setIsOnline(false);
        setSyncStatus('offline');
      }
    }, 15000);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(interval);
    };
  }, []);

  // Sync state whenever local variable changes after first initial load of cloud data
  useEffect(() => {
    if (isInitialLoad) return;
    const timer = setTimeout(() => {
      triggerCloudSync();
    }, 1500);

    return () => clearTimeout(timer);
  }, [drivers, companies, adminAuth, hourlyRate, logoUrl, companyName, companyTagline, masterNotifications, isInitialLoad]);

  const [currentUserId, setCurrentUserId] = useState<string | null>(() => {
    return localStorage.getItem('fleet_hub_logged_in_user_id') || null;
  });
  const [currentCompanyId, setCurrentCompanyId] = useState<string | null>(null);

  useEffect(() => {
    if (currentUserId) {
      localStorage.setItem('fleet_hub_logged_in_user_id', currentUserId);
      const user = drivers.find(d => d.id === currentUserId);
      if (user) {
        setCurrentCompanyId(user.companyId);
        if (user.role === 'admin') {
          setIsAdminAuthenticated(true);
          setCurrentView('fleet-overview');
        } else {
          setCurrentView('dashboard');
        }
      }
    } else {
      localStorage.removeItem('fleet_hub_logged_in_user_id');
      setIsAdminAuthenticated(false);
      setCurrentView('login');
    }
  }, [currentUserId, drivers]);
  const activeCompany = companies.find(c => c.id === currentCompanyId);

  const currentUser = drivers.find(d => d.id === currentUserId) || null;
  const userRole = currentUser?.role || 'driver';

  const [selectedDriverId, setSelectedDriverId] = useState<string | null>(null);
  const [activeNoCodeEdit, setActiveNoCodeEdit] = useState<{ id: string, originalText: string, currentText: string } | null>(null);

  useEffect(() => {
    const handleOpenEditor = (e: any) => {
      setActiveNoCodeEdit(e.detail);
    };
    window.addEventListener('open-no-code-editor', handleOpenEditor);
    return () => {
      window.removeEventListener('open-no-code-editor', handleOpenEditor);
    };
  }, []);

  const [toast, setToast] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const handleUpdateFuel = (amount: number, newOdo: number, liters: number) => {
    setDrivers(prev => prev.map(d => {
      if (d.id === currentUserId) {
        const distance = newOdo - d.odometer;
        const efficiency = distance > 0 && amount > 0 ? Number((distance / amount).toFixed(2)) : 0;
        
        const newEntry: FuelEntry = {
          id: Math.random().toString(36).substring(7),
          date: new Date().toLocaleDateString(),
          prevOdo: d.odometer,
          currOdo: newOdo,
          distance,
          amount,
          liters,
          efficiency
        };

        return { 
          ...d, 
          fuelBalance: d.fuelBalance + amount, // Add to balance
          odometer: newOdo,
          fuelEntries: [newEntry, ...d.fuelEntries]
        };
      }
      return d;
    }));
    showToast(`Refueling logged successfully`);
  };

  const handleUpdateKM = (newKm: number) => {
    setDrivers(prev => prev.map(d => 
      d.id === currentUserId 
        ? { 
            ...d, 
            odometer: newKm, 
            dailyTrip: { ...d.dailyTrip, currentKm: newKm } 
          } 
        : d
    ));
    showToast(`Odometer updated to ${newKm} KM`);
  };

  const handleStartTrip = (startKm: number) => {
    setDrivers(prev => prev.map(d => 
      d.id === currentUserId 
        ? { 
            ...d, 
            odometer: startKm,
            dailyTrip: { startKm, currentKm: startKm, endKm: null, active: true } 
          } 
        : d
    ));
    showToast("Trip Started! Drive Safely.");
  };

  const handleEndTrip = (endKm: number) => {
    setDrivers(prev => prev.map(d => {
      if (d.id === currentUserId && d.dailyTrip.startKm !== null) {
        const distance = endKm - d.dailyTrip.startKm;
        const newTrip: TripHistory = {
          date: new Date().toLocaleDateString(),
          startKm: d.dailyTrip.startKm,
          endKm: endKm,
          distance: distance
        };
        return {
          ...d,
          odometer: endKm,
          dailyTrip: { startKm: null, currentKm: null, endKm: null, active: false },
          trips: [newTrip, ...d.trips]
        };
      }
      return d;
    }));
    showToast("Trip Ended. Statistics Saved.");
  };

  const handleResetDay = () => {
    setDrivers(prev => prev.map(d => ({
      ...d,
      dailyTrip: { startKm: null, currentKm: null, endKm: null, active: false }
    })));
    showToast("All daily sessions reset for new day.");
  };

  const handleLogService = (userId: string, service: Omit<ServiceRecord, 'id'>, customInterval?: number, isAdditional?: boolean) => {
    setDrivers(prev => prev.map(d => {
      if (d.id === userId) {
        const newRecord: ServiceRecord = {
          ...service,
          id: Math.random().toString(36).substring(7)
        };
        if (isAdditional) {
          return {
            ...d,
            maintenance: {
              ...d.maintenance,
              serviceHistory: [newRecord, ...d.maintenance.serviceHistory]
            }
          };
        } else {
          const intervalRule = customInterval !== undefined ? customInterval : 10000;
          const nextKm = (service.km !== null && service.km !== undefined ? service.km : d.odometer) + intervalRule;
          return {
            ...d,
            maintenance: {
              ...d.maintenance,
              lastServiceDate: service.date,
              lastServiceKm: service.km,
              nextServiceKm: nextKm,
              serviceHistory: [newRecord, ...d.maintenance.serviceHistory]
            }
          };
        }
      }
      return d;
    }));
    showToast("Service record logged successfully");
  };

  const handleStartDuty = (userId: string = currentUserId!, location?: Location) => {
    setDrivers(prev => prev.map(d => {
      if (d.id === userId) {
        const now = new Date();
        return {
          ...d,
          currentSession: {
            active: true,
            startId: Math.random().toString(36).substring(7),
            startTime: now.toISOString(),
            startLocation: location
          }
        };
      }
      return d;
    }));
    showToast("Duty Started Successfully.");
  };

  const handleEndDuty = (userId: string = currentUserId!, location?: Location) => {
    setDrivers(prev => prev.map(d => {
      if (d.id === userId && d.currentSession.active && d.currentSession.startTime) {
        const now = new Date();
        const start = new Date(d.currentSession.startTime);
        const diffMs = now.getTime() - start.getTime();
        const totalHours = Number((diffMs / (1000 * 60 * 60)).toFixed(2));
        
        const regularHours = Math.min(totalHours, 8);
        const otHours = Math.max(0, totalHours - 8);

        const newLog: DutyLog = {
          id: d.currentSession.startId!,
          date: new Date().toLocaleDateString(),
          inTime: start.toLocaleTimeString(),
          outTime: now.toLocaleTimeString(),
          totalHours,
          regularHours,
          otHours,
          inLocation: d.currentSession.startLocation,
          outLocation: location
        };

        return {
          ...d,
          dutyLogs: [newLog, ...d.dutyLogs],
          currentSession: { active: false, startId: null, startTime: null }
        };
      }
      return d;
    }));
    showToast("Duty Ended Successfully.");
  };

  const handleNfcTap = (nfcId: string) => {
    const driver = drivers.find(d => d.nfcId === nfcId);
    if (!driver) {
      showToast("Invalid NFC Card Detected");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const location = {
          lat: position.coords.latitude,
          lng: position.coords.longitude
        };
        
        if (driver.currentSession.active) {
          handleEndDuty(driver.id, location);
        } else {
          handleStartDuty(driver.id, location);
        }
        
        setShowNfcScanner(false);
        setSelectedDriverId(driver.id);
        if (userRole === 'admin') {
          setCurrentView('driver-details');
        } else {
          setCurrentView('dashboard');
        }
      },
      () => {
        showToast("GPS Permission Denied. NFC Punch Failed.");
      }
    );
  };

  const handleNewDriver = (updates: Partial<DriverStat>) => {
    const nextIdVal = drivers.length > 0 ? Math.max(...drivers.map(d => isNaN(parseInt(d.id)) ? 0 : parseInt(d.id))) + 1 : 1;
    const newId = nextIdVal.toString();
    const name = updates.name || "Unnamed Driver";
    const fileNumber = updates.fileNumber || `F-${1000 + nextIdVal}`;
    const password = updates.password || '123';
    
    const newDriver: DriverStat = {
      id: newId,
      name,
      email: updates.email || `${name.toLowerCase()}@logistics.kw`,
      vehicle: updates.vehicle || "Standard Fleet Truck",
      role: updates.role || 'driver',
      odometer: updates.odometer !== undefined ? updates.odometer : 0,
      fuelBalance: updates.fuelBalance !== undefined ? updates.fuelBalance : 50.0,
      status: updates.status || 'active',
      dailyTrip: { startKm: null, currentKm: null, endKm: null, active: false },
      trips: [],
      dutyLogs: [],
      fuelEntries: [],
      maintenance: {
        lastServiceDate: null,
        lastServiceKm: null,
        nextServiceKm: getNoCodeServiceInterval(),
        nextServiceDate: null,
        serviceHistory: []
      },
      nfcId: `NFC-${name.substring(0, 2).toUpperCase()}-${newId}`,
      companyId: currentCompanyId || 'c1',
      vehiclePlate: updates.vehiclePlate || 'KW-XXXXX',
      fileNumber,
      password,
      currentSession: { active: false, startId: null, startTime: null }
    };
    setDrivers(prev => [...prev, newDriver]);
    showToast(`New Driver Created: ${name}`);
  };

  const handleEditDriver = (id: string, updates: Partial<DriverStat>) => {
    setDrivers(prev => prev.map(d => d.id === id ? { ...d, ...updates } : d));
    showToast("Driver profile updated");
  };

  const handleDeleteDriver = (id: string) => {
    if (id === currentUserId) {
      showToast("Cannot delete yourself");
      return;
    }
    const driver = drivers.find(d => d.id === id);
    if (driver) {
      const time = new Date().toLocaleString();
      const newNotification = {
        id: Math.random().toString(36).substring(7),
        time,
        company: companyName,
        type: 'deletion' as const,
        message: `⚠️ Vehicle Deleted: ${driver.vehicle} from ${companyName} at ${time}. Moved to Master Archive.`,
        read: false
      };
      setMasterNotifications(prev => [newNotification, ...prev]);
    }
    setDrivers(prev => prev.map(d => 
      d.id === id ? { ...d, companyDeleted: true, deletedAt: new Date().toISOString(), deletedBy: "Company Admin" } : d
    ));
    showToast("Driver account moved to Recycle Bin");
  };

  const handleDeleteLog = (driverId: string, type: 'fuel' | 'duty' | 'service', itemId: string) => {
    setDrivers(prev => prev.map(d => {
      if (d.id !== driverId) return d;
      const metadata = { companyDeleted: true, deletedAt: new Date().toISOString(), deletedBy: "Company Admin" };
      
      switch (type) {
        case 'fuel':
          return { ...d, fuelEntries: d.fuelEntries.map(e => e.id === itemId ? { ...e, ...metadata } : e) };
        case 'duty':
          return { ...d, dutyLogs: d.dutyLogs.map(l => l.id === itemId ? { ...l, ...metadata } : l) };
        case 'service':
          return { ...d, maintenance: { 
            ...d.maintenance, 
            serviceHistory: d.maintenance.serviceHistory.map(s => s.id === itemId ? { ...s, ...metadata } : s) 
          } };
        default:
          return d;
      }
    }));
    showToast(`${type.charAt(0).toUpperCase() + type.slice(1)} record moved to Recycle Bin`);
  };

  const handlePermanentDelete = (id: string, type: 'driver' | 'fuel' | 'duty' | 'service', driverId?: string) => {
    const masterArchiveDate = new Date();
    masterArchiveDate.setFullYear(masterArchiveDate.getFullYear() + 1); // 365 days retention
    
    const metadata = { 
      companyPermanentDelete: true, 
      masterArchiveDate: masterArchiveDate.toISOString() 
    };

    setDrivers(prev => prev.map(d => {
      if (type === 'driver') {
        if (d.id === id) return { ...d, ...metadata };
        return d;
      }
      
      if (d.id !== driverId) return d;
      
      switch (type) {
        case 'fuel':
          return { ...d, fuelEntries: d.fuelEntries.map(e => e.id === id ? { ...e, ...metadata } : e) };
        case 'duty':
          return { ...d, dutyLogs: d.dutyLogs.map(l => l.id === id ? { ...l, ...metadata } : l) };
        case 'service':
          return { ...d, maintenance: { 
            ...d.maintenance, 
            serviceHistory: d.maintenance.serviceHistory.map(s => s.id === id ? { ...s, ...metadata } : s) 
          } };
        default:
          return d;
      }
    }));
    showToast("Item permanently removed from your view. Retained in Master Cloud.");
  };

  const handleRestore = (id: string, type: 'driver' | 'fuel' | 'duty' | 'service', driverId?: string) => {
    setDrivers(prev => prev.map(d => {
      if (type === 'driver') {
        if (d.id === id) return { ...d, companyDeleted: false, deletedAt: undefined, deletedBy: undefined };
        return d;
      }
      
      if (d.id !== driverId) return d;
      
      switch (type) {
        case 'fuel':
          return { ...d, fuelEntries: d.fuelEntries.map(e => e.id === id ? { ...e, companyDeleted: false, deletedAt: undefined, deletedBy: undefined } : e) };
        case 'duty':
          return { ...d, dutyLogs: d.dutyLogs.map(l => l.id === id ? { ...l, companyDeleted: false, deletedAt: undefined, deletedBy: undefined } : l) };
        case 'service':
          return { ...d, maintenance: { 
            ...d.maintenance, 
            serviceHistory: d.maintenance.serviceHistory.map(s => s.id === id ? { ...s, companyDeleted: false, deletedAt: undefined, deletedBy: undefined } : s) 
          } };
        default:
          return d;
      }
    }));
    showToast("Item restored successfully");
  };

  const handleDriverLogin = (fileNumber: string, logPass: string): boolean => {
    const foundDriver = drivers.find(d => 
      !d.companyDeleted && 
      d.fileNumber?.toLowerCase() === fileNumber.trim().toLowerCase() && 
      d.password === logPass.trim()
    );

    if (foundDriver) {
      setCurrentUserId(foundDriver.id);
      showToast(`Welcome back, ${foundDriver.name}!`);
      return true;
    } else {
      showToast("Invalid Company File Number or Password");
      return false;
    }
  };

  const renderView = () => {
    switch (currentView) {
      case 'login':
        return (
          <LoginPage 
            onDriverLogin={handleDriverLogin}
            onAdminClick={() => setShowAdminAuthModal(true)}
            onMasterTrigger={() => {
              const device = navigator.userAgent;
              const time = new Date().toLocaleString();
              const newNotification = {
                id: Math.random().toString(36).substring(7),
                time,
                company: activeCompany?.name || companyName,
                device,
                type: 'intrusion' as const,
                message: `Master Trigger Alert: ${activeCompany?.name || companyName}, ${device}`,
                read: false
              };
              setMasterNotifications(prev => [newNotification, ...prev]);
              setShowMasterMasterAuthModal(true);
              console.warn(`SECURITY ALERT: 10-Tap Master Sequence activated. Device: ${device}, Time: ${time}`);
              showToast("Master sequence detected. Enter authorization.");
            }}
            defaultLogoUrl={logoUrl}
            defaultCompanyName={companyName}
            defaultCompanyTagline={companyTagline}
          />
        );
      case 'master-control':
        return (
          <MasterDashboard 
            onBack={() => {
              setMasterAuthStatus(false);
              setCurrentView('login');
            }}
            notifications={masterNotifications}
            setNotifications={setMasterNotifications}
            drivers={drivers}
            setDrivers={setDrivers}
            companies={companies}
            setCompanies={setCompanies}
            companyName={companyName}
            setCompanyName={setCompanyName}
            companyTagline={companyTagline}
            setCompanyTagline={setCompanyTagline}
            logoUrl={logoUrl}
            setLogoUrl={setLogoUrl}
            showToast={showToast}
          />
        );
      case 'role-select':
        return (
          <RoleSelectionPage 
            drivers={drivers.filter(d => !d.companyDeleted && d.role === 'driver' && d.companyId === currentCompanyId)}
            onSelect={(userId) => {
              setCurrentUserId(userId);
              setCurrentView('dashboard');
              showToast(`Logged in as ${drivers.find(d => d.id === userId)?.name}`);
            }}
          />
        );
      case 'dashboard':
        return currentUser ? (
          <Dashboard 
            onNavigate={setCurrentView} 
            driverName={currentUser.name} 
            carModel={currentUser.vehicle} 
            fuelBalance={currentUser.fuelBalance} 
            odometer={currentUser.odometer} 
            dailyTrip={currentUser.dailyTrip}
            currentSession={currentUser.currentSession}
            onStartDuty={handleStartDuty}
            onEndDuty={handleEndDuty}
            showToast={showToast}
            userRole={userRole}
            onLogout={() => {
              setCurrentUserId(null);
              setCurrentView('login');
            }}
            isAdminAuthenticated={isAdminAuthenticated}
            setShowAdminAuthModal={setShowAdminAuthModal}
            setShowNfcScanner={setShowNfcScanner}
            driver={currentUser}
          />
        ) : null;
      case 'vehicle':
        return currentUser ? (
          <VehicleDetails 
            onBack={() => setCurrentView('dashboard')} 
            odometer={currentUser.odometer} 
            dailyTrip={currentUser.dailyTrip}
            onUpdateKM={handleUpdateKM} 
            onStartTrip={handleStartTrip}
            onEndTrip={handleEndTrip}
            carModel={currentUser.vehicle}
            maintenance={currentUser.maintenance}
            onLogService={(service, customInterval, isAdditional) => handleLogService(currentUser.id, service, customInterval, isAdditional)}
            driver={currentUser}
            userRole={userRole}
          />
        ) : null;
      case 'fuel':
        return currentUser ? (
          <FuelLog 
            onBack={() => setCurrentView('dashboard')} 
            fuelBalance={currentUser.fuelBalance} 
            odometer={currentUser.odometer}
            onUpdateFuel={handleUpdateFuel}
            driver={currentUser}
            userRole={userRole}
          />
        ) : null;
      case 'fleet-overview':
        return (
          <FleetOverview 
            onBack={() => setCurrentView('dashboard')} 
            drivers={drivers.filter(d => d.companyId === currentCompanyId)} 
            adminAuth={adminAuth}
            setAdminAuth={setAdminAuth}
            hourlyRate={hourlyRate}
            setHourlyRate={setHourlyRate}
            onSaveDriver={(id, updates) => {
              if (id) handleEditDriver(id, updates);
              else handleNewDriver(updates);
            }}
            onDeleteDriver={handleDeleteDriver}
            onPermanentDelete={handlePermanentDelete}
            onRestore={handleRestore}
            onSelectDriver={(id) => {
              setSelectedDriverId(id);
              setCurrentView('driver-details');
            }}
            onResetDay={handleResetDay}
            showToast={showToast}
            logoUrl={logoUrl}
            setLogoUrl={setLogoUrl}
            companyName={companyName}
            setCompanyName={setCompanyName}
            companyTagline={companyTagline}
            setCompanyTagline={setCompanyTagline}
          />
        );
      case 'driver-details':
        const selectedDriver = drivers.find(d => d.id === selectedDriverId);
        return selectedDriver ? (
          <DriverIndividualView 
            driver={selectedDriver}
            onBack={() => setCurrentView('fleet-overview')}
            hourlyRate={hourlyRate}
            onLogService={handleLogService}
            onDeleteLog={(type, itemId) => handleDeleteLog(selectedDriver.id, type, itemId)}
          />
        ) : null;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-[#F8F9FA] text-ink font-sans selection:bg-accent/10 flex flex-col items-center overflow-x-hidden">
      <div className="w-full max-w-xl min-h-screen flex flex-col relative">
        {/* Beautiful Floating Cloud Sync Bar */}
        <div className="w-full bg-neutral-900 text-white text-[10px] font-bold tracking-widest uppercase px-4 py-2 flex justify-between items-center shadow-md border-b border-white/5 z-40">
          <div className="flex items-center gap-2">
            <span className={`inline-block w-2.5 h-2.5 rounded-full ${
              syncStatus === 'synced' ? 'bg-emerald-500 animate-pulse' :
              syncStatus === 'syncing' ? 'bg-amber-400 animate-pulse' :
              syncStatus === 'offline' ? 'bg-amber-500' :
              syncStatus === 'error' ? 'bg-rose-500 animate-pulse' : 'bg-neutral-500'
            }`} />
            <span>
              {syncStatus === 'synced' && 'Cloud Sync: Connected'}
              {syncStatus === 'syncing' && 'Cloud Sync: Syncing...'}
              {syncStatus === 'offline' && 'Cloud Sync: Offline'}
              {syncStatus === 'error' && 'Cloud Sync: Error'}
              {syncStatus === 'idle' && 'Cloud Sync: Connected'}
            </span>
          </div>
          <div className="flex items-center gap-3 font-mono text-[9px]">
            {lastSyncedTime && (
              <span className="text-neutral-400 font-normal lowercase">
                Synced {lastSyncedTime}
              </span>
            )}
            <button 
              onClick={() => triggerCloudSync()} 
              disabled={syncStatus === 'syncing'}
              className="hover:text-emerald-400 text-neutral-300 font-extrabold uppercase transition-colors tracking-widest cursor-pointer disabled:opacity-50"
            >
              Sync
            </button>
          </div>
        </div>

        <AnimatePresence mode="wait">
          {renderView()}
        </AnimatePresence>

        {/* Admin Authentication Modal */}
        <AnimatePresence>
          {showAdminAuthModal && (
            <AdminAuthModal 
              adminAuth={adminAuth}
              onSuccess={() => {
                const adminUser = drivers.find(d => d.role === 'admin');
                if (adminUser) setCurrentUserId(adminUser.id);
                setIsAdminAuthenticated(true);
                setShowAdminAuthModal(false);
                setCurrentView('fleet-overview');
              }}
              onClose={() => setShowAdminAuthModal(false)}
            />
          )}
          {showMasterAuthModal && (
            <MasterAuthModal 
              onSuccess={() => {
                setShowMasterMasterAuthModal(false);
                setCurrentView('master-control');
              }}
              onClose={() => setShowMasterMasterAuthModal(false)}
            />
          )}
        </AnimatePresence>

        {/* NFC Scanner Modal */}
        <AnimatePresence>
          {showNfcScanner && (
            <NfcScannerModal 
              drivers={drivers}
              onScan={handleNfcTap}
              onClose={() => setShowNfcScanner(false)}
            />
          )}
        </AnimatePresence>

        {/* No-Code Master Visual App Editor Popup Modal */}
        <AnimatePresence>
          {activeNoCodeEdit && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-fade-in"
              onClick={() => setActiveNoCodeEdit(null)}
            >
              <motion.div 
                initial={{ scale: 0.95, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.95, y: 20 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-neutral-900 border border-white/10 w-full max-w-sm rounded-3xl p-6 shadow-2xl text-left space-y-6 text-white"
              >
                <div className="space-y-1.5 border-b border-white/5 pb-4">
                  <div className="flex items-center gap-2">
                    <span className="bg-rose-500/20 text-rose-400 text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-md">
                      Live Editor Mode
                    </span>
                    <span className="font-mono text-[9px] text-neutral-500 font-bold uppercase tracking-wider">
                      Key: {activeNoCodeEdit.id}
                    </span>
                  </div>
                  <h3 className="text-base font-black uppercase tracking-tight text-white flex items-center gap-2">
                    ✏️ Modify UI Elements
                  </h3>
                  <p className="text-[10px] text-neutral-450 uppercase tracking-wide">
                    Direct changes apply instantly system-wide without editing code.
                  </p>
                </div>

                {/* String Rename section */}
                <div className="space-y-2">
                  <label className="text-[9px] font-black uppercase tracking-widest text-neutral-400 pl-1">
                    Custom Display Text Label
                  </label>
                  <input
                    type="text"
                    id="live_editor_input_text"
                    defaultValue={activeNoCodeEdit.currentText}
                    className="w-full bg-[#141414] border border-white/10 px-4 py-3 rounded-xl font-bold text-sm text-white focus:border-rose-500 outline-none"
                    placeholder={activeNoCodeEdit.originalText}
                  />
                  <div className="flex justify-between items-center text-[8px] text-neutral-500 font-bold uppercase tracking-wider pl-1 pt-1">
                    <span>Original: "{activeNoCodeEdit.originalText}"</span>
                    <button 
                      type="button"
                      onClick={() => {
                        const el = document.getElementById('live_editor_input_text') as HTMLInputElement;
                        if (el) el.value = activeNoCodeEdit.originalText;
                      }}
                      className="text-rose-400 hover:underline"
                    >
                      Use Original
                    </button>
                  </div>
                </div>

                {/* Section Visibility controls toggler */}
                <div className="bg-white/5 rounded-2xl p-4 border border-white/5 space-y-3">
                  <div className="flex items-start gap-3">
                    <input
                      type="checkbox"
                      id="live_editor_visibility_toggle"
                      defaultChecked={!isSectionVisible(activeNoCodeEdit.id)}
                      className="mt-0.5 w-4 h-4 text-rose-500 border-white/20 rounded bg-neutral-800 focus:ring-rose-600 focus:ring-offset-neutral-900"
                    />
                    <div className="space-y-0.5">
                      <label htmlFor="live_editor_visibility_toggle" className="text-[10px] font-black uppercase select-none cursor-pointer">
                        Hide this block completely
                      </label>
                      <p className="text-[9px] text-neutral-450 leading-normal">
                        When checked, this card will be hidden from driver & end-user dashboards.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Action buttons */}
                <div className="grid grid-cols-2 gap-3 pt-2">
                  <button
                    onClick={() => setActiveNoCodeEdit(null)}
                    className="bg-white/10 text-white rounded-xl py-3 font-black text-[10px] uppercase tracking-widest border border-white/5 hover:bg-white/20 transition-all text-center"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => {
                      const textEl = document.getElementById('live_editor_input_text') as HTMLInputElement;
                      const checkEl = document.getElementById('live_editor_visibility_toggle') as HTMLInputElement;
                      
                      const newText = textEl?.value || '';
                      const isHidden = checkEl?.checked || false;

                      // Update custom strings
                      const savedStrings = JSON.parse(localStorage.getItem('no_code_custom_strings') || '{}');
                      savedStrings[activeNoCodeEdit.id] = newText;
                      localStorage.setItem('no_code_custom_strings', JSON.stringify(savedStrings));

                      // Update visibility matching state
                      const savedHidden = JSON.parse(localStorage.getItem('no_code_hidden_sections') || '{}');
                      if (isHidden) {
                        savedHidden[activeNoCodeEdit.id] = true;
                      } else {
                        delete savedHidden[activeNoCodeEdit.id];
                      }
                      localStorage.setItem('no_code_hidden_sections', JSON.stringify(savedHidden));

                      // Dispatch event for components to pick up updates instantly
                      window.dispatchEvent(new Event('no-code-config-updated'));
                      
                      setActiveNoCodeEdit(null);
                      showToast("✓ Custom layout adjustments Applied!");
                    }}
                    className="bg-rose-600 text-white rounded-xl py-3 font-black text-[10px] uppercase tracking-widest hover:bg-rose-500 shadow-lg shadow-rose-600/20 active:scale-[0.98] transition-all text-center"
                  >
                    Save Changes
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Global Toast Notification */}
        <AnimatePresence>
          {toast && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="fixed bottom-8 left-1/2 -translate-x-1/2 bg-ink text-white px-8 py-4 rounded-lg text-[11px] font-bold uppercase tracking-widest shadow-2xl z-50 whitespace-nowrap"
            >
              {toast}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

// --- Login Page ---
function LoginPage({ 
  onDriverLogin, 
  onAdminClick, 
  onMasterTrigger,
  defaultLogoUrl, 
  defaultCompanyName, 
  defaultCompanyTagline 
}: { 
  onDriverLogin: (fileNum: string, pass: string) => boolean, 
  onAdminClick: () => void, 
  onMasterTrigger: () => void,
  defaultLogoUrl: string,
  defaultCompanyName: string,
  defaultCompanyTagline: string
}) {
  const [tapCount, setTapCount] = useState(0);
  const tapTimer = useRef<NodeJS.Timeout | null>(null);
  const [fileNumber, setFileNumber] = useState('');
  const [password, setPassword] = useState('');

  const handleLogoClick = () => {
    if (tapTimer.current) clearTimeout(tapTimer.current);
    const newCount = tapCount + 1;
    setTapCount(newCount);
    if (newCount === 10) {
      onMasterTrigger();
      setTapCount(0);
      return;
    }
    tapTimer.current = setTimeout(() => {
      if (newCount === 1) {
        onAdminClick();
      }
      setTapCount(0);
    }, 800);
  };

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onDriverLogin(fileNumber, password);
  };

  return (
    <motion.div
      key="login"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="flex-1 flex flex-col items-center justify-center p-8 space-y-10 bg-white"
    >
      <button 
        onClick={handleLogoClick}
        className="text-center space-y-4 group active:scale-95 transition-transform outline-none"
      >
        <div className="w-24 h-24 bg-ink rounded-3xl mx-auto flex items-center justify-center shadow-2xl shadow-ink/10 relative overflow-hidden ring-4 ring-neutral-50">
          {defaultLogoUrl ? (
            <img src={defaultLogoUrl} alt="Logo" className="w-full h-full object-cover" />
          ) : (
            <Car size={48} className="text-white" />
          )}
          <div className="absolute inset-0 bg-ink/0 group-hover:bg-ink/5 transition-colors" />
        </div>
        <div className="space-y-1">
          <h1 className="text-4xl font-black uppercase tracking-tighter">{defaultCompanyName}</h1>
          <p className="text-[11px] font-bold text-neutral-400 uppercase tracking-[0.2em]">{defaultCompanyTagline}</p>
        </div>
      </button>

      <form onSubmit={handleLoginSubmit} className="w-full max-w-sm space-y-6">
        <div className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-[10px] font-black uppercase tracking-widest text-neutral-400 pl-1">
              Company File Number
            </label>
            <input 
              type="text"
              value={fileNumber}
              onChange={(e) => setFileNumber(e.target.value)}
              placeholder="e.g. F-1002"
              required
              className="w-full bg-neutral-50 border border-neutral-200/80 p-5 rounded-2xl text-sm font-bold focus:ring-4 focus:ring-blue-600/5 focus:border-blue-500/50 outline-none transition-all text-ink"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-black uppercase tracking-widest text-neutral-400 pl-1">
              Secret Password
            </label>
            <input 
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              className="w-full bg-neutral-50 border border-neutral-200/80 p-5 rounded-2xl text-sm font-bold focus:ring-4 focus:ring-blue-600/5 focus:border-blue-500/50 outline-none transition-all text-ink"
            />
          </div>
        </div>

        <button 
          type="submit"
          className="w-full py-5 bg-ink text-white rounded-2xl font-black text-[12px] uppercase tracking-[0.15em] flex items-center justify-center gap-3 active:scale-[0.98] transition-all shadow-xl shadow-ink/10 cursor-pointer hover:brightness-110"
        >
          <Lock size={14} className="text-white/65" />
          Authenticate Session
        </button>
        
        <p className="text-[10px] text-center text-neutral-400 font-bold uppercase tracking-widest leading-relaxed">
          Authorized Company File Authorization Required<br />
          <span className="text-[8px] text-neutral-300">Persisted Secure Handshake Network</span>
        </p>
      </form>
    </motion.div>
  );
}

// --- Role Selection (For Testing) ---
function RoleSelectionPage({ drivers, onSelect }: { drivers: DriverStat[], onSelect: (id: string) => void }) {
  return (
    <motion.div
      key="role-select"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 1.05 }}
      className="flex-1 p-8 space-y-10 flex flex-col justify-center"
    >
      <div className="space-y-2">
        <h1 className="text-3xl font-black uppercase tracking-tight">Identity Select</h1>
        <p className="text-[11px] font-bold text-neutral-400 uppercase tracking-widest">Select profile for simulated authentication</p>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {drivers.map(driver => (
          <button 
            key={driver.id}
            onClick={() => onSelect(driver.id)}
            className="w-full bg-white border border-neutral-200 p-6 rounded-2xl flex items-center gap-6 text-left hover:border-ink transition-all group"
          >
            <div className={`w-12 h-12 rounded-full flex items-center justify-center font-black text-sm ${driver.role === 'admin' ? 'bg-ink text-white' : 'bg-neutral-100 text-neutral-400'}`}>
              {driver.name.substring(0, 2).toUpperCase()}
            </div>
            <div className="flex-1">
              <p className="text-lg font-bold tracking-tight">{driver.name}</p>
              <p className="text-[10px] font-black uppercase tracking-widest text-neutral-400">{driver.role} Account</p>
            </div>
            <ChevronLeft className="rotate-180 opacity-20 group-hover:opacity-100 transition-opacity" />
          </button>
        ))}
      </div>
    </motion.div>
  );
}

// --- Dashboard Screen ---
function Dashboard({ 
  onNavigate, 
  driverName, 
  carModel, 
  fuelBalance, 
  odometer,
  dailyTrip,
  currentSession,
  onStartDuty,
  onEndDuty,
  showToast,
  userRole,
  onLogout,
  isAdminAuthenticated,
  setShowAdminAuthModal,
  setShowNfcScanner,
  driver
}: { 
  onNavigate: (view: View) => void, 
  driverName: string, 
  carModel: string, 
  fuelBalance: number, 
  odometer: number,
  dailyTrip: DailyTrip,
  currentSession: { active: boolean, startTime: string | null },
  onStartDuty: () => void,
  onEndDuty: () => void,
  showToast: (m: string) => void,
  userRole: UserRole,
  onLogout: () => void,
  isAdminAuthenticated: boolean,
  setShowAdminAuthModal: (v: boolean) => void,
  setShowNfcScanner: (v: boolean) => void,
  driver: DriverStat
}) {
  const [activeTab, setActiveTab] = useState<'overview' | 'profile'>('overview');
  const [activeSubScreen, setActiveSubScreen] = useState<'attendance' | 'reports' | null>(null);
  const [showEndDutyConfirm, setShowEndDutyConfirm] = useState(false);
  const [fromDate, setFromDate] = useState('2026-04-20');
  const [toDate, setToDate] = useState('2026-05-20');
  const [reportFilter, setReportFilter] = useState<'all' | 'attendance' | 'odometer' | 'fuel'>('all');
  const [showDownloadReport, setShowDownloadReport] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

  // Custom multi-format reporting selections
  const [attendanceFormat, setAttendanceFormat] = useState<'xlsx' | 'docx' | 'pdf'>('pdf');
  const [fuelFormat, setFuelFormat] = useState<'xlsx' | 'docx' | 'pdf'>('pdf');
  const [odometerFormat, setOdometerFormat] = useState<'xlsx' | 'docx' | 'pdf'>('pdf');
  const [vehicleFormat, setVehicleFormat] = useState<'xlsx' | 'docx' | 'pdf'>('pdf');

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (activeSubScreen === 'attendance') {
      timer = setInterval(() => {
        setCurrentTime(new Date());
      }, 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [activeSubScreen]);

  // Robust date parsing helper
  const parseToDate = (dateStr: string): Date => {
    if (!dateStr) return new Date();
    if (dateStr.includes('/')) {
      const parts = dateStr.split('/');
      if (parts.length === 3) {
        const p0 = parseInt(parts[0], 10);
        const p1 = parseInt(parts[1], 10);
        const p2 = parseInt(parts[2], 10);
        // MM/DD/YYYY typically, but check overflow
        if (p0 > 12) {
          return new Date(p2, p1 - 1, p0); // D/M/Y
        }
        return new Date(p2, p0 - 1, p1); // M/D/Y
      }
    }
    return new Date(dateStr);
  };

  const isDateInRange = (dateStr: string): boolean => {
    try {
      const itemDate = parseToDate(dateStr);
      const fd = new Date(fromDate);
      const td = new Date(toDate);
      fd.setHours(0,0,0,0);
      td.setHours(23,59,59,999);
      itemDate.setHours(12,0,0,0);
      return itemDate >= fd && itemDate <= td;
    } catch {
      return true;
    }
  };

  const COMPANY_BUDGET_LIMIT = getNoCodeBudgetLimit();
  const activeEntries = driver.fuelEntries.filter(e => !e.companyDeleted);
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  const monthlySpent = activeEntries
    .filter(e => {
      try {
        const itemDate = parseToDate(e.date);
        return itemDate.getMonth() === currentMonth && itemDate.getFullYear() === currentYear;
      } catch {
        return true;
      }
    })
    .reduce((acc, e) => acc + (e.amount || 0), 0);

  const companyBalance = Math.max(0, COMPANY_BUDGET_LIMIT - monthlySpent);
  const isBudgetExceeded = monthlySpent > COMPANY_BUDGET_LIMIT;
  const progressPercent = Math.min(100, (monthlySpent / COMPANY_BUDGET_LIMIT) * 100);

  const allSplits = computeFuelSplit(driver.fuelEntries);
  const filteredSplits = allSplits.filter(se => !se.companyDeleted && isDateInRange(se.date));

  const totalCompanyKWD = filteredSplits.reduce((acc, se) => acc + se.companyAmount, 0);
  const totalAdditionalKWD = filteredSplits.reduce((acc, se) => acc + se.additionalAmount, 0);
  const totalCompanyLitres = totalCompanyKWD / 0.105;
  const totalAdditionalLitres = totalAdditionalKWD / 0.105;
  const totalCompanyKM = filteredSplits.reduce((acc, se) => acc + se.companyDistance, 0);
  const totalAdditionalKM = filteredSplits.reduce((acc, se) => acc + se.additionalDistance, 0);

  const grandTotalKWD = filteredSplits.reduce((acc, se) => acc + se.amount, 0);
  const grandTotalLitres = grandTotalKWD / 0.105;
  const grandTotalKM = filteredSplits.reduce((acc, se) => acc + se.distance, 0);

  const handleAdminClick = () => {
    if (isAdminAuthenticated) {
      onNavigate('fleet-overview');
    } else {
      setShowAdminAuthModal(true);
    }
  };

  const downloadBlob = (content: string, filename: string, contentType: string) => {
    const blob = new Blob([content], { type: contentType + ';charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const printPDF = (title: string, htmlBody: string) => {
    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = '0';
    iframe.style.zIndex = '-9999';
    document.body.appendChild(iframe);

    const iframeDoc = iframe.contentWindow?.document || iframe.contentDocument;
    if (iframeDoc) {
      iframeDoc.write(`
        <html>
        <head>
          <title>${title}</title>
          <style>
            @page { size: A4; margin: 15mm; }
            body { font-family: system-ui, -apple-system, sans-serif; color: #1f2937; line-height: 1.5; margin: 0; padding: 0; }
            .container { max-width: 100%; margin: 0 auto; }
            .header-table { width: 100%; border-collapse: collapse; margin-bottom: 25px; border-bottom: 3px solid #111827; padding-bottom: 12px; }
            .header-title { font-size: 24px; font-weight: 900; color: #111827; text-transform: uppercase; letter-spacing: -0.02em; }
            .header-meta { font-size: 11px; text-transform: uppercase; letter-spacing: 0.1em; color: #4b5563; margin-top: 4px; font-weight: bold; }
            
            .meta-grid { display: grid; grid-template-cols: 1fr 1fr; gap: 15px; margin-bottom: 25px; background: #f9fafb; padding: 15px; border-radius: 12px; border: 1px solid #e5e7eb; }
            .meta-item { font-size: 12px; }
            .meta-label { font-size: 9px; font-weight: bold; color: #6b7280; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 2px; }
            .meta-val { font-weight: 800; color: #111827; }

            table.data-table { width: 100%; border-collapse: collapse; margin-top: 15px; }
            table.data-table th { background: #111827; color: #ffffff; font-size: 11px; font-weight: bold; text-transform: uppercase; border: 1px solid #d1d5db; padding: 10px 12px; text-align: left; }
            table.data-table td { font-size: 12px; border: 1px solid #e5e7eb; padding: 8px 12px; }
            table.data-table tbody tr:nth-child(even) { background-color: #f9fafb; }
            
            .summary-container { margin-top: 30px; border-top: 2px dashed #d1d5db; padding-top: 20px; display: flex; gap: 15px; }
            .summary-card { flex: 1; background-color: #f3f4f6; border: 1px solid #e5e7eb; padding: 12px 18px; border-radius: 8px; }

            .badge-completed { background: #d1fae5; color: #065f46; border: 1px solid #a7f3d0; font-size: 9px; font-weight: 800; text-transform: uppercase; padding: 2px 6px; border-radius: 4px; }
            .badge-ot { background: #fee2e2; color: #991b1b; border: 1px solid #fca5a5; font-size: 9.5px; font-weight: bold; text-transform: uppercase; padding: 2.5px 6.5px; border-radius: 4px; font-family: monospace; }
            
            @media print {
              body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
            }
          </style>
        </head>
        <body>
          <div class="container">
            ${htmlBody}
          </div>
        </body>
        </html>
      `);
      iframeDoc.close();
      
      setTimeout(() => {
        iframe.contentWindow?.focus();
        iframe.contentWindow?.print();
        setTimeout(() => {
          document.body.removeChild(iframe);
        }, 500);
      }, 350);
    }
  };

  const handleDownloadAttendanceReport = () => {
    const resolvedFormat = userRole === 'admin' ? attendanceFormat : 'pdf';
    // 1. Gather filtered logs
    const activeLogs = driver.dutyLogs.filter(log => !log.companyDeleted && isDateInRange(log.date));
    
    // 2. Sort chronologically ascending
    const sortedLogs = [...activeLogs].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    
    const filenameBase = `${driver.name.replace(/\s+/g, '_')}_Attendance_Report_${fromDate}_to_${toDate}`;

    if (resolvedFormat === 'pdf') {
      let totalOvertimeSum = 0;
      let totalHoursSum = 0;
      
      const tableRowsHtml = sortedLogs.map(log => {
        const totalHours = log.totalHours || 0;
        const otHours = totalHours > 8 ? totalHours - 8 : 0;
        totalOvertimeSum += otHours;
        totalHoursSum += totalHours;
        
        return `
          <tr>
            <td>${log.date}</td>
            <td style="font-family: monospace; font-weight: bold;">${log.inTime || 'N/A'}</td>
            <td style="font-family: monospace; font-weight: bold;">${log.outTime || 'N/A'}</td>
            <td style="font-family: monospace;">${totalHours.toFixed(2)} hrs</td>
            <td>
              ${otHours > 0 
                ? `<span class="badge-ot">${otHours.toFixed(2)} hrs</span>` 
                : `<span style="color: #6b7280; font-family: monospace;">0.00 hrs</span>`
              }
            </td>
          </tr>
        `;
      }).join('');

      const pdfHtml = `
        <div class="header-table">
          <div class="header-title">KUWAIT LOGISTICS</div>
          <div class="header-meta">Official Fleet Attendance Record • Verification System</div>
        </div>

        <div class="meta-grid">
          <div class="meta-item">
            <div class="meta-label">Driver / Worker Profile</div>
            <div class="meta-val">${driver.name}</div>
            <div style="font-size: 11px; color: #4b5563;">${driver.email || ''}</div>
          </div>
          <div class="meta-item">
            <div class="meta-label">Fleet Assigned Vehicle</div>
            <div class="meta-val">${carModel}</div>
            <div style="font-size: 11px; color: #4b5563; font-family: monospace;">PLATE: ${getVehiclePlate(driver)}</div>
          </div>
          <div class="meta-item" style="margin-top: 10px;">
            <div class="meta-label">Compiled Date Period</div>
            <div class="meta-val" style="font-family: monospace;">${fromDate} to ${toDate}</div>
          </div>
          <div class="meta-item" style="margin-top: 10px; text-align: right;">
            <div class="meta-label">Security Clearance</div>
            <div class="meta-val" style="color: #059669; font-size: 11px;">✓ LABOUR REGULATION COMPLIANT</div>
          </div>
        </div>

        <h3 style="font-size: 14px; font-weight: 800; border-bottom: 2px solid #e5e7eb; padding-bottom: 6px; text-transform: uppercase; color: #111827; margin-top: 25px;">Chronological Shift Log</h3>
        
        <table class="data-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Punch-In Time</th>
              <th>Punch-Out Time</th>
              <th>Total Hours Worked</th>
              <th>Overtime (OT) Hours</th>
            </tr>
          </thead>
          <tbody>
            ${tableRowsHtml || '<tr><td colspan="5" style="text-align: center; color: #9ca3af; padding: 25px;">No attendance entries in this date range.</td></tr>'}
          </tbody>
        </table>

        <div class="summary-container">
          <div class="summary-card">
            <div class="meta-label">Total Shifts Logged</div>
            <div class="meta-val" style="font-size: 20px; color: #111827;">${sortedLogs.length} <span style="font-size:12px; font-weight:normal;">Days</span></div>
          </div>
          <div class="summary-card">
            <div class="meta-label">Total Hours Worked</div>
            <div class="meta-val" style="font-size: 20px; color: #1e3a8a; font-family: monospace;">${totalHoursSum.toFixed(2)} <span style="font-size:12px; font-weight:normal;">Hrs</span></div>
          </div>
          <div class="summary-card">
            <div class="meta-label">Total Overtime (OT)</div>
            <div class="meta-val" style="font-size: 20px; color: #b91c1c; font-family: monospace;">${totalOvertimeSum.toFixed(2)} <span style="font-size:12px; font-weight:normal;">Hrs</span></div>
          </div>
        </div>

        <div style="margin-top: 50px; font-size: 9px; text-align: center; color: #9ca3af; border-top: 1px solid #e5e7eb; padding-top: 12px; display: flex; justify-content: space-between; align-items: center;">
          <span>HUB SYSTEM AUTOMATED SIGN-OFF</span>
          <span style="font-weight: bold; font-family: monospace;">RUN TIME: 2026-05-20</span>
        </div>
      `;
      
      printPDF(`Attendance_Report_${driver.name}`, pdfHtml);
      showToast("✓ Triggered print engine for Adobe PDF report!");
      return;
    }

    if (resolvedFormat === 'xlsx') {
      let totalOvertimeSum = 0;
      let totalHoursSum = 0;

      let xlsHtml = `
        <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
        <head>
          <meta charset="utf-8">
          <!--[if gte mso 9]><xml><x:ExcelWorkbook><x:ExcelWorksheets><x:ExcelWorksheet><x:Name>Attendance Report</x:Name><x:WorksheetOptions><x:DisplayGridlines/></x:WorksheetOptions></x:ExcelWorksheet></x:ExcelWorksheets></x:ExcelWorkbook></xml><![endif]-->
          <style>
            body { font-family: 'Segoe UI', Arial, sans-serif; }
            table { border-collapse: collapse; width: 100%; border: 1px solid #cbd5e1; }
            th { background-color: #1e3a8a; color: #ffffff; border: 1px solid #cbd5e1; font-weight: bold; padding: 10px; font-size: 13px; text-align: left; }
            td { border: 1px solid #cbd5e1; padding: 8px; font-size: 12px; }
            .header-title { font-size: 18px; font-weight: bold; color: #1e3a8a; padding: 10px 0; border: none; }
            .header-meta { font-size: 11px; color: #475569; padding: 4px 0; border: none; }
            .summary-title { font-weight: bold; background-color: #f8fafc; text-align: left; }
            .summary-row { background-color: #eff6ff; font-weight: bold; color: #1e3a8a; border-top: 2px double #1e3a8a; }
          </style>
        </head>
        <body>
          <table>
            <tr><td colspan="5" class="header-title">KUWAIT LOGISTICS - WORKER ATTENDANCE & OVERTIME REPORT</td></tr>
            <tr><td colspan="5" class="header-meta"><strong>Driver Profile:</strong> ${driver.name} | <strong>Email:</strong> ${driver.email || ''}</td></tr>
            <tr><td colspan="5" class="header-meta"><strong>Vehicle Platform:</strong> ${carModel} | <strong>Plate Code:</strong> ${getVehiclePlate(driver)}</td></tr>
            <tr><td colspan="5" class="header-meta"><strong>Compiled Period:</strong> ${fromDate} to ${toDate}</td></tr>
            <tr><td colspan="5" style="border:none; height: 12px;"></td></tr>
            <thead>
              <tr>
                <th>Date</th>
                <th>Punch-In Time</th>
                <th>Punch-Out Time</th>
                <th>Total Hours Worked</th>
                <th>Overtime (OT) Hours</th>
              </tr>
            </thead>
            <tbody>
      `;

      sortedLogs.forEach(log => {
        const totalHours = log.totalHours || 0;
        const otHours = totalHours > 8 ? totalHours - 8 : 0;
        totalOvertimeSum += otHours;
        totalHoursSum += totalHours;

        xlsHtml += `
          <tr>
            <td>${log.date}</td>
            <td style="font-family: monospace;">${log.inTime || 'N/A'}</td>
            <td style="font-family: monospace;">${log.outTime || 'N/A'}</td>
            <td style="font-family: monospace;">${totalHours.toFixed(2)} hrs</td>
            <td style="font-family: monospace; font-weight: ${otHours > 0 ? 'bold' : 'normal'}; color: ${otHours > 0 ? '#b91c1c' : '#333333'};">${otHours.toFixed(2)} hrs</td>
          </tr>
        `;
      });

      xlsHtml += `
            <tr><td colspan="5" style="border:none; height: 10px;"></td></tr>
            <tr class="summary-row">
              <td colspan="3" class="summary-title">AGGREGATE RESULTS</td>
              <td>Total Hours: ${totalHoursSum.toFixed(2)} hrs</td>
              <td>Total OT: ${totalOvertimeSum.toFixed(2)} hrs</td>
            </tr>
            <tr class="summary-row">
              <td colspan="3" class="summary-title">Total Days Logged: ${sortedLogs.length} Days</td>
              <td colspan="2"></td>
            </tr>
          </tbody>
        </table>
        </body>
        </html>
      `;

      downloadBlob(xlsHtml, `${filenameBase}.xlsx`, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      showToast("✓ Microsoft Excel Attendance Report (.xlsx) downloaded successfully!");
      return;
    }

    if (resolvedFormat === 'docx') {
      let totalOvertimeSum = 0;
      let totalHoursSum = 0;

      let docHtml = `
        <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
        <head>
          <meta charset="utf-8">
          <style>
            @page { size: A4; margin: 1in; }
            body { font-family: 'Calibri', 'Segoe UI', Arial, sans-serif; line-height: 1.5; color: #1e293b; }
            h1 { font-size: 20pt; color: #1e3a8a; font-weight: bold; text-align: center; margin-bottom: 2pt; }
            .header-subtitle { text-align: center; font-size: 9.5pt; color: #64748b; text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 20pt; }
            
            .meta-box { background-color: #f8fafc; border: 1px solid #e2e8f0; padding: 12pt; border-radius: 6px; margin-bottom: 20pt; }
            .meta-title { font-weight: bold; font-size: 9pt; color: #64748b; text-transform: uppercase; }
            .meta-value { font-size: 11pt; color: #0f172a; font-weight: bold; margin-bottom: 6pt; }
            
            table { width: 100%; border-collapse: collapse; margin-top: 15pt; margin-bottom: 15pt; }
            th { background-color: #f1f5f9; color: #0f172a; border: 1px solid #cbd5e1; font-weight: bold; padding: 10px; font-size: 10pt; text-align: left; }
            td { border: 1px solid #cbd5e1; padding: 8px 10px; font-size: 9.5pt; }
            .summary-row { font-weight: bold; background-color: #f8fafc; }
          </style>
        </head>
        <body>
          <h1>KUWAIT LOGISTICS</h1>
          <div class="header-subtitle">Official Fleet Attendance & Overtime Record</div>

          <div class="meta-box">
            <table style="width:100%; border:none; margin:0;">
              <tr>
                <td style="border:none; width:50%; padding:0;">
                  <div class="meta-title">Driver / Worker Profile</div>
                  <div class="meta-value">${driver.name}</div>
                  <div style="font-size:9pt; color:#64748b;">${driver.email || ''}</div>
                </td>
                <td style="border:none; width:50%; padding:0;">
                  <div class="meta-title">Assigned Fleet Vehicle</div>
                  <div class="meta-value">${carModel}</div>
                  <div style="font-size:9pt; color:#64748b; font-family:Consolas, monospace;">PLATE: ${getVehiclePlate(driver)}</div>
                </td>
              </tr>
              <tr>
                <td style="border:none; padding:10pt 0 0 0;" colspan="2">
                  <div class="meta-title">Compiled Period</div>
                  <div class="meta-value" style="font-family:Consolas, monospace; font-size:10pt;">${fromDate} to ${toDate}</div>
                </td>
              </tr>
            </table>
          </div>

          <h2>Detailed Attendance History Table</h2>
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Punch-In Time</th>
                <th>Punch-Out Time</th>
                <th>Total Hours Worked</th>
                <th>Overtime (OT) Hours</th>
              </tr>
            </thead>
            <tbody>
      `;

      sortedLogs.forEach(log => {
        const totalHours = log.totalHours || 0;
        const otHours = totalHours > 8 ? totalHours - 8 : 0;
        totalOvertimeSum += otHours;
        totalHoursSum += totalHours;

        docHtml += `
          <tr>
            <td>${log.date}</td>
            <td style="font-family: Consolas, monospace;">${log.inTime || 'N/A'}</td>
            <td style="font-family: Consolas, monospace;">${log.outTime || 'N/A'}</td>
            <td style="font-family: Consolas, monospace;">${totalHours.toFixed(2)} hrs</td>
            <td style="font-family: Consolas, monospace; color: ${otHours > 0 ? '#b91c1c' : '#333333'}; font-weight: ${otHours > 0 ? 'bold' : 'normal'};">${otHours.toFixed(2)} hrs</td>
          </tr>
        `;
      });

      docHtml += `
            <tr class="summary-row">
              <td colspan="3" style="font-weight: bold; text-transform: uppercase;">Totals Summary Summary</td>
              <td style="font-family: Consolas, monospace; font-weight: bold;">${totalHoursSum.toFixed(2)} hrs</td>
              <td style="font-family: Consolas, monospace; font-weight: bold; color: #b91c1c;">${totalOvertimeSum.toFixed(2)} hrs</td>
            </tr>
            <tr class="summary-row">
              <td colspan="5" style="font-size: 9.5pt; color: #475569;">Total Working Days Recorded: <strong>${sortedLogs.length} Days</strong></td>
            </tr>
          </tbody>
        </table>

        <div style="margin-top: 40pt; border-top: 1pt solid #cbd5e1; padding-top: 10pt; font-size: 8.5pt; color: #94a3b8; text-align: center;">
          This is an automated administrative decree from Kuwait Logistics Hub verification protocols.
        </div>
        </body>
        </html>
      `;

      downloadBlob(docHtml, `${filenameBase}.docx`, 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
      showToast("✓ Microsoft Word Attendance Report (.docx) downloaded successfully!");
      return;
    }
  };

  const handleDownloadVehicleFuelReport = (filterType?: 'fuel' | 'odometer') => {
    const resolvedFormat = userRole === 'admin' 
      ? (filterType === 'fuel' ? fuelFormat : odometerFormat) 
      : 'pdf';
    // 1. Gather all unique dates of trips or fuel entries in the selected range
    const datesSet = new Set<string>();
    if (!filterType || filterType === 'odometer') {
      driver.trips.filter(t => !t.companyDeleted && isDateInRange(t.date)).forEach(t => datesSet.add(t.date));
    }
    if (!filterType || filterType === 'fuel') {
      driver.fuelEntries.filter(e => !e.companyDeleted && isDateInRange(e.date)).forEach(e => datesSet.add(e.date));
    }
    
    // Sort dates ascending
    const sortedDates = Array.from(datesSet).sort((a, b) => new Date(a).getTime() - new Date(b).getTime());
    
    let filenameBase = `${driver.name.replace(/\s+/g, '_')}_Vehicle_Fuel_Report_${fromDate}_to_${toDate}`;
    if (filterType === 'fuel') {
      filenameBase = `${driver.name.replace(/\s+/g, '_')}_Fuel_Report_${fromDate}_to_${toDate}`;
    } else if (filterType === 'odometer') {
      filenameBase = `${driver.name.replace(/\s+/g, '_')}_Odometer_Report_${fromDate}_to_${toDate}`;
    }

    if (resolvedFormat === 'pdf') {
      let totalRunningKm = 0;
      let totalFuelLiters = 0;
      let totalAmountKWD = 0;

      const tableRowsHtml = sortedDates.map(dStr => {
        const dayTrips = driver.trips.filter(t => !t.companyDeleted && t.date === dStr);
        const dayFuel = driver.fuelEntries.filter(e => !e.companyDeleted && e.date === dStr);
        
        const startOdo = dayTrips.length > 0 ? Math.min(...dayTrips.map(t => t.startKm)) : null;
        const endOdo = dayTrips.length > 0 ? Math.max(...dayTrips.map(t => t.endKm)) : null;
        const runningKm = dayTrips.reduce((acc, t) => acc + (t.distance || 0), 0);
        const fuelLiters = dayFuel.reduce((acc, e) => acc + (e.liters || 0), 0);
        const fuelAmount = dayFuel.reduce((acc, e) => acc + (e.amount || 0), 0);
        
        totalRunningKm += runningKm;
        totalFuelLiters += fuelLiters;
        totalAmountKWD += fuelAmount;

        if (filterType === 'fuel') {
          return `
            <tr>
              <td>${dStr}</td>
              <td style="font-family: monospace;">${endOdo !== null ? `${endOdo.toLocaleString()} KM` : '---'}</td>
              <td style="font-family: monospace;">${fuelLiters > 0 ? `${fuelLiters.toFixed(2)} L` : '0.00 L'}</td>
              <td style="font-family: monospace; font-weight: bold; color: #1e3a8a;">${fuelAmount > 0 ? `${fuelAmount.toFixed(3)} KD` : '0.000 KD'}</td>
            </tr>
          `;
        } else if (filterType === 'odometer') {
          return `
            <tr>
              <td>${dStr}</td>
              <td style="font-family: monospace;">${startOdo !== null ? startOdo : '---'}</td>
              <td style="font-family: monospace;">${endOdo !== null ? endOdo : '---'}</td>
              <td style="font-family: monospace; font-weight: bold; color: #047857;">${runningKm > 0 ? `${runningKm.toLocaleString()} KM` : '0 KM'}</td>
            </tr>
          `;
        } else {
          return `
            <tr>
              <td>${dStr}</td>
              <td style="font-family: monospace;">${startOdo !== null ? startOdo : '---'}</td>
              <td style="font-family: monospace;">${endOdo !== null ? endOdo : '---'}</td>
              <td style="font-family: monospace; font-weight: bold; color: #047857;">${runningKm > 0 ? `${runningKm.toLocaleString()} KM` : '0 KM'}</td>
              <td style="font-family: monospace;">${fuelLiters > 0 ? `${fuelLiters.toFixed(2)} L` : '0.00 L'}</td>
              <td style="font-family: monospace; font-weight: bold; color: #1e3a8a;">${fuelAmount > 0 ? `${fuelAmount.toFixed(3)} KD` : '0.000 KD'}</td>
            </tr>
          `;
        }
      }).join('');

      let titleLabel = "Vehicle Running & Fuel Segregation Report";
      if (filterType === 'fuel') {
        titleLabel = "Fuel Consumption & Segregation Report";
      } else if (filterType === 'odometer') {
        titleLabel = "Vehicle Running & Mileage Tracker Report";
      }

      let subSectionTitle = "Daily Running & Fuel Entries";
      if (filterType === 'fuel') subSectionTitle = "Daily Fuel Entries";
      if (filterType === 'odometer') subSectionTitle = "Daily Mileage & Odometer Logs";

      const tableHeaderHtml = filterType === 'fuel' ? `
              <tr>
                <th>Date</th>
                <th>Odometer Current</th>
                <th>Fuel Liters</th>
                <th>Total Cost (KWD)</th>
              </tr>
      ` : filterType === 'odometer' ? `
              <tr>
                <th>Date</th>
                <th>Start Odo</th>
                <th>End Odo</th>
                <th>Distance Run</th>
              </tr>
      ` : `
              <tr>
                <th>Date</th>
                <th>Start Odo</th>
                <th>End Odo</th>
                <th>Distance Run</th>
                <th>Fuel Liters</th>
                <th>Total Cost (KWD)</th>
              </tr>
      `;

      const summaryCardsHtml = filterType === 'fuel' ? `
          <div class="summary-card">
            <div class="meta-label">Total Fuel Loaded</div>
            <div class="meta-val" style="font-size: 20px; color: #111827; font-family: monospace;">${totalFuelLiters.toFixed(2)} <span style="font-size:12px; font-weight:normal;">L</span></div>
          </div>
          <div class="summary-card">
            <div class="meta-label">Total Fuel Cost</div>
            <div class="meta-val" style="font-size: 20px; color: #1e3a8a; font-family: monospace;">${totalAmountKWD.toFixed(3)} <span style="font-size:12px; font-weight:normal;">KD</span></div>
          </div>
      ` : filterType === 'odometer' ? `
          <div class="summary-card">
            <div class="meta-label">Total Running Distance</div>
            <div class="meta-val" style="font-size: 20px; color: #047857; font-family: monospace;">${totalRunningKm.toLocaleString()} <span style="font-size:12px; font-weight:normal;">KM</span></div>
          </div>
      ` : `
          <div class="summary-card">
            <div class="meta-label">Total Running Distance</div>
            <div class="meta-val" style="font-size: 20px; color: #047857; font-family: monospace;">${totalRunningKm.toLocaleString()} <span style="font-size:12px; font-weight:normal;">KM</span></div>
          </div>
          <div class="summary-card">
            <div class="meta-label">Total Fuel Loaded</div>
            <div class="meta-val" style="font-size: 20px; color: #111827; font-family: monospace;">${totalFuelLiters.toFixed(2)} <span style="font-size:12px; font-weight:normal;">L</span></div>
          </div>
          <div class="summary-card">
            <div class="meta-label">Total Fuel Cost</div>
            <div class="meta-val" style="font-size: 20px; color: #1e3a8a; font-family: monospace;">${totalAmountKWD.toFixed(3)} <span style="font-size:12px; font-weight:normal;">KD</span></div>
          </div>
      `;

      const colSpanCount = filterType === 'fuel' ? 4 : filterType === 'odometer' ? 4 : 6;

      const pdfHtml = `
        <div class="header-table">
          <div class="header-title">KUWAIT LOGISTICS</div>
          <div class="header-meta">${titleLabel}</div>
        </div>

        <div class="meta-grid">
          <div class="meta-item">
            <div class="meta-label">Driver Assigned</div>
            <div class="meta-val">${driver.name}</div>
            <div style="font-size: 11px; color: #4b5563;">${driver.email || ''}</div>
          </div>
          <div class="meta-item">
            <div class="meta-label">Vehicle Base</div>
            <div class="meta-val">${carModel}</div>
            <div style="font-size: 11px; color: #4b5563; font-family: monospace;">PLATE: ${getVehiclePlate(driver)}</div>
          </div>
          <div class="meta-item" style="margin-top: 10px;">
            <div class="meta-label">Compiled Range</div>
            <div class="meta-val" style="font-family: monospace;">${fromDate} to ${toDate}</div>
          </div>
          <div class="meta-item" style="margin-top: 10px; text-align: right;">
            <div class="meta-label">Report Status</div>
            <div class="meta-val" style="color: #047857; font-size: 11px;">✓ SYSTEM GENERATED & VERIFIED</div>
          </div>
        </div>

        <h3 style="font-size: 14px; font-weight: 800; border-bottom: 2px solid #e5e7eb; padding-bottom: 6px; text-transform: uppercase; color: #111827; margin-top: 25px;">${subSectionTitle}</h3>
        
        <table class="data-table">
          <thead>
            ${tableHeaderHtml}
          </thead>
          <tbody>
            ${tableRowsHtml || `<tr><td colspan="${colSpanCount}" style="text-align: center; color: #9ca3af; padding: 25px;">No active entries in this range.</td></tr>`}
          </tbody>
        </table>

        <div class="summary-container">
          ${summaryCardsHtml}
        </div>

        <div style="margin-top: 50px; font-size: 9px; text-align: center; color: #9ca3af; border-top: 1px solid #e5e7eb; padding-top: 12px; display: flex; justify-content: space-between; align-items: center;">
          <span>FLEET LOGISTICS CONTROL CENTRE</span>
          <span style="font-weight: bold; font-family: monospace;">DATE: 2026-05-20</span>
        </div>
      `;
      
      printPDF(`${filenameBase}`, pdfHtml);
      showToast("✓ Triggered print engine for Adobe PDF report!");
      return;
    }

    if (resolvedFormat === 'xlsx') {
      let totalRunningKm = 0;
      let totalFuelLiters = 0;
      let totalAmountKWD = 0;

      let titleLabel = "KUWAIT LOGISTICS - VEHICLE RUNNING & FUEL REPORT";
      if (filterType === 'fuel') titleLabel = "KUWAIT LOGISTICS - FUEL CONSUMPTION REPORT";
      if (filterType === 'odometer') titleLabel = "KUWAIT LOGISTICS - ODOMETER & MILEAGE REPORT";

      const tableHeaderHtml = filterType === 'fuel' ? `
              <tr>
                <th>Date</th>
                <th>Odometer Current (KM)</th>
                <th>Fuel Liters</th>
                <th>Amount (KWD)</th>
              </tr>
      ` : filterType === 'odometer' ? `
              <tr>
                <th>Date</th>
                <th>Start Odometer</th>
                <th>End Odometer</th>
                <th>Daily Running KM</th>
              </tr>
      ` : `
              <tr>
                <th>Date</th>
                <th>Start Odometer</th>
                <th>End Odometer</th>
                <th>Daily Running KM</th>
                <th>Fuel Liters</th>
                <th>Amount (KWD)</th>
              </tr>
      `;

      const colSpanCount = filterType === 'fuel' ? 4 : filterType === 'odometer' ? 4 : 6;

      let xlsHtml = `
        <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
        <head>
          <meta charset="utf-8">
          <!--[if gte mso 9]><xml><x:ExcelWorkbook><x:ExcelWorksheets><x:ExcelWorksheet><x:Name>Vehicle Fuel Log</x:Name><x:WorksheetOptions><x:DisplayGridlines/></x:WorksheetOptions></x:ExcelWorksheet></x:ExcelWorksheets></x:ExcelWorkbook></xml><![endif]-->
          <style>
            body { font-family: 'Segoe UI', Arial, sans-serif; }
            table { border-collapse: collapse; width: 100%; border: 1px solid #cbd5e1; }
            th { background-color: #047857; color: #ffffff; border: 1px solid #cbd5e1; font-weight: bold; padding: 10px; font-size: 13px; text-align: left; }
            td { border: 1px solid #cbd5e1; padding: 8px; font-size: 12px; }
            .header-title { font-size: 18px; font-weight: bold; color: #047857; padding: 10px 0; border: none; }
            .header-meta { font-size: 11px; color: #475569; padding: 4px 0; border: none; }
            .summary-title { font-weight: bold; background-color: #f8fafc; text-align: left; }
            .summary-row { background-color: #ecfdf5; font-weight: bold; color: #047857; border-top: 2px double #047857; }
          </style>
        </head>
        <body>
          <table>
            <tr><td colspan="${colSpanCount}" class="header-title">${titleLabel}</td></tr>
            <tr><td colspan="${colSpanCount}" class="header-meta"><strong>Driver Profile:</strong> ${driver.name} | <strong>Email:</strong> ${driver.email || ''}</td></tr>
            <tr><td colspan="${colSpanCount}" class="header-meta"><strong>Vehicle Platform:</strong> ${carModel} | <strong>Plate Code:</strong> ${getVehiclePlate(driver)}</td></tr>
            <tr><td colspan="${colSpanCount}" class="header-meta"><strong>Compiled Period:</strong> ${fromDate} to ${toDate}</td></tr>
            <tr><td colspan="${colSpanCount}" style="border:none; height: 12px;"></td></tr>
            <thead>
              ${tableHeaderHtml}
            </thead>
            <tbody>
      `;

      sortedDates.forEach(dStr => {
        const dayTrips = driver.trips.filter(t => !t.companyDeleted && t.date === dStr);
        const dayFuel = driver.fuelEntries.filter(e => !e.companyDeleted && e.date === dStr);
        
        const startOdo = dayTrips.length > 0 ? Math.min(...dayTrips.map(t => t.startKm)) : null;
        const endOdo = dayTrips.length > 0 ? Math.max(...dayTrips.map(t => t.endKm)) : null;
        const runningKm = dayTrips.reduce((acc, t) => acc + (t.distance || 0), 0);
        const fuelLiters = dayFuel.reduce((acc, e) => acc + (e.liters || 0), 0);
        const fuelAmount = dayFuel.reduce((acc, e) => acc + (e.amount || 0), 0);
        
        totalRunningKm += runningKm;
        totalFuelLiters += fuelLiters;
        totalAmountKWD += fuelAmount;

        if (filterType === 'fuel') {
          xlsHtml += `
            <tr>
              <td>${dStr}</td>
              <td style="font-family: monospace;">${endOdo !== null ? endOdo : '---'} KM</td>
              <td style="font-family: monospace;">${fuelLiters > 0 ? fuelLiters.toFixed(2) : '0.00'} L</td>
              <td style="font-family: monospace; font-weight: bold; color: #1e3a8a;">${fuelAmount > 0 ? fuelAmount.toFixed(3) : '0.000'} KD</td>
            </tr>
          `;
        } else if (filterType === 'odometer') {
          xlsHtml += `
            <tr>
              <td>${dStr}</td>
              <td style="font-family: monospace;">${startOdo !== null ? startOdo : '---'}</td>
              <td style="font-family: monospace;">${endOdo !== null ? endOdo : '---'}</td>
              <td style="font-family: monospace; font-weight: bold;">${runningKm > 0 ? runningKm : '0'} KM</td>
            </tr>
          `;
        } else {
          xlsHtml += `
            <tr>
              <td>${dStr}</td>
              <td style="font-family: monospace;">${startOdo !== null ? startOdo : '---'}</td>
              <td style="font-family: monospace;">${endOdo !== null ? endOdo : '---'}</td>
              <td style="font-family: monospace; font-weight: bold;">${runningKm > 0 ? runningKm : '0'} KM</td>
              <td style="font-family: monospace;">${fuelLiters > 0 ? fuelLiters.toFixed(2) : '0.00'} L</td>
              <td style="font-family: monospace; font-weight: bold; color: #1e3a8a;">${fuelAmount > 0 ? fuelAmount.toFixed(3) : '0.000'} KD</td>
            </tr>
          `;
        }
      });

      const aggregateRowHtml = filterType === 'fuel' ? `
            <tr class="summary-row">
              <td colspan="2" class="summary-title">AGGREGATE RESULTS</td>
              <td>Total Liters: ${totalFuelLiters.toFixed(2)} L</td>
              <td>Total Cost: ${totalAmountKWD.toFixed(3)} KD</td>
            </tr>
      ` : filterType === 'odometer' ? `
            <tr class="summary-row">
              <td colspan="3" class="summary-title">AGGREGATE RESULTS</td>
              <td>Total KM: ${totalRunningKm} KM</td>
            </tr>
      ` : `
            <tr class="summary-row">
              <td colspan="3" class="summary-title">AGGREGATE RESULTS</td>
              <td>Total KM: ${totalRunningKm} KM</td>
              <td>Total Liters: ${totalFuelLiters.toFixed(2)} L</td>
              <td>Total Cost: ${totalAmountKWD.toFixed(3)} KD</td>
            </tr>
      `;

      xlsHtml += `
            <tr><td colspan="${colSpanCount}" style="border:none; height: 10px;"></td></tr>
            ${aggregateRowHtml}
          </tbody>
        </table>
        </body>
        </html>
      `;

      downloadBlob(xlsHtml, `${filenameBase}.xlsx`, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      showToast(`✓ Microsoft Excel Report (.xlsx) downloaded successfully!`);
      return;
    }

    if (resolvedFormat === 'docx') {
      let totalRunningKm = 0;
      let totalFuelLiters = 0;
      let totalAmountKWD = 0;

      let titleLabel = "Official Vehicle Running & Fuel Segregation Record";
      if (filterType === 'fuel') titleLabel = "Official Fuel Consumption & Spent Record";
      if (filterType === 'odometer') titleLabel = "Official Vehicle Mileage & Odometer Record";

      const tableHeaderHtml = filterType === 'fuel' ? `
              <tr>
                <th>Date</th>
                <th>Odometer Current (KM)</th>
                <th>Fuel Liters</th>
                <th>Amount (KWD)</th>
              </tr>
      ` : filterType === 'odometer' ? `
              <tr>
                <th>Date</th>
                <th>Start Odo</th>
                <th>End Odo</th>
                <th>Distance (KM)</th>
              </tr>
      ` : `
              <tr>
                <th>Date</th>
                <th>Start Odo</th>
                <th>End Odo</th>
                <th>Distance (KM)</th>
                <th>Fuel Liters</th>
                <th>Amount (KWD)</th>
              </tr>
      `;

      const colSpanCount = filterType === 'fuel' ? 4 : filterType === 'odometer' ? 4 : 6;

      let docHtml = `
        <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
        <head>
          <meta charset="utf-8">
          <style>
            @page { size: A4; margin: 1in; }
            body { font-family: 'Calibri', 'Segoe UI', Arial, sans-serif; line-height: 1.5; color: #1e293b; }
            h1 { font-size: 20pt; color: #047857; font-weight: bold; text-align: center; margin-bottom: 2pt; }
            .header-subtitle { text-align: center; font-size: 9.5pt; color: #64748b; text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 20pt; }
            
            .meta-box { background-color: #f0fdf4; border: 1px solid #bbf7d0; padding: 12pt; border-radius: 6px; margin-bottom: 20pt; }
            .meta-title { font-weight: bold; font-size: 9pt; color: #047857; text-transform: uppercase; }
            .meta-value { font-size: 11pt; color: #0f172a; font-weight: bold; margin-bottom: 6pt; }
            
            table { width: 100%; border-collapse: collapse; margin-top: 15pt; margin-bottom: 15pt; }
            th { background-color: #f1f5f9; color: #0f172a; border: 1px solid #cbd5e1; font-weight: bold; padding: 10px; font-size: 10pt; text-align: left; }
            td { border: 1px solid #cbd5e1; padding: 8px 10px; font-size: 9.5pt; }
            .summary-row { font-weight: bold; background-color: #f8fafc; }
          </style>
        </head>
        <body>
          <h1>KUWAIT LOGISTICS</h1>
          <div class="header-subtitle">${titleLabel}</div>

          <div class="meta-box">
            <table style="width:100%; border:none; margin:0;">
              <tr>
                <td style="border:none; width:50%; padding:0;">
                  <div class="meta-title">Driver / Fleet Staff</div>
                  <div class="meta-value">${driver.name}</div>
                  <div style="font-size:9pt; color:#64748b;">${driver.email || ''}</div>
                </td>
                <td style="border:none; width:50%; padding:0;">
                  <div class="meta-title">Assigned Fleet Vehicle</div>
                  <div class="meta-value">${carModel}</div>
                  <div style="font-size:9pt; color:#64748b; font-family:Consolas, monospace;">PLATE: ${getVehiclePlate(driver)}</div>
                </td>
              </tr>
              <tr>
                <td style="border:none; padding:10pt 0 0 0;" colspan="2">
                  <div class="meta-title">Compiled Period</div>
                  <div class="meta-value" style="font-family:Consolas, monospace; font-size:10pt;">${fromDate} to ${toDate}</div>
                </td>
              </tr>
            </table>
          </div>

          <h2>Detailed Report Table</h2>
          <table>
            <thead>
              ${tableHeaderHtml}
            </thead>
            <tbody>
      `;

      sortedDates.forEach(dStr => {
        const dayTrips = driver.trips.filter(t => !t.companyDeleted && t.date === dStr);
        const dayFuel = driver.fuelEntries.filter(e => !e.companyDeleted && e.date === dStr);
        
        const startOdo = dayTrips.length > 0 ? Math.min(...dayTrips.map(t => t.startKm)) : null;
        const endOdo = dayTrips.length > 0 ? Math.max(...dayTrips.map(t => t.endKm)) : null;
        const runningKm = dayTrips.reduce((acc, t) => acc + (t.distance || 0), 0);
        const fuelLiters = dayFuel.reduce((acc, e) => acc + (e.liters || 0), 0);
        const fuelAmount = dayFuel.reduce((acc, e) => acc + (e.amount || 0), 0);
        
        totalRunningKm += runningKm;
        totalFuelLiters += fuelLiters;
        totalAmountKWD += fuelAmount;

        if (filterType === 'fuel') {
          docHtml += `
            <tr>
              <td>${dStr}</td>
              <td style="font-family: Consolas, monospace;">${endOdo !== null ? `${endOdo} KM` : '---'}</td>
              <td style="font-family: Consolas, monospace;">${fuelLiters > 0 ? fuelLiters.toFixed(2) : '0.00'} L</td>
              <td style="font-family: Consolas, monospace; font-weight: bold; color: #1e3a8a;">${fuelAmount > 0 ? fuelAmount.toFixed(3) : '0.000'} KD</td>
            </tr>
          `;
        } else if (filterType === 'odometer') {
          docHtml += `
            <tr>
              <td>${dStr}</td>
              <td style="font-family: Consolas, monospace;">${startOdo !== null ? startOdo : '---'}</td>
              <td style="font-family: Consolas, monospace;">${endOdo !== null ? endOdo : '---'}</td>
              <td style="font-family: Consolas, monospace; font-weight: bold;">${runningKm > 0 ? runningKm : '0'} KM</td>
            </tr>
          `;
        } else {
          docHtml += `
            <tr>
              <td>${dStr}</td>
              <td style="font-family: Consolas, monospace;">${startOdo !== null ? startOdo : '---'}</td>
              <td style="font-family: Consolas, monospace;">${endOdo !== null ? endOdo : '---'}</td>
              <td style="font-family: Consolas, monospace; font-weight: bold;">${runningKm > 0 ? runningKm : '0'} KM</td>
              <td style="font-family: Consolas, monospace;">${fuelLiters > 0 ? fuelLiters.toFixed(2) : '0.00'} L</td>
              <td style="font-family: Consolas, monospace; font-weight: bold; color: #1e3a8a;">${fuelAmount > 0 ? fuelAmount.toFixed(3) : '0.000'} KD</td>
            </tr>
          `;
        }
      });

      const totalsRowHtml = filterType === 'fuel' ? `
            <tr class="summary-row">
              <td colspan="2" style="font-weight: bold; text-transform: uppercase;">Totals Summary</td>
              <td style="font-family: Consolas, monospace; font-weight: bold;">${totalFuelLiters.toFixed(2)} L</td>
              <td style="font-family: Consolas, monospace; font-weight: bold; color: #1e3a8a;">${totalAmountKWD.toFixed(3)} KD</td>
            </tr>
      ` : filterType === 'odometer' ? `
            <tr class="summary-row">
              <td colspan="3" style="font-weight: bold; text-transform: uppercase;">Totals Summary</td>
              <td style="font-family: Consolas, monospace; font-weight: bold;">${totalRunningKm.toLocaleString()} KM</td>
            </tr>
      ` : `
            <tr class="summary-row">
              <td colspan="3" style="font-weight: bold; text-transform: uppercase;">Totals Summary</td>
              <td style="font-family: Consolas, monospace; font-weight: bold;">${totalRunningKm.toLocaleString()} KM</td>
              <td style="font-family: Consolas, monospace; font-weight: bold;">${totalFuelLiters.toFixed(2)} L</td>
              <td style="font-family: Consolas, monospace; font-weight: bold; color: #1e3a8a;">${totalAmountKWD.toFixed(3)} KD</td>
            </tr>
      `;

      docHtml += `
            ${totalsRowHtml}
          </tbody>
        </table>

        <div style="margin-top: 40pt; border-top: 1pt solid #cbd5e1; padding-top: 10pt; font-size: 8.5pt; color: #94a3b8; text-align: center;">
          Official automated logistics summary from Kuwait Logistics verification systems.
        </div>
        </body>
        </html>
      `;

      downloadBlob(docHtml, `${filenameBase}.docx`, 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
      showToast(`✓ Microsoft Word Report (.docx) downloaded successfully!`);
      return;
    }
  };

  // Dynamic Shift and Attendance helper definitions based on state
  const getShiftState = () => {
    if (currentSession?.active) {
      return {
        label: 'ON DUTY',
        statusClass: 'text-success bg-success/10 border border-success/20',
        dotClass: 'bg-success',
        buttonLabel: 'END DUTY',
        buttonClass: 'bg-danger shadow-danger/20 hover:bg-neutral-800'
      };
    }
    
    // Check if the user has a punch log today (either in local locale date format or standard ISO)
    const todayStr_iso = new Date().toISOString().split('T')[0];
    const todayStr_locale = new Date().toLocaleDateString();
    
    const hasPunchedToday = driver?.dutyLogs?.some((log: any) => {
      return log.date === todayStr_locale || log.date === todayStr_iso || (log.date && log.date.includes(todayStr_iso));
    });

    if (hasPunchedToday) {
      return {
        label: 'DUTY ENDED',
        statusClass: 'text-amber-500 bg-amber-500/10 border border-amber-500/20',
        dotClass: 'bg-amber-500',
        buttonLabel: 'START DUTY',
        buttonClass: 'bg-success shadow-success/20 hover:brightness-110'
      };
    }

    // Default: OFF DUTY (Red)
    return {
      label: 'OFF DUTY',
      statusClass: 'text-danger bg-danger/10 border border-danger/20',
      dotClass: 'bg-danger',
      buttonLabel: 'START DUTY',
      buttonClass: 'bg-success shadow-success/20 hover:brightness-110'
    };
  };

  const shiftState = getShiftState();

  return (
    <motion.div
      key="dashboard"
      initial={{ opacity: 0, scale: 1.02 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.98 }}
      className="p-6 md:p-12 space-y-10 flex-1 flex flex-col"
    >
      <header className="flex flex-col md:flex-row md:items-start justify-between gap-6 pb-6 border-b border-neutral-100">
        <div className="space-y-1">
          <p className="text-[10px] font-black uppercase text-accent tracking-[0.2em]">Logged in as {userRole}</p>
          <h1 className="text-4xl md:text-5xl font-black leading-[0.9] tracking-tighter uppercase">
            Logistics Portal
          </h1>
        </div>
        <div className="flex items-center gap-2">
          {userRole === 'admin' && (
            <button 
              onClick={() => setShowNfcScanner(true)}
              className="p-3 bg-white border border-neutral-200 rounded-xl hover:bg-ink hover:text-white transition-all shadow-sm"
              title="Scan Worker Card"
            >
              <Nfc size={20} />
            </button>
          )}
          {userRole === 'admin' && (
            <button 
              onClick={handleAdminClick}
              className="p-3 bg-white border border-neutral-200 rounded-xl hover:bg-ink hover:text-white transition-all shadow-sm"
              title="Fleet Overview"
            >
              <Settings size={20} />
            </button>
          )}
          <button 
            onClick={onLogout}
            className="p-3 bg-white border border-neutral-200 rounded-xl hover:bg-danger hover:text-white transition-all shadow-sm"
            title="Logout"
          >
            <User size={20} />
          </button>
        </div>
      </header>

      {/* Internal Tabs */}
      <div className="flex gap-4 border-b border-neutral-100 pb-4">
        <button 
          onClick={() => setActiveTab('overview')}
          className={`text-[12px] font-black uppercase tracking-widest pb-2 border-b-2 transition-all ${activeTab === 'overview' ? 'border-ink text-ink' : 'border-transparent text-neutral-300'}`}
        >
          My Vehicle
        </button>
        <button 
          onClick={() => setActiveTab('profile')}
          className={`text-[12px] font-black uppercase tracking-widest pb-2 border-b-2 transition-all ${activeTab === 'profile' ? 'border-ink text-ink' : 'border-transparent text-neutral-300'}`}
        >
          My Profile
        </button>
      </div>

      <AnimatePresence mode="wait">
        {activeTab === 'overview' ? (
          activeSubScreen === 'attendance' ? (
            <motion.div
              key="attendance-subscreen"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="space-y-8 flex-1"
            >
              {/* Header / Back */}
              <div className="flex items-center gap-4">
                <button 
                  onClick={() => setActiveSubScreen(null)} 
                  className="p-3 border border-neutral-200 rounded-xl hover:bg-neutral-100 transition-colors"
                >
                  <ChevronLeft size={20} />
                </button>
                <div>
                  <h2 className="text-xl font-black uppercase tracking-tight">Shift Attendance</h2>
                  <p className="text-[10px] font-bold text-neutral-400">PUNCH IN/OUT & ABSENCE BYPASS</p>
                </div>
              </div>

              {/* Digital Live Clock Widget */}
              <div className="bg-ink text-white p-8 rounded-3xl text-center space-y-2 shadow-xl shadow-ink/10 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-3xl translate-x-10 -translate-y-10" />
                <p className="text-[10px] font-bold text-neutral-500 uppercase tracking-[0.2em] font-mono">
                  {currentTime.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                </p>
                <p className="text-5xl md:text-6xl font-black tracking-tighter font-mono text-white">
                  {currentTime.toLocaleTimeString('en-US', { hour12: true })}
                </p>
                <div className="flex justify-center items-center gap-2 pt-2">
                  <span className="w-2 h-2 rounded-full bg-success animate-ping" />
                  <span className="text-[9px] font-bold text-neutral-400 uppercase tracking-widest font-mono">
                    Time Server Synced
                  </span>
                </div>
              </div>

              {/* Punch Form */}
              <div className="bg-white border border-neutral-200 rounded-3xl p-6 md:p-8 space-y-6 shadow-sm">
                <div className="flex justify-between items-center">
                  <div className="space-y-1">
                    <p className="text-[10px] font-black uppercase text-neutral-400 tracking-widest">Attendance Status</p>
                    <p className={`text-xl font-black uppercase px-2.5 py-1 rounded-lg text-center inline-block ${shiftState.statusClass}`}>
                      {shiftState.label}
                    </p>
                  </div>
                  {currentSession.active ? (
                    <div className="text-right space-y-1">
                      <p className="text-[9px] font-black uppercase text-neutral-400 tracking-widest">Driver Identity</p>
                      <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 px-3 py-2 rounded-xl font-mono text-xs font-bold whitespace-nowrap">
                        Name: <span className="font-extrabold text-emerald-700">{driverName}</span> | File: <span className="font-extrabold text-emerald-700">{driver.id === '1' ? '4248' : (driver.id === '2' ? '5129' : (driver.id === '3' ? '6812' : '42' + driver.id))}</span>
                      </div>
                    </div>
                  ) : (
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${shiftState.dotClass} text-white shadow-lg`}>
                      <Clock size={24} />
                    </div>
                  )}
                </div>

                <div className="bg-neutral-50 p-5 rounded-2xl border border-neutral-100 space-y-3">
                  <div className="flex items-center gap-3">
                    <Shield size={16} className="text-accent" />
                    <p className="text-[10px] font-black uppercase tracking-wider text-neutral-600">Camera & NFC Restriction Bypass</p>
                  </div>
                  <p className="text-[11px] font-medium text-neutral-400 leading-relaxed">
                    This terminal operates with strict camera restrictions. Attendance logs are safely registered locally with manual verification, bypassing device-level triggers.
                  </p>
                  <div className="flex gap-2">
                    <span className="bg-neutral-200/60 text-neutral-600 text-[8px] font-black uppercase px-2 py-1 rounded tracking-widest">CAMERA BYPASSED</span>
                    <span className="bg-neutral-200/60 text-neutral-600 text-[8px] font-black uppercase px-2 py-1 rounded tracking-widest">OFFLINE SAFE</span>
                  </div>
                </div>

                {currentSession.active && currentSession.startTime && (
                  <div className="bg-neutral-50 px-5 py-4 rounded-xl flex justify-between items-center">
                    <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">Shift Started At</span>
                    <span className="font-mono font-bold text-xs">{new Date(currentSession.startTime).toLocaleTimeString()}</span>
                  </div>
                )}

                <div className="flex gap-4">
                  {!currentSession.active ? (
                    <button 
                      onClick={() => {
                        onStartDuty();
                        showToast("Punch In Registered: Shift is live.");
                      }}
                      className="flex-1 bg-success text-white py-6 rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-xl shadow-success/20 hover:brightness-110 active:scale-95 transition-all text-center flex items-center justify-center gap-2"
                    >
                      <ArrowUpRight size={16} /> START DUTY
                    </button>
                  ) : (
                    <button 
                      onClick={() => {
                        setShowEndDutyConfirm(true);
                      }}
                      className="flex-1 bg-danger text-white py-6 rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-xl shadow-danger/20 hover:brightness-110 active:scale-95 transition-all text-center flex items-center justify-center gap-2"
                    >
                      <Clock size={16} /> END DUTY
                    </button>
                  )}
                </div>
              </div>

              {/* Attendance Log List */}
              <div className="space-y-4">
                <p className="text-[10px] font-black uppercase tracking-widest text-neutral-400 px-1">Recent Attendance Punches</p>
                <div className="space-y-3">
                  {driver.dutyLogs && driver.dutyLogs.filter(log => !log.companyDeleted).slice(0, 5).map(log => (
                    <div key={log.id} className="bg-white border border-neutral-200 p-5 rounded-2xl flex items-center justify-between shadow-sm hover:border-neutral-300 transition-all">
                      <div className="space-y-1">
                        <p className="font-black text-sm">{log.date}</p>
                        <p className="text-[9px] font-black uppercase tracking-widest text-neutral-400">
                          In: {log.inTime} • Out: {log.outTime || 'Live'}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-black text-xs">{log.totalHours.toFixed(2)} hrs</p>
                        <span className="text-[8px] font-bold bg-neutral-100 text-neutral-400 px-2 py-0.5 rounded">Duration</span>
                      </div>
                    </div>
                  ))}
                  {(!driver.dutyLogs || driver.dutyLogs.filter(log => !log.companyDeleted).length === 0) && (
                    <div className="py-10 bg-white border border-dashed border-neutral-200 rounded-2xl text-center">
                      <p className="text-[10px] font-black uppercase text-neutral-400 tracking-widest">No shift records found</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Attendance Report Download Container */}
              <div className="bg-white border border-neutral-200 rounded-3xl p-6 md:p-8 space-y-4 shadow-sm text-left mt-6">
                <div>
                  <h3 className="text-sm font-black uppercase tracking-tight text-ink">Download Attendance Report</h3>
                  <p className="text-[10px] text-neutral-450 uppercase font-bold tracking-wider">Configure export range and file format protocols</p>
                </div>
                
                <div className="grid grid-cols-2 gap-4 pb-2">
                  <div className="space-y-1">
                    <label className="text-[9px] font-black text-neutral-450 uppercase tracking-widest pl-1">From Date</label>
                    <input 
                      type="date"
                      value={fromDate}
                      onChange={e => setFromDate(e.target.value)}
                      className="w-full bg-neutral-50 border border-neutral-150 p-3 rounded-xl text-xs font-bold font-mono outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-black text-neutral-450 uppercase tracking-widest pl-1">To Date</label>
                    <input 
                      type="date"
                      value={toDate}
                      onChange={e => setToDate(e.target.value)}
                      className="w-full bg-neutral-50 border border-neutral-150 p-3 rounded-xl text-xs font-bold font-mono outline-none"
                    />
                  </div>
                </div>

                {userRole === 'admin' ? (
                  <div className="space-y-1">
                    <label className="text-[9px] font-black uppercase tracking-widest text-neutral-400 pl-1 font-mono">
                      Select Format (வடிவம்)
                    </label>
                    <select
                      value={attendanceFormat}
                      onChange={(e) => setAttendanceFormat(e.target.value as 'xlsx' | 'docx' | 'pdf')}
                      className="w-full bg-white border border-neutral-200 p-3 rounded-xl text-xs font-bold font-sans cursor-pointer text-ink outline-none"
                    >
                      <option value="xlsx">Microsoft Excel (.xlsx)</option>
                      <option value="docx">Microsoft Word (.docx)</option>
                      <option value="pdf">Adobe PDF Document (.pdf)</option>
                    </select>
                  </div>
                ) : (
                  <div className="space-y-1">
                    <label className="text-[9px] font-black uppercase tracking-widest text-neutral-400 pl-1">
                      Export Format (வடிவம்)
                    </label>
                    <div className="w-full bg-neutral-100/60 border border-neutral-200/50 p-4 rounded-xl text-xs font-bold text-neutral-600 flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                      Adobe PDF Document (.pdf) [🔒 Secure PDF]
                    </div>
                  </div>
                )}

                <button
                  onClick={handleDownloadAttendanceReport}
                  className={`w-full text-white py-3.5 px-5 rounded-xl font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2.5 shadow-md active:scale-[0.98] mt-2 cursor-pointer ${
                    (userRole === 'admin' ? attendanceFormat : 'pdf') === 'xlsx' 
                      ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/10' 
                      : (userRole === 'admin' ? attendanceFormat : 'pdf') === 'docx' 
                      ? 'bg-blue-600 hover:bg-blue-700 shadow-blue-600/10' 
                      : 'bg-red-600 hover:bg-red-700 shadow-red-600/10'
                  }`}
                >
                  <Download size={14} />
                  <span>Download Attendance Report</span>
                </button>
              </div>
            </motion.div>
          ) : activeSubScreen === 'reports' ? (
            <div className="hidden" />
          ) : activeSubScreen === 'disabled_legacy_reports_page_do_not_render' ? (
            <motion.div
              key="reports-subscreen"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-8 flex-1"
            >
              {/* Header / Back */}
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <button 
                    onClick={() => setActiveSubScreen(null)} 
                    className="p-3 border border-neutral-200 rounded-xl hover:bg-neutral-100 transition-colors"
                  >
                    <ChevronLeft size={20} />
                  </button>
                  <div>
                    <h2 className="text-xl font-black uppercase tracking-tight">Driver Reports</h2>
                    <p className="text-[10px] font-bold text-neutral-400 font-mono">ODOMETER, PUNCHING & FUEL STATS</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowDownloadReport(true)}
                  className="bg-ink text-white px-4 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest hover:brightness-110 active:scale-95 transition-all flex items-center gap-2 shadow-md"
                >
                  <Download size={12} /> Download Voucher
                </button>
              </div>

              {/* Date-Range Pickers */}
              <div className="bg-white border border-neutral-200 p-6 rounded-3xl grid grid-cols-2 gap-4 shadow-sm">
                <div className="space-y-1">
                  <label className="text-[9px] font-black text-neutral-400 uppercase tracking-widest pl-1">From Date</label>
                  <input 
                    type="date"
                    value={fromDate}
                    onChange={e => setFromDate(e.target.value)}
                    className="w-full bg-neutral-50 border border-neutral-100 p-4 rounded-xl text-xs font-bold font-mono focus:ring-2 focus:ring-blue-500/10 outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-black text-neutral-400 uppercase tracking-widest pl-1">To Date</label>
                  <input 
                    type="date"
                    value={toDate}
                    onChange={e => setToDate(e.target.value)}
                    className="w-full bg-neutral-50 border border-neutral-100 p-4 rounded-xl text-xs font-bold font-mono focus:ring-2 focus:ring-blue-500/10 outline-none"
                  />
                </div>
              </div>

              {/* Individual Export Actions */}
              <div className="bg-white border border-neutral-200 p-6 md:p-8 rounded-3xl space-y-6 shadow-sm text-left">
                <div className="border-b border-neutral-100 pb-3 flex justify-between items-center">
                  <div>
                    <h4 className="text-sm font-black uppercase tracking-tight text-ink">Export Verified Reports</h4>
                    <p className="text-[10px] text-neutral-400 font-bold uppercase tracking-widest mt-0.5">Dual-Channel Formal Export Protocols</p>
                  </div>
                  <span className="text-[9px] bg-neutral-100 text-neutral-500 font-extrabold px-2 py-0.5 rounded font-mono">MULTI-FORMAT</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Attendance & OT Report Card */}
                  <div className="bg-neutral-50/50 border border-neutral-200/60 p-5 rounded-2xl flex flex-col justify-between space-y-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                        <h5 className="text-xs font-black uppercase tracking-wider text-neutral-800">Attendance & Overtime Report</h5>
                      </div>
                      <p className="text-[10px] font-bold text-neutral-400 leading-relaxed uppercase tracking-wider">
                        வருகைப்பதிவு & கூடுதல் நேர வேலை அறிக்கை
                      </p>
                    </div>

                    <div className="space-y-3 pt-2">
                      {userRole === 'admin' ? (
                        <div className="space-y-1">
                          <label className="text-[9px] font-black uppercase tracking-widest text-neutral-400 pl-1">
                            Select Format (வடிவம்)
                          </label>
                          <select
                            value={attendanceFormat}
                            onChange={(e) => setAttendanceFormat(e.target.value as 'xlsx' | 'docx' | 'pdf')}
                            className="w-full bg-white border border-neutral-200/85 p-3 rounded-xl text-xs font-bold focus:ring-4 focus:ring-blue-500/10 outline-none transition-all cursor-pointer shadow-sm text-ink"
                          >
                            <option value="xlsx">Microsoft Excel (.xlsx)</option>
                            <option value="docx">Microsoft Word (.docx)</option>
                            <option value="pdf">Adobe PDF Document (.pdf)</option>
                          </select>
                        </div>
                      ) : (
                        <div className="space-y-1">
                          <label className="text-[9px] font-black uppercase tracking-widest text-neutral-400 pl-1">
                            Export Format (வடிவம்)
                          </label>
                          <div className="w-full bg-neutral-100/60 border border-neutral-200/50 p-3 rounded-xl text-xs font-bold text-neutral-600 flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                            Adobe PDF Document (.pdf) [🔒 Secure PDF]
                          </div>
                        </div>
                      )}

                      <button
                        onClick={handleDownloadAttendanceReport}
                        className={`w-full text-white py-3.5 px-5 rounded-xl font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2.5 shadow-md active:scale-[0.98] group mt-2 cursor-pointer ${
                          attendanceFormat === 'xlsx' 
                            ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/10' 
                            : attendanceFormat === 'docx' 
                            ? 'bg-blue-600 hover:bg-blue-700 shadow-blue-600/10' 
                            : 'bg-red-600 hover:bg-red-700 shadow-red-600/10'
                        }`}
                      >
                        <Download size={14} className="group-hover:translate-y-0.5 transition-transform" />
                        <span>
                          {attendanceFormat === 'xlsx' && "Export as Excel (.xlsx)"}
                          {attendanceFormat === 'docx' && "Export as Word (.docx)"}
                          {attendanceFormat === 'pdf' && "Export as PDF (.pdf)"}
                        </span>
                      </button>
                    </div>
                  </div>

                  {/* Vehicle & Fuel Log Report Card */}
                  <div className="bg-neutral-50/50 border border-neutral-200/60 p-5 rounded-2xl flex flex-col justify-between space-y-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                        <h5 className="text-xs font-black uppercase tracking-wider text-neutral-800">Vehicle Run & Fuel Segregation</h5>
                      </div>
                      <p className="text-[10px] font-bold text-neutral-400 leading-relaxed uppercase tracking-wider">
                        வாகன ஓட்டம் & எரிபொருள் பயன்பாட்டு அறிக்கை
                      </p>
                    </div>

                    <div className="space-y-3 pt-2">
                      {userRole === 'admin' ? (
                        <div className="space-y-1">
                          <label className="text-[9px] font-black uppercase tracking-widest text-neutral-400 pl-1">
                            Select Format (வடிவம்)
                          </label>
                          <select
                            value={vehicleFormat}
                            onChange={(e) => setVehicleFormat(e.target.value as 'xlsx' | 'docx' | 'pdf')}
                            className="w-full bg-white border border-neutral-200/85 p-3 rounded-xl text-xs font-bold focus:ring-4 focus:ring-emerald-500/10 outline-none transition-all cursor-pointer shadow-sm text-ink"
                          >
                            <option value="xlsx">Microsoft Excel (.xlsx)</option>
                            <option value="docx">Microsoft Word (.docx)</option>
                            <option value="pdf">Adobe PDF Document (.pdf)</option>
                          </select>
                        </div>
                      ) : (
                        <div className="space-y-1">
                          <label className="text-[9px] font-black uppercase tracking-widest text-neutral-400 pl-1">
                            Export Format (வடிவம்)
                          </label>
                          <div className="w-full bg-neutral-100/60 border border-neutral-200/50 p-3 rounded-xl text-xs font-bold text-neutral-600 flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                            Adobe PDF Document (.pdf) [🔒 Secure PDF]
                          </div>
                        </div>
                      )}

                      <button
                        onClick={handleDownloadVehicleFuelReport}
                        className={`w-full text-white py-3.5 px-5 rounded-xl font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2.5 shadow-md active:scale-[0.98] group mt-2 cursor-pointer ${
                          vehicleFormat === 'xlsx' 
                            ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/10' 
                            : vehicleFormat === 'docx' 
                            ? 'bg-blue-600 hover:bg-blue-700 shadow-blue-600/10' 
                            : 'bg-red-600 hover:bg-red-700 shadow-red-600/10'
                        }`}
                      >
                        <Download size={14} className="group-hover:translate-y-0.5 transition-transform" />
                        <span>
                          {vehicleFormat === 'xlsx' && "Export as Excel (.xlsx)"}
                          {vehicleFormat === 'docx' && "Export as Word (.docx)"}
                          {vehicleFormat === 'pdf' && "Export as PDF (.pdf)"}
                        </span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Interactive Report View Filters */}
              <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar-x">
                {[
                  { id: 'all', label: 'All Logs' },
                  { id: 'attendance', label: 'Shift punches' },
                  { id: 'odometer', label: 'Odometer Logs' },
                  { id: 'fuel', label: 'Fuel Entries' },
                ].map(item => (
                  <button
                    key={item.id}
                    onClick={() => setReportFilter(item.id as any)}
                    className={`px-4 py-2 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all border whitespace-nowrap ${reportFilter === item.id ? 'bg-ink text-white border-ink' : 'bg-white text-neutral-400 border-neutral-200 hover:text-ink'}`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>

              {/* Chronological Fuel Budget splits formulation */}
              {(() => {
                const allSplits = computeFuelSplit(driver.fuelEntries);
                const filteredSplits = allSplits.filter(se => !se.companyDeleted && isDateInRange(se.date));

                const totalCompanyKWD = filteredSplits.reduce((acc, se) => acc + se.companyAmount, 0);
                const totalAdditionalKWD = filteredSplits.reduce((acc, se) => acc + se.additionalAmount, 0);
                const totalCompanyLitres = totalCompanyKWD / 0.105;
                const totalAdditionalLitres = totalAdditionalKWD / 0.105;
                const totalCompanyKM = filteredSplits.reduce((acc, se) => acc + se.companyDistance, 0);
                const totalAdditionalKM = filteredSplits.reduce((acc, se) => acc + se.additionalDistance, 0);

                const grandTotalKWD = filteredSplits.reduce((acc, se) => acc + se.amount, 0);
                const grandTotalLitres = grandTotalKWD / 0.105;
                const grandTotalKM = filteredSplits.reduce((acc, se) => acc + se.distance, 0);

                return (
                  <div className="space-y-6">
                    {/* Quick Sum Panel */}
                    <div className="grid grid-cols-3 gap-3">
                      <div className="bg-blue-50/50 border border-blue-100 p-4 rounded-2xl text-center">
                        <p className="text-[8px] font-black text-blue-600 uppercase tracking-widest mb-1">Total Hours Worked</p>
                        <p className="text-xl font-black text-blue-900 font-mono">
                          {driver.dutyLogs.filter(log => !log.companyDeleted && isDateInRange(log.date)).reduce((acc, log) => acc + (log.totalHours || 0), 0).toFixed(1)} hrs
                        </p>
                      </div>
                      <div className="bg-emerald-50/50 border border-emerald-100 p-4 rounded-2xl text-center">
                        <p className="text-[8px] font-black text-emerald-600 uppercase tracking-widest mb-1">Distance Driven</p>
                        <p className="text-xl font-black text-emerald-900 font-mono">
                          {driver.trips.filter(t => !t.companyDeleted && isDateInRange(t.date)).reduce((acc, t) => acc + (t.distance || 0), 0).toLocaleString()} km
                        </p>
                      </div>
                      <div className="bg-amber-50/50 border border-amber-100 p-4 rounded-2xl text-center flex flex-col justify-center items-center">
                        <p className="text-[8px] font-black text-amber-600 uppercase tracking-widest mb-1">Fuel Added Cost</p>
                        <p className="text-xl font-black text-amber-900 font-mono">
                          {grandTotalKWD.toFixed(2)} KD
                        </p>
                        <p className="text-[9px] font-bold text-neutral-450 font-mono">
                          ({grandTotalLitres.toFixed(1)} L)
                        </p>
                      </div>
                    </div>

                    {/* Highly-crafted Reports Fuel Splits Breakdown Dashboard */}
                    {(reportFilter === 'all' || reportFilter === 'fuel') && filteredSplits.length > 0 && (
                      <div className="bg-white border border-neutral-200 rounded-3xl p-6 space-y-4">
                        <div className="flex justify-between items-center border-b border-neutral-100 pb-3">
                          <h4 className="text-[10px] font-black uppercase tracking-[0.15em] text-neutral-400">Monthly Fuel Budget Splits</h4>
                          <span className="text-[8px] font-black bg-ink text-white px-2 py-0.5 rounded uppercase tracking-wider">MONTHLY RULES: 80 KD</span>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                          {/* Company Covered Panel */}
                          <div className="bg-neutral-50 p-4 rounded-2xl border border-neutral-200/50 space-y-2">
                            <p className="text-[9px] font-black text-neutral-600 uppercase tracking-wider">💼 Company Covered (Standard)</p>
                            <div className="space-y-1 font-mono text-xs">
                              <p className="font-extrabold text-neutral-800">KD: {totalCompanyKWD.toFixed(3)} KWD</p>
                              <p className="text-neutral-500 text-[11px]">Liters: {totalCompanyLitres.toFixed(1)} L</p>
                              <p className="text-neutral-500 text-[11px]">Distance: {totalCompanyKM.toLocaleString()} KM</p>
                            </div>
                          </div>

                          {/* Additional Expenses Panel */}
                          <div className="bg-amber-500/5 p-4 rounded-2xl border border-amber-500/10 space-y-2">
                            <p className="text-[9px] font-black text-amber-700 uppercase tracking-wider">🔥 Additional Expenses</p>
                            <div className="space-y-1 font-mono text-xs">
                              <p className="font-extrabold text-amber-600">KD: {totalAdditionalKWD.toFixed(3)} KWD</p>
                              <p className="text-amber-500 text-[11px]">Liters: {totalAdditionalLitres.toFixed(1)} L</p>
                              <p className="text-amber-500 text-[11px]">Distance: {totalAdditionalKM.toLocaleString()} KM</p>
                            </div>
                          </div>

                          {/* Absolute Grand Total Panel */}
                          <div className="bg-ink text-white p-4 rounded-2xl space-y-2">
                            <p className="text-[9px] font-black text-neutral-200 uppercase tracking-wider">📊 Total Combined</p>
                            <div className="space-y-1 font-mono text-xs">
                              <p className="font-extrabold text-white">KD: {grandTotalKWD.toFixed(3)} KWD</p>
                              <p className="text-neutral-300 text-[11px]">Liters: {grandTotalLitres.toFixed(1)} L</p>
                              <p className="text-neutral-300 text-[11px]">Distance: {grandTotalKM.toLocaleString()} KM</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Day to Day Records List */}
                    <div className="space-y-4 text-left">
                      <p className="text-[10px] font-black uppercase tracking-widest text-neutral-400 px-1">Day-to-day Logs ({fromDate} to {toDate})</p>
                      
                      <div className="space-y-3">
                        {(() => {
                          const mergedLogs: { date: string, type: 'attendance'|'odometer'|'fuel', details: React.ReactNode, id: string, sortTime: number }[] = [];

                          if (reportFilter === 'all' || reportFilter === 'attendance') {
                            driver.dutyLogs.filter(log => !log.companyDeleted && isDateInRange(log.date)).forEach(log => {
                              mergedLogs.push({
                                id: log.id,
                                date: log.date,
                                type: 'attendance',
                                sortTime: new Date(log.date).getTime(),
                                details: (
                                  <div className="flex justify-between items-center w-full">
                                    <div className="text-left">
                                      <p className="font-bold text-neutral-900">Punch In: <span className="font-mono text-neutral-600">{log.inTime}</span></p>
                                      <p className="font-bold text-neutral-900">Punch Out: <span className="font-mono text-neutral-600">{log.outTime || 'Live'}</span></p>
                                    </div>
                                    <div className="text-right">
                                      <span className="bg-blue-100 text-blue-700 text-[8px] font-black uppercase px-2 py-1 rounded">
                                        {log.totalHours.toFixed(2)} hrs
                                      </span>
                                    </div>
                                  </div>
                                )
                              });
                            });
                          }

                          if (reportFilter === 'all' || reportFilter === 'odometer') {
                            driver.trips.filter(t => !t.companyDeleted && isDateInRange(t.date)).forEach((t, index) => {
                              mergedLogs.push({
                                id: `trip-${index}`,
                                date: t.date,
                                type: 'odometer',
                                sortTime: new Date(t.date).getTime(),
                                details: (
                                  <div className="flex justify-between items-center w-full">
                                    <div className="text-left">
                                      <p className="font-bold text-neutral-900">Start Odometer: <span className="font-mono text-neutral-600">{t.startKm.toLocaleString()} KM</span></p>
                                      <p className="font-bold text-neutral-900">End Odometer: <span className="font-mono text-neutral-600">{t.endKm.toLocaleString()} KM</span></p>
                                    </div>
                                    <div className="text-right">
                                      <span className="bg-emerald-100 text-emerald-700 text-[8px] font-black uppercase px-2 py-1 rounded">
                                        +{t.distance} KM
                                      </span>
                                    </div>
                                  </div>
                                )
                              });
                            });
                          }

                          if (reportFilter === 'all' || reportFilter === 'fuel') {
                            filteredSplits.forEach(se => {
                              const totalLitres = se.amount / 0.105;
                              const companyLitres = se.companyAmount / 0.105;
                              const additionalLitres = se.additionalAmount / 0.105;

                              mergedLogs.push({
                                id: se.id,
                                date: se.date,
                                type: 'fuel',
                                sortTime: new Date(se.date).getTime(),
                                details: (
                                  <div className="flex flex-col gap-3 w-full text-left">
                                    <div className="space-y-2">
                                      {se.companyAmount > 0 && (
                                        <div className="text-neutral-900 border-l-[3px] border-neutral-300 pl-3 py-0.5">
                                          <p className="text-[10px] font-black uppercase tracking-wider text-neutral-500 mb-0.5">💼 Company Covered</p>
                                          <p className="text-[11px] font-semibold text-neutral-700">
                                            Cost: <span className="font-mono font-black text-neutral-900">{se.companyAmount.toFixed(3)} KD</span> • Liters: <span className="font-mono text-neutral-600">{companyLitres.toFixed(1)} L</span> • Running: <span className="font-mono text-neutral-600">{se.companyDistance} KM</span>
                                          </p>
                                        </div>
                                      )}
                                      {se.additionalAmount > 0 && (
                                        <div className="text-amber-700 border-l-[3px] border-amber-500 pl-3 py-0.5 bg-amber-500/5 rounded-r-xl">
                                          <p className="text-[10px] font-black uppercase tracking-wider text-amber-600 mb-0.5">🔥 Additional Expenses</p>
                                          <p className="text-[11px] font-semibold text-amber-800">
                                            Cost: <span className="font-mono font-black text-amber-700">{se.additionalAmount.toFixed(3)} KD</span> • Liters: <span className="font-mono text-amber-600">{additionalLitres.toFixed(1)} L</span> • Running: <span className="font-mono text-amber-600">{se.additionalDistance} KM</span>
                                          </p>
                                        </div>
                                      )}
                                      <p className="text-[10px] font-semibold text-neutral-400 pl-1">
                                        Prev Odometer: {se.prevOdo.toLocaleString()} KM • New: {se.currOdo.toLocaleString()} KM • Combined Fuel: {se.amount.toFixed(2)} KD ({totalLitres.toFixed(1)} L)
                                      </p>
                                    </div>
                                    <div className="flex justify-between items-center text-[9px] font-bold text-neutral-450 border-t border-neutral-50 pt-1">
                                      <span>Efficiency:</span>
                                      <span className="bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded font-mono font-bold">{se.efficiency} KM/KD</span>
                                    </div>
                                  </div>
                                )
                              });
                            });
                          }

                          // Sort descending
                          mergedLogs.sort((a,b) => b.sortTime - a.sortTime);

                          if (mergedLogs.length === 0) {
                            return (
                              <div className="py-12 bg-white border border-dashed border-neutral-200 rounded-3xl text-center">
                                <p className="text-[10px] font-black uppercase text-neutral-400 tracking-widest">No reports for chosen filters & date range</p>
                              </div>
                            );
                          }

                          return mergedLogs.map(item => (
                            <div key={item.id} className="bg-white border border-neutral-200 rounded-2xl p-5 shadow-sm space-y-3 text-left">
                              <div className="flex justify-between items-center pb-2 border-b border-neutral-100">
                                <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded tracking-widest ${item.type === 'attendance' ? 'bg-blue-50 text-blue-600 border border-blue-100' : item.type === 'odometer' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-amber-50 text-amber-700 border border-amber-100'}`}>
                                  {item.type} Report
                                </span>
                                <span className="text-[9px] font-bold text-neutral-400 font-mono">{item.date}</span>
                              </div>
                              <div className="text-xs font-semibold leading-relaxed">
                                {item.details}
                              </div>
                            </div>
                          ));
                        })()}
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* Printable Pay Slip & Report Download Modal Popup */}
              <AnimatePresence>
                {showDownloadReport && (
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 bg-ink/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4"
                  >
                    <motion.div 
                      initial={{ scale: 0.95, y: 15 }}
                      animate={{ scale: 1, y: 0 }}
                      exit={{ scale: 0.95, y: 15 }}
                      className="bg-white text-ink w-full max-w-lg rounded-[32px] overflow-hidden shadow-2xl flex flex-col max-h-[90vh]"
                    >
                      {/* Printable Invoice Card */}
                      <div className="p-8 space-y-6 overflow-y-auto no-scrollbar print-invoice" id="printable-area">
                        <div className="flex items-start justify-between border-b pb-6 border-neutral-100">
                          <div className="space-y-1">
                            <h3 className="text-xl font-black uppercase tracking-tight text-ink">KUWAIT LOGISTICS</h3>
                            <p className="text-[8px] font-bold uppercase tracking-widest text-neutral-400">Official Worker Fleet Report Summary</p>
                          </div>
                          <div className="text-right">
                            <span className="text-[10px] font-extrabold uppercase bg-neutral-100 px-3 py-1 rounded-full font-mono text-neutral-500">
                              TENANT: c1
                            </span>
                          </div>
                        </div>

                        {/* Invoice Metadata */}
                        <div className="grid grid-cols-2 gap-4 text-xs">
                          <div>
                            <p className="text-[8px] font-bold text-neutral-300 uppercase tracking-widest text-left">Worker / Driver Name</p>
                            <p className="font-extrabold text-neutral-800 text-left">{driverName}</p>
                            <p className="text-neutral-400 text-[10px] text-left">{driver.email}</p>
                          </div>
                          <div>
                            <p className="text-[8px] font-bold text-neutral-300 uppercase tracking-widest text-left">Assigned Force Unit</p>
                            <p className="font-extrabold text-neutral-800 text-left">{carModel}</p>
                            <p className="text-neutral-400 text-[10px] font-mono text-left">PLATE: {getVehiclePlate(driver)}</p>
                          </div>
                          <div className="pt-2">
                            <p className="text-[8px] font-bold text-neutral-300 uppercase tracking-widest text-left">Compiled Date Range</p>
                            <p className="font-bold text-neutral-800 font-mono text-[11px] text-left">{fromDate} TO {toDate}</p>
                          </div>
                          <div className="pt-2 text-right flex flex-col items-end">
                            <p className="text-[8px] font-bold text-neutral-300 uppercase tracking-widest">Status Verification</p>
                            <span className="text-success font-black text-[9px] uppercase tracking-widest">✓ LABOUR REGULATION COMPLIANT</span>
                          </div>
                        </div>

                        {/* Summary of Statistics */}
                        <div className="bg-neutral-50 p-6 rounded-2xl border border-neutral-100 space-y-5">
                          <h4 className="text-[9px] font-black uppercase tracking-widest text-neutral-400 text-left">AGGREGATE RESULTS</h4>
                          <div className="space-y-3.5 text-xs">
                            <div className="flex justify-between items-center font-bold">
                              <span className="text-neutral-500 text-left">Total Shift Regular / OT Hours:</span>
                              <span className="font-mono text-neutral-800">
                                {driver.dutyLogs.filter(log => !log.companyDeleted && isDateInRange(log.date)).reduce((acc, log) => acc + (log.totalHours || 0), 0).toFixed(1)} Hrs
                              </span>
                            </div>
                            <div className="flex justify-between items-center font-bold">
                              <span className="text-neutral-500 text-left">Total Distance Drive Traveled:</span>
                              <span className="font-mono text-neutral-800">
                                {driver.trips.filter(t => !t.companyDeleted && isDateInRange(t.date)).reduce((acc, t) => acc + (t.distance || 0), 0).toLocaleString()} KM
                              </span>
                            </div>

                            <div className="border-t border-dashed border-neutral-200 pt-4 space-y-3">
                              <p className="text-[9px] font-black uppercase tracking-widest text-neutral-400 text-left">FUEL SEGREGATION SUMMARY</p>
                              
                              {/* Company Covered Category */}
                              <div className="bg-white p-3.5 rounded-xl border border-neutral-200/60 text-left space-y-1">
                                <p className="font-extrabold text-[11px] text-neutral-800">💼 Company Covered Expenses (Standard)</p>
                                <div className="grid grid-cols-3 gap-2 text-[10px] font-bold text-neutral-500 font-mono mt-1">
                                  <div>
                                    <p className="text-[8px] uppercase font-bold text-neutral-400">Total KWD</p>
                                    <p className="text-neutral-800 font-black">{totalCompanyKWD.toFixed(3)} KD</p>
                                  </div>
                                  <div>
                                    <p className="text-[8px] uppercase font-bold text-neutral-400">Total Liters</p>
                                    <p className="text-neutral-800 font-black">{totalCompanyLitres.toFixed(1)} L</p>
                                  </div>
                                  <div>
                                    <p className="text-[8px] uppercase font-bold text-neutral-400">Achieved KM</p>
                                    <p className="text-neutral-800 font-black">{totalCompanyKM} KM</p>
                                  </div>
                                </div>
                              </div>

                              {/* Additional Expenses Category */}
                              <div className="bg-amber-500/5 p-3.5 rounded-xl border border-amber-500/10 text-left space-y-1">
                                <p className="font-extrabold text-[11px] text-amber-700">🔥 Additional Expenses (Refilled Over budget)</p>
                                <div className="grid grid-cols-3 gap-2 text-[10px] font-bold text-amber-600 font-mono mt-1">
                                  <div>
                                    <p className="text-[8px] uppercase font-bold text-amber-400/80">Total KWD</p>
                                    <p className="text-amber-700 font-black">{totalAdditionalKWD.toFixed(3)} KD</p>
                                  </div>
                                  <div>
                                    <p className="text-[8px] uppercase font-bold text-amber-400/80">Total Liters</p>
                                    <p className="text-amber-700 font-black">{totalAdditionalLitres.toFixed(1)} L</p>
                                  </div>
                                  <div>
                                    <p className="text-[8px] uppercase font-bold text-amber-400/80">Extra Running</p>
                                    <p className="text-amber-700 font-black">{totalAdditionalKM} KM</p>
                                  </div>
                                </div>
                              </div>

                              {/* Absolute Grand Total */}
                              <div className="bg-ink text-white p-3.5 rounded-xl text-left space-y-1 shadow-sm mt-3">
                                <p className="font-black text-[11px] uppercase tracking-wider text-neutral-200">📊 Absolute Grand Total</p>
                                <div className="grid grid-cols-3 gap-2 text-[10px] font-bold text-neutral-300 font-mono mt-1">
                                  <div>
                                    <p className="text-[8px] uppercase font-bold text-neutral-400">Total KWD</p>
                                    <p className="text-white font-black">{grandTotalKWD.toFixed(3)} KD</p>
                                  </div>
                                  <div>
                                    <p className="text-[8px] uppercase font-bold text-neutral-400">Total Liters</p>
                                    <p className="text-white font-black">{grandTotalLitres.toFixed(1)} L</p>
                                  </div>
                                  <div>
                                    <p className="text-[8px] uppercase font-bold text-neutral-400">Total KM</p>
                                    <p className="text-white font-black">{grandTotalKM} KM</p>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Barcode / System Verification Info */}
                        <div className="flex items-center justify-between pt-4 border-t border-dashed border-neutral-100">
                          <div className="text-left">
                            <p className="text-[8px] font-mono text-neutral-200">HUB-SYSTEM-GENERATED DECREE</p>
                            <p className="text-[7px] text-neutral-300 italic">Generated with secure multi-tenant protocols.</p>
                          </div>
                          <div className="w-24 h-6 bg-[repeating-linear-gradient(90deg,#000,#000_2px,transparent_2px,transparent_6px)] opacity-60" />
                        </div>
                      </div>

                      {/* Modal Footer Controls */}
                      <div className="p-6 bg-neutral-50 border-t border-neutral-100 flex gap-3">
                        <button
                          onClick={() => {
                            window.print();
                          }}
                          className="flex-1 bg-white border border-neutral-200 text-ink py-4 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-neutral-100 transition-colors flex items-center justify-center gap-2"
                        >
                          <Printer size={12} /> Print Document
                        </button>
                        <button
                          onClick={() => {
                            showToast("📄 Simulating PDF download... Saved to device.");
                            setShowDownloadReport(false);
                          }}
                          className="flex-1 bg-ink text-white py-4 rounded-xl font-black text-[10px] uppercase tracking-widest hover:brightness-110 transition-colors flex items-center justify-center gap-2"
                        >
                          <Download size={12} /> Save PDF
                        </button>
                        <button 
                          onClick={() => setShowDownloadReport(false)}
                          className="px-5 bg-neutral-200 text-neutral-600 rounded-xl hover:bg-neutral-300 transition-colors font-black text-[10px] uppercase tracking-widest"
                        >
                          Cancel
                        </button>
                      </div>
                    </motion.div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ) : (
            <motion.div 
              key="overview"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-10 flex-1"
            >
              <div className="bg-white p-6 rounded-2xl border border-neutral-200 shadow-sm flex items-center justify-between">
                <div className="space-y-1 text-left">
                  <p className="text-[11px] font-bold text-neutral-400 uppercase tracking-widest">Assigned Unit</p>
                  <p className="text-2xl font-black tracking-tight">{carModel} - Plate: {getVehiclePlate(driver)}</p>
                </div>
                <Car size={32} className="text-neutral-100" />
              </div>

              {/* VEHICLE SERVICE STATUS Card */}
              {(() => {
                const cardVisible = isSectionVisible('dash_card_service_status');
                const isUiEditorMode = localStorage.getItem('no_code_ui_editor_active') === 'true';
                if (!cardVisible && !isUiEditorMode) return null;

                const srvLastKm = driver.maintenance.lastServiceKm !== null ? driver.maintenance.lastServiceKm : 0;
                const srvTargetKm = driver.maintenance.nextServiceKm !== null ? driver.maintenance.nextServiceKm : (srvLastKm + getNoCodeServiceInterval());
                const rmKm = srvTargetKm - driver.odometer;

                let cardBg = '';
                let borderClass = '';
                let textColor = '';
                let textStr = '';
                let badgeClass = '';

                if (rmKm > 5000) {
                  cardBg = 'bg-emerald-50/70';
                  borderClass = 'border-emerald-200';
                  textColor = 'text-emerald-900';
                  textStr = `Vehicle Status: Good (${rmKm.toLocaleString()} KM left)`;
                  badgeClass = 'bg-emerald-500 text-white';
                } else if (rmKm >= 1001) {
                  cardBg = 'bg-amber-50/70';
                  borderClass = 'border-amber-200';
                  textColor = 'text-amber-900';
                  textStr = `Service Due Soon (${rmKm.toLocaleString()} KM left)`;
                  badgeClass = 'bg-amber-500 text-white';
                } else {
                  cardBg = 'bg-red-50/90';
                  borderClass = 'border-red-200 animate-pulse';
                  textColor = 'text-red-900 font-extrabold';
                  textStr = 'URGENT: Service Required Immediately!';
                  badgeClass = 'bg-red-600 text-white';
                }

                return (
                  <div 
                    onClick={(e) => {
                      if (isUiEditorMode) {
                        e.stopPropagation();
                        e.preventDefault();
                        const event = new CustomEvent('open-no-code-editor', {
                          detail: { 
                            id: 'dash_card_service_status', 
                            originalText: 'Vehicle Service Status Card', 
                            currentText: 'Vehicle Service Status Card'
                          }
                        });
                        window.dispatchEvent(event);
                      }
                    }}
                    className={`p-6 rounded-2xl border transition-all duration-300 relative flex items-center justify-between shadow-sm ${
                      !cardVisible ? 'border-dashed border-red-500 opacity-50 bg-red-500/5' : `${borderClass} ${cardBg}`
                    } ${isUiEditorMode ? 'cursor-pointer hover:border-red-500 hover:scale-[1.01]' : ''}`}
                  >
                    {!cardVisible && (
                      <span className="absolute top-2 right-2 bg-red-600 text-white text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full z-10 animate-pulse">
                        Hidden Card (Admin)
                      </span>
                    )}
                    <div className="space-y-1.5 text-left flex-1 pr-4">
                      <div className="flex items-center gap-2">
                        <div className="relative flex h-2.5 w-2.5">
                          {rmKm <= 1000 && <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>}
                          <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${rmKm > 5000 ? 'bg-emerald-500' : rmKm >= 1001 ? 'bg-amber-500' : 'bg-red-600'}`}></span>
                        </div>
                        <p className="text-[11px] font-black uppercase tracking-widest text-neutral-400">
                          <EditableText id="dash_service_title" defaultText="Vehicle Service Status" />
                        </p>
                      </div>
                      <p className={`text-xl font-black tracking-tight ${textColor}`}>
                        {textStr}
                      </p>
                      <p className="text-[10px] text-neutral-500 font-medium">
                        Last Service at: <span className="font-mono font-bold">{srvLastKm.toLocaleString()} KM</span> • Next Target: <span className="font-mono font-bold">{srvTargetKm.toLocaleString()} KM</span>
                      </p>
                    </div>
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${badgeClass} shadow-md`}>
                      <Wrench size={22} />
                    </div>
                  </div>
                );
              })()}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <button 
                  onClick={() => onNavigate('fuel')}
                  className={`text-left border-b-[6px] pb-6 pt-5 px-5 rounded-3xl border border-neutral-200 hover:bg-neutral-50/50 transition-all space-y-4 w-full flex flex-col ${
                    isBudgetExceeded ? 'border-b-amber-500 shadow-lg shadow-amber-500/5' : 'border-b-emerald-600 shadow-lg shadow-emerald-500/5'
                  }`}
                >
                  <div className="flex justify-between items-start w-full">
                    <div className="space-y-1 text-left">
                      <p className="text-[10px] font-black uppercase tracking-[0.15em] text-neutral-400">
                        {isBudgetExceeded ? 'Company Limit Reached' : 'Company Fuel Balance'}
                      </p>
                      <div className="flex items-baseline gap-2">
                        <span className={`text-[44px] md:text-5xl font-black tracking-tighter ${isBudgetExceeded ? 'text-amber-600' : 'text-neutral-900'}`}>
                          {companyBalance.toFixed(3)}
                        </span>
                        <span className="text-xl font-bold text-neutral-300 italic">KWD</span>
                      </div>
                    </div>
                    <div>
                      {isBudgetExceeded ? (
                        <div className="flex items-center gap-1.5 bg-amber-500/10 border border-amber-500/20 text-amber-700 px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest animate-pulse">
                          <AlertTriangle size={11} className="stroke-[3]" />
                          <span>Additional Expenses</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                          <span>Within Budget</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="space-y-3 w-full">
                    <div className="flex justify-between items-center text-[10px] font-black text-neutral-500 uppercase tracking-widest">
                      <span>Total Monthly Used:</span>
                      <span className="font-mono text-neutral-750">Spent: {monthlySpent.toFixed(3)} / {COMPANY_BUDGET_LIMIT.toFixed(3)} KWD</span>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full h-3 bg-neutral-100 rounded-full overflow-hidden relative border border-neutral-150">
                      <div 
                        className={`h-full rounded-full transition-all duration-500 ${isBudgetExceeded ? 'bg-amber-500' : 'bg-emerald-500'}`}
                        style={{ width: `${progressPercent}%` }}
                      />
                    </div>
                    {isBudgetExceeded && (
                      <p className="text-[10px] font-bold text-amber-600 uppercase tracking-wider leading-relaxed">
                        ⚠️ Limit exceeded. Subsequent logs are classified as <span className="font-black underline text-amber-700">Additional Expenses</span>.
                      </p>
                    )}
                  </div>
                </button>
                <button 
                  onClick={() => onNavigate('vehicle')}
                  className={`text-left border-b-[6px] pb-4 space-y-1 transition-colors p-2 ${dailyTrip.active ? 'border-success bg-success/2' : 'border-accent hover:bg-accent/2'}`}
                >
                  <p className="text-[12px] font-bold text-neutral-400 uppercase tracking-[0.1em]">
                    {dailyTrip.active ? 'Trip In Progress' : 'Current Odometer'}
                  </p>
                  <div className="flex items-baseline gap-2">
                    <span className="text-6xl md:text-7xl font-black tracking-tighter">{odometer.toLocaleString()}</span>
                    <span className="text-2xl font-bold text-neutral-200 italic">KM</span>
                  </div>
                  {dailyTrip.active && dailyTrip.startKm !== null && (
                    <p className="text-[10px] font-black text-success uppercase tracking-widest">
                      +{odometer - dailyTrip.startKm} KM Today
                    </p>
                  )}
                </button>
              </div>

              <div className="grid grid-cols-3 gap-4 pt-10">
                <ActionButton 
                  icon={<Clock size={28} className="text-blue-500" />} 
                  label="Punch In/Out" 
                  onClick={() => setActiveSubScreen('attendance')} 
                />
                <ActionButton 
                  icon={<Fuel size={28} className="text-amber-500" />} 
                  label="Fuel Log" 
                  onClick={() => onNavigate('fuel')} 
                />
                <ActionButton 
                  icon={<Milestone size={28} className="text-emerald-500" />} 
                  label="Odometer" 
                  onClick={() => onNavigate('vehicle')} 
                />
              </div>

              {/* Duty Section */}
              <div className="bg-white border-2 border-neutral-100 rounded-3xl p-8 space-y-6">
                <div className="flex justify-between items-center">
                  <div className="space-y-1 text-left">
                    <p className="text-[10px] font-black uppercase text-neutral-400 tracking-widest">Attendance Status</p>
                    <p className={`text-xl font-black uppercase px-2.5 py-1 rounded-lg text-center inline-block ${shiftState.statusClass}`}>
                      {shiftState.label}
                    </p>
                  </div>
                  {currentSession.active ? (
                    <div className="text-right space-y-1">
                      <p className="text-[9px] font-black uppercase text-neutral-400 tracking-widest">Driver Identity</p>
                      <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 px-3 py-2 rounded-xl font-mono text-xs font-bold whitespace-nowrap">
                        Name: <span className="font-extrabold text-emerald-700">{driverName}</span> | File: <span className="font-extrabold text-emerald-700">{driver.id === '1' ? '4248' : (driver.id === '2' ? '5129' : (driver.id === '3' ? '6812' : '42' + driver.id))}</span>
                      </div>
                    </div>
                  ) : (
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${shiftState.dotClass} text-white shadow-lg`}>
                      <User size={24} />
                    </div>
                  )}
                </div>

                {currentSession.active && currentSession.startTime && (
                  <div className="bg-neutral-50 px-5 py-4 rounded-xl flex justify-between items-center">
                    <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">Shift Started</span>
                    <span className="font-mono font-bold text-xs">{new Date(currentSession.startTime).toLocaleTimeString()}</span>
                  </div>
                )}

                <div className="flex gap-4">
                  {!currentSession.active ? (
                    <button 
                      onClick={onStartDuty}
                      className="flex-1 bg-success text-white py-5 rounded-2xl font-black text-[12px] uppercase tracking-[0.2em] shadow-xl shadow-success/20 hover:brightness-110 active:scale-95 transition-all"
                    >
                      START DUTY
                    </button>
                  ) : (
                    <button 
                      onClick={() => setShowEndDutyConfirm(true)}
                      className="flex-1 bg-danger text-white py-5 rounded-2xl font-black text-[12px] uppercase tracking-[0.2em] shadow-xl shadow-danger/20 hover:brightness-110 active:scale-95 transition-all"
                    >
                      END DUTY
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          )
        ) : (
          <motion.div 
            key="profile"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-8 flex-1"
          >
            <div className="bg-white border border-neutral-200 rounded-2xl overflow-hidden shadow-sm">
              <div className="h-32 bg-ink flex items-center justify-center relative">
                <div className="w-20 h-20 rounded-full bg-white flex items-center justify-center font-black text-2xl text-ink border-4 border-white translate-y-10 shadow-lg">
                  {driverName.substring(0, 2).toUpperCase()}
                </div>
              </div>
              <div className="pt-16 pb-6 px-8 text-center space-y-1">
                <h2 className="text-2xl font-black text-ink">{driverName}</h2>
                <p className="text-[11px] font-bold text-neutral-400 uppercase tracking-[0.2em]">
                  {userRole} · Kuwait Logistics Fleet
                </p>
              </div>

              <div className="px-8 pb-8 space-y-1">
                <p className="text-[10px] font-black uppercase text-neutral-400 tracking-widest mb-4">Profile & Fleet Assigned Details</p>
                
                <div className="flex justify-between items-center py-4 border-b border-neutral-100">
                  <span className="text-xs font-bold text-neutral-400 uppercase tracking-wider">Email Address</span>
                  <span className="font-bold text-sm text-ink">{driver.email || 'active@logistics.kw'}</span>
                </div>

                <div className="flex justify-between items-center py-4 border-b border-neutral-100">
                  <span className="text-xs font-bold text-neutral-400 uppercase tracking-wider">Staff ID</span>
                  <span className="font-mono font-bold text-sm text-ink">#KW-LOG-{100 + parseInt(driver.id || '1')}</span>
                </div>

                <div className="flex justify-between items-center py-4 border-b border-neutral-100">
                  <span className="text-xs font-bold text-neutral-400 uppercase tracking-wider">Company File Number</span>
                  <span className="font-mono font-extrabold text-sm text-emerald-600 bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-500/20">
                    {driver.id === '1' ? '4248' : (driver.id === '2' ? '5129' : (driver.id === '3' ? '6812' : '42' + driver.id))}
                  </span>
                </div>

                <div className="flex justify-between items-center py-4 border-b border-neutral-100">
                  <span className="text-xs font-bold text-neutral-400 uppercase tracking-wider">Vehicle Assigned</span>
                  <span className="font-bold text-sm text-ink">{driver.vehicle || 'Toyota Fortuner'}</span>
                </div>

                <div className="flex justify-between items-center py-4">
                  <span className="text-xs font-bold text-neutral-400 uppercase tracking-wider">Plate Number</span>
                  <span className="font-mono font-extrabold text-sm text-indigo-600 bg-indigo-500/10 px-2.5 py-1 rounded-lg border border-indigo-500/20">
                    {getVehiclePlate(driver)}
                  </span>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showEndDutyConfirm && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[110] bg-ink/90 backdrop-blur-md flex items-center justify-center p-6 text-left"
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 15 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 15 }}
              className="w-full max-w-sm bg-white rounded-3xl p-8 space-y-8 shadow-2xl text-center"
            >
              <div className="w-16 h-16 bg-danger/10 text-danger rounded-2xl mx-auto flex items-center justify-center shadow-lg shadow-danger/10">
                <AlertTriangle size={32} />
              </div>

              <div className="space-y-3">
                <h3 className="text-xl font-black text-ink uppercase tracking-tight">End Duty Shift?</h3>
                <p className="text-sm font-bold text-neutral-600 leading-relaxed px-2">
                  Are you sure you want to End your Duty / Punch Out?
                </p>
                <div className="bg-danger/5 py-3 px-4 rounded-xl border border-danger/10">
                  <p className="text-xs font-black text-danger uppercase tracking-[0.05em] leading-normal">
                    முடிச்சு பஞ்ச் அவுட் பண்றீங்களா?
                  </p>
                </div>
              </div>

              <div className="flex flex-col gap-3">
                <button 
                  onClick={() => {
                    onEndDuty();
                    setShowEndDutyConfirm(false);
                    showToast("Punch Out Registered: Shift ended.");
                  }}
                  className="w-full bg-danger text-white py-4 rounded-xl font-black text-xs uppercase tracking-[0.15em] shadow-xl shadow-danger/25 hover:brightness-110 active:scale-95 transition-all cursor-pointer"
                >
                  Yes, End Shift (முடி)
                </button>
                <button 
                  onClick={() => setShowEndDutyConfirm(false)}
                  className="w-full bg-neutral-100 text-ink py-4 rounded-xl font-black text-xs uppercase tracking-[0.15em] hover:bg-neutral-200 active:scale-95 transition-all cursor-pointer"
                >
                  No, Stay On Duty (தொடரு)
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// --- Vehicle Details Screen ---
function VehicleDetails({ 
  onBack, 
  odometer, 
  dailyTrip,
  onUpdateKM, 
  onStartTrip,
  onEndTrip,
  carModel,
  maintenance,
  onLogService,
  driver,
  userRole = 'driver'
}: { 
  onBack: () => void, 
  odometer: number, 
  dailyTrip: DailyTrip,
  onUpdateKM: (km: number) => void, 
  onStartTrip: (km: number) => void,
  onEndTrip: (km: number) => void,
  carModel: string,
  maintenance: MaintenanceInfo,
  onLogService?: (service: Omit<ServiceRecord, 'id'>, customInterval?: number, isAdditional?: boolean) => void,
  driver?: DriverStat,
  userRole?: string
}) {
  const [inputValue, setInputValue] = useState<string>(odometer.toString());

  const [fromDate, setFromDate] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return d.toISOString().split('T')[0];
  });
  const [toDate, setToDate] = useState<string>(() => new Date().toISOString().split('T')[0]);
  const [odometerFormat, setOdometerFormat] = useState<'xlsx' | 'docx' | 'pdf'>('pdf');

  const handleDownloadOdometerReportCustom = () => {
    const resolvedFormat = userRole === 'admin' ? odometerFormat : 'pdf';
    const activeTrips = driver ? driver.trips.filter(t => !t.companyDeleted) : [];

    const isDateInRangeLocal = (dateStr: string): boolean => {
      if (!dateStr) return false;
      const start = new Date(fromDate);
      const end = new Date(toDate);
      start.setHours(0,0,0,0);
      end.setHours(23,59,59,999);
      const d = new Date(dateStr);
      return d >= start && d <= end;
    };

    const targetTrips = activeTrips.filter(t => isDateInRangeLocal(t.date));
    let filename = `${driver?.name || 'Driver'}_Odometer_Report_${fromDate}_to_${toDate}`;

    if (resolvedFormat === 'pdf') {
       let totalDistance = targetTrips.reduce((acc, t) => acc + (t.distance || 0), 0);
       let rowsHtml = targetTrips.map(t => `
         <tr>
           <td style="padding: 10px; border-bottom: 1px solid #e5e7eb;">${t.date}</td>
           <td style="padding: 10px; border-bottom: 1px solid #e5e7eb; font-family: monospace;">${t.startKm.toLocaleString()} KM</td>
           <td style="padding: 10px; border-bottom: 1px solid #e5e7eb; font-family: monospace;">${t.endKm.toLocaleString()} KM</td>
           <td style="padding: 10px; border-bottom: 1px solid #e5e7eb; font-family: monospace; font-weight: bold; color: #047857;">+${t.distance} KM</td>
         </tr>
       `).join('');

       let pdfHtml = `
         <div style="font-family: Arial, sans-serif; padding: 25px;">
           <h2 style="color: #047857; text-transform: uppercase; margin-bottom: 5px; font-weight: 900;">Kuwait Logistics Hub</h2>
           <h3 style="color: #4b5563; text-transform: uppercase; margin-top: 0; font-size: 14px;">Vehicle Running & Mileage Tracker Report</h3>
           <hr style="border: 0; border-top: 2px solid #e5e7eb; margin: 20px 0;" />
           <p style="font-size: 13px; line-height: 1.5;"><strong>Driver:</strong> ${driver?.name || 'N/A'} (${driver?.email})</p>
           <p style="font-size: 13px; line-height: 1.5;"><strong>Vehicle Unit:</strong> ${driver?.vehicle || 'N/A'} | <strong>Plate Code:</strong> ${getVehiclePlate(driver)}</p>
           <p style="font-size: 13px; line-height: 1.5;"><strong>Date Range:</strong> ${fromDate} to ${toDate}</p>
           
           <table style="width: 100%; border-collapse: collapse; margin-top: 20px;">
             <thead>
               <tr style="background-color: #f3f4f6; text-align: left; border-bottom: 2px solid #e5e7eb; font-size: 13px;">
                 <th style="padding: 10px;">Date</th>
                 <th style="padding: 10px;">Start Odometer</th>
                 <th style="padding: 10px;">End Odometer</th>
                 <th style="padding: 10px;">Distance Run</th>
               </tr>
             </thead>
             <tbody style="font-size: 12px;">
               ${rowsHtml || '<tr><td colspan="4" style="padding: 20px; text-align: center; color: #9ca3af;">No trips run in this date range.</td></tr>'}
             </tbody>
           </table>

           <div style="margin-top: 30px; padding: 15px; background-color: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; width: fit-content; min-width: 250px;">
             <p style="margin: 0; font-size: 15px; color: #047857; font-weight: bold;"><strong>Total Distance Traveled:</strong> ${totalDistance.toLocaleString()} KM</p>
           </div>
         </div>
       `;

       globalPrintPDF(filename, pdfHtml);
       showToast("✓ Triggered print engine for Adobe PDF report!");
    } else if (resolvedFormat === 'xlsx') {
       let rowsHtml = targetTrips.map(t => `
         <tr>
           <td>${t.date}</td>
           <td>${t.startKm}</td>
           <td>${t.endKm}</td>
           <td>${t.distance}</td>
         </tr>
       `).join('');

       let xlsHtml = `
         <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
         <head>
           <meta charset="utf-8">
           <style>
             th { background-color: #047857; color: white; font-weight: bold; }
             td { border: 1px solid #cbd5e1; padding: 8px; }
           </style>
         </head>
         <body>
           <h3>Odometer & Mileage Report</h3>
           <p><strong>Driver:</strong> ${driver?.name || 'N/A'}</p>
           <p><strong>Vehicle:</strong> ${driver?.vehicle || 'N/A'}</p>
           <p><strong>Period:</strong> ${fromDate} to ${toDate}</p>
           <table>
             <thead>
               <tr>
                 <th>Date</th>
                 <th>Start Odometer (KM)</th>
                 <th>End Odometer (KM)</th>
                 <th>Distance Traveled (KM)</th>
               </tr>
             </thead>
             <tbody>
               ${rowsHtml}
             </tbody>
           </table>
         </body>
         </html>
       `;
       globalDownloadBlob(xlsHtml, `${filename}.xlsx`, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
       showToast(`✓ Microsoft Excel Odometer Report (.xlsx) downloaded successfully!`);
    } else if (resolvedFormat === 'docx') {
       let rowsHtml = targetTrips.map(t => `
         <tr>
           <td style="border: 1px solid #e5e7eb; padding: 8px;">${t.date}</td>
           <td style="border: 1px solid #e5e7eb; padding: 8px;">${t.startKm.toLocaleString()} KM</td>
           <td style="border: 1px solid #e5e7eb; padding: 8px;">${t.endKm.toLocaleString()} KM</td>
           <td style="border: 1px solid #e5e7eb; padding: 8px;">${t.distance} KM</td>
         </tr>
       `).join('');

       let docHtml = `
         <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40">
         <head><meta charset="utf-8"></head>
         <body style="font-family: Arial, sans-serif;">
           <h2>KUWAIT LOGISTICS ODOMETER TRACKING REPORT</h2>
           <p><strong>Driver Name:</strong> ${driver?.name || 'N/A'}</p>
           <p><strong>Compiled Period:</strong> ${fromDate} to ${toDate}</p>
           <table style="width: 100%; border-collapse: collapse;">
             <thead>
               <tr style="background-color: #f3f4f6;">
                 <th style="border: 1px solid #e5e7eb; padding: 8px; text-align: left;">Date</th>
                 <th style="border: 1px solid #e5e7eb; padding: 8px; text-align: left;">Start Odometer</th>
                 <th style="border: 1px solid #e5e7eb; padding: 8px; text-align: left;">End Odometer</th>
                 <th style="border: 1px solid #e5e7eb; padding: 8px; text-align: left;">Distance Travled</th>
               </tr>
             </thead>
             <tbody>
               ${rowsHtml}
             </tbody>
           </table>
         </body>
         </html>
       `;
       globalDownloadBlob(docHtml, `${filename}.docx`, 'application/msword');
       showToast(`✓ Microsoft Word Odometer Report (.docx) downloaded successfully!`);
    }
  };

  // Log Service State Hooks
  const [srvDate, setSrvDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [srvKm, setSrvKm] = useState<string>(odometer.toString());
  const [srvInterval, setSrvInterval] = useState<string>('10000');
  const [srvCategory, setSrvCategory] = useState<string>('General Service (ஜெனரல் சர்வீஸ்)');

  // Log Additional Service State Hooks
  const [incDate, setIncDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [incKm, setIncKm] = useState<string>(odometer.toString());
  const [incRemark, setIncRemark] = useState<string>('');

  const srvLastKm = maintenance.lastServiceKm !== null ? maintenance.lastServiceKm : 0;
  const srvTargetKm = maintenance.nextServiceKm !== null ? maintenance.nextServiceKm : (srvLastKm + getNoCodeServiceInterval());
  const rmKm = srvTargetKm - odometer;

  const handleSaveServiceLog = () => {
    const kmNum = parseInt(srvKm);
    const intervalNum = parseInt(srvInterval);
    if (!srvDate) {
      alert("Please select a service date (டேட்டிவிலிருந்து)");
      return;
    }
    if (isNaN(kmNum) || kmNum < 0) {
      alert("Please enter a valid Service Odometer Reading (சர்வீஸ் செய்யும்போது இருந்த கிலோமீட்டர்)");
      return;
    }
    if (isNaN(intervalNum) || intervalNum <= 0) {
      alert("Please enter a valid Next Service Interval Rule");
      return;
    }

    if (onLogService) {
      onLogService({
        date: srvDate,
        km: kmNum,
        cost: 0,
        type: srvCategory
      }, intervalNum);
      
      // Auto-set resetting/updating the default Odometer Reading state
      setSrvKm(odometer.toString());
    }
  };

  const handleSaveIncident = () => {
    const kmNum = parseInt(incKm);
    if (!incDate) {
      alert("Please select Incident Date (தேதி)");
      return;
    }
    if (isNaN(kmNum) || kmNum < 0) {
      alert("Please enter a valid Current Odometer Reading (அப்போதைய கிலோமீட்டர்)");
      return;
    }
    if (!incRemark.trim()) {
      alert("Please enter a short Description/Remark for the repair");
      return;
    }

    if (onLogService) {
      onLogService({
        date: incDate,
        km: kmNum,
        cost: 0,
        type: `Additional: ${incRemark.trim()}`
      }, undefined, true);
      
      // Reset incident fields
      setIncRemark('');
      setIncKm(odometer.toString());
    }
  };

  const isGreen = rmKm > 5000;
  const isOrange = rmKm <= 5000 && rmKm >= 1001;
  const isRed = rmKm <= 1000;

  return (
    <motion.div
      key="vehicle"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      className="p-6 md:p-12 space-y-10 flex-1 overflow-y-auto no-scrollbar"
    >
      <header className="flex items-center gap-6">
        <button onClick={onBack} className="p-3 border border-neutral-200 rounded-xl hover:bg-neutral-100 transition-colors">
          <ChevronLeft size={24} />
        </button>
        <h1 className="text-3xl font-black uppercase tracking-tight text-left">Trip Management</h1>
      </header>

      <div className="space-y-6">
        {/* Maintenance Indicator (aligned with dynamic 3-status color-coded logic) */}
        {(() => {
          let cardBg = '';
          let borderClass = '';
          let textColor = '';
          let textStr = '';
          let iconColor = '';
          let pulse = false;

          if (isGreen) {
            cardBg = 'bg-emerald-50/70';
            borderClass = 'border-emerald-200';
            textColor = 'text-emerald-900';
            textStr = `Vehicle Status: Good (${rmKm.toLocaleString()} KM left)`;
            iconColor = 'text-emerald-500';
          } else if (isOrange) {
            cardBg = 'bg-amber-50/70';
            borderClass = 'border-amber-200';
            textColor = 'text-amber-950';
            textStr = `Service Due Soon (${rmKm.toLocaleString()} KM left)`;
            iconColor = 'text-amber-500';
          } else {
            cardBg = 'bg-red-50/90';
            borderClass = 'border-red-200 animate-pulse';
            textColor = 'text-red-900 font-extrabold';
            textStr = 'URGENT: Service Required Immediately!';
            iconColor = 'text-red-500';
            pulse = true;
          }

          return (
            <div className={`p-6 rounded-3xl border-2 flex items-center justify-between ${cardBg} ${borderClass}`}>
              <div className="space-y-1 text-left">
                <p className="text-[10px] font-black uppercase text-neutral-400 tracking-widest">Maintenance Status</p>
                <p className={`text-lg font-black uppercase ${textColor}`}>
                  {textStr}
                </p>
                <p className="text-[9px] font-bold text-neutral-400 uppercase tracking-widest">
                  Last checkup: {srvLastKm.toLocaleString()} KM • Next Target: {srvTargetKm.toLocaleString()} KM
                </p>
              </div>
              <motion.div 
                animate={pulse ? { scale: [1, 1.2, 1], opacity: [1, 0.5, 1] } : {}}
                transition={{ repeat: Infinity, duration: 1 }}
                className={`w-10 h-10 rounded-full flex items-center justify-center ${iconColor}`}
              >
                <Wrench size={24} />
              </motion.div>
            </div>
          );
        })()}

        {/* Status Card */}
        <div className={`p-6 rounded-2xl border-2 transition-all ${dailyTrip.active ? 'bg-success/5 border-success/20' : 'bg-neutral-50 border-neutral-200'}`}>
          <div className="flex justify-between items-center mb-6">
            <div className="space-y-1 text-left">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-neutral-400">Shift Status</p>
              <p className={`text-xl font-black uppercase ${dailyTrip.active ? 'text-success' : 'text-neutral-400'}`}>
                {dailyTrip.active ? 'Active on Road' : 'Shift Not Started'}
              </p>
            </div>
            <div className={`w-12 h-12 rounded-full flex items-center justify-center ${dailyTrip.active ? 'bg-success text-white' : 'bg-neutral-200 text-neutral-400'}`}>
              <Milestone size={24} />
            </div>
          </div>

          <div className="space-y-4">
            <div className="space-y-1 text-left">
              <label className="text-[10px] font-black uppercase tracking-widest text-neutral-400 pl-1">Enter Odometer (KM)</label>
              <div className="relative">
                <input 
                  type="number"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  className="w-full bg-white border border-neutral-200 p-6 rounded-2xl text-3xl font-black focus:ring-4 focus:ring-accent/10 outline-none transition-all"
                  placeholder="0"
                />
                <span className="absolute right-6 top-1/2 -translate-y-1/2 text-neutral-300 font-bold">KM</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {!dailyTrip.active ? (
                <button 
                  onClick={() => onStartTrip(parseInt(inputValue))}
                  className="col-span-2 bg-ink text-white py-6 rounded-2xl font-black text-[12px] uppercase tracking-[0.2em] shadow-xl shadow-ink/20 hover:brightness-110 active:scale-95 transition-all text-center"
                >
                  Confirm Start KM
                </button>
              ) : (
                <>
                  <button 
                    onClick={() => onUpdateKM(parseInt(inputValue))}
                    className="bg-accent text-white py-6 rounded-xl font-black text-[10px] uppercase tracking-widest hover:brightness-110 active:scale-95 transition-all text-center"
                  >
                    Update Current
                  </button>
                  <button 
                    onClick={() => onEndTrip(parseInt(inputValue))}
                    className="bg-danger text-white py-6 rounded-xl font-black text-[10px] uppercase tracking-widest hover:brightness-110 active:scale-95 transition-all shadow-xl shadow-danger/20 text-center"
                  >
                    End Shift
                  </button>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Info Grid */}
        <div className="grid grid-cols-2 gap-4 text-left">
          <div className="bg-white p-6 rounded-2xl border border-neutral-100 shadow-sm">
            <p className="text-[10px] font-black uppercase tracking-widest text-neutral-300">Total KM</p>
            <p className="text-2xl font-black">{odometer.toLocaleString()}</p>
          </div>
          <div className="bg-white p-6 rounded-2xl border border-neutral-100 shadow-sm">
            <p className="text-[10px] font-black uppercase tracking-widest text-neutral-300">Today's Run</p>
            <p className="text-2xl font-black text-accent">
              {dailyTrip.active && dailyTrip.startKm !== null ? `${odometer - dailyTrip.startKm} KM` : '0 KM'}
            </p>
          </div>
        </div>

        {/* Historical Context */}
        {dailyTrip.active && dailyTrip.startKm !== null && (
          <div className="bg-neutral-900 p-6 rounded-2xl text-white flex items-center justify-between">
            <div className="space-y-1 text-left">
              <p className="text-[10px] font-black text-white/40 uppercase tracking-widest">Start KM registered at</p>
              <p className="text-lg font-black">{dailyTrip.startKm.toLocaleString()} KM</p>
            </div>
            <div className="text-right">
              <p className="text-[10px] font-black text-white/40 uppercase tracking-widest">Current Session</p>
              <p className="text-lg font-black text-success">Active</p>
            </div>
          </div>
        )}

        {/* LOG VEHICLE SERVICE FORM SECTION */}
        <div className="bg-white border border-neutral-200 rounded-3xl p-6 md:p-8 space-y-6 shadow-sm">
          <div className="border-b border-neutral-100 pb-4">
            <h3 className="text-xl font-black text-ink flex items-center gap-3 uppercase tracking-tight text-left">
              <Wrench size={20} className="text-accent" /> Log Vehicle Service
            </h3>
            <p className="text-xs text-neutral-400 mt-1 font-semibold leading-relaxed text-left">
              Log completed vehicle service visits to compute next maintenance goals and reset mileage counters.
            </p>
          </div>

          <div className="space-y-4">
            {/* Service Category (Select Dropdown) */}
            <div className="space-y-1 text-left">
              <label className="text-[10px] font-black uppercase tracking-widest text-neutral-400 pl-1">
                Service Category (சர்வீஸ் வகை)
              </label>
              <select
                value={srvCategory}
                onChange={(e) => setSrvCategory(e.target.value)}
                className="w-full bg-neutral-50 border border-neutral-200 p-4 rounded-xl text-sm font-bold focus:ring-4 focus:ring-accent/10 outline-none transition-all cursor-pointer"
              >
                {getNoCodeServiceCategories().map((cat, idx) => (
                  <option key={idx} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            {/* Service Date Input */}
            <div className="space-y-1 text-left">
              <label className="text-[10px] font-black uppercase tracking-widest text-neutral-400 pl-1 flex items-center justify-between">
                <span>Service Date (டேட்டிவிலிருந்து)</span>
                <span className="text-accent font-semibold font-mono">YYYY-MM-DD</span>
              </label>
              <input 
                type="date"
                value={srvDate}
                onChange={(e) => setSrvDate(e.target.value)}
                className="w-full bg-neutral-50 border border-neutral-200 p-4 rounded-xl text-sm font-bold focus:ring-4 focus:ring-accent/10 outline-none transition-all"
              />
            </div>

            {/* Service Odometer Reading Input */}
            <div className="space-y-1 text-left">
              <label className="text-[10px] font-black uppercase tracking-widest text-neutral-400 pl-1">
                Service Odometer Reading (சர்வீஸ் செய்யும்போது இருந்த கிலோமீட்டர்)
              </label>
              <div className="relative">
                <input 
                  type="number"
                  value={srvKm}
                  onChange={(e) => setSrvKm(e.target.value)}
                  className="w-full bg-neutral-50 border border-neutral-200 p-4 rounded-xl text-base font-black focus:ring-4 focus:ring-accent/10 outline-none transition-all"
                  placeholder="e.g. 15000"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-neutral-400 font-bold text-xs">KM</span>
              </div>
            </div>

            {/* Next Service Interval Rule Input */}
            <div className="space-y-1 text-left">
              <label className="text-[10px] font-black uppercase tracking-widest text-neutral-400 pl-1">
                Next Service Interval Rule (Default set to 10,000 KM)
              </label>
              <div className="relative">
                <input 
                  type="number"
                  value={srvInterval}
                  onChange={(e) => setSrvInterval(e.target.value)}
                  className="w-full bg-neutral-50 border border-neutral-200 p-4 rounded-xl text-base font-black focus:ring-4 focus:ring-accent/10 outline-none transition-all"
                  placeholder="10000"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-neutral-400 font-bold text-xs">KM</span>
              </div>
            </div>

            {/* Save Log Button */}
            <button
              type="button"
              onClick={handleSaveServiceLog}
              className="w-full bg-ink text-white py-4 rounded-xl font-black text-xs uppercase tracking-[0.15em] shadow-xl shadow-ink/15 hover:brightness-110 active:scale-95 transition-all text-center"
            >
              Save Service Log
            </button>
          </div>
        </div>

        {/* LOG ADDITIONAL SERVICE FORM SECTION */}
        <div className="bg-white border border-neutral-200 rounded-3xl p-6 md:p-8 space-y-6 shadow-sm">
          <div className="border-b border-neutral-100 pb-4">
            <div className="flex justify-between items-center">
              <h3 className="text-xl font-black text-ink flex items-center gap-3 uppercase tracking-tight text-left">
                <Wrench size={20} className="text-indigo-600" /> Log Additional Service
              </h3>
              <span className="text-[8px] bg-indigo-50 text-indigo-600 font-extrabold px-2 py-0.5 rounded uppercase tracking-widest font-mono">
                இடைக்கால கூடுதல் சர்வீஸ்
              </span>
            </div>
            <p className="text-xs text-neutral-400 mt-1 font-semibold leading-relaxed text-left">
              Record mid-interval issues (such as punctures or emergency repairs) directly into history without altering standard company maintenance intervals.
            </p>
          </div>

          <div className="space-y-4">
            {/* Incident Date Input */}
            <div className="space-y-1 text-left">
              <label className="text-[10px] font-black uppercase tracking-widest text-neutral-400 pl-1 flex items-center justify-between">
                <span>Incident Date (தேதி)</span>
                <span className="text-indigo-500 font-semibold font-mono">YYYY-MM-DD</span>
              </label>
              <input 
                type="date"
                value={incDate}
                onChange={(e) => setIncDate(e.target.value)}
                className="w-full bg-neutral-50 border border-neutral-200 p-4 rounded-xl text-sm font-bold focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all"
              />
            </div>

            {/* Current Odometer Reading Input */}
            <div className="space-y-1 text-left">
              <label className="text-[10px] font-black uppercase tracking-widest text-neutral-400 pl-1">
                Current Odometer Reading (அப்போதைய கிலோமீட்டர்)
              </label>
              <div className="relative">
                <input 
                  type="number"
                  value={incKm}
                  onChange={(e) => setIncKm(e.target.value)}
                  className="w-full bg-neutral-50 border border-neutral-200 p-4 rounded-xl text-base font-black focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all"
                  placeholder={odometer.toString()}
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-neutral-400 font-bold text-xs">KM</span>
              </div>
            </div>

            {/* Description/Remark Input */}
            <div className="space-y-1 text-left">
              <label className="text-[10px] font-black uppercase tracking-widest text-neutral-400 pl-1">
                Short Description/Remark (விவரம்)
              </label>
              <input 
                type="text"
                value={incRemark}
                onChange={(e) => setIncRemark(e.target.value)}
                className="w-full bg-neutral-50 border border-neutral-200 p-4 rounded-xl text-sm font-bold focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all"
                placeholder="e.g. Tyre Puncture, Sudden breakdown repair"
              />
            </div>

            {/* Save Incident Button */}
            <button
              type="button"
              onClick={handleSaveIncident}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-4 rounded-xl font-black text-xs uppercase tracking-[0.15em] shadow-xl shadow-indigo-600/15 hover:brightness-110 active:scale-95 transition-all text-center"
            >
              Log Additional Service
            </button>
          </div>
        </div>

        {/* SERVICES HISTORY LOG LIST */}
        <div className="bg-white border border-neutral-200 rounded-3xl p-6 space-y-4 shadow-sm">
          <div className="border-b border-neutral-100 pb-2">
            <h4 className="text-[11px] font-black uppercase tracking-widest text-neutral-400 text-left">Service Logs History</h4>
          </div>

          <div className="space-y-3">
            {(() => {
              const activeHistory = maintenance.serviceHistory 
                ? maintenance.serviceHistory.filter(s => !s.companyDeleted) 
                : [];

              if (activeHistory.length === 0) {
                return (
                  <div className="py-8 text-center bg-neutral-50 border border-dashed border-neutral-200 rounded-2xl">
                    <p className="text-[10px] font-black uppercase tracking-widest text-neutral-400">No past services completed yet</p>
                  </div>
                );
              }

              return activeHistory.map((item) => {
                const isAdditionalVal = item.type.startsWith('Additional:');
                const displayName = isAdditionalVal ? item.type.replace('Additional:', '').trim() : item.type;
                return (
                  <div key={item.id} className="bg-neutral-50 border border-neutral-200 p-4 rounded-xl flex items-center justify-between text-left">
                    <div className="space-y-1">
                      <p className="text-[11px] font-extrabold text-neutral-800">{displayName || 'Completed Service'}</p>
                      <p className="text-[10px] text-neutral-500 font-bold">
                        Odometer: <span className="font-mono text-neutral-700">{item.km.toLocaleString()} KM</span>
                      </p>
                      <p className="text-[9px] text-neutral-450 font-bold uppercase tracking-widest font-mono">Date: {item.date}</p>
                    </div>
                    <div className="text-right">
                      {isAdditionalVal ? (
                        <span className="bg-indigo-50 text-indigo-700 border border-indigo-100 text-[8px] font-black uppercase px-2 py-1 rounded">
                          Mid-Interval (கூடுதல்)
                        </span>
                      ) : (
                        <span className="bg-emerald-50 text-emerald-700 border border-emerald-100 text-[8px] font-black uppercase px-2 py-1 rounded">
                          Completed
                        </span>
                      )}
                    </div>
                  </div>
                );
              });
            })()}
          </div>
        </div>

        {/* Dedicated Isolated Odometer Report Exporter */}
        <div className="bg-white border border-neutral-200 rounded-[28px] p-6 md:p-8 space-y-4 shadow-sm text-left mt-8">
          <div>
            <h3 className="text-sm font-black uppercase tracking-tight text-ink flex items-center gap-2">
              <Calendar size={16} className="text-emerald-600" />
              Download Odometer Report
            </h3>
            <p className="text-[10px] text-neutral-450 uppercase font-bold tracking-wider">Configure export range and file format protocols</p>
          </div>
          
          <div className="grid grid-cols-2 gap-4 pb-2">
            <div className="space-y-1">
              <label className="text-[9px] font-black text-neutral-450 uppercase tracking-widest pl-1">From Date</label>
              <input 
                type="date"
                value={fromDate}
                onChange={e => setFromDate(e.target.value)}
                className="w-full bg-neutral-50 border border-neutral-150 p-3 rounded-xl text-xs font-bold font-mono outline-none"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[9px] font-black text-neutral-450 uppercase tracking-widest pl-1">To Date</label>
              <input 
                type="date"
                value={toDate}
                onChange={e => setToDate(e.target.value)}
                className="w-full bg-neutral-50 border border-neutral-150 p-3 rounded-xl text-xs font-bold font-mono outline-none"
              />
            </div>
          </div>

          {userRole === 'admin' ? (
            <div className="space-y-1">
              <label className="text-[9px] font-black uppercase tracking-widest text-neutral-400 pl-1 font-mono">
                Select Format (வடிவம்)
              </label>
              <select
                value={odometerFormat}
                onChange={(e) => setOdometerFormat(e.target.value as 'xlsx' | 'docx' | 'pdf')}
                className="w-full bg-white border border-neutral-200 p-3 rounded-xl text-xs font-bold font-sans cursor-pointer text-ink outline-none"
              >
                <option value="xlsx">Microsoft Excel (.xlsx)</option>
                <option value="docx">Microsoft Word (.docx)</option>
                <option value="pdf">Adobe PDF Document (.pdf)</option>
              </select>
            </div>
          ) : (
            <div className="space-y-1">
              <label className="text-[9px] font-black uppercase tracking-widest text-neutral-400 pl-1 font-mono">
                Export Format (வடிவம்)
              </label>
              <div className="w-full bg-neutral-100/60 border border-neutral-200/50 p-4 rounded-xl text-xs font-bold text-neutral-600 flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                Adobe PDF Document (.pdf) [🔒 Secure PDF]
              </div>
            </div>
          )}

          <button
            onClick={handleDownloadOdometerReportCustom}
            className={`w-full text-white py-3.5 px-5 rounded-xl font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2.5 shadow-md active:scale-[0.98] mt-2 cursor-pointer ${
              (userRole === 'admin' ? odometerFormat : 'pdf') === 'xlsx' 
                ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/10' 
                : (userRole === 'admin' ? odometerFormat : 'pdf') === 'docx' 
                ? 'bg-blue-600 hover:bg-blue-700 shadow-blue-600/10' 
                : 'bg-red-600 hover:bg-red-700 shadow-red-600/10'
            }`}
          >
            <Download size={14} />
            <span>Download Odometer Report</span>
          </button>
        </div>
      </div>
    </motion.div>
  );
}

// --- Fuel Log Screen ---
function FuelLog({ 
  onBack, 
  fuelBalance, 
  odometer,
  onUpdateFuel,
  driver,
  userRole = 'driver'
}: { 
  onBack: () => void, 
  fuelBalance: number, 
  odometer: number,
  onUpdateFuel: (amount: number, newOdo: number, liters: number) => void,
  driver?: DriverStat,
  userRole?: string
}) {
  const [fuelInput, setFuelInput] = useState<string>('');
  const [odoInput, setOdoInput] = useState<string>(odometer.toString());
  const [litersInput, setLitersInput] = useState<string>('');

  const [fromDate, setFromDate] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return d.toISOString().split('T')[0];
  });
  const [toDate, setToDate] = useState<string>(() => new Date().toISOString().split('T')[0]);
  const [fuelFormat, setFuelFormat] = useState<'xlsx' | 'docx' | 'pdf'>('pdf');

  const handleDownloadFuelReportCustom = () => {
    const resolvedFormat = userRole === 'admin' ? fuelFormat : 'pdf';
    const activeEntries = driver ? driver.fuelEntries.filter(e => !e.companyDeleted) : [];

    const isDateInRangeLocal = (dateStr: string): boolean => {
      if (!dateStr) return false;
      const start = new Date(fromDate);
      const end = new Date(toDate);
      start.setHours(0,0,0,0);
      end.setHours(23,59,59,999);
      const d = parseToDateHelper(dateStr);
      return d >= start && d <= end;
    };

    const targetEntries = activeEntries.filter(e => isDateInRangeLocal(e.date));
    let filename = `${driver?.name || 'Driver'}_Fuel_Report_${fromDate}_to_${toDate}`;

    if (resolvedFormat === 'pdf') {
       let totalCost = targetEntries.reduce((acc, e) => acc + (e.amount || 0), 0);
       let totalLiters = targetEntries.reduce((acc, e) => acc + (e.liters || 0), 0);
       let rowsHtml = targetEntries.map(e => `
         <tr>
           <td style="padding: 10px; border-bottom: 1px solid #e5e7eb;">${e.date}</td>
           <td style="padding: 10px; border-bottom: 1px solid #e5e7eb; font-family: monospace;">${e.currOdo.toLocaleString()} KM</td>
           <td style="padding: 10px; border-bottom: 1px solid #e5e7eb; font-family: monospace;">${e.liters?.toFixed(2) || '0.00'} L</td>
           <td style="padding: 10px; border-bottom: 1px solid #e5e7eb; font-family: monospace; font-weight: bold; color: #1e3a8a;">${e.amount?.toFixed(3) || '0.000'} KD</td>
         </tr>
       `).join('');

       let pdfHtml = `
         <div style="font-family: Arial, sans-serif; padding: 25px;">
           <h2 style="color: #1e3a8a; text-transform: uppercase; margin-bottom: 5px; font-weight: 900;">Kuwait Logistics Hub</h2>
           <h3 style="color: #4b5563; text-transform: uppercase; margin-top: 0; font-size: 14px;">Fuel Consumption & Segregation Report</h3>
           <hr style="border: 0; border-top: 2px solid #e5e7eb; margin: 20px 0;" />
           <p style="font-size: 13px; line-height: 1.5;"><strong>Driver:</strong> ${driver?.name || 'N/A'} (${driver?.email})</p>
           <p style="font-size: 13px; line-height: 1.5;"><strong>Vehicle Unit:</strong> ${driver?.vehicle || 'N/A'} | <strong>Plate Code:</strong> ${getVehiclePlate(driver)}</p>
           <p style="font-size: 13px; line-height: 1.5;"><strong>Date Range:</strong> ${fromDate} to ${toDate}</p>
           
           <table style="width: 100%; border-collapse: collapse; margin-top: 20px;">
             <thead>
               <tr style="background-color: #f3f4f6; text-align: left; border-bottom: 2px solid #e5e7eb; font-size: 13px;">
                 <th style="padding: 10px;">Date</th>
                 <th style="padding: 10px;">Odometer (KM)</th>
                 <th style="padding: 10px;">Fuel (Liters)</th>
                 <th style="padding: 10px;">Total Cost (KWD)</th>
               </tr>
             </thead>
             <tbody style="font-size: 12px;">
               ${rowsHtml || '<tr><td colspan="4" style="padding: 20px; text-align: center; color: #9ca3af;">No fuel entries registered in this range.</td></tr>'}
             </tbody>
           </table>

           <div style="margin-top: 30px; padding: 15px; background-color: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; width: fit-content; min-width: 250px;">
             <p style="margin: 0; font-size: 13px;"><strong>Total Fuel Loaded:</strong> ${totalLiters.toFixed(2)} Liters</p>
             <p style="margin: 5px 0 0 0; font-size: 15px; color: #1e3a8a; font-weight: bold;"><strong>Total Outlay:</strong> ${totalCost.toFixed(3)} KWD</p>
           </div>
         </div>
       `;

       globalPrintPDF(filename, pdfHtml);
       showToast("✓ Triggered print engine for Adobe PDF report!");
    } else if (resolvedFormat === 'xlsx') {
       let rowsHtml = targetEntries.map(e => `
         <tr>
           <td>${e.date}</td>
           <td>${e.currOdo}</td>
           <td>${e.liters?.toFixed(2) || '0.00'}</td>
           <td>${e.amount?.toFixed(3) || '0.000'}</td>
         </tr>
       `).join('');

       let xlsHtml = `
         <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
         <head>
           <meta charset="utf-8">
           <style>
             th { background-color: #047857; color: white; font-weight: bold; }
             td { border: 1px solid #cbd5e1; padding: 8px; }
           </style>
         </head>
         <body>
           <h3>Fuel Consumption Report</h3>
           <p><strong>Driver:</strong> ${driver?.name || 'N/A'}</p>
           <p><strong>Vehicle:</strong> ${driver?.vehicle || 'N/A'}</p>
           <p><strong>Period:</strong> ${fromDate} to ${toDate}</p>
           <table>
             <thead>
               <tr>
                 <th>Date</th>
                 <th>Odometer (KM)</th>
                 <th>Liters</th>
                 <th>Amount (KWD)</th>
               </tr>
             </thead>
             <tbody>
               ${rowsHtml}
             </tbody>
           </table>
         </body>
         </html>
       `;
       globalDownloadBlob(xlsHtml, `${filename}.xlsx`, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
       showToast(`✓ Microsoft Excel Fuel Report (.xlsx) downloaded successfully!`);
    } else if (resolvedFormat === 'docx') {
       let rowsHtml = targetEntries.map(e => `
         <tr>
           <td style="border: 1px solid #e5e7eb; padding: 8px;">${e.date}</td>
           <td style="border: 1px solid #e5e7eb; padding: 8px;">${e.currOdo.toLocaleString()} KM</td>
           <td style="border: 1px solid #e5e7eb; padding: 8px;">${e.liters?.toFixed(2) || '0.00'} L</td>
           <td style="border: 1px solid #e5e7eb; padding: 8px;">${e.amount?.toFixed(3) || '0.000'} KD</td>
         </tr>
       `).join('');

       let docHtml = `
         <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40">
         <head><meta charset="utf-8"></head>
         <body style="font-family: Arial, sans-serif;">
           <h2>KUWAIT LOGISTICS FUEL CONSUMPTION REPORT</h2>
           <p><strong>Driver Name:</strong> ${driver?.name || 'N/A'}</p>
           <p><strong>Compiled Period:</strong> ${fromDate} to ${toDate}</p>
           <table style="width: 100%; border-collapse: collapse;">
             <thead>
               <tr style="background-color: #f3f4f6;">
                 <th style="border: 1px solid #e5e7eb; padding: 8px; text-align: left;">Date</th>
                 <th style="border: 1px solid #e5e7eb; padding: 8px; text-align: left;">Odometer (KM)</th>
                 <th style="border: 1px solid #e5e7eb; padding: 8px; text-align: left;">Liters</th>
                 <th style="border: 1px solid #e5e7eb; padding: 8px; text-align: left;">Cost KWD</th>
               </tr>
             </thead>
             <tbody>
               ${rowsHtml}
             </tbody>
           </table>
         </body>
         </html>
       `;
       globalDownloadBlob(docHtml, `${filename}.docx`, 'application/msword');
       showToast(`✓ Microsoft Word Fuel Report (.docx) downloaded successfully!`);
    }
  };

  const fuelAmount = parseFloat(fuelInput) || 0;
  const currentOdo = parseInt(odoInput) || odometer;
  const distance = Math.max(0, currentOdo - odometer);
  const efficiency = distance > 0 && fuelAmount > 0 ? (distance / fuelAmount).toFixed(2) : '0.00';

  const COMPANY_BUDGET_LIMIT = getNoCodeBudgetLimit();
  const activeEntries = driver ? driver.fuelEntries.filter(e => !e.companyDeleted) : [];
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  const parseToDateHelper = (dateStr: string): Date => {
    if (!dateStr) return new Date();
    if (dateStr.includes('/')) {
      const parts = dateStr.split('/');
      if (parts.length === 3) {
        const p0 = parseInt(parts[0], 10);
        const p1 = parseInt(parts[1], 10);
        const p2 = parseInt(parts[2], 10);
        if (p0 > 12) {
          return new Date(p2, p1 - 1, p0); // D/M/Y
        }
        return new Date(p2, p0 - 1, p1); // M/D/Y
      }
    }
    return new Date(dateStr);
  };

  const monthlySpent = activeEntries
    .filter(e => {
      try {
        const itemDate = parseToDateHelper(e.date);
        return itemDate.getMonth() === currentMonth && itemDate.getFullYear() === currentYear;
      } catch {
        return true;
      }
    })
    .reduce((acc, e) => acc + (e.amount || 0), 0);

  const companyBalance = Math.max(0, COMPANY_BUDGET_LIMIT - monthlySpent);
  const isBudgetExceeded = monthlySpent > COMPANY_BUDGET_LIMIT;
  const progressPercent = Math.min(100, (monthlySpent / COMPANY_BUDGET_LIMIT) * 100);

  return (
    <motion.div
      key="fuel"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      className="p-6 md:p-12 space-y-8 flex-1 overflow-y-auto no-scrollbar"
    >
      <header className="flex items-center gap-6">
        <button onClick={onBack} className="p-3 border border-neutral-200 rounded-xl hover:bg-neutral-100 transition-colors">
          <ChevronLeft size={24} />
        </button>
        <h1 className="text-3xl font-extrabold uppercase tracking-tight">Refueling Log</h1>
      </header>

      <div className="space-y-6">
        {/* Dynamic Budget Balance Card */}
        <div className={`p-6 rounded-[24px] border border-neutral-200 space-y-4 shadow-sm w-full flex flex-col transition-all ${
          isBudgetExceeded ? 'bg-amber-50/50 border-l-[6px] border-l-amber-500' : 'bg-emerald-50/50 border-l-[6px] border-l-emerald-600'
        }`}>
          <div className="flex justify-between items-start w-full">
            <div className="space-y-1 text-left">
              <p className="text-[10px] font-black uppercase tracking-widest text-neutral-400">
                {isBudgetExceeded ? 'Company Fuel Budget Exhausted' : 'Remaining Company Fuel Balance'}
              </p>
              <div className="flex items-baseline gap-2">
                <span className={`text-3xl font-black tracking-tight ${isBudgetExceeded ? 'text-amber-600' : 'text-emerald-800'}`}>
                  {companyBalance.toFixed(3)}
                </span>
                <span className="text-sm font-bold text-neutral-400 italic">KWD</span>
              </div>
            </div>
            <div>
              {isBudgetExceeded ? (
                <div className="flex items-center gap-1 bg-amber-500 text-white px-2.5 py-1 rounded-lg text-[8px] font-black uppercase tracking-widest animate-pulse">
                  <AlertTriangle size={10} className="stroke-[3]" />
                  <span>Extra Account mode</span>
                </div>
              ) : (
                <div className="flex items-center gap-1 bg-emerald-600 text-white px-2.5 py-1 rounded-lg text-[8px] font-black uppercase tracking-widest">
                  <span>Card Active</span>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between items-center text-[10px] font-black text-neutral-400 uppercase tracking-widest">
              <span>Monthly Progress:</span>
              <span className="font-mono text-neutral-700">Spent: {monthlySpent.toFixed(3)} / {COMPANY_BUDGET_LIMIT.toFixed(3)} KWD</span>
            </div>
            {/* Progress Bar */}
            <div className="w-full h-2 bg-neutral-200 rounded-full overflow-hidden relative">
              <div 
                className={`h-full rounded-full transition-all duration-500 ${isBudgetExceeded ? 'bg-amber-500' : 'bg-emerald-600'}`}
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            {isBudgetExceeded && (
              <p className="text-[10px] font-bold text-amber-600 uppercase tracking-wider">
                📢 Notice: Subsequent entries are classified as <span className="font-black underline">Additional Expenses</span>.
              </p>
            )}
          </div>
        </div>

        {/* Form */}
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            
            {/* Odometer Reading input block */}
            <div className="space-y-1 text-left">
              <div className="flex justify-between items-center">
                <label className="text-[10px] font-black uppercase tracking-widest text-neutral-400 pl-1">Odometer Reading</label>
                <span className="text-[8px] font-extrabold text-neutral-400 font-mono uppercase">Prev: {odometer.toLocaleString()}</span>
              </div>
              <div className="relative">
                <input 
                  type="number"
                  value={odoInput}
                  onChange={(e) => setOdoInput(e.target.value)}
                  className="w-full bg-white border border-neutral-200 p-4 rounded-xl text-lg font-black focus:ring-4 focus:ring-accent/10 outline-none transition-all"
                  placeholder="Enter KM"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-neutral-300 font-bold text-xs">KM</span>
              </div>
            </div>

            {/* Amount KWD input block */}
            <div className="space-y-1 text-left">
              <label className="text-[10px] font-black uppercase tracking-widest text-neutral-400 pl-1">Amount (KWD)</label>
              <div className="relative">
                <input 
                  type="number"
                  step="0.001"
                  value={fuelInput}
                  onChange={(e) => setFuelInput(e.target.value)}
                  className="w-full bg-white border border-neutral-200 p-4 rounded-xl text-lg font-black focus:ring-4 focus:ring-accent/10 outline-none transition-all"
                  placeholder="0.000"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-neutral-300 font-bold text-xs">KWD</span>
              </div>
            </div>

            {/* Fuel Quantity Liters input block */}
            <div className="space-y-1 text-left">
              <div className="flex items-center justify-between">
                <label className="text-[10px] font-black uppercase tracking-widest text-neutral-400 pl-1">Fuel Quantity (Liters)</label>
                <span className="text-[8px] bg-indigo-50 text-indigo-600 font-black px-1.5 py-0.5 rounded uppercase tracking-wider">Mandatory</span>
              </div>
              <div className="relative">
                <input 
                  type="number"
                  step="0.01"
                  value={litersInput}
                  onChange={(e) => setLitersInput(e.target.value)}
                  className="w-full bg-white border border-neutral-200 p-4 rounded-xl text-lg font-black focus:ring-4 focus:ring-accent/10 outline-none transition-all"
                  placeholder="0.00"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-neutral-300 font-bold text-xs">Liters</span>
              </div>
            </div>

          </div>
        </div>

        {/* Live Metrics */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white border border-neutral-200 p-6 rounded-2xl shadow-sm text-center">
            <p className="text-[9px] font-black uppercase text-neutral-400 tracking-widest mb-1">Distance Run</p>
            <p className="text-2xl font-black">{distance} KM</p>
          </div>
          <div className="bg-white border border-neutral-200 p-6 rounded-2xl shadow-sm text-center">
            <p className="text-[9px] font-black uppercase text-neutral-400 tracking-widest mb-1">Efficiency</p>
            <p className="text-2xl font-black text-accent">{efficiency} <span className="text-[10px]">KM/KWD</span></p>
          </div>
        </div>

        <button 
          onClick={() => {
            const litersVal = parseFloat(litersInput);
            if (!litersVal || litersVal <= 0) {
              alert("Please enter a valid Fuel Quantity in Liters");
              return;
            }
            onUpdateFuel(fuelAmount, currentOdo, litersVal);
          }}
          disabled={!fuelInput || !odoInput || !litersInput || currentOdo < odometer || parseFloat(litersInput) <= 0}
          className="w-full bg-ink text-white py-6 rounded-2xl font-black text-[12px] uppercase tracking-[0.15em] hover:scale-[1.02] active:scale-[0.98] transition-all shadow-xl shadow-ink/20 disabled:opacity-50 disabled:grayscale disabled:hover:scale-100 text-center"
        >
          {currentOdo < odometer ? "Error: Check Odometer" : `Submit Fuel Log (+${fuelAmount} KWD)`}
        </button>

        <div className="bg-neutral-50 p-6 rounded-2xl border border-neutral-100 italic text-[11px] text-neutral-400">
          Privacy Notice: Fuel records are locked to your profile. Administrators can view metrics but cannot modify entries.
        </div>

        {/* Dedicated Isolated Fuel Report Exporter */}
        <div className="bg-white border border-neutral-200 rounded-[28px] p-6 md:p-8 space-y-4 shadow-sm text-left mt-8">
          <div>
            <h3 className="text-sm font-black uppercase tracking-tight text-ink flex items-center gap-2">
              <Fuel size={16} className="text-amber-500" />
              Download Fuel Log Report
            </h3>
            <p className="text-[10px] text-neutral-450 uppercase font-bold tracking-wider">Configure export range and file format protocols</p>
          </div>
          
          <div className="grid grid-cols-2 gap-4 pb-2">
            <div className="space-y-1">
              <label className="text-[9px] font-black text-neutral-450 uppercase tracking-widest pl-1">From Date</label>
              <input 
                type="date"
                value={fromDate}
                onChange={e => setFromDate(e.target.value)}
                className="w-full bg-neutral-50 border border-neutral-150 p-3 rounded-xl text-xs font-bold font-mono outline-none"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[9px] font-black text-neutral-450 uppercase tracking-widest pl-1">To Date</label>
              <input 
                type="date"
                value={toDate}
                onChange={e => setToDate(e.target.value)}
                className="w-full bg-neutral-50 border border-neutral-150 p-3 rounded-xl text-xs font-bold font-mono outline-none"
              />
            </div>
          </div>

          {userRole === 'admin' ? (
            <div className="space-y-1">
              <label className="text-[9px] font-black uppercase tracking-widest text-neutral-400 pl-1 font-mono">
                Select Format (வடிவம்)
              </label>
              <select
                value={fuelFormat}
                onChange={(e) => setFuelFormat(e.target.value as 'xlsx' | 'docx' | 'pdf')}
                className="w-full bg-white border border-neutral-200 p-3 rounded-xl text-xs font-bold font-sans cursor-pointer text-ink outline-none"
              >
                <option value="xlsx">Microsoft Excel (.xlsx)</option>
                <option value="docx">Microsoft Word (.docx)</option>
                <option value="pdf">Adobe PDF Document (.pdf)</option>
              </select>
            </div>
          ) : (
            <div className="space-y-1">
              <label className="text-[9px] font-black uppercase tracking-widest text-neutral-400 pl-1">
                Export Format (வடிவம்)
              </label>
              <div className="w-full bg-neutral-100/60 border border-neutral-200/50 p-4 rounded-xl text-xs font-bold text-neutral-600 flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                Adobe PDF Document (.pdf) [🔒 Secure PDF]
              </div>
            </div>
          )}

          <button
            onClick={handleDownloadFuelReportCustom}
            className={`w-full text-white py-3.5 px-5 rounded-xl font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2.5 shadow-md active:scale-[0.98] mt-2 cursor-pointer ${
              (userRole === 'admin' ? fuelFormat : 'pdf') === 'xlsx' 
                ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/10' 
                : (userRole === 'admin' ? fuelFormat : 'pdf') === 'docx' 
                ? 'bg-blue-600 hover:bg-blue-700 shadow-blue-600/10' 
                : 'bg-red-600 hover:bg-red-700 shadow-red-600/10'
            }`}
          >
            <Download size={14} />
            <span>Download Fuel Report</span>
          </button>
        </div>
      </div>
    </motion.div>
  );
}

// --- Fleet Overview (Admin) View ---
function FleetOverview({ 
  onBack, 
  drivers, 
  adminAuth,
  setAdminAuth,
  hourlyRate,
  setHourlyRate,
  onSaveDriver,
  onDeleteDriver,
  onPermanentDelete,
  onRestore,
  onSelectDriver,
  onResetDay,
  showToast,
  logoUrl,
  setLogoUrl,
  companyName,
  setCompanyName,
  companyTagline,
  setCompanyTagline
}: { 
  onBack: () => void, 
  drivers: DriverStat[], 
  adminAuth: { username: string, password: string },
  setAdminAuth: (v: { username: string, password: string }) => void,
  hourlyRate: number,
  setHourlyRate: (v: number) => void,
  onSaveDriver: (id: string | null, updates: Partial<DriverStat>) => void,
  onDeleteDriver: (id: string) => void,
  onPermanentDelete: (id: string, type: 'driver' | 'fuel' | 'duty' | 'service', driverId?: string) => void,
  onRestore: (id: string, type: 'driver' | 'fuel' | 'duty' | 'service', driverId?: string) => void,
  onSelectDriver: (id: string) => void,
  onResetDay: () => void,
  showToast: (m: string) => void,
  logoUrl: string,
  setLogoUrl: (v: string) => void,
  companyName: string,
  setCompanyName: (v: string) => void,
  companyTagline: string,
  setCompanyTagline: (v: string) => void
}) {
  const [editingDriver, setEditingDriver] = useState<DriverStat | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState({ 
    name: '', 
    vehicle: '', 
    vehiclePlate: '',
    role: 'driver' as UserRole,
    fileNumber: '',
    password: '',
    odometer: 0,
    fuelBalance: 50.0,
    status: 'active' as 'active' | 'warning' | 'error'
  });
  const [activeTab, setActiveTab] = useState<'users' | 'vehicles' | 'daily' | 'trash' | 'settings'>('users');
  const [showSettings, setShowSettings] = useState(false);

  // Master Report State Hooks
  const [showMasterReportModal, setShowMasterReportModal] = useState(false);
  const [repType, setRepType] = useState<'attendance' | 'fuel'>('attendance');
  const [repScope, setRepScope] = useState<'all' | string>('all');
  const [repFormat, setRepFormat] = useState<'xlsx' | 'docx' | 'pdf'>('xlsx');
  const [repSort, setRepSort] = useState<'date' | 'fileNumber'>('date');
  const [repFromDate, setRepFromDate] = useState(new Date(Date.now() - 7 * 86400000).toISOString().split('T')[0]);
  const [repToDate, setRepToDate] = useState(new Date().toISOString().split('T')[0]);

  const [authFormData, setAuthFormData] = useState({ ...adminAuth });

  // Native Blob Downloader Helper
  const downloadBlob = (content: string, filename: string, contentType: string) => {
    const blob = new Blob([content], { type: contentType + ';charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Automated Native PDF Printer Helper
  const printPDF = (title: string, htmlBody: string) => {
    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = '0';
    iframe.style.zIndex = '-9999';
    document.body.appendChild(iframe);

    const iframeDoc = iframe.contentWindow?.document || iframe.contentDocument;
    if (iframeDoc) {
      iframeDoc.open();
      iframeDoc.write(`
        <html>
          <head>
            <title>${title}</title>
            <style>
              @media print {
                body { margin: 15mm; }
                table { page-break-inside: auto; }
                tr { page-break-inside: avoid; page-break-after: auto; }
              }
            </style>
          </head>
          <body>
            ${htmlBody}
          </body>
        </html>
      `);
      iframeDoc.close();

      setTimeout(() => {
        iframe.contentWindow?.focus();
        iframe.contentWindow?.print();
        setTimeout(() => {
          document.body.removeChild(iframe);
        }, 1000);
      }, 500);
    }
  };

  const handleCompileMasterReport = (
    reportType: 'attendance' | 'fuel',
    selectedScope: 'all' | string,
    fileFormat: 'xlsx' | 'docx' | 'pdf',
    sortScope: 'date' | 'fileNumber',
    rFromDate: string,
    rToDate: string
  ) => {
    const targets = selectedScope === 'all' 
      ? drivers.filter(d => !d.companyDeleted)
      : drivers.filter(d => d.id === selectedScope);

    if (targets.length === 0) {
      showToast("No drivers found matching criteria");
      return;
    }

    let attendanceRows: Array<{
      date: string;
      fileNumber: string;
      name: string;
      inTime: string;
      outTime: string;
      totalHours: number;
      otHours: number;
    }> = [];

    let fuelRows: Array<{
      date: string;
      fileNumber: string;
      name: string;
      vehicle: string;
      prevOdo: number;
      currOdo: number;
      distance: number;
      amount: number;
      liters?: number;
    }> = [];

    targets.forEach(driver => {
      const dName = driver.name;
      const dFile = driver.fileNumber || 'N/A';
      const dVehicle = driver.vehicle || 'Standard Model';

      if (reportType === 'attendance') {
        const logs = driver.dutyLogs || [];
        logs.forEach(log => {
          if (!log.companyDeleted && log.date >= rFromDate && log.date <= rToDate) {
            const totHrs = log.totalHours || 0;
            const ot = totHrs > 8 ? totHrs - 8 : 0;
            attendanceRows.push({
              date: log.date,
              fileNumber: dFile,
              name: dName,
              inTime: log.inTime || 'N/A',
              outTime: log.outTime || 'Live',
              totalHours: totHrs,
              otHours: ot
            });
          }
        });
      } else {
        const fuelEntries = driver.fuelEntries || [];
        fuelEntries.forEach(entry => {
          if (!entry.companyDeleted && entry.date >= rFromDate && entry.date <= rToDate) {
            fuelRows.push({
              date: entry.date,
              fileNumber: dFile,
              name: dName,
              vehicle: dVehicle,
              prevOdo: entry.prevOdo || 0,
              currOdo: entry.currOdo || 0,
              distance: entry.distance || 0,
              amount: entry.amount || 0,
              liters: entry.amount > 0 ? entry.amount * 4 : 0
            });
          }
        });
      }
    });

    if (reportType === 'attendance') {
      if (attendanceRows.length === 0) {
        showToast("⚠️ No attendance logs found matching selected filters.");
        return;
      }
      attendanceRows.sort((a, b) => {
        if (sortScope === 'date') return a.date.localeCompare(b.date);
        return a.fileNumber.localeCompare(b.fileNumber);
      });
    } else {
      if (fuelRows.length === 0) {
        showToast("⚠️ No fuel or vehicle logs found matching selected filters.");
        return;
      }
      fuelRows.sort((a, b) => {
        if (sortScope === 'date') return a.date.localeCompare(b.date);
        return a.fileNumber.localeCompare(b.fileNumber);
      });
    }

    const filenameBase = `${companyName.replace(/\s+/g, '_')}_Master_${reportType === 'attendance' ? 'Attendance' : 'Fuel'}_Report`;

    if (fileFormat === 'xlsx') {
      let xlsHtml = `
        <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: 'Segoe UI', Arial, sans-serif; }
            table { border-collapse: collapse; }
            th { background-color: #1e3a8a; color: #ffffff; border: 1px solid #cbd5e1; font-weight: bold; padding: 10px; font-size: 13px; text-align: left; }
            td { border: 1px solid #cbd5e1; padding: 8px; font-size: 12px; }
            .header-title { font-size: 18px; font-weight: bold; color: #1e3a8a; padding: 10px 0; border: none; }
            .header-meta { font-size: 11px; color: #475569; padding: 4px 0; border: none; }
            .summary-row { background-color: #eff6ff; font-weight: bold; color: #1e3a8a; border-top: 2px double #1e3a8a; }
          </style>
        </head>
        <body>
          <table>
            <tr><td colspan="${reportType === 'attendance' ? '7' : '9'}" class="header-title">${companyName.toUpperCase()} - COMPREHENSIVE COMPILATION GENERAL LEDGER</td></tr>
            <tr><td colspan="${reportType === 'attendance' ? '7' : '9'}" class="header-meta"><strong>Scope:</strong> ${selectedScope === 'all' ? 'All Company Drivers (Master Compilation)' : targets[0].name}</td></tr>
            <tr><td colspan="${reportType === 'attendance' ? '7' : '9'}" class="header-meta"><strong>Period:</strong> ${rFromDate} to ${rToDate}</td></tr>
            <tr><td colspan="${reportType === 'attendance' ? '7' : '9'}" style="border:none; height: 12px;"></td></tr>
            <thead>
      `;

      if (reportType === 'attendance') {
        xlsHtml += `
              <tr>
                <th>Date</th>
                <th>File Number</th>
                <th>Driver Name</th>
                <th>Punch-In Time</th>
                <th>Punch-Out Time</th>
                <th>Total Hours Worked</th>
                <th>Overtime (OT) Hours</th>
              </tr>
            </thead>
            <tbody>
        `;

        let totalHoursSum = 0;
        let totalOvertimeSum = 0;

        attendanceRows.forEach(row => {
          totalHoursSum += row.totalHours;
          totalOvertimeSum += row.otHours;
          xlsHtml += `
            <tr>
              <td>${row.date}</td>
              <td style="font-family: monospace;">${row.fileNumber}</td>
              <td>${row.name}</td>
              <td style="font-family: monospace;">${row.inTime}</td>
              <td style="font-family: monospace;">${row.outTime}</td>
              <td style="font-family: monospace;">${row.totalHours.toFixed(2)} hrs</td>
              <td style="font-family: monospace; font-weight: ${row.otHours > 0 ? 'bold' : 'normal'}; color: ${row.otHours > 0 ? '#b91c1c' : '#333333'};">${row.otHours.toFixed(2)} hrs</td>
            </tr>
          `;
        });

        xlsHtml += `
              <tr class="summary-row">
                <td colspan="5">GRAND TOTAL COMPILATION</td>
                <td>Total Hours: ${totalHoursSum.toFixed(2)} hrs</td>
                <td>Total OT: ${totalOvertimeSum.toFixed(2)} hrs</td>
              </tr>
              <tr class="summary-row">
                <td colspan="5">Total Logged Days: ${attendanceRows.length} Days</td>
                <td colspan="2"></td>
              </tr>
            </tbody>
          </table>
          </body>
          </html>
        `;
      } else {
        xlsHtml += `
              <tr>
                <th>Date</th>
                <th>File Number</th>
                <th>Driver Name</th>
                <th>Vehicle Model</th>
                <th>Start Odometer</th>
                <th>End Odometer</th>
                <th>Distance Run (KM)</th>
                <th>Fuel Filled (Liters)</th>
                <th>Total cost (KWD)</th>
              </tr>
            </thead>
            <tbody>
        `;

        let totalDist = 0;
        let totalCost = 0;

        fuelRows.forEach(row => {
          totalDist += row.distance;
          totalCost += row.amount;
          xlsHtml += `
            <tr>
              <td>${row.date}</td>
              <td style="font-family: monospace;">${row.fileNumber}</td>
              <td>${row.name}</td>
              <td>${row.vehicle}</td>
              <td style="font-family: monospace;">${row.prevOdo}</td>
              <td style="font-family: monospace;">${row.currOdo}</td>
              <td style="font-family: monospace;">${row.distance} KM</td>
              <td style="font-family: monospace;">${row.liters?.toFixed(1) || '0.0'} L</td>
              <td style="font-family: monospace;">${row.amount.toFixed(3)} KWD</td>
            </tr>
          `;
        });

        xlsHtml += `
              <tr class="summary-row">
                <td colspan="6">GRAND TOTAL COMPILATION</td>
                <td>Total Running: ${totalDist.toFixed(1)} KM</td>
                <td>Estimated Fuel: ${(totalCost * 4).toFixed(1)} L</td>
                <td>Total Cost: ${totalCost.toFixed(3)} KWD</td>
              </tr>
            </tbody>
          </table>
          </body>
          </html>
        `;
      }

      downloadBlob(xlsHtml, `${filenameBase}.xlsx`, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      showToast("✓ Microsoft Excel Compiled Master Report downloaded successfully.");
      return;
    }

    if (fileFormat === 'docx') {
      let docHtml = `
        <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
        <head>
          <meta charset="utf-8">
          <style>
            @page { size: A4; margin: 1in; }
            body { font-family: 'Calibri', 'Segoe UI', Arial, sans-serif; line-height: 1.5; color: #1e293b; }
            h1 { font-size: 18pt; color: #1e3a8a; font-weight: bold; text-align: center; margin-bottom: 2pt; }
            .header-subtitle { text-align: center; font-size: 9pt; color: #64748b; text-transform: uppercase; letter-spacing: 0.12em; margin-bottom: 20pt; }
            table { width: 100%; border-collapse: collapse; margin-top: 15pt; margin-bottom: 15pt; }
            th { background-color: #f1f5f9; color: #0f172a; border: 1px solid #cbd5e1; font-weight: bold; padding: 10px; font-size: 10pt; text-align: left; }
            td { border: 1px solid #cbd5e1; padding: 8px 10px; font-size: 9pt; }
            .summary-row { font-weight: bold; background-color: #f8fafc; }
          </style>
        </head>
        <body>
          <h1>${companyName.toUpperCase()}</h1>
          <div class="header-subtitle">Official Compiled Master Fleet Report</div>
          <p><strong>Report Date:</strong> ${new Date().toLocaleDateString()}</p>
          <p><strong>Covering Dates:</strong> ${rFromDate} to ${rToDate}</p>
          <p><strong>Scope:</strong> ${selectedScope === 'all' ? 'All Registered Company Operators' : targets[0].name}</p>
          <hr />
      `;

      if (reportType === 'attendance') {
        docHtml += `
          <h2>Section: Attendance & Overtime Ledger</h2>
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>File No</th>
                <th>Driver Profile</th>
                <th>Punch In</th>
                <th>Punch Out</th>
                <th>Working Hours</th>
                <th>OT Hours</th>
              </tr>
            </thead>
            <tbody>
        `;

        let totalWorkingHrs = 0;
        let totalOtHrs = 0;

        attendanceRows.forEach(row => {
          totalWorkingHrs += row.totalHours;
          totalOtHrs += row.otHours;
          docHtml += `
            <tr>
              <td>${row.date}</td>
              <td>${row.fileNumber}</td>
              <td><strong>${row.name}</strong></td>
              <td>${row.inTime}</td>
              <td>${row.outTime}</td>
              <td>${row.totalHours.toFixed(2)} hrs</td>
              <td>${row.otHours.toFixed(2)} hrs</td>
            </tr>
          `;
        });

        docHtml += `
              <tr class="summary-row">
                <td colspan="5">Grand Combined Total</td>
                <td>${totalWorkingHrs.toFixed(2)} hrs</td>
                <td>${totalOtHrs.toFixed(2)} hrs</td>
              </tr>
            </tbody>
          </table>
        `;
      } else {
        docHtml += `
          <h2>Section: Fleet Run & Fuel Separation</h2>
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>File No</th>
                <th>Driver Profile</th>
                <th>Vehicle Model</th>
                <th>Start Odo</th>
                <th>End Odo</th>
                <th>Distance</th>
                <th>Fuel (L)</th>
                <th>Amount (KWD)</th>
              </tr>
            </thead>
            <tbody>
        `;

        let grandD = 0;
        let grandC = 0;

        fuelRows.forEach(row => {
          grandD += row.distance;
          grandC += row.amount;
          docHtml += `
            <tr>
              <td>${row.date}</td>
              <td>${row.fileNumber}</td>
              <td><strong>${row.name}</strong></td>
              <td>${row.vehicle}</td>
              <td>${row.prevOdo}</td>
              <td>${row.currOdo}</td>
              <td>${row.distance} KM</td>
              <td>${row.liters?.toFixed(1) || '0.0'} L</td>
              <td>${row.amount.toFixed(3)} KWD</td>
            </tr>
          `;
        });

        docHtml += `
              <tr class="summary-row">
                <td colspan="6">Grand Combined Total</td>
                <td>${grandD.toFixed(1)} KM</td>
                <td>${(grandC * 4).toFixed(1)} L</td>
                <td>${grandC.toFixed(3)} KWD</td>
              </tr>
            </tbody>
          </table>
        `;
      }

      docHtml += `
        </body>
        </html>
      `;

      downloadBlob(docHtml, `${filenameBase}.docx`, 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
      showToast("✓ Microsoft Word Compiled Master Report downloaded successfully.");
      return;
    }

    if (fileFormat === 'pdf') {
      let pdfBody = `
        <div style="font-family: Arial, sans-serif; padding: 20px; color: #1e293b;">
          <div style="text-align: center; border-bottom: 2px solid #1e3a8a; padding-bottom: 12px; margin-bottom: 20px;">
            <h1 style="color: #1e3a8a; margin: 0; font-size: 24px; text-transform: uppercase;">${companyName}</h1>
            <p style="margin: 4px 0 0 0; font-size: 11px; letter-spacing: 2px; color: #64748b; font-weight: bold;">FLEET AUDITING GENERAL LEDGER</p>
          </div>
          
          <table style="width: 100%; font-size: 11px; margin-bottom: 20px;">
            <tr>
              <td style="width: 50%; vertical-align: top;">
                <span style="color: #64748b; font-size: 9px; font-weight: bold; text-transform: uppercase; display: block;">COMPILED RANGE:</span>
                <strong style="font-size: 13px; color: #000;">${rFromDate} to ${rToDate}</strong>
              </td>
              <td style="width: 50%; vertical-align: top; text-align: right;">
                <span style="color: #64748b; font-size: 9px; font-weight: bold; text-transform: uppercase; display: block;">EXPORT PORTAL:</span>
                <strong style="font-size: 13px; color: #1e3a8a;">ADMIN COMPILATION MANUAL</strong>
              </td>
            </tr>
          </table>
      `;

      if (reportType === 'attendance') {
        pdfBody += `
          <h3 style="color: #1e3a8a; border-bottom: 1px solid #e2e8f0; padding-bottom: 6px; margin-top: 30px; font-size: 14px;">1. ATTENDANCE & OVERTIME HOURS CALCULATIONS</h3>
          <table style="width:100%; border-collapse:collapse; margin-top:10px; font-size:10px;">
            <thead>
              <tr style="background-color:#f1f5f9;">
                <th style="border:1px solid #cbd5e1; padding:8px; text-align:left;">Date</th>
                <th style="border:1px solid #cbd5e1; padding:8px; text-align:left;">File No</th>
                <th style="border:1px solid #cbd5e1; padding:8px; text-align:left;">Operator/Driver</th>
                <th style="border:1px solid #cbd5e1; padding:8px; text-align:left;">Punch-In</th>
                <th style="border:1px solid #cbd5e1; padding:8px; text-align:left;">Punch-Out</th>
                <th style="border:1px solid #cbd5e1; padding:8px; text-align:right;">Total Hours</th>
                <th style="border:1px solid #cbd5e1; padding:8px; text-align:right;">OT Hours</th>
              </tr>
            </thead>
            <tbody>
        `;

        let thSum = 0;
        let totOt = 0;

        attendanceRows.forEach(row => {
          thSum += row.totalHours;
          totOt += row.otHours;
          pdfBody += `
            <tr>
              <td style="border:1px solid #cbd5e1; padding:8px; font-family:monospace;">${row.date}</td>
              <td style="border:1px solid #cbd5e1; padding:8px; font-family:monospace;">${row.fileNumber}</td>
              <td style="border:1px solid #cbd5e1; padding:8px; font-weight:bold;">${row.name}</td>
              <td style="border:1px solid #cbd5e1; padding:8px; font-family:monospace;">${row.inTime}</td>
              <td style="border:1px solid #cbd5e1; padding:8px; font-family:monospace;">${row.outTime}</td>
              <td style="border:1px solid #cbd5e1; padding:8px; text-align:right; font-family:monospace;">${row.totalHours.toFixed(2)}</td>
              <td style="border:1px solid #cbd5e1; padding:8px; text-align:right; font-family:monospace; font-weight:${row.otHours > 0 ? 'bold' : 'normal'}; color:${row.otHours > 0 ? '#b91c1c' : '#000'};">${row.otHours.toFixed(2)}</td>
            </tr>
          `;
        });

        pdfBody += `
              <tr style="background-color:#eff6ff; font-weight:bold; color: #1e3a8a;">
                <td colspan="5" style="border:1px solid #cbd5e1; padding:10px;">GRAND COMBINED TOTALS:</td>
                <td style="border:1px solid #cbd5e1; padding:10px; text-align:right; font-family:monospace;">${thSum.toFixed(2)} hrs</td>
                <td style="border:1px solid #cbd5e1; padding:10px; text-align:right; font-family:monospace;">${totOt.toFixed(2)} hrs</td>
              </tr>
            </tbody>
          </table>
        `;
      } else {
        pdfBody += `
          <h3 style="color: #1e3a8a; border-bottom: 1px solid #e2e8f0; padding-bottom: 6px; margin-top: 30px; font-size: 14px;">2. VEHICLE RUNS & FUEL EXTRACTION LEDGER</h3>
          <table style="width:100%; border-collapse:collapse; margin-top:10px; font-size:10px;">
            <thead>
              <tr style="background-color:#f1f5f9;">
                <th style="border:1px solid #cbd5e1; padding:8px; text-align:left;">Date</th>
                <th style="border:1px solid #cbd5e1; padding:8px; text-align:left;">File No</th>
                <th style="border:1px solid #cbd5e1; padding:8px; text-align:left;">Operator/Driver</th>
                <th style="border:1px solid #cbd5e1; padding:8px; text-align:left;">Vehicle</th>
                <th style="border:1px solid #cbd5e1; padding:8px; text-align:right;">Start KM</th>
                <th style="border:1px solid #cbd5e1; padding:8px; text-align:right;">End KM</th>
                <th style="border:1px solid #cbd5e1; padding:8px; text-align:right;">Distance (KM)</th>
                <th style="border:1px solid #cbd5e1; padding:8px; text-align:right;">Fuel (L)</th>
                <th style="border:1px solid #cbd5e1; padding:8px; text-align:right;">Amount (KWD)</th>
              </tr>
            </thead>
            <tbody>
        `;

        let grandDistance = 0;
        let grandCostResult = 0;

        fuelRows.forEach(row => {
          grandDistance += row.distance;
          grandCostResult += row.amount;
          pdfBody += `
            <tr>
              <td style="border:1px solid #cbd5e1; padding:8px; font-family:monospace;">${row.date}</td>
              <td style="border:1px solid #cbd5e1; padding:8px; font-family:monospace;">${row.fileNumber}</td>
              <td style="border:1px solid #cbd5e1; padding:8px; font-weight:bold;">${row.name}</td>
              <td style="border:1px solid #cbd5e1; padding:8px;">${row.vehicle}</td>
              <td style="border:1px solid #cbd5e1; padding:8px; text-align:right; font-family:monospace;">${row.prevOdo}</td>
              <td style="border:1px solid #cbd5e1; padding:8px; text-align:right; font-family:monospace;">${row.currOdo}</td>
              <td style="border:1px solid #cbd5e1; padding:8px; text-align:right; font-family:monospace;">${row.distance}</td>
              <td style="border:1px solid #cbd5e1; padding:8px; text-align:right; font-family:monospace;">${row.liters?.toFixed(1) || '0.0'} L</td>
              <td style="border:1px solid #cbd5e1; padding:8px; text-align:right; font-family:monospace;">${row.amount.toFixed(3)}</td>
            </tr>
          `;
        });

        pdfBody += `
              <tr style="background-color:#eff6ff; font-weight:bold; color: #1e3a8a;">
                <td colspan="6" style="border:1px solid #cbd5e1; padding:10px;">GRAND COMBINED TOTALS:</td>
                <td style="border:1px solid #cbd5e1; padding:10px; text-align:right; font-family:monospace;">${grandDistance.toFixed(1)} KM</td>
                <td style="border:1px solid #cbd5e1; padding:10px; text-align:right; font-family:monospace;">${(grandCostResult * 4).toFixed(1)} L</td>
                <td style="border:1px solid #cbd5e1; padding:10px; text-align:right; font-family:monospace;">${grandCostResult.toFixed(3)} KWD</td>
              </tr>
            </tbody>
          </table>
        `;
      }

      pdfBody += `
          <p style="font-size:9px; color:#64748b; margin-top:25px; text-align:center;">This official compilation document is printed from the secure centralized administration portal.</p>
        </div>
      `;

      printPDF(`${companyName} Master Report`, pdfBody);
      showToast("✓ PDF Report Compiled. Opening system print preview...");
      return;
    }
  };

  const handleSave = () => {
    if (!formData.name || !formData.vehicle || !formData.fileNumber || !formData.password) {
      showToast("Please fill in Name, Vehicle, File Number, and Secret Password");
      return;
    }
    const odoNum = parseInt(formData.odometer as any);
    const fuelNum = parseFloat(formData.fuelBalance as any);

    onSaveDriver(editingDriver ? editingDriver.id : null, {
      ...formData,
      odometer: isNaN(odoNum) ? 0 : odoNum,
      fuelBalance: isNaN(fuelNum) ? 50.0 : fuelNum
    });
    setEditingDriver(null);
    setShowAddForm(false);
    setFormData({ 
      name: '', 
      vehicle: '', 
      vehiclePlate: '',
      role: 'driver',
      fileNumber: '',
      password: '',
      odometer: 0,
      fuelBalance: 50.0,
      status: 'active'
    });
  };

  const startEdit = (driver: DriverStat) => {
    setEditingDriver(driver);
    setFormData({ 
      name: driver.name, 
      vehicle: driver.vehicle, 
      vehiclePlate: driver.vehiclePlate || '',
      role: driver.role,
      fileNumber: driver.fileNumber || '',
      password: driver.password || '',
      odometer: driver.odometer,
      fuelBalance: driver.fuelBalance,
      status: driver.status
    });
    setShowAddForm(true);
  };

  return (
    <motion.div
      key="admin"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      className="p-6 md:p-12 space-y-12 flex-1 overflow-y-auto no-scrollbar"
    >
      <header className="flex items-center justify-between">
        <div className="flex items-center gap-6">
          <button onClick={onBack} className="p-3 border border-neutral-200 rounded-xl hover:bg-neutral-100 transition-colors">
            <ChevronLeft size={24} />
          </button>
          <div className="space-y-1">
            <p className="text-[12px] font-black uppercase tracking-[0.2em] text-neutral-400">Logistics Hub</p>
            <h1 className="text-3xl font-extrabold uppercase tracking-tight">Fleet Overview</h1>
          </div>
        </div>
      </header>

      {showAddForm ? (
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white border border-neutral-200 rounded-2xl p-8 space-y-6 shadow-sm max-w-2xl text-left"
        >
          <div className="space-y-2 border-b border-neutral-100 pb-4">
            <h2 className="text-xl font-black uppercase tracking-tight">{editingDriver ? 'Override & Edit Profile' : 'Register New Company Unit / Driver'}</h2>
            <p className="text-[10px] font-extrabold text-neutral-400 uppercase tracking-widest leading-relaxed">
              Manually Provision Credentials & Access Safeguards
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase tracking-widest text-neutral-400 pl-1">Driver Name</label>
              <input 
                type="text" 
                value={formData.name}
                onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="e.g. Salim Al-Harbi"
                className="w-full bg-neutral-50 border border-neutral-200 p-4 rounded-xl focus:ring-2 focus:ring-accent outline-none font-bold text-ink"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase tracking-widest text-neutral-400 pl-1">Company File Number (Unique) *</label>
              <input 
                type="text" 
                value={formData.fileNumber}
                onChange={e => setFormData(prev => ({ ...prev, fileNumber: e.target.value }))}
                placeholder="e.g. F-1004"
                className="w-full bg-neutral-50 border border-neutral-200 p-4 rounded-xl focus:ring-2 focus:ring-accent outline-none font-bold text-ink"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase tracking-widest text-neutral-400 pl-1">Secret Password *</label>
              <input 
                type="text" 
                value={formData.password}
                onChange={e => setFormData(prev => ({ ...prev, password: e.target.value }))}
                placeholder="Secret access key"
                className="w-full bg-neutral-50 border border-neutral-200 p-4 rounded-xl focus:ring-2 focus:ring-accent outline-none font-bold text-ink"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase tracking-widest text-neutral-400 pl-1">Assigned Vehicle Model</label>
              <input 
                type="text" 
                value={formData.vehicle}
                onChange={e => setFormData(prev => ({ ...prev, vehicle: e.target.value }))}
                placeholder="e.g. Toyota Hilux 4x4"
                className="w-full bg-neutral-50 border border-neutral-200 p-4 rounded-xl focus:ring-2 focus:ring-accent outline-none font-bold text-ink"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase tracking-widest text-neutral-400 pl-1">Assigned Vehicle Plate</label>
              <input 
                type="text" 
                value={formData.vehiclePlate}
                onChange={e => setFormData(prev => ({ ...prev, vehiclePlate: e.target.value }))}
                placeholder="e.g. KW-20183"
                className="w-full bg-neutral-50 border border-neutral-200 p-4 rounded-xl focus:ring-2 focus:ring-accent outline-none font-bold text-ink"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase tracking-widest text-neutral-400 pl-1">Access Role & Level</label>
              <select 
                value={formData.role}
                onChange={e => setFormData(prev => ({ ...prev, role: e.target.value as UserRole }))}
                className="w-full bg-neutral-50 border border-neutral-200 p-4 rounded-xl focus:ring-2 focus:ring-accent outline-none font-bold text-ink"
              >
                <option value="driver">Driver (Limited Access)</option>
                <option value="admin">Administrator (Fleet Control)</option>
              </select>
            </div>

            <div className="space-y-1 border-t border-dashed border-neutral-200 pt-3 md:col-span-2">
              <p className="text-[9px] font-extrabold text-blue-600 uppercase tracking-widest mb-2">★ ADMIN OVERRIDES SUITE (நிர்வாக மேலெழுத்து)</p>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase tracking-widest text-neutral-400 pl-1">
                Odometer Override (KM)
              </label>
              <input 
                type="number" 
                value={formData.odometer}
                onChange={e => setFormData(prev => ({ ...prev, odometer: parseInt(e.target.value) || 0 }))}
                className="w-full bg-blue-50/30 border border-blue-200/80 p-4 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-mono font-bold text-blue-900"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase tracking-widest text-neutral-400 pl-1">
                Fuel Balance Limit (KWD)
              </label>
              <input 
                type="number" 
                step="0.01"
                value={formData.fuelBalance}
                onChange={e => setFormData(prev => ({ ...prev, fuelBalance: parseFloat(e.target.value) || 0 }))}
                className="w-full bg-blue-50/30 border border-blue-200/80 p-4 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-mono font-bold text-blue-900"
              />
            </div>

            <div className="space-y-1 md:col-span-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-neutral-400 pl-1">
                Unit Operational Warning Status
              </label>
              <select 
                value={formData.status}
                onChange={e => setFormData(prev => ({ ...prev, status: e.target.value as any }))}
                className="w-full bg-neutral-50 border border-neutral-200 p-4 rounded-xl focus:ring-2 focus:ring-accent outline-none font-bold text-ink"
              >
                <option value="active">Active & Safe (ஆலிவ் கிரீன்)</option>
                <option value="warning">Orange Warning (டயர்/எண்ணெய் எச்சரிக்கை)</option>
                <option value="error">Critical Deactivated (பிரேக்/இயந்திரக் கோளாறு)</option>
              </select>
            </div>
          </div>

          <div className="flex gap-4 pt-6 border-t border-neutral-100">
            <button 
              onClick={() => { setShowAddForm(false); setEditingDriver(null); }}
              className="flex-1 py-4 font-black text-[11px] uppercase tracking-widest text-neutral-400 hover:bg-neutral-50 rounded-xl transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button 
              onClick={handleSave}
              className="flex-1 bg-ink text-white py-4 font-black text-[11px] uppercase tracking-widest rounded-xl hover:brightness-110 shadow-lg shadow-ink/10 transition-all cursor-pointer"
            >
              Save Account Changes
            </button>
          </div>
        </motion.div>
      ) : (
        <div className="space-y-8">
          {/* Admin Tabs */}
          <div className="flex gap-6 border-b border-neutral-100 overflow-x-auto no-scrollbar">
            <button 
              onClick={() => setActiveTab('users')}
              className={`text-[11px] font-black uppercase tracking-widest pb-3 border-b-2 transition-all whitespace-nowrap ${activeTab === 'users' ? 'border-ink text-ink' : 'border-transparent text-neutral-300'}`}
            >
              All Users
            </button>
            <button 
              onClick={() => setActiveTab('vehicles')}
              className={`text-[11px] font-black uppercase tracking-widest pb-3 border-b-2 transition-all whitespace-nowrap ${activeTab === 'vehicles' ? 'border-ink text-ink' : 'border-transparent text-neutral-300'}`}
            >
              All Vehicles
            </button>
            <button 
              onClick={() => setActiveTab('daily')}
              className={`text-[11px] font-black uppercase tracking-widest pb-3 border-b-2 transition-all whitespace-nowrap ${activeTab === 'daily' ? 'border-ink text-ink' : 'border-transparent text-neutral-300'}`}
            >
              Daily Reports
            </button>
            <button 
              onClick={() => setActiveTab('trash')}
              className={`text-[11px] font-black uppercase tracking-widest pb-3 border-b-2 transition-all whitespace-nowrap ${activeTab === 'trash' ? 'border-danger text-danger' : 'border-transparent text-neutral-300'}`}
            >
              Recycle Bin
            </button>
            <button 
              onClick={() => setActiveTab('settings')}
              className={`text-[11px] font-black uppercase tracking-widest pb-3 border-b-2 transition-all whitespace-nowrap ${activeTab === 'settings' ? 'border-ink text-ink' : 'border-transparent text-neutral-300'}`}
            >
              Security Settings
            </button>
          </div>

          <div className="space-y-4">
            {activeTab === 'users' && (
              <div className="grid grid-cols-2 gap-4 pb-4">
                <div className="bg-neutral-50/60 border border-neutral-200/80 p-5 rounded-2xl text-left space-y-1">
                  <span className="text-[9px] font-black text-neutral-400 uppercase tracking-widest block">Total Drivers Count</span>
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-3xl font-black text-ink">{drivers.filter(d => !d.companyDeleted).length}</span>
                    <span className="text-[10px] font-bold text-neutral-400 uppercase">Registered</span>
                  </div>
                </div>
                <div className="bg-neutral-50/60 border border-neutral-200/80 p-5 rounded-2xl text-left space-y-1">
                  <span className="text-[9px] font-black text-neutral-400 uppercase tracking-widest block">Total Fleet Vehicles</span>
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-3xl font-black text-blue-600">
                      {Array.from(new Set(drivers.filter(d => !d.companyDeleted && d.vehicle).map(d => d.vehicle.trim().toLowerCase()))).length}
                    </span>
                    <span className="text-[10px] font-bold text-neutral-400 uppercase">Models</span>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'users' ? (
              drivers.filter(d => !d.companyDeleted).map((driver) => (
                <div key={driver.id} className="bg-white border border-neutral-200 rounded-2xl p-5 space-y-4 shadow-sm hover:border-accent transition-colors cursor-pointer" onClick={() => onSelectDriver(driver.id)}>
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center font-black text-sm ${
                      driver.status === 'active' ? 'bg-success/10 text-success' : 'bg-danger/10 text-danger'
                    }`}>
                      {driver.name.substring(0, 2).toUpperCase()}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-black tracking-tight">{driver.name}</p>
                        {driver.role === 'admin' && <span className="text-[7px] bg-ink text-white px-1 py-0.5 rounded">ADMIN</span>}
                      </div>
                      <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">{driver.vehicle}</p>
                    </div>
                    <div className="text-right">
                      <p className={`text-[10px] font-black uppercase tracking-widest ${driver.status === 'active' ? 'text-success' : 'text-danger'}`}>
                        {driver.status}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                    <button 
                      onClick={() => startEdit(driver)}
                      className="flex-1 py-2 bg-neutral-50 rounded-lg text-[9px] font-black uppercase tracking-widest text-neutral-400 hover:bg-neutral-100 transition-colors"
                    >
                      Edit
                    </button>
                    <button 
                      onClick={() => onDeleteDriver(driver.id)}
                      className="flex-1 py-2 bg-danger/5 rounded-lg text-[9px] font-black uppercase tracking-widest text-danger hover:bg-danger/10 transition-colors"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))
            ) : activeTab === 'vehicles' ? (
              drivers.filter(d => !d.companyDeleted).map((driver) => {
                const kmSinceService = driver.maintenance.lastServiceKm !== null ? driver.odometer - driver.maintenance.lastServiceKm : driver.odometer;
                const isOverdue = kmSinceService >= 5000 || (driver.maintenance.nextServiceKm && driver.odometer >= driver.maintenance.nextServiceKm);
                const isNearService = kmSinceService >= 4000 || (driver.maintenance.nextServiceKm && driver.odometer >= driver.maintenance.nextServiceKm - 500);

                return (
                  <div 
                    key={`v-${driver.id}`} 
                    className={`bg-white border ${isOverdue ? 'border-danger shadow-danger/5' : isNearService ? 'border-amber-400 shadow-amber-400/5' : 'border-neutral-200'} rounded-2xl p-5 flex items-center justify-between shadow-sm cursor-pointer hover:scale-[1.01] transition-all`}
                    onClick={() => onSelectDriver(driver.id)}
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <p className="font-black tracking-tight text-lg">{driver.vehicle}</p>
                        {isOverdue && <span className="p-1 px-2 bg-danger text-white text-[7px] font-black uppercase rounded">Overdue</span>}
                        {!isOverdue && isNearService && <span className="p-1 px-2 bg-amber-400 text-white text-[7px] font-black uppercase rounded">Due Soon</span>}
                      </div>
                      <p className="text-[10px] font-black text-neutral-400 uppercase tracking-widest">Driver: {driver.name} • {kmSinceService.toLocaleString()} KM since service</p>
                    </div>
                    <div className="text-right space-y-1">
                      <div className="flex items-baseline gap-1 justify-end">
                        <span className="text-xl font-bold">{driver.odometer.toLocaleString()}</span>
                        <span className="text-[10px] font-black text-neutral-300">KM</span>
                      </div>
                      <div className="flex items-baseline gap-1 justify-end text-neutral-400">
                        <span className="text-[9px] font-bold uppercase tracking-tighter">Next Srv:</span>
                        <span className="text-[11px] font-black">{driver.maintenance.nextServiceKm?.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                );
              })
            ) : activeTab === 'trash' ? (
              <div className="space-y-10 pb-10">
                <div className="space-y-4">
                  <div className="flex items-center justify-between px-1">
                    <h3 className="text-[10px] font-black uppercase tracking-widest text-neutral-400">Drivers & Fleet Assets</h3>
                    <div className="flex items-center gap-2">
                       <span className="w-2 h-2 bg-danger rounded-full animate-pulse"></span>
                       <span className="text-[8px] font-black uppercase text-danger tracking-widest">Self-Service Bin</span>
                    </div>
                  </div>
                  {drivers.filter(d => d.companyDeleted && !d.companyPermanentDelete).map(driver => (
                    <div key={driver.id} className="bg-white border border-neutral-200 rounded-3xl p-6 flex items-center justify-between shadow-sm hover:shadow-md transition-all">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-neutral-100 rounded-2xl flex items-center justify-center text-neutral-400">
                          <UserCog size={24} />
                        </div>
                        <div>
                          <p className="font-black text-base">{driver.name}</p>
                          <p className="text-[10px] text-neutral-400 font-bold uppercase tracking-widest">{driver.vehicle} • Deleted {new Date(driver.deletedAt || "").toLocaleDateString()}</p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button 
                          onClick={() => onRestore(driver.id, 'driver')}
                          className="bg-success text-white px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-success/10 hover:scale-[1.02] transition-all"
                        >
                          Restore
                        </button>
                        <button 
                          onClick={() => onPermanentDelete(driver.id, 'driver')}
                          className="bg-danger/10 text-danger border border-danger/20 px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-danger/20 transition-all"
                        >
                          Permanent Delete
                        </button>
                      </div>
                    </div>
                  ))}
                  {drivers.filter(d => d.companyDeleted && !d.companyPermanentDelete).length === 0 && (
                    <div className="text-center py-16 bg-neutral-50/50 border-2 border-dashed border-neutral-100 rounded-3xl">
                      <p className="text-[11px] font-black uppercase text-neutral-300 tracking-[0.2em]">Recycle bin is empty</p>
                    </div>
                  )}
                </div>

                <div className="space-y-4">
                  <h3 className="text-[10px] font-black uppercase tracking-widest text-neutral-400 px-1">Soft-Deleted Records</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {drivers.map(d => (
                      <React.Fragment key={d.id}>
                        {d.fuelEntries.filter(e => e.companyDeleted && !e.companyPermanentDelete).map(entry => (
                          <div key={entry.id} className="bg-white border border-neutral-200 p-5 rounded-2xl flex items-center justify-between shadow-sm">
                            <div className="flex items-center gap-4">
                              <div className="w-10 h-10 bg-amber-500/10 text-amber-500 rounded-xl flex items-center justify-center">
                                <Fuel size={18} />
                              </div>
                              <div>
                                <p className="text-[11px] font-black">Fuel: {entry.amount} KWD</p>
                                <p className="text-[9px] text-neutral-400 font-bold uppercase tracking-widest truncate max-w-[120px]">{d.name} • {entry.date}</p>
                              </div>
                            </div>
                            <div className="flex gap-4">
                              <button onClick={() => onRestore(entry.id, 'fuel', d.id)} className="text-[10px] font-black text-success uppercase hover:underline">Restore</button>
                              <button onClick={() => onPermanentDelete(entry.id, 'fuel', d.id)} className="text-[10px] font-black text-danger uppercase hover:underline">Clear</button>
                            </div>
                          </div>
                        ))}
                      </React.Fragment>
                    ))}
                  </div>
                </div>
              </div>
            ) : activeTab === 'settings' ? (
              <div className="bg-white border border-neutral-200 rounded-2xl p-8 space-y-6 shadow-sm">
                <div className="space-y-2">
                  <h3 className="text-xl font-bold uppercase tracking-tight">Admin Credentials</h3>
                  <p className="text-[10px] font-black uppercase tracking-widest text-neutral-400">Update security access keys</p>
                </div>
                <div className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase tracking-widest text-neutral-400 pl-1">Admin Username / ID</label>
                    <input 
                      type="text" 
                      value={authFormData.username}
                      onChange={e => setAuthFormData(prev => ({ ...prev, username: e.target.value }))}
                      className="w-full bg-neutral-50 border border-neutral-200 p-4 rounded-xl focus:ring-2 focus:ring-accent outline-none font-bold"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase tracking-widest text-neutral-400 pl-1">Admin Password</label>
                    <input 
                      type="password" 
                      value={authFormData.password}
                      onChange={e => setAuthFormData(prev => ({ ...prev, password: e.target.value }))}
                      className="w-full bg-neutral-50 border border-neutral-200 p-4 rounded-xl focus:ring-2 focus:ring-accent outline-none font-bold"
                    />
                  </div>
                </div>
                <button 
                  onClick={() => {
                    setAdminAuth(authFormData);
                    showToast("Admin credentials updated successfully");
                  }}
                  className="w-full bg-accent text-white py-4 rounded-xl font-black text-[11px] uppercase tracking-widest shadow-xl shadow-accent/20 hover:brightness-110 transition-all"
                >
                  Update Credentials
                </button>

                <div className="pt-8 border-t border-neutral-100 space-y-6">
                  <div className="space-y-2">
                    <h3 className="text-xl font-bold uppercase tracking-tight">Financial Settings</h3>
                    <p className="text-[10px] font-black uppercase tracking-widest text-neutral-400">Payroll Calculation Basis</p>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase tracking-widest text-neutral-400 pl-1">Base Hourly Rate (KWD/hr)</label>
                    <div className="relative">
                      <input 
                        type="number" 
                        step="0.1"
                        value={hourlyRate}
                        onChange={e => setHourlyRate(parseFloat(e.target.value))}
                        className="w-full bg-neutral-50 border border-neutral-200 p-4 rounded-xl focus:ring-2 focus:ring-accent outline-none font-black text-xl"
                      />
                      <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-black text-neutral-300">KWD</span>
                    </div>
                  </div>
                </div>

                <div className="pt-8 border-t border-neutral-100 space-y-6">
                  <div className="space-y-2">
                    <h3 className="text-xl font-bold uppercase tracking-tight">App Customization</h3>
                    <p className="text-[10px] font-black uppercase tracking-widest text-neutral-400">Branding and Experience</p>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase tracking-widest text-neutral-400 pl-1">Custom Logo Image URL</label>
                    <input 
                      type="text" 
                      value={logoUrl}
                      onChange={e => setLogoUrl(e.target.value)}
                      placeholder="https://example.com/logo.png"
                      className="w-full bg-neutral-50 border border-neutral-200 p-4 rounded-xl focus:ring-2 focus:ring-accent outline-none font-bold"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase tracking-widest text-neutral-400 pl-1">Company Name</label>
                    <input 
                      type="text" 
                      value={companyName}
                      onChange={e => setCompanyName(e.target.value)}
                      placeholder="e.g., Kuwait Logistics"
                      className="w-full bg-neutral-50 border border-neutral-200 p-4 rounded-xl focus:ring-2 focus:ring-accent outline-none font-bold"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase tracking-widest text-neutral-400 pl-1">Company Tagline</label>
                    <input 
                      type="text" 
                      value={companyTagline}
                      onChange={e => setCompanyTagline(e.target.value)}
                      placeholder="e.g., Enterprise Fleet Hub"
                      className="w-full bg-neutral-50 border border-neutral-200 p-4 rounded-xl focus:ring-2 focus:ring-accent outline-none font-bold"
                    />
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-white border border-neutral-200 rounded-2xl overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead className="bg-neutral-50 border-b border-neutral-100">
                      <tr>
                        <th className="p-4 text-[9px] font-black uppercase tracking-widest text-neutral-400">Driver</th>
                        <th className="p-4 text-[9px] font-black uppercase tracking-widest text-neutral-400">Shift Start</th>
                        <th className="p-4 text-[9px] font-black uppercase tracking-widest text-neutral-400">Shift End</th>
                        <th className="p-4 text-[9px] font-black uppercase tracking-widest text-neutral-400">Run (KM)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-50">
                      {drivers.map(d => {
                        const hasTripToday = d.trips.length > 0 && d.trips[0].date === new Date().toLocaleDateString();
                        const currentSession = d.dailyTrip;
                        return (
                          <tr key={`daily-${d.id}`} className="hover:bg-neutral-50 transition-colors">
                            <td className="p-4">
                              <p className="font-bold text-sm tracking-tight">{d.name}</p>
                              <p className={`text-[8px] font-black uppercase ${currentSession.active ? 'text-success' : 'text-neutral-300'}`}>
                                {currentSession.active ? 'Active' : 'Offline'}
                              </p>
                            </td>
                            <td className="p-4 font-mono text-[10px] font-bold">
                              {currentSession.startKm?.toLocaleString() || (hasTripToday ? d.trips[0].startKm.toLocaleString() : '---')}
                            </td>
                            <td className="p-4 font-mono text-[10px] font-bold">
                              {currentSession.endKm?.toLocaleString() || (hasTripToday ? d.trips[0].endKm.toLocaleString() : '---')}
                            </td>
                            <td className="p-4">
                              <span className="font-black text-accent text-sm">
                                {currentSession.active && currentSession.startKm !== null 
                                  ? `${d.odometer - currentSession.startKm}` 
                                  : (hasTripToday ? d.trips[0].distance : '0')}
                              </span>
                              {(currentSession.active) && <span className="text-[8px] ml-1 text-success animate-pulse">Live</span>}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>

          {!showAddForm && (
            <div className="grid grid-cols-1 gap-4 pt-8">
              {activeTab === 'daily' && (
                <button 
                  onClick={onResetDay}
                  className="w-full bg-danger text-white py-5 rounded-xl font-black text-[12px] uppercase tracking-[0.15em] hover:brightness-110 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                >
                  <MapPin size={16} /> Reset All Shift Sessions
                </button>
              )}
              <button 
                onClick={() => showToast("Syncing data to Firebase Cloud...")}
                className="w-full bg-accent text-white py-5 rounded-xl font-black text-[12px] uppercase tracking-[0.15em] hover:brightness-110 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
              >
                <FileText size={16} /> Save Changes to Cloud
              </button>
              <button 
                onClick={() => { 
                  setShowAddForm(true); 
                  setEditingDriver(null); 
                  setFormData({ 
                    name: '', 
                    vehicle: '', 
                    vehiclePlate: '',
                    role: 'driver',
                    fileNumber: '',
                    password: '',
                    odometer: 0,
                    fuelBalance: 50.0,
                    status: 'active'
                  }); 
                }}
                className="w-full bg-white border border-ink py-5 rounded-xl font-black text-[12px] uppercase tracking-[0.15em] hover:bg-neutral-50 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <Plus size={16} /> Add Driver / Unit
              </button>
              <button 
                onClick={() => setShowMasterReportModal(true)}
                className="w-full bg-ink text-white py-5 rounded-xl font-black text-[12px] uppercase tracking-[0.15em] hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <Download size={16} /> Fleet Report
              </button>
            </div>
          )}
        </div>
      )}

      {/* --- MASTER FLEET REPORT COMPILER OVERLAY MODAL --- */}
      {showMasterReportModal && (
        <div className="fixed inset-0 bg-ink/75 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div 
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white border border-neutral-200 w-full max-w-xl rounded-2xl p-8 space-y-6 shadow-2xl text-left overflow-y-auto max-h-[90vh] no-scrollbar"
          >
            <div className="flex items-center justify-between border-b border-neutral-100 pb-4">
              <div className="space-y-1">
                <h3 className="text-xl font-black uppercase tracking-tight text-ink">Master Report Compiler</h3>
                <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">
                  வருகைப்பதிவு & எரிபொருள் பயன்பாட்டு அறிக்கை
                </p>
              </div>
              <button 
                onClick={() => setShowMasterReportModal(false)}
                className="p-2.5 rounded-xl border border-neutral-100 hover:bg-neutral-50 transition-colors cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              {/* Report Type */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-widest text-neutral-400 block pl-1">
                  Report Data Category (அறிக்கை வகை)
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button 
                    type="button"
                    onClick={() => setRepType('attendance')}
                    className={`p-4 rounded-xl border font-bold text-[11px] uppercase tracking-wider text-center transition-all cursor-pointer ${
                      repType === 'attendance' 
                        ? 'bg-blue-50 border-blue-500 text-blue-700 font-extrabold shadow-sm' 
                        : 'bg-neutral-50 border-neutral-200 text-neutral-500'
                    }`}
                  >
                    Attendance & OT Hours
                  </button>
                  <button 
                    type="button"
                    onClick={() => setRepType('fuel')}
                    className={`p-4 rounded-xl border font-bold text-[11px] uppercase tracking-wider text-center transition-all cursor-pointer ${
                      repType === 'fuel' 
                        ? 'bg-blue-50 border-blue-500 text-blue-700 font-extrabold shadow-sm' 
                        : 'bg-neutral-50 border-neutral-200 text-neutral-500'
                    }`}
                  >
                    Runs & Fuel Logs
                  </button>
                </div>
              </div>

              {/* Drivers Scope */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-widest text-neutral-400 pl-1">
                  Drivers Audit Scope (டிரைவர்கள் விவரம்)
                </label>
                <select 
                  value={repScope}
                  onChange={e => setRepScope(e.target.value)}
                  className="w-full bg-neutral-50 border border-neutral-200 p-4 rounded-xl focus:ring-2 focus:ring-accent outline-none font-bold text-ink"
                >
                  <option value="all">★ ALL Company Drivers (Master Document Compilation)</option>
                  {drivers.filter(d => !d.companyDeleted).map(d => (
                    <option key={d.id} value={d.id}>{d.name} ({d.fileNumber || 'No File No.'})</option>
                  ))}
                </select>
              </div>

              {/* Export File Format */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-widest text-neutral-400 block pl-1">
                  Preferred Download Export Format
                </label>
                <div className="grid grid-cols-3 gap-3">
                  <button 
                    type="button"
                    onClick={() => setRepFormat('xlsx')}
                    className={`py-3.5 rounded-xl border font-bold text-[10px] uppercase tracking-widest text-center transition-all cursor-pointer ${
                      repFormat === 'xlsx' 
                        ? 'bg-emerald-50 border-emerald-500 text-emerald-700 font-black shadow-sm' 
                        : 'bg-neutral-50 border-neutral-200 text-neutral-500'
                    }`}
                  >
                    Excel (.xlsx)
                  </button>
                  <button 
                    type="button"
                    onClick={() => setRepFormat('docx')}
                    className={`py-3.5 rounded-xl border font-bold text-[10px] uppercase tracking-widest text-center transition-all cursor-pointer ${
                      repFormat === 'docx' 
                        ? 'bg-sky-50 border-sky-500 text-sky-700 font-black shadow-sm' 
                        : 'bg-neutral-50 border-neutral-200 text-neutral-500'
                    }`}
                  >
                    Word (.docx)
                  </button>
                  <button 
                    type="button"
                    onClick={() => setRepFormat('pdf')}
                    className={`py-3.5 rounded-xl border font-bold text-[10px] uppercase tracking-widest text-center transition-all cursor-pointer ${
                      repFormat === 'pdf' 
                        ? 'bg-red-50 border-red-500 text-red-700 font-black shadow-sm' 
                        : 'bg-neutral-50 border-neutral-200 text-neutral-500'
                    }`}
                  >
                    Print PDF (.pdf)
                  </button>
                </div>
              </div>

              {/* Date Ranges */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-widest text-neutral-400 pl-1">From Date (முதல்)</label>
                  <input 
                    type="date" 
                    value={repFromDate}
                    onChange={e => setRepFromDate(e.target.value)}
                    className="w-full bg-neutral-50 border border-neutral-200 p-4 rounded-xl focus:ring-2 focus:ring-accent outline-none font-bold"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-widest text-neutral-400 pl-1">To Date (வரை)</label>
                  <input 
                    type="date" 
                    value={repToDate}
                    onChange={e => setRepToDate(e.target.value)}
                    className="w-full bg-neutral-50 border border-neutral-200 p-4 rounded-xl focus:ring-2 focus:ring-accent outline-none font-bold"
                  />
                </div>
              </div>

              {/* Sort order selection */}
              <div className="space-y-1.5 pt-1 text-left">
                <label className="text-[10px] font-black uppercase tracking-widest text-neutral-400 block pl-1">
                  Sort Order Sequence
                </label>
                <div className="flex gap-6 pl-1">
                  <label className="flex items-center gap-2 cursor-pointer font-bold text-[11px] text-ink">
                    <input 
                      type="radio" 
                      checked={repSort === 'date'} 
                      onChange={() => setRepSort('date')}
                      className="w-4 h-4 text-blue-600 border-neutral-300 focus:ring-blue-500"
                    />
                    Chronological (Date)
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer font-bold text-[11px] text-ink">
                    <input 
                      type="radio" 
                      checked={repSort === 'fileNumber'} 
                      onChange={() => setRepSort('fileNumber')}
                      className="w-4 h-4 text-blue-600 border-neutral-300 focus:ring-blue-500"
                    />
                    By Company File Number
                  </label>
                </div>
              </div>
            </div>

            <div className="flex gap-4 pt-6 border-t border-neutral-100">
              <button 
                onClick={() => setShowMasterReportModal(false)}
                className="flex-1 py-4 font-black text-[11px] uppercase tracking-widest text-neutral-400 hover:bg-neutral-50 rounded-xl transition-colors cursor-pointer text-center"
              >
                Cancel
              </button>
              <button 
                onClick={() => {
                  handleCompileMasterReport(repType, repScope, repFormat, repSort, repFromDate, repToDate);
                  setShowMasterReportModal(false);
                }}
                className="flex-1 bg-ink text-white py-4 font-black text-[11px] uppercase tracking-widest rounded-xl hover:brightness-110 shadow-lg shadow-ink/10 transition-all cursor-pointer text-center"
              >
                Compile Document
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </motion.div>
  );
}

// --- Individual Driver Tracking ---
function DriverIndividualView({ 
  driver, 
  onBack,
  hourlyRate,
  onLogService,
  onDeleteLog
}: { 
  driver: DriverStat, 
  onBack: () => void,
  hourlyRate: number,
  onLogService: (id: string, service: Omit<ServiceRecord, 'id'>) => void,
  onDeleteLog: (type: 'fuel' | 'duty' | 'service', itemId: string) => void
}) {
  const [activeTab, setActiveTab] = useState<'overview' | 'attendance' | 'maintenance'>('overview');
  const [showServiceForm, setShowServiceForm] = useState(false);
  const [serviceFormData, setServiceFormData] = useState({ date: new Date().toISOString().split('T')[0], km: driver.odometer, cost: 0, type: 'Routine Maintenance' });

  const activeDutyLogs = driver.dutyLogs.filter(l => !l.companyDeleted);
  const activeFuelEntries = driver.fuelEntries.filter(e => !e.companyDeleted);
  const activeServiceHistory = driver.maintenance.serviceHistory.filter(s => !s.companyDeleted);

  const totalRegularHours = activeDutyLogs.reduce((acc, log) => acc + log.regularHours, 0);
  const totalOTHours = activeDutyLogs.reduce((acc, log) => acc + log.otHours, 0);
  const totalHours = totalRegularHours + totalOTHours;
  const daysWorked = activeDutyLogs.length;

  const estimatedSalary = (totalRegularHours * hourlyRate) + (totalOTHours * (hourlyRate * 1.5));

  const runSinceLastService = (driver.maintenance.lastServiceKm !== null) 
    ? driver.odometer - driver.maintenance.lastServiceKm 
    : driver.odometer;

  return (
    <motion.div
      key="driver-details"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      className="p-6 md:p-12 space-y-10 flex-1 flex flex-col"
    >
      <header className="flex items-center gap-6">
        <button onClick={onBack} className="p-3 border border-neutral-200 rounded-xl hover:bg-neutral-100 transition-colors">
          <ChevronLeft size={24} />
        </button>
        <div>
          <h1 className="text-2xl font-black uppercase tracking-tight">{driver.name}</h1>
          <p className="text-[10px] font-black uppercase tracking-widest text-neutral-400">Individual Tracking</p>
        </div>
      </header>

      {/* Internal Tabs */}
      <div className="flex gap-4 border-b border-neutral-100 pb-4">
        <button 
          onClick={() => setActiveTab('overview')}
          className={`text-[12px] font-black uppercase tracking-widest pb-2 border-b-2 transition-all ${activeTab === 'overview' ? 'border-ink text-ink' : 'border-transparent text-neutral-300'}`}
        >
          Vehicle & Fuel
        </button>
        <button 
          onClick={() => setActiveTab('attendance')}
          className={`text-[12px] font-black uppercase tracking-widest pb-2 border-b-2 transition-all ${activeTab === 'attendance' ? 'border-ink text-ink' : 'border-transparent text-neutral-300'}`}
        >
          Payroll & Attendance
        </button>
        <button 
          onClick={() => setActiveTab('maintenance')}
          className={`text-[12px] font-black uppercase tracking-widest pb-2 border-b-2 transition-all ${activeTab === 'maintenance' ? 'border-ink text-ink' : 'border-transparent text-neutral-300'}`}
        >
          Maintenance
        </button>
      </div>

      <div className="flex-1 overflow-y-auto no-scrollbar space-y-8">
        {activeTab === 'overview' ? (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white border border-neutral-200 p-6 rounded-2xl shadow-sm">
                <p className="text-[10px] font-black uppercase text-neutral-400 tracking-widest">Total KM</p>
                <p className="text-2xl font-black">{driver.odometer.toLocaleString()}</p>
              </div>
              <div className="bg-white border border-neutral-200 p-6 rounded-2xl shadow-sm">
                <p className="text-[10px] font-black uppercase text-neutral-400 tracking-widest">Fuel Balance</p>
                <p className="text-2xl font-black text-danger">{driver.fuelBalance.toFixed(1)} KWD</p>
              </div>
            </div>

            <div className="bg-white border border-neutral-200 rounded-2xl p-6 space-y-4">
              <h3 className="text-[12px] font-black uppercase tracking-widest pb-2 border-b border-neutral-50">Vehicle Logs</h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center text-[11px] font-bold">
                  <span className="text-neutral-400">Assigned Unit</span>
                  <span>{driver.vehicle}</span>
                </div>
                <div className="flex justify-between items-center text-[11px] font-bold">
                  <span className="text-neutral-400">Current Status</span>
                  <span className="text-success uppercase tracking-widest">{driver.status}</span>
                </div>
              </div>
            </div>

            {/* Detailed Fuel History */}
            <div className="space-y-4">
              <p className="text-[11px] font-black uppercase tracking-widest text-neutral-400 px-1">Fuel & Efficiency History</p>
              <div className="space-y-3">
                {activeFuelEntries.map(entry => (
                  <div key={entry.id} className="bg-white border border-neutral-200 p-5 rounded-2xl space-y-3 shadow-sm relative group">
                    <button 
                      onClick={() => onDeleteLog('fuel', entry.id)}
                      className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 p-2 bg-danger/5 text-danger rounded-lg hover:bg-danger/10 transition-all"
                    >
                      <Trash2 size={12} />
                    </button>
                    <div className="flex justify-between items-start">
                      <p className="font-black text-sm">{entry.date}</p>
                      <div className="bg-accent/10 text-accent px-2 py-1 rounded text-[8px] font-black tracking-widest uppercase mr-8">
                        {entry.efficiency} KM/KWD
                      </div>
                    </div>
                    <div className="grid grid-cols-4 gap-2 py-2 border-y border-neutral-50">
                      <div>
                        <p className="text-[8px] font-bold text-neutral-300 uppercase">Distance</p>
                        <p className="font-black text-xs">{entry.distance} KM</p>
                      </div>
                      <div>
                        <p className="text-[8px] font-bold text-neutral-300 uppercase">Amount</p>
                        <p className="font-black text-xs">{entry.amount} KWD</p>
                      </div>
                      <div>
                        <p className="text-[8px] font-bold text-neutral-300 uppercase">Quantity</p>
                        <p className="font-black text-xs">{entry.liters !== undefined && entry.liters !== null ? `${entry.liters} L` : '---'}</p>
                      </div>
                      <div>
                        <p className="text-[8px] font-bold text-neutral-300 uppercase">New ODO</p>
                        <p className="font-black text-xs">{entry.currOdo.toLocaleString()}</p>
                      </div>
                    </div>
                  </div>
                ))}
                {driver.fuelEntries.length === 0 && (
                  <div className="text-center py-10 bg-neutral-50 border border-dashed border-neutral-200 rounded-3xl">
                    <p className="text-[10px] font-black uppercase text-neutral-300 tracking-[0.2em]">No fuel logs available</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : activeTab === 'maintenance' ? (
          <div className="space-y-8">
            <div className="grid grid-cols-2 gap-4">
              <div className={`p-6 rounded-2xl border transition-all ${runSinceLastService > 4500 ? 'bg-danger/10 border-danger/20' : 'bg-white border-neutral-200'}`}>
                <p className="text-[9px] font-black uppercase text-neutral-400 tracking-widest mb-1">KM Since Last Service</p>
                <div className="flex items-baseline gap-2">
                  <span className={`text-3xl font-black ${runSinceLastService > 4500 ? 'text-danger' : 'text-ink'}`}>{runSinceLastService.toLocaleString()}</span>
                  <span className="text-xs font-bold opacity-30">KM</span>
                </div>
              </div>
              <div className="bg-white border border-neutral-200 p-6 rounded-2xl">
                <p className="text-[9px] font-black uppercase text-neutral-400 tracking-widest mb-1">Next Service Target</p>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-black text-ink">{driver.maintenance.nextServiceKm?.toLocaleString() || '---'}</span>
                  <span className="text-xs font-bold opacity-30">KM</span>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex justify-between items-center px-1">
                <p className="text-[11px] font-black uppercase tracking-widest text-neutral-400">Maintenance History</p>
                <button 
                  onClick={() => setShowServiceForm(true)}
                  className="bg-accent text-white px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest shadow-lg shadow-accent/20"
                >
                  Log New Service
                </button>
              </div>

              {showServiceForm && (
                <div className="bg-neutral-50 border-2 border-neutral-100 p-6 rounded-3xl space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[8px] font-black uppercase text-neutral-400 pl-1">Service Type</label>
                      <input 
                        className="w-full bg-white border border-neutral-200 p-3 rounded-xl text-xs font-bold"
                        value={serviceFormData.type}
                        onChange={e => setServiceFormData({...serviceFormData, type: e.target.value})}
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[8px] font-black uppercase text-neutral-400 pl-1">Date</label>
                      <input 
                        type="date"
                        className="w-full bg-white border border-neutral-200 p-3 rounded-xl text-xs font-bold"
                        value={serviceFormData.date}
                        onChange={e => setServiceFormData({...serviceFormData, date: e.target.value})}
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[8px] font-black uppercase text-neutral-400 pl-1">Odometer (KM)</label>
                      <input 
                        type="number"
                        className="w-full bg-white border border-neutral-200 p-3 rounded-xl text-xs font-bold"
                        value={serviceFormData.km}
                        onChange={e => setServiceFormData({...serviceFormData, km: parseInt(e.target.value)})}
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[8px] font-black uppercase text-neutral-400 pl-1">Cost (KWD)</label>
                      <input 
                        type="number"
                        className="w-full bg-white border border-neutral-200 p-3 rounded-xl text-xs font-bold"
                        value={serviceFormData.cost}
                        onChange={e => setServiceFormData({...serviceFormData, cost: parseFloat(e.target.value)})}
                      />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => setShowServiceForm(false)} className="flex-1 py-3 text-[10px] font-black uppercase tracking-widest text-neutral-400">Cancel</button>
                    <button 
                      onClick={() => {
                        onLogService(driver.id, serviceFormData);
                        setShowServiceForm(false);
                      }}
                      className="flex-1 bg-ink text-white py-3 rounded-xl text-[10px] font-black uppercase tracking-widest"
                    >
                      Save Service
                    </button>
                  </div>
                </div>
              )}

              <div className="space-y-3">
                {activeServiceHistory.map(record => (
                  <div key={record.id} className="bg-white border border-neutral-200 p-6 rounded-2xl flex justify-between items-center shadow-sm relative group">
                    <div className="space-y-1">
                      <p className="font-extrabold text-sm">{record.type}</p>
                      <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">{record.date} • {record.km.toLocaleString()} KM</p>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="font-black text-lg">{record.cost.toFixed(2)}</p>
                        <p className="text-[8px] font-black text-neutral-300 uppercase tracking-widest">KWD</p>
                      </div>
                      <button 
                        onClick={() => onDeleteLog('service', record.id)}
                        className="opacity-0 group-hover:opacity-100 p-2 bg-danger/5 text-danger rounded-lg hover:bg-danger/10 transition-all"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))}
                {activeServiceHistory.length === 0 && !showServiceForm && (
                  <div className="text-center py-10 bg-neutral-50 border border-dashed border-neutral-200 rounded-3xl">
                    <p className="text-[10px] font-black uppercase text-neutral-300 tracking-[0.2em]">No maintenance logs</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Salary Calculation Helper */}
            <div className="bg-ink p-8 rounded-2xl text-white space-y-6 shadow-2xl shadow-ink/20">
              <div className="space-y-1">
                <p className="text-[10px] font-black uppercase text-white/40 tracking-widest">Estimated Salary (Month)</p>
                <div className="flex items-baseline gap-3">
                  <span className="text-5xl font-black">{estimatedSalary.toFixed(2)}</span>
                  <span className="text-xl font-bold text-white/20 uppercase">KWD</span>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white/10">
                <div>
                  <p className="text-[8px] font-black uppercase text-white/40">Regular Pay</p>
                  <p className="font-bold">{(totalRegularHours * hourlyRate).toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-[8px] font-black uppercase text-white/40">Overtime (1.5x)</p>
                  <p className="font-bold text-accent">{(totalOTHours * (hourlyRate * 1.5)).toFixed(2)}</p>
                </div>
              </div>
            </div>

            {/* Attendance Report */}
            <div className="bg-white border border-neutral-200 rounded-2xl overflow-hidden shadow-sm">
              <div className="p-6 border-b border-neutral-50 flex justify-between items-center bg-neutral-50/50">
                <h3 className="text-[12px] font-black uppercase tracking-widest">Attendance Report</h3>
                <span className="text-[10px] font-black uppercase bg-neutral-100 px-2 py-1 rounded text-neutral-400">Monthly</span>
              </div>
              <div className="grid grid-cols-3 divide-x divide-neutral-50 text-center py-6">
                <div>
                  <p className="text-[9px] font-black uppercase text-neutral-300">Days</p>
                  <p className="text-xl font-black">{daysWorked}</p>
                </div>
                <div>
                  <p className="text-[9px] font-black uppercase text-neutral-300">Reg Hr</p>
                  <p className="text-xl font-black">{totalRegularHours.toFixed(1)}</p>
                </div>
                <div>
                  <p className="text-[9px] font-black uppercase text-neutral-300">OT Hr</p>
                  <p className="text-xl font-black text-accent">{totalOTHours.toFixed(1)}</p>
                </div>
              </div>
            </div>

            {/* Shift History */}
            <div className="space-y-4">
              <p className="text-[11px] font-black uppercase tracking-widest text-neutral-400 px-1">Shift History</p>
              <div className="space-y-3">
                {activeDutyLogs.slice(0, 5).map(log => (
                  <div key={log.id} className="bg-white border border-neutral-200 p-5 rounded-2xl space-y-4 shadow-sm relative group">
                    <button 
                      onClick={() => onDeleteLog('duty', log.id)}
                      className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 p-2 bg-danger/5 text-danger rounded-lg hover:bg-danger/10 transition-all"
                    >
                      <Trash2 size={12} />
                    </button>
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <p className="font-black text-sm">{log.date}</p>
                        <p className="text-[10px] text-neutral-400 font-bold uppercase tracking-widest">{log.inTime} - {log.outTime}</p>
                      </div>
                      <div className="text-right mr-8">
                        <p className="font-black text-lg">{log.totalHours}h</p>
                        {log.otHours > 0 && <p className="text-[8px] font-black text-accent uppercase tracking-widest">+{log.otHours} OT</p>}
                      </div>
                    </div>
                    {(log.inLocation || log.outLocation) && (
                      <div className="pt-3 border-t border-neutral-50 flex flex-col gap-2">
                        {log.inLocation && (
                          <div className="flex items-center gap-2 text-[9px] font-bold text-neutral-400">
                            <MapPin size={10} className="text-success" />
                            <span>IN: {log.inLocation.lat.toFixed(4)}, {log.inLocation.lng.toFixed(4)}</span>
                          </div>
                        )}
                        {log.outLocation && (
                          <div className="flex items-center gap-2 text-[9px] font-bold text-neutral-400">
                            <MapPin size={10} className="text-danger" />
                            <span>OUT: {log.outLocation.lat.toFixed(4)}, {log.outLocation.lng.toFixed(4)}</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
                {driver.dutyLogs.length === 0 && (
                  <div className="text-center py-10 bg-neutral-50 border border-dashed border-neutral-200 rounded-3xl">
                    <p className="text-[10px] font-black uppercase text-neutral-300 tracking-[0.2em]">No logs recorded</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="pt-6">
        <button 
          onClick={onBack}
          className="w-full bg-neutral-100 text-ink py-5 rounded-xl font-black text-[12px] uppercase tracking-widest hover:bg-neutral-200 transition-colors"
        >
          Return to Fleet Overview
        </button>
      </div>
    </motion.div>
  );
}

// --- Admin Auth Modal ---
function AdminAuthModal({ 
  adminAuth, 
  onSuccess, 
  onClose 
}: { 
  adminAuth: { username: string, password: string },
  onSuccess: () => void,
  onClose: () => void
}) {
  const [idInput, setIdInput] = useState('');
  const [passInput, setPassInput] = useState('');
  const [error, setError] = useState(false);

  const handleVerify = (e: React.FormEvent) => {
    e.preventDefault();
    const saved = localStorage.getItem('no_code_sub_admins');
    const subAdmins: any[] = saved ? JSON.parse(saved) : [];
    const isSubAdminMatch = subAdmins.some(sub => sub.email.toLowerCase() === idInput.trim().toLowerCase() && sub.password === passInput);

    if ((idInput === adminAuth.username && passInput === adminAuth.password) || isSubAdminMatch) {
      if (isSubAdminMatch) {
        const matchingSub = subAdmins.find(sub => sub.email.toLowerCase() === idInput.trim().toLowerCase() && sub.password === passInput);
        sessionStorage.setItem('active_sub_admin_name', matchingSub.name);
        sessionStorage.setItem('active_sub_admin_permissions', JSON.stringify(matchingSub.permissions));
      } else {
        sessionStorage.removeItem('active_sub_admin_name');
        sessionStorage.removeItem('active_sub_admin_permissions');
      }
      onSuccess();
    } else {
      setError(true);
      setTimeout(() => setError(false), 2000);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] bg-ink/95 backdrop-blur-md flex items-center justify-center p-6"
    >
      <motion.div 
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        className="w-full max-w-sm bg-white rounded-3xl p-8 space-y-8 shadow-2xl"
      >
        <div className="text-center space-y-2">
          <div className="w-16 h-16 bg-accent/10 text-accent rounded-2xl mx-auto flex items-center justify-center">
            <UserPlus size={32} />
          </div>
          <h2 className="text-2xl font-black uppercase tracking-tight">Admin Access</h2>
          <p className="text-[10px] font-black uppercase tracking-widest text-neutral-400">Strict Credentials Required</p>
        </div>

        <form onSubmit={handleVerify} className="space-y-4">
          <div className="space-y-1">
            <input 
              type="text" 
              placeholder="Admin ID"
              value={idInput}
              onChange={e => setIdInput(e.target.value)}
              className={`w-full bg-neutral-50 border ${error ? 'border-danger' : 'border-neutral-200'} p-4 rounded-xl outline-none font-bold placeholder:text-neutral-300`}
            />
          </div>
          <div className="space-y-1">
            <input 
              type="password" 
              placeholder="Password"
              value={passInput}
              onChange={e => setPassInput(e.target.value)}
              className={`w-full bg-neutral-50 border ${error ? 'border-danger' : 'border-neutral-200'} p-4 rounded-xl outline-none font-bold placeholder:text-neutral-300`}
            />
          </div>
          
          <div className="flex gap-3 pt-4">
            <button 
              type="button"
              onClick={onClose}
              className="flex-1 py-4 font-black text-[11px] uppercase tracking-widest text-neutral-400 hover:bg-neutral-50 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button 
              type="submit"
              className="flex-1 bg-ink text-white py-4 rounded-xl font-black text-[11px] uppercase tracking-widest hover:brightness-110 active:scale-95 transition-all shadow-xl shadow-ink/20"
            >
              Authorize
            </button>
          </div>
          
          {error && (
            <p className="text-[10px] font-black text-danger uppercase tracking-widest text-center animate-bounce">
              Invalid credentials provided
            </p>
          )}
        </form>
      </motion.div>
    </motion.div>
  );
}

function ActionButton({ icon, label, onClick }: { icon: React.ReactNode, label: string, onClick: () => void }) {
  return (
    <button 
      onClick={onClick}
      className="aspect-square bg-white border border-neutral-200 rounded-3xl flex flex-col items-center justify-center gap-4 hover:bg-ink hover:text-white transition-all duration-300 group shadow-sm active:scale-95"
    >
      <div className="transition-transform group-hover:scale-125 duration-500">
        {icon}
      </div>
      <span className="text-[10px] font-black uppercase tracking-widest">{label}</span>
    </button>
  );
}

// --- NFC Scanner Modal (Simulation) ---
function NfcScannerModal({ 
  drivers, 
  onScan, 
  onClose 
}: { 
  drivers: DriverStat[], 
  onScan: (id: string) => void, 
  onClose: () => void 
}) {
  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[110] bg-ink/90 backdrop-blur-xl flex items-center justify-center p-6"
    >
      <motion.div 
        initial={{ scale: 0.9, opacity: 0, y: 30 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        className="w-full max-w-md bg-white rounded-[2.5rem] p-10 space-y-10 shadow-2xl relative overflow-hidden"
      >
        <div className="absolute top-0 left-0 w-full h-2 bg-accent/20">
          <motion.div 
            animate={{ x: ['-100%', '100%'] }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            className="w-1/2 h-full bg-accent"
          />
        </div>

        <div className="text-center space-y-4">
          <div className="w-20 h-20 bg-accent/10 text-accent rounded-3xl mx-auto flex items-center justify-center relative">
            <Nfc size={40} />
            <motion.div 
              animate={{ scale: [1, 1.5, 1], opacity: [0.5, 0, 0.5] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="absolute inset-0 border-4 border-accent rounded-3xl"
            />
          </div>
          <div className="space-y-1">
            <h2 className="text-3xl font-black uppercase tracking-tighter">NFC Radar</h2>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-neutral-400">Align Worker ID Card with Phone</p>
          </div>
        </div>

        <div className="space-y-4">
          <p className="text-[9px] font-black uppercase text-neutral-300 tracking-widest text-center">Simulate Hardware Tap</p>
          <div className="grid grid-cols-1 gap-3">
            {drivers.map(d => (
              <button 
                key={d.id}
                onClick={() => onScan(d.nfcId)}
                className="w-full bg-neutral-50 border border-neutral-100 p-4 rounded-2xl flex items-center justify-between hover:bg-neutral-100 transition-colors group"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center border border-neutral-100 font-black text-xs">
                    {d.name.substring(0, 2)}
                  </div>
                  <div className="text-left">
                    <p className="font-bold text-sm tracking-tight">{d.name}</p>
                    <p className="text-[8px] font-black uppercase tracking-widest text-neutral-400">{d.nfcId}</p>
                  </div>
                </div>
                <div className="w-8 h-8 rounded-lg bg-white border border-neutral-100 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <Plus size={14} />
                </div>
              </button>
            ))}
          </div>
        </div>

        <button 
          onClick={onClose}
          className="w-full py-4 font-black text-[11px] uppercase tracking-widest text-neutral-400 hover:bg-neutral-50 rounded-2xl transition-colors"
        >
          Cancel Scan
        </button>
      </motion.div>
    </motion.div>
  );
}

// --- Master Control Components ---
function MasterAuthModal({ onSuccess, onClose }: { onSuccess: () => void, onClose: () => void }) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState(false);

  const handleLogin = () => {
    if (password === 'AK@Kuwait2026') {
      onSuccess();
    } else {
      setError(true);
      setTimeout(() => setError(false), 500);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-[200] bg-ink/60 backdrop-blur-md flex items-center justify-center p-6"
    >
      <motion.div 
        initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }}
        className={`w-full max-w-md bg-white rounded-3xl p-8 space-y-8 shadow-2xl ${error ? 'animate-shake' : ''}`}
      >
        <div className="text-center space-y-2">
          <div className="w-16 h-16 bg-danger rounded-2xl mx-auto flex items-center justify-center mb-4">
            <Lock size={32} className="text-white" />
          </div>
          <h2 className="text-2xl font-black uppercase tracking-tight">Master Access</h2>
          <p className="text-[10px] font-black uppercase tracking-widest text-neutral-400">Restricted Area • Developers Only</p>
        </div>

        <div className="space-y-4">
          <div className="space-y-1">
            <label className="text-[10px] font-black uppercase tracking-widest text-neutral-400 pl-1">Master Password</label>
            <input 
              type="password" 
              className="w-full bg-neutral-100 border border-neutral-200 p-4 rounded-xl font-black focus:ring-2 focus:ring-danger outline-none"
              value={password}
              onChange={e => setPassword(e.target.value)}
              onKeyPress={e => e.key === 'Enter' && handleLogin()}
              autoFocus
            />
          </div>
          <button 
            onClick={handleLogin}
            className="w-full bg-danger text-white py-5 rounded-2xl font-black text-xs uppercase tracking-widest hover:scale-[1.02] active:scale-[0.98] transition-all"
          >
            Authorize Entry
          </button>
          <button onClick={onClose} className="w-full text-neutral-400 font-bold text-[10px] uppercase tracking-widest pt-2">
            Abort Attempt
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

function MasterDashboard({ 
  onBack, 
  notifications,
  setNotifications, 
  drivers,
  setDrivers,
  companies,
  setCompanies,
  companyName,
  setCompanyName,
  companyTagline,
  setCompanyTagline,
  logoUrl,
  setLogoUrl,
  showToast 
}: { 
  onBack: () => void, 
  notifications: any[],
  setNotifications: (n: any[]) => void, 
  drivers: DriverStat[],
  setDrivers: (d: DriverStat[]) => void,
  companies: Company[],
  setCompanies: (c: Company[]) => void,
  companyName: string,
  setCompanyName: (v: string) => void,
  companyTagline: string,
  setCompanyTagline: (v: string) => void,
  logoUrl: string,
  setLogoUrl: (v: string) => void,
  showToast: (m: string) => void
}) {
  const [activeMasterTab, setActiveMasterTab] = useState<'overview' | 'drivers' | 'vehicles' | 'companies' | 'no-code-editor' | 'sub-admins' | 'recycle' | 'archive' | 'settings'>('overview');
  const [editingObj, setEditingObj] = useState<{ type: 'driver' | 'vehicle' | 'company' | 'tenant', id?: string } | null>(null);
  const [showNotifications, setShowNotifications] = useState(false);

  // Partial edit states
  const [tempDriver, setTempDriver] = useState<Partial<DriverStat>>({});
  const [tempCompany, setTempCompany] = useState({ name: companyName, tagline: companyTagline, logo: logoUrl });
  const [newCompany, setNewCompany] = useState<Partial<Company>>({ name: '', tagline: '', logoUrl: '', adminEmail: '' });

  const handleRegisterCompany = () => {
    if (!newCompany.name || !newCompany.adminEmail) {
      showToast("Company Name and Admin Email are required");
      return;
    }
    const company: Company = {
      id: 'c-' + Math.random().toString(36).substring(7),
      name: newCompany.name || '',
      tagline: newCompany.tagline || '',
      logoUrl: newCompany.logoUrl || '',
      adminEmail: newCompany.adminEmail || '',
    };
    setCompanies([...companies, company]);
    setNewCompany({ name: '', tagline: '', logoUrl: '', adminEmail: '' });
    showToast(`New Company: ${company.name} Registered`);
  };

  useEffect(() => {
    setTempCompany({ name: companyName, tagline: companyTagline, logo: logoUrl });
  }, [companyName, companyTagline, logoUrl]);

  const handleSaveDriver = () => {
    if (!editingObj?.id) return;
    const updated = drivers.map(d => d.id === editingObj.id ? { ...d, ...tempDriver } : d);
    setDrivers(updated);
    setEditingObj(null);
    showToast("Driver updated successfully");
  };

  const handleSaveVehicle = () => {
    if (!editingObj?.id) return;
    const updated = drivers.map(d => d.id === editingObj.id ? { ...d, ...tempDriver } : d);
    setDrivers(updated);
    setEditingObj(null);
    showToast("Vehicle configuration updated");
  };

  const handleSaveCompany = () => {
    setCompanyName(tempCompany.name);
    setCompanyTagline(tempCompany.tagline);
    setLogoUrl(tempCompany.logo);
    setEditingObj(null);
    showToast("Company settings overwritten");
  };

  const markAllRead = () => {
    setNotifications(notifications.map(n => ({ ...n, read: true })));
  };

  const clearAllNotifications = () => {
    setNotifications([]);
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  const startEditDriver = (driver: DriverStat) => {
    setTempDriver({ ...driver });
    setEditingObj({ type: 'driver', id: driver.id });
  };

  const startEditVehicle = (driver: DriverStat) => {
    setTempDriver({ ...driver });
    setEditingObj({ type: 'vehicle', id: driver.id });
  };

  const handleRecoverDriver = (id: string) => {
    const updated = drivers.map(d => d.id === id ? { 
      ...d, 
      companyDeleted: false, 
      companyPermanentDelete: false,
      deletedAt: undefined, 
      deletedBy: undefined,
      masterArchiveDate: undefined 
    } : d);
    setDrivers(updated);
    showToast("Master Restore: Driver returned to active fleet");
  };

  const handleRecoverFuelEntry = (driverId: string, entryId: string) => {
    const updated = drivers.map(d => d.id === driverId ? {
      ...d,
      fuelEntries: d.fuelEntries.map(e => e.id === entryId ? { 
        ...e, 
        companyDeleted: false, 
        companyPermanentDelete: false,
        deletedAt: undefined,
        masterArchiveDate: undefined 
      } : e)
    } : d);
    setDrivers(updated);
    showToast("Master Restore: Fuel record returned to active fleet");
  };

  const handleRecoverDutyLog = (driverId: string, logId: string) => {
    const updated = drivers.map(d => d.id === driverId ? {
      ...d,
      dutyLogs: d.dutyLogs.map(l => l.id === logId ? { 
        ...l, 
        companyDeleted: false, 
        companyPermanentDelete: false,
        deletedAt: undefined,
        masterArchiveDate: undefined 
      } : l)
    } : d);
    setDrivers(updated);
    showToast("Master Restore: Duty log returned to active fleet");
  };

  const handleRecoverTrip = (driverId: string, tripDate: string) => {
    const updated = drivers.map(d => d.id === driverId ? {
      ...d,
      trips: d.trips.map(t => t.date === tripDate ? { 
        ...t, 
        companyDeleted: false, 
        companyPermanentDelete: false,
        deletedAt: undefined,
        masterArchiveDate: undefined 
      } : t)
    } : d);
    setDrivers(updated);
    showToast("Master Restore: Trip history returned to active fleet");
  };

  const handleRecoverService = (driverId: string, serviceId: string) => {
    const updated = drivers.map(d => d.id === driverId ? {
      ...d,
      maintenance: {
        ...d.maintenance,
        serviceHistory: d.maintenance.serviceHistory.map(s => s.id === serviceId ? { 
          ...s, 
          companyDeleted: false, 
          companyPermanentDelete: false,
          deletedAt: undefined,
          masterArchiveDate: undefined 
        } : s)
      }
    } : d);
    setDrivers(updated);
    showToast("Master Restore: Service record returned to active fleet");
  };

  return (
    <motion.div 
      key="master-dashboard" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="flex-1 flex flex-col bg-[#0a0a0a] text-white overflow-hidden font-sans"
    >
      <header className="p-6 md:p-8 flex items-center justify-between border-b border-white/5 bg-[#0d0d0d]">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-danger rounded-xl flex items-center justify-center shadow-lg shadow-danger/20">
            <Shield size={20} className="text-white" />
          </div>
          <div>
            <h1 className="text-xl font-black uppercase tracking-tight">Creator Console</h1>
            <p className="text-[9px] font-bold text-neutral-500 uppercase tracking-widest">Master Control • AK Dashboard</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="hidden md:flex gap-2 mr-4">
            {(['overview', 'drivers', 'vehicles', 'companies', 'no-code-editor', 'sub-admins', 'recycle', 'archive', 'settings'] as const).map((tab) => (
              <button 
                key={tab}
                onClick={() => setActiveMasterTab(tab)}
                className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${activeMasterTab === tab ? 'bg-danger text-white' : 'bg-white/5 text-neutral-500 hover:bg-white/10'}`}
              >
                {tab === 'recycle' ? 'Client Trash' : 
                 tab === 'archive' ? 'Master Archive' : 
                 tab === 'no-code-editor' ? 'No-Code Console' :
                 tab === 'sub-admins' ? 'Sub-Admins' : tab}
              </button>
            ))}
          </div>
          
          {/* Notification Bell */}
          <div className="relative">
            <button 
              onClick={() => setShowNotifications(!showNotifications)}
              className={`p-3 rounded-xl transition-all relative ${showNotifications ? 'bg-danger text-white' : 'bg-white/5 text-neutral-500 hover:bg-white/10'}`}
            >
              <Bell size={18} />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-danger text-white text-[8px] font-black px-1.5 py-0.5 rounded-full border-2 border-[#0d0d0d] animate-pulse">
                  {unreadCount}
                </span>
              )}
            </button>

            <AnimatePresence>
              {showNotifications && (
                <motion.div 
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  className="absolute right-0 mt-3 w-80 bg-[#141414] border border-white/10 rounded-2xl shadow-2xl z-[500] overflow-hidden"
                >
                  <div className="p-4 border-b border-white/5 flex items-center justify-between bg-white/2">
                    <h3 className="text-[10px] font-black uppercase tracking-widest text-neutral-400">System Logs</h3>
                    <div className="flex gap-3">
                      <button onClick={markAllRead} className="text-[8px] font-black uppercase tracking-widest text-neutral-500 hover:text-white transition-colors">Mark Read</button>
                      <button onClick={clearAllNotifications} className="text-[8px] font-black uppercase tracking-widest text-danger hover:brightness-110 transition-colors">Clear All</button>
                    </div>
                  </div>
                  <div className="max-h-[400px] overflow-y-auto no-scrollbar p-2 space-y-1">
                    {notifications.length === 0 && (
                      <div className="py-10 text-center">
                        <p className="text-[10px] font-black uppercase tracking-widest text-neutral-700 font-mono">Archive Empty</p>
                      </div>
                    )}
                    {notifications.map((n) => (
                      <div key={n.id} className={`p-4 rounded-xl space-y-2 transition-colors ${n.read ? 'opacity-60' : 'bg-white/5'}`}>
                        <div className="flex justify-between items-start">
                           <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded ${n.type === 'intrusion' ? 'bg-danger/20 text-danger' : 'bg-amber-500/20 text-amber-500'}`}>
                              {n.type} Alert
                           </span>
                           <span className="text-[8px] text-neutral-600 font-mono">{n.time}</span>
                        </div>
                        <p className="text-[11px] font-medium leading-relaxed text-neutral-200">
                          {n.message}
                        </p>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <button onClick={onBack} className="p-3 bg-white/5 rounded-xl hover:bg-white/10 transition-colors text-neutral-500">
            <LogOut size={18} />
          </button>
        </div>
      </header>

      {/* Mobile Nav */}
      <div className="md:hidden flex overflow-x-auto p-4 gap-2 border-b border-white/5 bg-[#0d0d0d] no-scrollbar">
        {(['overview', 'drivers', 'vehicles', 'companies', 'no-code-editor', 'sub-admins', 'recycle', 'archive', 'settings'] as const).map((tab) => (
          <button 
            key={tab}
            onClick={() => setActiveMasterTab(tab)}
            className={`px-4 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest whitespace-nowrap transition-all ${activeMasterTab === tab ? 'bg-danger text-white' : 'bg-white/5 text-neutral-500'}`}
          >
            {tab === 'recycle' ? 'Trash' : 
             tab === 'archive' ? 'Archive' : 
             tab === 'no-code-editor' ? 'No-Code' :
             tab === 'sub-admins' ? 'SubAdmins' : tab}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-10 no-scrollbar">
        {activeMasterTab === 'overview' && (
          <div className="space-y-10">
            {/* Global Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-white/5 border border-white/10 p-6 rounded-3xl space-y-1">
                <p className="text-[9px] font-bold text-neutral-500 uppercase tracking-widest">Active Companies</p>
                <p className="text-3xl font-black">{companies.length}</p>
              </div>
              <div className="bg-white/5 border border-white/10 p-6 rounded-3xl space-y-1">
                <p className="text-[9px] font-bold text-neutral-500 uppercase tracking-widest">Subscription</p>
                <p className="text-3xl font-black text-success">PRO</p>
              </div>
              <div className="bg-white/5 border border-white/10 p-6 rounded-3xl space-y-1">
                <p className="text-[9px] font-bold text-neutral-500 uppercase tracking-widest">Global Users</p>
                <p className="text-3xl font-black text-amber-500">{drivers.length}</p>
              </div>
              <div className="bg-white/5 border border-white/10 p-6 rounded-3xl space-y-1">
                <p className="text-[9px] font-bold text-neutral-500 uppercase tracking-widest">Intrusions</p>
                <p className="text-3xl font-black text-danger">{notifications.filter(n => n.type === 'intrusion').length}</p>
              </div>
            </div>

            {/* Analytics & Exports */}
            <div className="space-y-4">
              <h2 className="text-xs font-black uppercase tracking-[0.2em] text-neutral-500 px-1">Global App Analytics</h2>
              <div className="bg-white/5 border border-white/10 rounded-3xl p-6 grid grid-cols-2 md:grid-cols-4 gap-6">
                <div className="space-y-1">
                  <p className="text-[10px] font-black text-neutral-500 uppercase tracking-widest">Total Trips</p>
                  <p className="text-2xl font-black">1,420</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-black text-neutral-500 uppercase tracking-widest">Total Fuel (KWD)</p>
                  <p className="text-2xl font-black">2,840.00</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-black text-neutral-500 uppercase tracking-widest">Active Drivers</p>
                  <p className="text-2xl font-black">45</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-black text-neutral-500 uppercase tracking-widest">System Health</p>
                  <p className="text-2xl font-black text-success">99.9%</p>
                </div>
              </div>

              <div className="flex gap-3">
                <button className="flex-1 bg-white/5 border border-white/10 py-4 rounded-2xl flex flex-col items-center justify-center gap-2 hover:bg-white/10 transition-colors">
                  <Download size={18} className="text-neutral-400" />
                  <span className="text-[9px] font-black uppercase tracking-widest">Daily Rpt</span>
                </button>
                <button className="flex-1 bg-white/5 border border-white/10 py-4 rounded-2xl flex flex-col items-center justify-center gap-2 hover:bg-white/10 transition-colors">
                  <Download size={18} className="text-neutral-400" />
                  <span className="text-[9px] font-black uppercase tracking-widest">Monthly Rpt</span>
                </button>
                <button className="flex-1 bg-white/5 border border-white/10 py-4 rounded-2xl flex flex-col items-center justify-center gap-2 hover:bg-white/10 transition-colors">
                  <Download size={18} className="text-neutral-400" />
                  <span className="text-[9px] font-black uppercase tracking-widest">Yearly Rpt</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {activeMasterTab === 'drivers' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between px-1">
              <div className="space-y-1">
                <h2 className="text-xl font-black uppercase tracking-tight">Driver Management</h2>
                <p className="text-[10px] font-bold text-neutral-500 uppercase tracking-[0.2em]">Super Admin Control</p>
              </div>
              <button className="bg-white/5 p-3 rounded-xl hover:bg-white/10">
                <RefreshCw size={18} className="text-neutral-400" />
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {drivers.filter(d => d.role === 'driver').map((driver) => (
                <div key={driver.id} className="bg-white/5 border border-white/10 rounded-3xl p-6 space-y-4 hover:border-white/20 transition-all">
                  <div className="flex justify-between items-start">
                    <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center">
                      <UserCog size={24} className="text-neutral-300" />
                    </div>
                    <div className={`p-1.5 rounded-lg ${driver.status === 'active' ? 'bg-success/20 text-success' : 'bg-danger/20 text-danger'}`}>
                      <p className="text-[8px] font-black uppercase">{driver.status}</p>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-lg font-black">{driver.name}</h3>
                    <p className="text-xs text-neutral-500 font-bold">{driver.email}</p>
                    <p className="text-[9px] text-neutral-600 uppercase tracking-widest">NFC: {driver.nfcId}</p>
                  </div>
                  <div className="pt-4 flex gap-2">
                    <button 
                      onClick={() => startEditDriver(driver)}
                      className="flex-1 bg-white text-black py-3 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2"
                    >
                      <Edit size={12} /> Edit Profile
                    </button>
                    <button className="p-3 bg-danger/10 text-danger rounded-xl hover:bg-danger/20 transition-colors">
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeMasterTab === 'vehicles' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between px-1">
              <div className="space-y-1">
                <h2 className="text-xl font-black uppercase tracking-tight">Inventory & Fleet</h2>
                <p className="text-[10px] font-bold text-neutral-500 uppercase tracking-[0.2em]">Vehicle Configuration</p>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {drivers.map((driver) => (
                <div key={driver.id} className="bg-white/5 border border-white/10 rounded-3xl p-6 space-y-4">
                  <div className="flex justify-between items-start">
                    <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center">
                      <Car size={24} className="text-neutral-300" />
                    </div>
                    <div className="bg-white/10 p-2 rounded-xl">
                      <p className="text-[10px] font-black text-neutral-400 uppercase tracking-widest">{driver.odometer.toLocaleString()} KM</p>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-lg font-black uppercase">{driver.vehicle}</h3>
                    <p className="text-[10px] text-neutral-500 font-bold uppercase tracking-widest">Primary: {driver.name}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-[9px] font-bold uppercase tracking-widest text-neutral-500">
                    <div className="bg-white/5 p-2 rounded-lg">
                      <p>Last Serv</p>
                      <p className="text-white">{driver.maintenance.lastServiceKm} KM</p>
                    </div>
                    <div className="bg-white/5 p-2 rounded-lg">
                      <p>Next Serv</p>
                      <p className="text-danger">{driver.maintenance.nextServiceKm} KM</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => startEditVehicle(driver)}
                    className="w-full bg-white/10 text-white py-3 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-white/20 transition-all border border-white/5"
                  >
                    <Wrench size={12} /> Configure Vehicle
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeMasterTab === 'companies' && (
          <div className="space-y-10">
            <div className="space-y-1">
              <h2 className="text-2xl font-black uppercase tracking-tight">Company Management</h2>
              <p className="text-xs font-bold text-neutral-500 uppercase tracking-[0.2em]">Register and override multi-tenant environments</p>
            </div>

            {/* Registration Form */}
            <div className="bg-white/5 border border-white/10 p-8 rounded-[32px] space-y-6">
               <h3 className="text-xs font-black uppercase tracking-widest text-neutral-400">Register New Company</h3>
               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-neutral-500 tracking-widest">Company Name</label>
                    <input 
                      className="w-full bg-black/40 border border-white/10 p-4 rounded-xl text-sm font-bold focus:ring-2 focus:ring-danger outline-none"
                      value={newCompany.name}
                      onChange={e => setNewCompany({...newCompany, name: e.target.value})}
                      placeholder="e.g. Kuwait Logistics"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-neutral-500 tracking-widest">Admin Email ID</label>
                    <input 
                      className="w-full bg-black/40 border border-white/10 p-4 rounded-xl text-sm font-bold focus:ring-2 focus:ring-danger outline-none"
                      value={newCompany.adminEmail}
                      onChange={e => setNewCompany({...newCompany, adminEmail: e.target.value})}
                      placeholder="admin@company.com"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-neutral-500 tracking-widest">Company Tagline</label>
                    <input 
                      className="w-full bg-black/40 border border-white/10 p-4 rounded-xl text-sm font-bold focus:ring-2 focus:ring-danger outline-none"
                      value={newCompany.tagline}
                      onChange={e => setNewCompany({...newCompany, tagline: e.target.value})}
                      placeholder="Enterprise Fleet Hub"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-neutral-500 tracking-widest">Logo URL</label>
                    <input 
                      className="w-full bg-black/40 border border-white/10 p-4 rounded-xl text-sm font-bold focus:ring-2 focus:ring-danger outline-none"
                      value={newCompany.logoUrl}
                      onChange={e => setNewCompany({...newCompany, logoUrl: e.target.value})}
                      placeholder="https://..."
                    />
                  </div>
               </div>
               <button 
                onClick={handleRegisterCompany}
                className="bg-danger text-white px-10 py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:brightness-110 transition-all font-mono"
               >
                Execute Registration
               </button>
            </div>

            {/* List of Companies */}
            <div className="space-y-4">
              <h3 className="text-[10px] font-black uppercase tracking-widest text-neutral-600 px-1">Registered Tenants</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {companies.map(company => (
                  <div key={company.id} className="bg-white/2 border border-white/5 p-6 rounded-3xl flex items-center justify-between group hover:border-white/20 transition-all">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center overflow-hidden border border-white/10">
                        {company.logoUrl ? <img src={company.logoUrl} className="w-full h-full object-cover" /> : <Shield size={20} className="text-black" />}
                      </div>
                      <div>
                        <p className="font-black text-lg">{company.name}</p>
                        <p className="text-[9px] text-neutral-500 uppercase font-black tracking-widest">{company.adminEmail} • UID: {company.id}</p>
                      </div>
                    </div>
                    <button 
                      onClick={() => {
                        showToast(`Managing ${company.name}`);
                      }}
                      className="p-3 bg-white/5 rounded-xl hover:bg-white/10 transition-colors opacity-0 group-hover:opacity-100"
                    >
                      <Settings size={14} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeMasterTab === 'recycle' && (
          <div className="space-y-10">
            <div className="space-y-1">
              <h2 className="text-2xl font-black uppercase tracking-tight">Client Trash Can</h2>
              <p className="text-xs font-bold text-neutral-500 uppercase tracking-[0.2em]">Viewing items in {companyName}'s self-service bin</p>
            </div>

            {/* Deleted Drivers */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 px-1">
                <UserCog size={14} className="text-neutral-500" />
                <h3 className="text-[10px] font-black uppercase tracking-widest text-neutral-500">Soft-Deleted Drivers</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {drivers.filter(d => d.companyDeleted && !d.companyPermanentDelete && d.role === 'driver').map(driver => (
                  <div key={driver.id} className="bg-white/5 border border-white/10 p-6 rounded-3xl flex items-center justify-between">
                    <div>
                      <p className="font-black text-lg">{driver.name}</p>
                      <p className="text-[10px] text-neutral-500 uppercase font-black tracking-widest">UID: {driver.id} • Trash At: {new Date(driver.deletedAt || "").toLocaleDateString()}</p>
                    </div>
                    <button 
                      onClick={() => handleRecoverDriver(driver.id)}
                      className="bg-success text-white px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest flex items-center gap-2 hover:brightness-110 transition-all"
                    >
                      <RefreshCw size={12} /> Force Restore
                    </button>
                  </div>
                ))}
                {drivers.filter(d => d.companyDeleted && !d.companyPermanentDelete && d.role === 'driver').length === 0 && (
                  <div className="col-span-full p-8 border border-dashed border-white/5 rounded-3xl text-center">
                    <p className="text-[9px] font-black uppercase text-neutral-700 tracking-widest">No active soft-deletions</p>
                  </div>
                )}
              </div>
            </div>

            {/* Deleted Activity Logs */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 px-1">
                <FileText size={14} className="text-neutral-500" />
                <h3 className="text-[10px] font-black uppercase tracking-widest text-neutral-500">Soft-Deleted Activity Logs</h3>
              </div>
              <div className="space-y-3">
                {drivers.map(d => (
                  <React.Fragment key={d.id}>
                    {/* Fuel Logs */}
                    {d.fuelEntries.filter(e => e.companyDeleted && !e.companyPermanentDelete).map(entry => (
                      <div key={entry.id} className="bg-white/5 border border-white/10 p-5 rounded-2xl flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 bg-amber-500/10 text-amber-500 rounded-xl flex items-center justify-center">
                            <Fuel size={18} />
                          </div>
                          <div>
                            <p className="text-xs font-black">Fuel: {entry.amount} KWD</p>
                            <p className="text-[9px] text-neutral-500 uppercase font-bold tracking-widest">{d.name} • {entry.date}</p>
                          </div>
                        </div>
                        <button 
                          onClick={() => handleRecoverFuelEntry(d.id, entry.id)}
                          className="text-[9px] font-black uppercase tracking-widest text-success hover:underline"
                        >
                          Restore Record
                        </button>
                      </div>
                    ))}
                    {/* Duty Logs */}
                    {d.dutyLogs.filter(l => l.companyDeleted && !l.companyPermanentDelete).map(log => (
                      <div key={log.id} className="bg-white/5 border border-white/10 p-5 rounded-2xl flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 bg-blue-500/10 text-blue-500 rounded-xl flex items-center justify-center">
                            <Lock size={18} />
                          </div>
                          <div>
                            <p className="text-xs font-black">Duty: {log.totalHours}h</p>
                            <p className="text-[9px] text-neutral-500 uppercase font-bold tracking-widest">{d.name} • {log.date}</p>
                          </div>
                        </div>
                        <button 
                          onClick={() => handleRecoverDutyLog(d.id, log.id)}
                          className="text-[9px] font-black uppercase tracking-widest text-success hover:underline"
                        >
                          Restore Record
                        </button>
                      </div>
                    ))}
                  </React.Fragment>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeMasterTab === 'archive' && (
          <div className="space-y-10">
            <div className="space-y-2">
              <h2 className="text-2xl font-black uppercase tracking-tight flex items-center gap-3">
                <Shield size={24} className="text-danger" /> Global Master Archive
              </h2>
              <p className="text-xs font-bold text-neutral-500 uppercase tracking-[0.2em]">Master Control Exclusive • Immutable Backup Layer</p>
            </div>

            <div className="bg-danger/5 border border-danger/20 p-6 rounded-3xl space-y-2">
               <p className="text-[11px] font-black text-danger uppercase tracking-widest">Automatic Purge Protocol Active</p>
               <p className="text-[9px] text-neutral-500 uppercase font-bold leading-relaxed">Items below were permanently deleted from the client UI. Master Control retains these for exactly 365 days before cloud-level erasure. Use "Super Restore" to force return items to the active database.</p>
            </div>

            {/* Archived Drivers */}
            <div className="space-y-4">
              <h3 className="text-[10px] font-black uppercase tracking-widest text-neutral-600 px-1">Archived Fleet Units</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {drivers.filter(d => d.companyPermanentDelete && d.role === 'driver').map(driver => (
                  <div key={driver.id} className="bg-black/50 border border-white/5 p-8 rounded-[32px] flex items-center justify-between hover:border-danger/30 transition-all group">
                    <div>
                      <p className="font-black text-xl text-neutral-300 group-hover:text-white transition-colors">{driver.name}</p>
                      <p className="text-[9px] text-neutral-600 uppercase font-black tracking-widest mt-1">Status: Locked in Cloud • Purge Date: {new Date(driver.masterArchiveDate || "").toLocaleDateString()}</p>
                    </div>
                    <button 
                      onClick={() => handleRecoverDriver(driver.id)}
                      className="bg-danger text-white px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-danger/20 hover:scale-[1.05] active:scale-[0.98] transition-all"
                    >
                      Super Restore
                    </button>
                  </div>
                ))}
                {drivers.filter(d => d.companyPermanentDelete && d.role === 'driver').length === 0 && (
                  <div className="col-span-full py-12 bg-white/2 border border-dashed border-white/5 rounded-3xl text-center">
                    <p className="text-[10px] font-black uppercase text-neutral-800 tracking-widest">Master Archive Vault Secure & Empty</p>
                  </div>
                )}
              </div>
            </div>

            {/* Archived Logs */}
            <div className="space-y-4">
              <h3 className="text-[10px] font-black uppercase tracking-widest text-neutral-600 px-1">Cloud Activity Backups</h3>
              <div className="space-y-3">
                {drivers.map(d => (
                  <React.Fragment key={d.id}>
                    {d.fuelEntries.filter(e => e.companyPermanentDelete).map(entry => (
                      <div key={entry.id} className="bg-black/30 border border-white/5 p-6 rounded-2xl flex items-center justify-between group hover:border-danger/20">
                        <div className="flex items-center gap-5">
                          <Fuel size={20} className="text-neutral-700 group-hover:text-danger/50 transition-colors" />
                          <div>
                            <p className="text-sm font-black text-neutral-400 group-hover:text-white transition-colors">Fuel Record {entry.amount} KWD</p>
                            <p className="text-[10px] text-neutral-600 font-bold uppercase tracking-widest">Origin: {d.name} • Reference: {entry.date}</p>
                          </div>
                        </div>
                        <button 
                          onClick={() => handleRecoverFuelEntry(d.id, entry.id)}
                          className="text-[10px] font-black uppercase tracking-widest text-danger hover:underline"
                        >
                          Super Restore
                        </button>
                      </div>
                    ))}
                  </React.Fragment>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeMasterTab === 'no-code-editor' && (
          <div className="max-w-4xl space-y-10 pb-10">
            <div className="space-y-1">
              <h2 className="text-2xl font-black uppercase tracking-tight flex items-center gap-3 text-white">
                <Wrench size={24} className="text-danger" /> No-Code System Configuration
              </h2>
              <p className="text-xs font-bold text-neutral-500 uppercase tracking-[0.2em]">In-App Layout Customizer & Variable Manager</p>
            </div>

            {/* In-App Visual Layout Customization Module */}
            <div className="bg-white/5 border border-white/10 rounded-3xl p-8 space-y-6 text-left">
              <div className="space-y-2">
                <h3 className="text-lg font-black uppercase tracking-tight flex items-center gap-2">
                  🛠️ Visual Layout App-Editor Mode
                </h3>
                <p className="text-xs text-neutral-400">
                  Enable the editor mode to manually rename labels, headers, or quickly configure card visibilities on any live page of the app.
                </p>
              </div>

              <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5">
                <div className="space-y-0.5">
                  <p className="text-xs font-black uppercase">Editor State</p>
                  <p className="text-[10px] text-neutral-500 font-bold uppercase tracking-wider">
                    {localStorage.getItem('no_code_ui_editor_active') === 'true' ? '● RUNNING IN INTERACTIVE MODE' : '● IDLE (USER READ-ONLY)'}
                  </p>
                </div>
                <button
                  onClick={() => {
                    const isCurrentlyOn = localStorage.getItem('no_code_ui_editor_active') === 'true';
                    if (isCurrentlyOn) {
                      localStorage.removeItem('no_code_ui_editor_active');
                      showToast("Visual App-Editor deactivated.");
                    } else {
                      localStorage.setItem('no_code_ui_editor_active', 'true');
                      showToast("🛠️ Visual App-Editor activated! Navigate to make changes.");
                    }
                    window.dispatchEvent(new Event('no-code-config-updated'));
                  }}
                  className={`px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                    localStorage.getItem('no_code_ui_editor_active') === 'true'
                      ? 'bg-rose-600 text-white shadow-lg shadow-rose-600/20'
                      : 'bg-white/10 text-white hover:bg-white/20'
                  }`}
                >
                  {localStorage.getItem('no_code_ui_editor_active') === 'true' ? 'Disable Visual Editor' : 'Enable Visual Editor'}
                </button>
              </div>
            </div>

            {/* Variable Settings Manager (Numerical inputs and config limits) */}
            <div className="bg-white/5 border border-white/10 rounded-3xl p-8 space-y-8 text-left">
              <div className="space-y-1">
                <h3 className="text-lg font-black uppercase tracking-tight flex items-center gap-2">
                  📊 Variable Settings Controls
                </h3>
                <p className="text-xs text-neutral-400">
                  Configure limits, limits budgets, and intervals across the system. These immediately update application calculations.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-neutral-500 pl-1">
                    Universal Fuel Budget Limit (KWD / month)
                  </label>
                  <input
                    type="number"
                    defaultValue={getNoCodeBudgetLimit()}
                    onChange={(e) => {
                      const val = parseFloat(e.target.value);
                      if (!isNaN(val)) {
                        localStorage.setItem('no_code_monthly_budget', val.toString());
                        window.dispatchEvent(new Event('no-code-config-updated'));
                      }
                    }}
                    className="w-full bg-[#141414] border border-white/10 px-4 py-3 rounded-xl font-mono text-sm font-bold text-white focus:ring-2 focus:ring-danger outline-none"
                    placeholder="80.000"
                  />
                  <span className="text-[8px] uppercase tracking-wider text-rose-500 font-extrabold pr-1">Updates splitting threshold instantly</span>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-neutral-500 pl-1">
                    Universal Maintenance Interval Rule (KM)
                  </label>
                  <input
                    type="number"
                    defaultValue={getNoCodeServiceInterval()}
                    onChange={(e) => {
                      const val = parseInt(e.target.value, 10);
                      if (!isNaN(val)) {
                        localStorage.setItem('no_code_service_interval', val.toString());
                        window.dispatchEvent(new Event('no-code-config-updated'));
                      }
                    }}
                    className="w-full bg-[#141414] border border-white/10 px-4 py-3 rounded-xl font-mono text-sm font-bold text-white focus:ring-2 focus:ring-danger outline-none"
                    placeholder="10000"
                  />
                  <span className="text-[8px] uppercase tracking-wider text-rose-500 font-extrabold pr-1">Sets next target for vehicle servicing</span>
                </div>
              </div>
            </div>

            {/* Vehicle Service Category Dropdown configuration Table */}
            <div className="bg-white/5 border border-white/10 rounded-3xl p-8 space-y-6 text-left">
              <div className="space-y-2">
                <h3 className="text-lg font-black uppercase tracking-tight">🛠️ Vehicle Service Categories List</h3>
                <p className="text-xs text-neutral-400">Add, rename, or delete category options in the driver service-logging dropdown sheet.</p>
              </div>

              {/* Add category box */}
              <div className="flex gap-4">
                <input
                  type="text"
                  id="new_service_category_input"
                  className="flex-1 bg-[#141414] border border-white/10 px-4 py-3 rounded-xl font-bold text-sm text-white focus:border-danger outline-none placeholder:text-neutral-600"
                  placeholder="e.g., Battery Changing (பேட்டரி சேஞ்சிங்)"
                />
                <button
                  onClick={() => {
                    const input = document.getElementById("new_service_category_input") as HTMLInputElement;
                    const val = input?.value?.trim();
                    if (val) {
                      const current = getNoCodeServiceCategories();
                      if (!current.includes(val)) {
                        const next = [...current, val];
                        localStorage.setItem('no_code_service_categories', JSON.stringify(next));
                        window.dispatchEvent(new Event('no-code-config-updated'));
                        input.value = "";
                        showToast(`✓ Registered category: ${val}`);
                      } else {
                        showToast("Category option already exists!");
                      }
                    }
                  }}
                  className="bg-danger text-white px-5 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest hover:brightness-110 shadow-lg shadow-danger/10 text-center"
                >
                  Add Option
                </button>
              </div>

              {/* List table */}
              <div className="space-y-3 pt-2 max-h-80 overflow-y-auto no-scrollbar">
                {getNoCodeServiceCategories().map((cat, idx) => (
                  <div key={idx} className="bg-white/5 p-4 rounded-xl flex items-center justify-between border border-white/10">
                    <span className="text-xs font-bold text-white">{cat}</span>
                    <div className="flex gap-3">
                      <button
                        onClick={() => {
                          const updatedName = prompt("Rename category:", cat);
                          if (updatedName && updatedName.trim() !== "") {
                            const current = getNoCodeServiceCategories();
                            const next = current.map(item => item === cat ? updatedName.trim() : item);
                            localStorage.setItem('no_code_service_categories', JSON.stringify(next));
                            window.dispatchEvent(new Event('no-code-config-updated'));
                            showToast("✓ Category renamed successfully!");
                          }
                        }}
                        className="text-[9px] font-black uppercase text-neutral-400 hover:text-white"
                      >
                        Rename
                      </button>
                      <button
                        onClick={() => {
                          const current = getNoCodeServiceCategories();
                          if (current.length <= 1) {
                            showToast("Error: Minimally one service category must remain active!");
                            return;
                          }
                          const next = current.filter(item => item !== cat);
                          localStorage.setItem('no_code_service_categories', JSON.stringify(next));
                          window.dispatchEvent(new Event('no-code-config-updated'));
                          showToast("✓ Category purged.");
                        }}
                        className="text-[9px] font-black uppercase text-rose-500 hover:text-rose-400"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeMasterTab === 'sub-admins' && (
          <div className="max-w-4xl space-y-10 pb-10">
            <div className="space-y-1">
              <h2 className="text-2xl font-black uppercase tracking-tight flex items-center gap-3 text-white">
                <UserCog size={24} className="text-danger" /> Manage Extra Administrators
              </h2>
              <p className="text-xs font-bold text-neutral-500 uppercase tracking-[0.2em]">Provision sub-accounts, specify permissions, and manage roles</p>
            </div>

            {/* Sub-Admin Registration Form */}
            <div className="bg-white/5 border border-white/10 rounded-3xl p-8 space-y-6 text-left">
              <h3 className="text-lg font-black uppercase tracking-tight flex items-center gap-2">
                <UserPlus size={18} className="text-danger" /> Register Corporate Sub-Admin
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-neutral-500 pl-1">Admin Name</label>
                  <input
                    type="text"
                    id="new_subadmin_name"
                    required
                    className="w-full bg-[#141414] border border-white/10 p-4 rounded-xl text-xs font-bold text-white focus:border-danger outline-none placeholder:text-neutral-700"
                    placeholder="Full Corporate Name"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-neutral-500 pl-1">Access Email / ID</label>
                  <input
                    type="email"
                    id="new_subadmin_email"
                    required
                    className="w-full bg-[#141414] border border-white/10 p-4 rounded-xl text-xs font-bold text-white focus:border-danger outline-none placeholder:text-neutral-700"
                    placeholder="e.g. subadmin@fleet.com"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-neutral-500 pl-1">Secure Password</label>
                  <input
                    type="password"
                    id="new_subadmin_password"
                    required
                    className="w-full bg-[#141414] border border-white/10 p-4 rounded-xl text-xs font-bold text-white focus:border-danger outline-none placeholder:text-neutral-700"
                    placeholder="••••••••"
                  />
                </div>
              </div>

              {/* Custom Access Rights Permissions list */}
              <div className="space-y-3 pt-2">
                <p className="text-[10px] font-black uppercase tracking-widest text-neutral-500 pl-1">Custom Access Rights (அனுமதிகள்)</p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {[
                    { id: 'all', label: 'Full Overrides' },
                    { id: 'reports', label: 'Access Reports' },
                    { id: 'drivers', label: 'Manage Drivers' },
                    { id: 'vehicles', label: 'Manage Fleet' }
                  ].map((perm) => (
                    <div key={perm.id} className="flex items-center gap-3 bg-white/5 p-4 rounded-xl border border-white/10">
                      <input
                        type="checkbox"
                        id={`perm_${perm.id}`}
                        name="subadmin_perms"
                        value={perm.id}
                        className="w-4 h-4 text-danger border-white/20 rounded bg-[#141414] focus:ring-danger"
                      />
                      <label htmlFor={`perm_${perm.id}`} className="text-[10px] font-bold text-neutral-300 select-none">
                        {perm.label}
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              <button
                onClick={() => {
                  const nameEl = document.getElementById("new_subadmin_name") as HTMLInputElement;
                  const emailEl = document.getElementById("new_subadmin_email") as HTMLInputElement;
                  const passEl = document.getElementById("new_subadmin_password") as HTMLInputElement;

                  const name = nameEl?.value?.trim();
                  const email = emailEl?.value?.trim().toLowerCase();
                  const password = passEl?.value?.trim();

                  if (!name || !email || !password) {
                    showToast("Please fill in Name, Email and Password!");
                    return;
                  }

                  // Gather checked permissions
                  const checks = document.getElementsByName("subadmin_perms");
                  const permissions: string[] = [];
                  checks.forEach((chk: any) => {
                    if (chk.checked) {
                      permissions.push(chk.value);
                    }
                  });

                  // Add to roster
                  const saved = localStorage.getItem('no_code_sub_admins');
                  const admins: any[] = saved ? JSON.parse(saved) : [];

                  if (admins.some(a => a.email === email)) {
                    showToast("Sub-Admin with this Email already exists!");
                    return;
                  }

                  const newAdmin = {
                    id: Math.random().toString(36).substr(2, 9),
                    name,
                    email,
                    password,
                    permissions: permissions.length > 0 ? permissions : ['reports']
                  };

                  const nextAdmins = [...admins, newAdmin];
                  localStorage.setItem('no_code_sub_admins', JSON.stringify(nextAdmins));
                  window.dispatchEvent(new Event('no-code-config-updated'));

                  // Reset UI
                  nameEl.value = "";
                  emailEl.value = "";
                  passEl.value = "";
                  checks.forEach((chk: any) => { chk.checked = false; });

                  showToast(`✓ Registered sub-admin: ${name}`);
                }}
                className="w-full bg-danger text-white py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-danger/20 hover:scale-[1.01] active:scale-[0.99] transition-all text-center"
              >
                Create Account
              </button>
            </div>

            {/* Sub-Admin Active Roster Table */}
            <div className="bg-white/5 border border-white/10 rounded-3xl p-8 space-y-6 text-left">
              <h3 className="text-lg font-black uppercase tracking-tight flex items-center gap-2">
                📋 Active Administrative Roster
              </h3>

              {/* Table / List */}
              <div className="space-y-4">
                {(() => {
                  const saved = localStorage.getItem('no_code_sub_admins');
                  const admins: any[] = saved ? JSON.parse(saved) : [];

                  if (admins.length === 0) {
                    return (
                      <p className="text-sm font-bold text-neutral-500 uppercase tracking-widest py-8 text-center bg-white/5 rounded-2xl border border-dashed border-white/10">
                        No sub-administrators provisioned yet.
                      </p>
                    );
                  }

                  return admins.map((admin) => (
                    <div key={admin.id} className="bg-white/5 border border-white/10 p-6 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="space-y-2">
                        <div>
                          <p className="text-sm font-black text-white">{admin.name}</p>
                          <p className="text-[10px] font-bold text-neutral-450 font-mono">{admin.email} • Pass: {admin.password}</p>
                        </div>
                        <div className="flex flex-wrap gap-2 pt-1">
                          {admin.permissions.map((p: string, pIdx: number) => (
                            <span 
                              key={pIdx} 
                              className={`text-[8px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full ${
                                p === 'all' ? 'bg-rose-500/10 text-rose-400 border border-rose-500/10' :
                                p === 'drivers' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/10' :
                                p === 'vehicles' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/10' :
                                'bg-amber-500/10 text-amber-400 border border-amber-500/10'
                              }`}
                            >
                              {p === 'all' ? 'Full Overrides' :
                               p === 'drivers' ? 'Manage Drivers' :
                               p === 'vehicles' ? 'Manage Fleet' : 'Access Reports'}
                            </span>
                          ))}
                        </div>
                      </div>

                      <div className="flex gap-3">
                        <button
                          onClick={() => {
                            const newRights = prompt("Update permissions (comma separated, e.g. drivers,reports,vehicles):", admin.permissions.join(","));
                            if (newRights !== null) {
                              const list = newRights.split(",").map(i => i.trim()).filter(i => i !== "");
                              const next = admins.map(a => a.id === admin.id ? { ...a, permissions: list.length > 0 ? list : ['reports'] } : a);
                              localStorage.setItem('no_code_sub_admins', JSON.stringify(next));
                              window.dispatchEvent(new Event('no-code-config-updated'));
                              showToast("✓ Admin access rights modified successfully!");
                            }
                          }}
                          className="bg-white/5 text-xs text-white px-4 py-2.5 rounded-xl border border-white/10 hover:bg-white/1 hover:text-white transition-colors"
                        >
                          Modify Rights
                        </button>
                        <button
                          onClick={() => {
                            if (confirm(`Revoke all management access for ${admin.name}?`)) {
                              const next = admins.filter(a => a.id !== admin.id);
                              localStorage.setItem('no_code_sub_admins', JSON.stringify(next));
                              window.dispatchEvent(new Event('no-code-config-updated'));
                              showToast(`✕ Revoked privileges for ${admin.name}.`);
                            }
                          }}
                          className="bg-rose-500/10 text-xs text-rose-500 px-4 py-2.5 rounded-xl border border-rose-500/20 hover:bg-rose-500/20 transition-colors animate-pulse"
                        >
                          Revoke Access
                        </button>
                      </div>
                    </div>
                  ));
                })()}
              </div>
            </div>
          </div>
        )}

        {activeMasterTab === 'settings' && (
          <div className="max-w-2xl space-y-8 pb-10">
            <div className="space-y-1">
              <h2 className="text-2xl font-black uppercase tracking-tight">Global Overrides</h2>
              <p className="text-xs font-bold text-neutral-500 uppercase tracking-[0.2em]">Direct Company Branding Engine</p>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-3xl p-8 space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-neutral-500 pl-1">Target Company Name</label>
                <input 
                  type="text" 
                  value={tempCompany.name}
                  onChange={e => setTempCompany(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full bg-[#1a1a1a] border border-white/10 p-4 rounded-xl font-bold focus:ring-2 focus:ring-danger outline-none"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-neutral-500 pl-1">Global Tagline/Subtitle</label>
                <input 
                  type="text" 
                  value={tempCompany.tagline}
                  onChange={e => setTempCompany(prev => ({ ...prev, tagline: e.target.value }))}
                  className="w-full bg-[#1a1a1a] border border-white/10 p-4 rounded-xl font-bold focus:ring-2 focus:ring-danger outline-none"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-neutral-500 pl-1">Logo Asset URL</label>
                <input 
                  type="text" 
                  value={tempCompany.logo}
                  onChange={e => setTempCompany(prev => ({ ...prev, logo: e.target.value }))}
                  className="w-full bg-[#1a1a1a] border border-white/10 p-4 rounded-xl font-bold focus:ring-2 focus:ring-danger outline-none"
                />
              </div>

              <button 
                onClick={handleSaveCompany}
                className="w-full bg-danger text-white py-5 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-danger/20 hover:scale-[1.01] active:scale-[0.99] transition-all"
              >
                Force Global Update
              </button>
            </div>

            <div className="bg-danger/10 border border-danger/20 rounded-3xl p-8 space-y-4">
              <div className="flex items-center gap-3 text-danger">
                <Shield size={20} />
                <h3 className="font-black uppercase tracking-tight">Danger Zone</h3>
              </div>
              <p className="text-xs text-danger/80">These actions are destructive and cannot be undone. Master Authorization is active.</p>
              <div className="flex gap-4">
                <button className="flex-1 bg-danger/20 text-danger border border-danger/30 py-4 rounded-xl text-[10px] font-black uppercase tracking-widest">
                  Reset Fleet Log
                </button>
                <button className="flex-1 bg-danger/20 text-danger border border-danger/30 py-4 rounded-xl text-[10px] font-black uppercase tracking-widest">
                  Purge Client Data
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Editing Modal/Overlay */}
      <AnimatePresence>
        {editingObj && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[300] bg-black/80 backdrop-blur-xl flex items-center justify-center p-6"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
              className="w-full max-w-xl bg-[#111111] border border-white/10 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
            >
              <div className="p-6 md:p-8 border-b border-white/5 flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-black uppercase tracking-tight">
                    {editingObj.type === 'driver' ? 'Edit Driver Profile' : 'Configure Vehicle'}
                  </h2>
                  <p className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest">Overriding UID: {editingObj.id}</p>
                </div>
                <button onClick={() => setEditingObj(null)} className="p-2 hover:bg-white/5 rounded-lg">
                  <Plus size={24} className="rotate-45" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-8 space-y-6">
                {editingObj.type === 'driver' && (
                  <>
                    <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-neutral-500 pl-1">Name</label>
                        <input className="w-full bg-white/5 p-4 rounded-xl outline-none border border-white/5 focus:border-danger font-bold" value={tempDriver.name} onChange={e => setTempDriver(p => ({...p, name: e.target.value})) } />
                    </div>
                    <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-neutral-500 pl-1">Email / Username</label>
                        <input className="w-full bg-white/5 p-4 rounded-xl outline-none border border-white/5 focus:border-danger font-bold" value={tempDriver.email} onChange={e => setTempDriver(p => ({...p, email: e.target.value})) } />
                    </div>
                    <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-neutral-500 pl-1">NFC Identity ID</label>
                        <input className="w-full bg-white/5 p-4 rounded-xl outline-none border border-white/5 focus:border-danger font-bold" value={tempDriver.nfcId} onChange={e => setTempDriver(p => ({...p, nfcId: e.target.value})) } />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-neutral-500 pl-1">Account Status</label>
                            <select className="w-full bg-white/5 p-4 rounded-xl outline-none border border-white/5 focus:border-danger font-bold text-white" value={tempDriver.status} onChange={e => setTempDriver(p => ({...p, status: e.target.value as any})) }>
                                <option value="active" className="bg-[#111]">Active</option>
                                <option value="warning" className="bg-[#111]">Warning</option>
                                <option value="suspended" className="bg-[#111]">Suspended</option>
                            </select>
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-neutral-500 pl-1">Role</label>
                            <select className="w-full bg-white/5 p-4 rounded-xl outline-none border border-white/5 focus:border-danger font-bold text-white" value={tempDriver.role} onChange={e => setTempDriver(p => ({...p, role: e.target.value as any})) }>
                                <option value="driver" className="bg-[#111]">Driver</option>
                                <option value="admin" className="bg-[#111]">Admin</option>
                            </select>
                        </div>
                    </div>
                  </>
                )}

                {editingObj.type === 'vehicle' && (
                  <>
                    <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-neutral-500 pl-1">Vehicle Name / ID</label>
                        <input className="w-full bg-white/5 p-4 rounded-xl outline-none border border-white/5 focus:border-danger font-bold" value={tempDriver.vehicle} onChange={e => setTempDriver(p => ({...p, vehicle: e.target.value})) } />
                    </div>
                    <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-neutral-500 pl-1">Current Odometer (KM)</label>
                        <input className="w-full bg-white/5 p-4 rounded-xl outline-none border border-white/5 focus:border-danger font-bold" type="number" value={tempDriver.odometer} onChange={e => setTempDriver(p => ({...p, odometer: parseInt(e.target.value)})) } />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-neutral-500 pl-1">Last Service KM</label>
                            <input className="w-full bg-white/5 p-4 rounded-xl outline-none border border-white/5 focus:border-danger font-bold" type="number" value={tempDriver.maintenance?.lastServiceKm} 
                                onChange={e => setTempDriver(p => ({...p, maintenance: { ...(p.maintenance as any), lastServiceKm: parseInt(e.target.value) }})) } />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-neutral-500 pl-1">Next Service KM</label>
                            <input className="w-full bg-white/5 p-4 rounded-xl outline-none border border-white/5 focus:border-danger font-bold" type="number" value={tempDriver.maintenance?.nextServiceKm} 
                                onChange={e => setTempDriver(p => ({...p, maintenance: { ...(p.maintenance as any), nextServiceKm: parseInt(e.target.value) }})) } />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-neutral-500 pl-1">Primary Driver ID Assignment</label>
                        <input className="w-full bg-white/5 p-4 rounded-xl outline-none border border-white/5 focus:border-danger font-bold" value={tempDriver.id} readOnly opacity-50 />
                    </div>
                  </>
                )}
              </div>

              <div className="p-8 border-t border-white/5 bg-[#1a1a1a] flex gap-4">
                <button 
                  onClick={() => setEditingObj(null)}
                  className="flex-1 py-4 text-[10px] font-black uppercase tracking-widest text-neutral-500 hover:bg-white/5 rounded-2xl transition-colors"
                >
                  Discard Changes
                </button>
                <button 
                  onClick={editingObj.type === 'driver' ? handleSaveDriver : handleSaveVehicle}
                  className="flex-[2] bg-danger text-white py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-danger/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
                >
                  Save Override
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

