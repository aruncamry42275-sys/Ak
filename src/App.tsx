/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, ReactNode } from 'react';
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
  Wrench
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

type View = 'login' | 'role-select' | 'dashboard' | 'fleet-overview' | 'vehicle' | 'fuel' | 'driver-details';
type UserRole = 'admin' | 'driver';

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
}

interface FuelEntry {
  id: string;
  date: string;
  prevOdo: number;
  currOdo: number;
  distance: number;
  amount: number;
  efficiency: number; // KM/KWD
}

interface ServiceRecord {
  id: string;
  date: string;
  km: number;
  cost: number;
  type: string;
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
  currentSession: {
    active: boolean;
    startId: string | null;
    startTime: string | null;
    startLocation?: Location;
  };
}

export default function App() {
  const [currentView, setCurrentView] = useState<View>('login');
  
  const [drivers, setDrivers] = useState<DriverStat[]>([
    { 
      id: '1', 
      name: "AK", 
      email: "Arun965560@gmail.com", 
      vehicle: "Toyota Fortuner", 
      role: 'admin', 
      odometer: 15420, 
      fuelBalance: 95.0, 
      status: 'active',
      dailyTrip: { startKm: null, currentKm: null, endKm: null, active: false },
      trips: [],
      dutyLogs: [],
      fuelEntries: [],
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
      dailyTrip: { startKm: 12050, currentKm: 12100, endKm: null, active: true },
      trips: [],
      dutyLogs: [],
      fuelEntries: [],
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
      currentSession: { active: false, startId: null, startTime: null }
    },
    { 
      id: '3', 
      name: "Driver_3", 
      email: "driver3@example.com", 
      vehicle: "Mistubishi Pajero", 
      role: 'driver', 
      odometer: 8500, 
      fuelBalance: 120.0, 
      status: 'active',
      dailyTrip: { startKm: null, currentKm: null, endKm: null, active: false },
      trips: [],
      dutyLogs: [],
      fuelEntries: [],
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
      currentSession: { active: false, startId: null, startTime: null }
    },
  ]);

  const [adminAuth, setAdminAuth] = useState({ username: 'Arun965560@gmail.com', password: 'Arun965560@gmail.com' });
  const [hourlyRate, setHourlyRate] = useState(5.0); // Default hourly rate
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false);
  const [showAdminAuthModal, setShowAdminAuthModal] = useState(false);
  const [showNfcScanner, setShowNfcScanner] = useState(false);

  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const currentUser = drivers.find(d => d.id === currentUserId) || null;
  const userRole = currentUser?.role || 'driver';

  const [selectedDriverId, setSelectedDriverId] = useState<string | null>(null);

  const [toast, setToast] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const handleUpdateFuel = (amount: number, newOdo: number) => {
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

  const handleLogService = (userId: string, service: Omit<ServiceRecord, 'id'>) => {
    setDrivers(prev => prev.map(d => {
      if (d.id === userId) {
        const newRecord: ServiceRecord = {
          ...service,
          id: Math.random().toString(36).substring(7)
        };
        const nextKm = (service.km || d.odometer) + 5000; // Auto calculate next service at 5k interval
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

  const handleNewDriver = (name: string, vehicle: string, role: UserRole) => {
    const newId = (Math.max(...drivers.map(d => parseInt(d.id))) + 1).toString();
    const newDriver: DriverStat = {
      id: newId,
      name,
      email: `${name.toLowerCase()}@logistics.kw`,
      vehicle,
      role,
      odometer: 0,
      fuelBalance: 50.0,
      status: 'active',
      dailyTrip: { startKm: null, currentKm: null, endKm: null, active: false },
      trips: [],
      dutyLogs: [],
      fuelEntries: [],
      maintenance: {
        lastServiceDate: null,
        lastServiceKm: null,
        nextServiceKm: 5000,
        nextServiceDate: null,
        serviceHistory: []
      },
      nfcId: `NFC-${name.substring(0, 2).toUpperCase()}-${newId}`,
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
    setDrivers(prev => prev.filter(d => d.id !== id));
    showToast("Driver account deleted");
  };

  const renderView = () => {
    switch (currentView) {
      case 'login':
        return (
          <LoginPage 
            onLogin={() => setCurrentView('role-select')} 
          />
        );
      case 'role-select':
        return (
          <RoleSelectionPage 
            drivers={drivers}
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
          />
        ) : null;
      case 'fuel':
        return currentUser ? (
          <FuelLog 
            onBack={() => setCurrentView('dashboard')} 
            fuelBalance={currentUser.fuelBalance} 
            odometer={currentUser.odometer}
            onUpdateFuel={handleUpdateFuel}
          />
        ) : null;
      case 'fleet-overview':
        return (
          <FleetOverview 
            onBack={() => setCurrentView('dashboard')} 
            drivers={drivers} 
            adminAuth={adminAuth}
            setAdminAuth={setAdminAuth}
            hourlyRate={hourlyRate}
            setHourlyRate={setHourlyRate}
            onSaveDriver={(id, updates) => {
              if (id) handleEditDriver(id, updates);
              else handleNewDriver(updates.name!, updates.vehicle!, updates.role!);
            }}
            onDeleteDriver={handleDeleteDriver}
            onSelectDriver={(id) => {
              setSelectedDriverId(id);
              setCurrentView('driver-details');
            }}
            onResetDay={handleResetDay}
            showToast={showToast}
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
          />
        ) : null;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-[#F8F9FA] text-ink font-sans selection:bg-accent/10 flex flex-col items-center overflow-x-hidden">
      <div className="w-full max-w-xl min-h-screen flex flex-col relative">
        <AnimatePresence mode="wait">
          {renderView()}
        </AnimatePresence>

        {/* Admin Authentication Modal */}
        <AnimatePresence>
          {showAdminAuthModal && (
            <AdminAuthModal 
              adminAuth={adminAuth}
              onSuccess={() => {
                setIsAdminAuthenticated(true);
                setShowAdminAuthModal(false);
                setCurrentView('fleet-overview');
              }}
              onClose={() => setShowAdminAuthModal(false)}
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
function LoginPage({ onLogin }: { onLogin: () => void }) {
  return (
    <motion.div
      key="login"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="flex-1 flex flex-col items-center justify-center p-8 space-y-12 bg-white"
    >
      <div className="text-center space-y-4">
        <div className="w-20 h-20 bg-ink rounded-3xl mx-auto flex items-center justify-center shadow-xl shadow-ink/10">
          <Car size={40} className="text-white" />
        </div>
        <div className="space-y-1">
          <h1 className="text-4xl font-black uppercase tracking-tighter">Kuwait Logistics</h1>
          <p className="text-[11px] font-bold text-neutral-400 uppercase tracking-[0.2em]">Enterprise Fleet Hub</p>
        </div>
      </div>

      <div className="w-full space-y-4">
        <button 
          onClick={onLogin}
          className="w-full bg-blue-600 text-white py-6 rounded-2xl font-black text-[12px] uppercase tracking-[0.15em] flex items-center justify-center gap-3 hover:bg-blue-700 active:scale-[0.98] transition-all shadow-xl shadow-blue-600/10"
        >
          <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" className="w-5 h-5" alt="G" />
          Login with Google
        </button>
        <p className="text-[10px] text-center text-neutral-400 font-bold uppercase tracking-widest">
          Secure enterprise authentication
        </p>
      </div>
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
  setShowNfcScanner
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
  setShowNfcScanner: (v: boolean) => void
}) {
  const [activeTab, setActiveTab] = useState<'overview' | 'profile'>('overview');

  const handleAdminClick = () => {
    if (isAdminAuthenticated) {
      onNavigate('fleet-overview');
    } else {
      setShowAdminAuthModal(true);
    }
  };

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
          <motion.div 
            key="overview"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-10 flex-1"
          >
            <div className="bg-white p-6 rounded-2xl border border-neutral-200 shadow-sm flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-[11px] font-bold text-neutral-400 uppercase tracking-widest">Assigned Unit</p>
                <p className="text-2xl font-black tracking-tight">{carModel}</p>
              </div>
              <Car size={32} className="text-neutral-100" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <button 
                onClick={() => onNavigate('fuel')}
                className="text-left border-b-[6px] border-danger pb-4 space-y-1 hover:bg-danger/2 transition-colors p-2"
              >
                <p className="text-[12px] font-bold text-neutral-400 uppercase tracking-[0.1em]">Remaining Fuel</p>
                <div className="flex items-baseline gap-2">
                  <span className="text-6xl md:text-7xl font-black tracking-tighter">{fuelBalance.toFixed(1)}</span>
                  <span className="text-2xl font-bold text-neutral-200 italic">KWD</span>
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

            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 pt-10">
              <ActionButton icon={<Nfc size={28} />} label="NFC Scan" onClick={() => showToast("Scanning...")} />
              <ActionButton icon={<Fuel size={28} />} label="Fuel Log" onClick={() => onNavigate('fuel')} />
              <ActionButton icon={<Milestone size={28} />} label="Odometer" onClick={() => onNavigate('vehicle')} />
            </div>

            {/* Duty Section */}
            <div className="bg-white border-2 border-neutral-100 rounded-3xl p-8 space-y-6">
              <div className="flex justify-between items-center">
                <div className="space-y-1">
                  <p className="text-[10px] font-black uppercase text-neutral-400 tracking-widest">Attendance Status</p>
                  <p className={`text-xl font-black uppercase ${currentSession.active ? 'text-success' : 'text-neutral-300'}`}>
                    {currentSession.active ? 'On Duty' : 'Off Duty'}
                  </p>
                </div>
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${currentSession.active ? 'bg-success text-white shadow-lg shadow-success/20' : 'bg-neutral-100 text-neutral-300'}`}>
                  <User size={24} />
                </div>
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
                    Start Duty
                  </button>
                ) : (
                  <button 
                    onClick={onEndDuty}
                    className="flex-1 bg-danger text-white py-5 rounded-2xl font-black text-[12px] uppercase tracking-[0.2em] shadow-xl shadow-danger/20 hover:brightness-110 active:scale-95 transition-all"
                  >
                    End Duty
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div 
            key="profile"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-8 flex-1"
          >
            <div className="bg-white border border-neutral-200 rounded-2xl overflow-hidden">
              <div className="h-32 bg-ink flex items-center justify-center">
                <div className="w-20 h-20 rounded-full bg-white flex items-center justify-center font-black text-2xl text-ink border-4 border-white translate-y-10 shadow-lg">
                  {driverName.substring(0, 2).toUpperCase()}
                </div>
              </div>
              <div className="pt-16 pb-8 px-8 text-center space-y-2">
                <h2 className="text-2xl font-black">{driverName}</h2>
                <p className="text-[11px] font-bold text-neutral-400 uppercase tracking-[0.2em]">{userRole} · Kuwait Logistics Fleet</p>
              </div>
              <div className="px-8 pb-8 space-y-4">
                <div className="flex justify-between items-center py-4 border-b border-neutral-50">
                  <span className="text-[11px] font-bold uppercase text-neutral-300">Email Address</span>
                  <span className="font-bold text-sm">active@logistics.kw</span>
                </div>
                <div className="flex justify-between items-center py-4 border-b border-neutral-50">
                  <span className="text-[11px] font-bold uppercase text-neutral-300">Staff ID</span>
                  <span className="font-bold text-sm">#KW-LOG-882</span>
                </div>
              </div>
            </div>
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
  maintenance
}: { 
  onBack: () => void, 
  odometer: number, 
  dailyTrip: DailyTrip,
  onUpdateKM: (km: number) => void, 
  onStartTrip: (km: number) => void,
  onEndTrip: (km: number) => void,
  carModel: string,
  maintenance: MaintenanceInfo
}) {
  const [inputValue, setInputValue] = useState<string>(odometer.toString());

  const kmSinceService = maintenance.lastServiceKm !== null ? odometer - maintenance.lastServiceKm : odometer;
  const isOverdue = kmSinceService >= 5000;
  const isNearService = kmSinceService >= 4000;

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
        <h1 className="text-3xl font-black uppercase tracking-tight">Trip Management</h1>
      </header>

      <div className="space-y-6">
        {/* Maintenance Indicator */}
        <div className={`p-6 rounded-3xl border-2 flex items-center justify-between ${isOverdue ? 'bg-danger/5 border-danger/20' : 'bg-white border-neutral-100 shadow-sm'}`}>
          <div className="space-y-1">
            <p className="text-[10px] font-black uppercase text-neutral-400 tracking-widest">Maintenance Status</p>
            <p className={`text-lg font-black uppercase ${isOverdue ? 'text-danger' : isNearService ? 'text-amber-500' : 'text-ink'}`}>
              {isOverdue ? 'Immediate Service Required' : isNearService ? 'Service Due Soon' : 'All Systems Nominal'}
            </p>
            <p className="text-[9px] font-bold text-neutral-300 uppercase tracking-widest">{kmSinceService.toLocaleString()} KM since last checkup</p>
          </div>
          <motion.div 
            animate={isOverdue ? { scale: [1, 1.2, 1], opacity: [1, 0.5, 1] } : {}}
            transition={{ repeat: Infinity, duration: 1 }}
            className={`w-10 h-10 rounded-full flex items-center justify-center ${isOverdue ? 'text-danger' : 'text-neutral-200'}`}
          >
            <Wrench size={24} />
          </motion.div>
        </div>

        {/* Status Card */}
        <div className={`p-6 rounded-2xl border-2 transition-all ${dailyTrip.active ? 'bg-success/5 border-success/20' : 'bg-neutral-50 border-neutral-200'}`}>
          <div className="flex justify-between items-center mb-6">
            <div className="space-y-1">
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
            <div className="space-y-1">
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
                  className="col-span-2 bg-ink text-white py-6 rounded-2xl font-black text-[12px] uppercase tracking-[0.2em] shadow-xl shadow-ink/20 hover:brightness-110 active:scale-95 transition-all"
                >
                  Confirm Start KM
                </button>
              ) : (
                <>
                  <button 
                    onClick={() => onUpdateKM(parseInt(inputValue))}
                    className="bg-accent text-white py-6 rounded-xl font-black text-[10px] uppercase tracking-widest hover:brightness-110 active:scale-95 transition-all"
                  >
                    Update Current
                  </button>
                  <button 
                    onClick={() => onEndTrip(parseInt(inputValue))}
                    className="bg-danger text-white py-6 rounded-xl font-black text-[10px] uppercase tracking-widest hover:brightness-110 active:scale-95 transition-all shadow-xl shadow-danger/20"
                  >
                    End Shift
                  </button>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Info Grid */}
        <div className="grid grid-cols-2 gap-4">
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
            <div className="space-y-1">
              <p className="text-[10px] font-black text-white/40 uppercase tracking-widest">Start KM registered at</p>
              <p className="text-lg font-black">{dailyTrip.startKm.toLocaleString()} KM</p>
            </div>
            <div className="text-right">
              <p className="text-[10px] font-black text-white/40 uppercase tracking-widest">Current Session</p>
              <p className="text-lg font-black text-success">Active</p>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}

// --- Fuel Log Screen ---
function FuelLog({ 
  onBack, 
  fuelBalance, 
  odometer,
  onUpdateFuel 
}: { 
  onBack: () => void, 
  fuelBalance: number, 
  odometer: number,
  onUpdateFuel: (amount: number, newOdo: number) => void 
}) {
  const [fuelInput, setFuelInput] = useState<string>('');
  const [odoInput, setOdoInput] = useState<string>(odometer.toString());

  const fuelAmount = parseFloat(fuelInput) || 0;
  const currentOdo = parseInt(odoInput) || odometer;
  const distance = Math.max(0, currentOdo - odometer);
  const efficiency = distance > 0 && fuelAmount > 0 ? (distance / fuelAmount).toFixed(2) : '0.00';

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
        {/* Balance Card */}
        <div className="bg-danger/10 border border-danger/20 p-6 rounded-3xl flex justify-between items-center">
          <div className="space-y-1">
            <p className="text-[10px] font-black uppercase tracking-widest text-danger">Current Card Balance</p>
            <p className="text-3xl font-black text-danger">{fuelBalance.toFixed(2)} KWD</p>
          </div>
          <Fuel size={32} className="text-danger/20" />
        </div>

        {/* Form */}
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase tracking-widest text-neutral-400 pl-1">Prev Odometer Reading</label>
              <div className="bg-neutral-100 border border-neutral-200 p-4 rounded-xl text-lg font-black text-neutral-400">
                {odometer.toLocaleString()} KM
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase tracking-widest text-neutral-400 pl-1">New Odometer Reading</label>
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
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-black uppercase tracking-widest text-neutral-400 pl-1">Fuel Amount (Refilled)</label>
            <div className="relative">
              <input 
                type="number"
                step="0.01"
                value={fuelInput}
                onChange={(e) => setFuelInput(e.target.value)}
                className="w-full bg-white border border-neutral-200 p-6 rounded-2xl text-4xl font-black focus:ring-4 focus:ring-accent/10 outline-none transition-all"
                placeholder="0.00"
              />
              <span className="absolute right-6 top-1/2 -translate-y-1/2 text-neutral-300 font-bold">KWD</span>
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
          onClick={() => onUpdateFuel(fuelAmount, currentOdo)}
          disabled={!fuelInput || !odoInput || currentOdo < odometer}
          className="w-full bg-ink text-white py-6 rounded-2xl font-black text-[12px] uppercase tracking-[0.15em] hover:scale-[1.02] active:scale-[0.98] transition-all shadow-xl shadow-ink/20 disabled:opacity-50 disabled:grayscale disabled:hover:scale-100"
        >
          {currentOdo < odometer ? "Error: Check Odometer" : `Save & Update Records (+${fuelAmount} KWD)`}
        </button>

        <div className="bg-neutral-50 p-6 rounded-2xl border border-neutral-100 italic text-[11px] text-neutral-400">
          Privacy Notice: Fuel records are locked to your profile. Administrators can view metrics but cannot modify entries.
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
  onSelectDriver,
  onResetDay,
  showToast 
}: { 
  onBack: () => void, 
  drivers: DriverStat[], 
  adminAuth: { username: string, password: string },
  setAdminAuth: (v: { username: string, password: string }) => void,
  hourlyRate: number,
  setHourlyRate: (v: number) => void,
  onSaveDriver: (id: string | null, updates: Partial<DriverStat>) => void,
  onDeleteDriver: (id: string) => void,
  onSelectDriver: (id: string) => void,
  onResetDay: () => void,
  showToast: (m: string) => void
}) {
  const [editingDriver, setEditingDriver] = useState<DriverStat | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState({ name: '', vehicle: '', role: 'driver' as UserRole });
  const [activeTab, setActiveTab] = useState<'users' | 'vehicles' | 'daily' | 'settings'>('users');
  const [showSettings, setShowSettings] = useState(false);

  const [authFormData, setAuthFormData] = useState({ ...adminAuth });

  const handleSave = () => {
    if (!formData.name || !formData.vehicle) {
      showToast("Please fill in all fields");
      return;
    }
    onSaveDriver(editingDriver ? editingDriver.id : null, formData);
    setEditingDriver(null);
    setShowAddForm(false);
    setFormData({ name: '', vehicle: '', role: 'driver' });
  };

  const startEdit = (driver: DriverStat) => {
    setEditingDriver(driver);
    setFormData({ name: driver.name, vehicle: driver.vehicle, role: driver.role });
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
          className="bg-white border border-neutral-200 rounded-2xl p-8 space-y-6 shadow-sm"
        >
          <div className="space-y-2">
            <h2 className="text-xl font-bold">{editingDriver ? 'Edit Profile' : 'Register New Unit'}</h2>
            <p className="text-[11px] font-bold text-neutral-400 uppercase tracking-widest">Fleet Configuration</p>
          </div>

          <div className="space-y-4">
            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase tracking-widest text-neutral-400 pl-1">Full Name</label>
              <input 
                type="text" 
                value={formData.name}
                onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="e.g. John Doe"
                className="w-full bg-neutral-50 border border-neutral-200 p-4 rounded-xl focus:ring-2 focus:ring-accent outline-none font-bold"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase tracking-widest text-neutral-400 pl-1">Assigned Vehicle</label>
              <input 
                type="text" 
                value={formData.vehicle}
                onChange={e => setFormData(prev => ({ ...prev, vehicle: e.target.value }))}
                placeholder="e.g. Toyota Fortuner"
                className="w-full bg-neutral-50 border border-neutral-200 p-4 rounded-xl focus:ring-2 focus:ring-accent outline-none font-bold"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase tracking-widest text-neutral-400 pl-1">Access Role</label>
              <select 
                value={formData.role}
                onChange={e => setFormData(prev => ({ ...prev, role: e.target.value as UserRole }))}
                className="w-full bg-neutral-50 border border-neutral-200 p-4 rounded-xl focus:ring-2 focus:ring-accent outline-none appearance-none font-bold"
              >
                <option value="driver">Driver (Limited Access)</option>
                <option value="admin">Administrator (Fleet Control)</option>
              </select>
            </div>
          </div>

          <div className="flex gap-4 pt-4">
            <button 
              onClick={() => { setShowAddForm(false); setEditingDriver(null); }}
              className="flex-1 py-4 font-black text-[11px] uppercase tracking-widest text-neutral-400 hover:bg-neutral-50 rounded-xl transition-colors"
            >
              Back
            </button>
            <button 
              onClick={handleSave}
              className="flex-1 bg-ink text-white py-4 font-black text-[11px] uppercase tracking-widest rounded-xl hover:brightness-110 transition-all"
            >
              Confirm
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
              onClick={() => setActiveTab('settings')}
              className={`text-[11px] font-black uppercase tracking-widest pb-3 border-b-2 transition-all whitespace-nowrap ${activeTab === 'settings' ? 'border-ink text-ink' : 'border-transparent text-neutral-300'}`}
            >
              Security Settings
            </button>
          </div>

          <div className="space-y-4">
            {activeTab === 'users' ? (
              drivers.map((driver) => (
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
              drivers.map((driver) => {
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
                onClick={() => { setShowAddForm(true); setEditingDriver(null); setFormData({ name: '', vehicle: '', role: 'driver' }); }}
                className="w-full bg-white border border-ink py-5 rounded-xl font-black text-[12px] uppercase tracking-[0.15em] hover:bg-neutral-50 transition-all flex items-center justify-center gap-2"
              >
                <Plus size={16} /> Add Driver / Unit
              </button>
              <button 
                onClick={() => showToast("Generating Analytics...")}
                className="w-full bg-ink text-white py-5 rounded-xl font-black text-[12px] uppercase tracking-[0.15em] hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2"
              >
                <Download size={16} /> Fleet Report
              </button>
            </div>
          )}
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
  onLogService
}: { 
  driver: DriverStat, 
  onBack: () => void,
  hourlyRate: number,
  onLogService: (id: string, service: Omit<ServiceRecord, 'id'>) => void
}) {
  const [activeTab, setActiveTab] = useState<'overview' | 'attendance' | 'maintenance'>('overview');
  const [showServiceForm, setShowServiceForm] = useState(false);
  const [serviceFormData, setServiceFormData] = useState({ date: new Date().toISOString().split('T')[0], km: driver.odometer, cost: 0, type: 'Routine Maintenance' });

  const totalRegularHours = driver.dutyLogs.reduce((acc, log) => acc + log.regularHours, 0);
  const totalOTHours = driver.dutyLogs.reduce((acc, log) => acc + log.otHours, 0);
  const totalHours = totalRegularHours + totalOTHours;
  const daysWorked = driver.dutyLogs.length;

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
                {driver.fuelEntries.map(entry => (
                  <div key={entry.id} className="bg-white border border-neutral-200 p-5 rounded-2xl space-y-3 shadow-sm">
                    <div className="flex justify-between items-start">
                      <p className="font-black text-sm">{entry.date}</p>
                      <div className="bg-accent/10 text-accent px-2 py-1 rounded text-[8px] font-black tracking-widest uppercase">
                        {entry.efficiency} KM/KWD
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-2 py-2 border-y border-neutral-50">
                      <div>
                        <p className="text-[8px] font-bold text-neutral-300 uppercase">Distance</p>
                        <p className="font-black text-xs">{entry.distance} KM</p>
                      </div>
                      <div>
                        <p className="text-[8px] font-bold text-neutral-300 uppercase">Amount</p>
                        <p className="font-black text-xs">{entry.amount} KWD</p>
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
                {driver.maintenance.serviceHistory.map(record => (
                  <div key={record.id} className="bg-white border border-neutral-200 p-6 rounded-2xl flex justify-between items-center shadow-sm">
                    <div className="space-y-1">
                      <p className="font-extrabold text-sm">{record.type}</p>
                      <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">{record.date} • {record.km.toLocaleString()} KM</p>
                    </div>
                    <div className="text-right">
                      <p className="font-black text-lg">{record.cost.toFixed(2)}</p>
                      <p className="text-[8px] font-black text-neutral-300 uppercase tracking-widest">KWD</p>
                    </div>
                  </div>
                ))}
                {driver.maintenance.serviceHistory.length === 0 && !showServiceForm && (
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
                {driver.dutyLogs.slice(0, 5).map(log => (
                  <div key={log.id} className="bg-white border border-neutral-200 p-5 rounded-2xl space-y-4 shadow-sm">
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <p className="font-black text-sm">{log.date}</p>
                        <p className="text-[10px] text-neutral-400 font-bold uppercase tracking-widest">{log.inTime} - {log.outTime}</p>
                      </div>
                      <div className="text-right">
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
    if (idInput === adminAuth.username && passInput === adminAuth.password) {
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

