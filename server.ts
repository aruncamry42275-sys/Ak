import express from 'express';
import path from 'path';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';

const PORT = 3000;
const STATE_FILE_PATH = path.join(process.cwd(), 'state.json');

// Default Seed Data matching App.tsx initial states
const DEFAULT_STATE = {
  companies: [
    {
      id: "c1",
      name: "Kuwait Logistics",
      tagline: "Enterprise Fleet Hub",
      logoUrl: "",
      adminEmail: "Arun965560@gmail.com"
    }
  ],
  drivers: [
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
    }
  ],
  adminAuth: { username: 'Arun965560@gmail.com', password: 'Arun965560@gmail.com' },
  hourlyRate: 5.0,
  logoUrl: '',
  companyName: 'Kuwait Logistics',
  companyTagline: 'Enterprise Fleet Hub',
  masterNotifications: []
};

// Helper to safely load state
function loadState() {
  try {
    if (fs.existsSync(STATE_FILE_PATH)) {
      const data = fs.readFileSync(STATE_FILE_PATH, 'utf8');
      return JSON.parse(data);
    }
  } catch (err) {
    console.error('Error loading state from file, reverting to seed:', err);
  }
  return DEFAULT_STATE;
}

// Helper to safely write state
function saveState(state: any) {
  try {
    fs.writeFileSync(STATE_FILE_PATH, JSON.stringify(state, null, 2), 'utf8');
  } catch (err) {
    console.error('Error writing state to file:', err);
  }
}

async function startServer() {
  const app = express();
  
  // Enable JSON request bodies
  app.use(express.json({ limit: '10mb' }));

  // Initialize State file if not present
  if (!fs.existsSync(STATE_FILE_PATH)) {
    saveState(DEFAULT_STATE);
  }

  // API Routes
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', online: true, timestamp: new Date().toISOString() });
  });

  app.get('/api/get-state', (req, res) => {
    const currentState = loadState();
    res.json(currentState);
  });

  app.post('/api/sync-state', (req, res) => {
    const clientState = req.body;
    if (!clientState) {
      return res.status(400).json({ error: 'No body provided' });
    }

    const serverState = loadState();
    
    // We synchronize by taking client modifications.
    // To handle true offline-to-online reconciliation:
    // We merge client's uploaded arrays/objects, or overwrite properties that are newer
    const mergedState = {
      companies: clientState.companies || serverState.companies,
      drivers: clientState.drivers || serverState.drivers,
      adminAuth: clientState.adminAuth || serverState.adminAuth,
      hourlyRate: typeof clientState.hourlyRate === 'number' ? clientState.hourlyRate : serverState.hourlyRate,
      logoUrl: typeof clientState.logoUrl === 'string' ? clientState.logoUrl : serverState.logoUrl,
      companyName: typeof clientState.companyName === 'string' ? clientState.companyName : serverState.companyName,
      companyTagline: typeof clientState.companyTagline === 'string' ? clientState.companyTagline : serverState.companyTagline,
      masterNotifications: clientState.masterNotifications || serverState.masterNotifications
    };

    saveState(mergedState);
    res.json({ status: 'synced', state: mergedState });
  });

  // Vite integration middleware
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Fleet Server] Live online at http://0.0.0.0:${PORT}`);
  });
}

startServer();
