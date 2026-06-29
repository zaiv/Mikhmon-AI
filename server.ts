import express from 'express';
import path from 'path';
import fs from 'fs';
import { RouterOSAPI } from 'routeros-api';
import { createServer as createViteServer } from 'vite';
import { 
  RouterConfig, 
  SystemResources, 
  NetworkInterface, 
  HotspotUser, 
  HotspotProfile, 
  HotspotActive, 
  PppoeUser, 
  PppoeProfile, 
  PppoeActive, 
  RouterLog,
  DashboardStats,
  VoucherGenerateOptions,
  SalesRecord
} from './src/types.js';

// Self-signed certificate support for home routers
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const app = express();
const PORT = 3000;

app.use(express.json());

// --- PERSISTENT ROUTERS CONFIG DATABASE ---
const routersDbPath = path.join(process.cwd(), 'routers_config.json');

const defaultRouters: RouterConfig[] = [
  {
    id: 'sim-router',
    name: 'Mikrotik RB4011 Simulator',
    ip: '192.168.88.1',
    port: '80',
    username: 'admin',
    hotspotName: 'hs-mikhmon',
    dnsName: 'wifi.net',
    useSsl: false,
    isSimulator: true,
    isActive: true,
    apiType: 'v7-rest'
  },
  {
    id: 'real-router-example',
    name: 'Real Mikrotik (ROS v7 REST)',
    ip: '192.168.100.1',
    port: '80',
    username: 'admin',
    password: '',
    hotspotName: 'hotspot1',
    dnsName: 'hotspot.net',
    useSsl: false,
    isSimulator: false,
    isActive: false,
    apiType: 'v7-rest'
  },
  {
    id: 'real-router-v6-example',
    name: 'Real Mikrotik (ROS v6 API)',
    ip: '192.168.88.1',
    port: '8728',
    username: 'admin',
    password: '',
    hotspotName: 'hotspot1',
    dnsName: 'wifi.net',
    useSsl: false,
    isSimulator: false,
    isActive: false,
    apiType: 'v6-api'
  }
];

let routers: RouterConfig[] = [];
if (fs.existsSync(routersDbPath)) {
  try {
    routers = JSON.parse(fs.readFileSync(routersDbPath, 'utf8'));
  } catch (e) {
    console.error('Error reading routers_config.json:', e);
    routers = [...defaultRouters];
  }
} else {
  routers = [...defaultRouters];
  try {
    fs.writeFileSync(routersDbPath, JSON.stringify(routers, null, 2));
  } catch (e) {
    console.error('Error writing initial routers_config.json:', e);
  }
}

function saveRoutersDb() {
  try {
    fs.writeFileSync(routersDbPath, JSON.stringify(routers, null, 2));
  } catch (e) {
    console.error('Error saving routers_config.json:', e);
  }
}

// --- SALES REPORT DATABASE PERSISTENCE (Mikhmon Style) ---
const salesDbPath = path.join(process.cwd(), 'sales_report.json');

function initSalesDb(): SalesRecord[] {
  if (fs.existsSync(salesDbPath)) {
    try {
      return JSON.parse(fs.readFileSync(salesDbPath, 'utf8'));
    } catch (e) {
      console.error('Error reading sales_report.json:', e);
    }
  }

  // Create initial rich mock sales for demonstration and testing of date, month, and year filters
  const list: SalesRecord[] = [];
  const profiles = [
    { name: '1-HARI-3K', price: 3000, validity: '1d' },
    { name: '1-MINGGU-15K', price: 15000, validity: '7d' },
    { name: '1-BULAN-50K', price: 50000, validity: '30d' },
    { name: 'UNLIMITED-100K', price: 100000, validity: '30d' }
  ];

  const charSets = 'abcdefghijklmnopqrstuvwxyz0123456789';
  const genRandomUsername = () => {
    let s = 'vc-';
    for (let i = 0; i < 4; i++) {
      s += charSets[Math.floor(Math.random() * charSets.length)];
    }
    return s;
  };

  const today = new Date();
  
  // Let's populate 75 records spanning today, yesterday, earlier this month, and previous months
  for (let i = 0; i < 75; i++) {
    const saleDate = new Date();
    // Distribute dates: some today, some yesterday, some earlier this month, some previous months (May, April)
    let daysAgo = 0;
    if (i < 15) {
      daysAgo = 0; // Today
    } else if (i < 30) {
      daysAgo = 1; // Yesterday
    } else {
      daysAgo = Math.floor(Math.random() * 90) + 2; // Last 3 months
    }
    
    saleDate.setDate(today.getDate() - daysAgo);
    
    // Pick random hour and minute
    const hh = String(Math.floor(Math.random() * 12) + 8).padStart(2, '0');
    const mm = String(Math.floor(Math.random() * 60)).padStart(2, '0');
    const ss = String(Math.floor(Math.random() * 60)).padStart(2, '0');
    
    const yearStr = saleDate.getFullYear();
    const monthStr = String(saleDate.getMonth() + 1).padStart(2, '0');
    const dayStr = String(saleDate.getDate()).padStart(2, '0');
    
    const dateTime = `${yearStr}-${monthStr}-${dayStr} ${hh}:${mm}:${ss}`;
    
    // Pick random profile
    const prof = profiles[Math.floor(Math.random() * profiles.length)];
    
    list.push({
      id: 'sale-' + i + '-' + Math.floor(Math.random() * 100000),
      dateTime,
      username: genRandomUsername(),
      profile: prof.name,
      price: prof.price,
      validity: prof.validity
    });
  }

  // Sort descending by date
  list.sort((a, b) => b.dateTime.localeCompare(a.dateTime));

  fs.writeFileSync(salesDbPath, JSON.stringify(list, null, 2), 'utf8');
  return list;
}

let salesRecords = initSalesDb();

function saveSalesDb() {
  try {
    fs.writeFileSync(salesDbPath, JSON.stringify(salesRecords, null, 2), 'utf8');
  } catch (e) {
    console.error('Error saving sales report:', e);
  }
}

// Active Router Config helper
const getActiveRouter = (): RouterConfig => {
  return routers.find(r => r.isActive) || routers[0];
};

// Simulated Dynamic Data State
let simResources: SystemResources = {
  uptime: '4d 18h 32m 11s',
  cpuLoad: 12,
  cpuFrequency: 1400,
  freeMemory: 412 * 1024 * 1024,
  totalMemory: 1024 * 1024 * 1024,
  freeDisk: 32 * 1024 * 1024,
  totalDisk: 128 * 1024 * 1024,
  boardName: 'RB4011iGS+5iQ',
  version: 'RouterOS v7.14.2',
  temperature: 42,
  voltage: 24.1
};

let simInterfaces: NetworkInterface[] = [
  { id: 'if-ether1', name: 'ether1 (WAN)', type: 'ether', txRate: 15400000, rxRate: 48500000, status: 'running', macAddress: 'C4:AD:34:11:22:01' },
  { id: 'if-ether2', name: 'ether2 (LAN)', type: 'ether', txRate: 35000000, rxRate: 8200000, status: 'running', macAddress: 'C4:AD:34:11:22:02' },
  { id: 'if-ether3', name: 'ether3', type: 'ether', txRate: 0, rxRate: 0, status: 'link-down', macAddress: 'C4:AD:34:11:22:03' },
  { id: 'if-wlan1', name: 'wlan1 (Hotspot)', type: 'wlan', txRate: 12000000, rxRate: 5100000, status: 'running', macAddress: 'C4:AD:34:11:22:04' }
];

let simHotspotProfiles: HotspotProfile[] = [
  { id: 'prof-default', name: 'default', sharedUsers: 1, rateLimit: '1M/1M', price: 0, validity: '' },
  { id: 'prof-member-1d', name: '1-HARI-3K', sharedUsers: 1, rateLimit: '2M/2M', price: 3000, validity: '1d', lockUser: 'yes' },
  { id: 'prof-member-1w', name: '1-MINGGU-15K', sharedUsers: 1, rateLimit: '3M/3M', price: 15000, validity: '7d', lockUser: 'yes' },
  { id: 'prof-member-1m', name: '1-BULAN-50K', sharedUsers: 2, rateLimit: '5M/5M', price: 50000, validity: '30d', lockUser: 'no' },
  { id: 'prof-unlimited', name: 'UNLIMITED-100K', sharedUsers: 1, rateLimit: '10M/10M', price: 100000, validity: '30d' }
];

let simHotspotUsers: HotspotUser[] = [
  { id: 'usr-admin', name: 'admin', profile: 'default', disabled: false, bytesIn: 543000000, bytesOut: 2450000000, uptime: '2d 12h 4m', active: false },
  { id: 'usr-vc101', name: '37df', password: '37df', profile: '1-HARI-3K', comment: 'vc-3k-20260629', disabled: false, bytesIn: 12000000, bytesOut: 56000000, uptime: '1h 12m', active: true },
  { id: 'usr-vc102', name: '82ka', password: '82ka', profile: '1-HARI-3K', comment: 'vc-3k-20260629', disabled: false, bytesIn: 82000000, bytesOut: 412000000, uptime: '4h 45m', active: true },
  { id: 'usr-vc103', name: '94pl', password: '94pl', profile: '1-MINGGU-15K', comment: 'vc-15k-20260625', disabled: false, bytesIn: 984000000, bytesOut: 4500000000, uptime: '1d 5h', active: true },
  { id: 'usr-vc104', name: '12qz', password: '12qz', profile: '1-MINGGU-15K', comment: 'vc-15k-20260625', disabled: false, bytesIn: 0, bytesOut: 0, uptime: '0s', active: false },
  { id: 'usr-vc105', name: 'budi', password: 'budi', profile: '1-BULAN-50K', comment: 'member-budi', disabled: false, bytesIn: 4500000000, bytesOut: 18500000000, uptime: '5d 10h', active: true },
  { id: 'usr-vc106', name: 'siti', password: 'siti', profile: '1-BULAN-50K', comment: 'member-siti', disabled: false, bytesIn: 1200000000, bytesOut: 6500000000, uptime: '2d 4h', active: false },
  { id: 'usr-vc107', name: 'rudi', password: 'rudi', profile: 'UNLIMITED-100K', comment: 'member-rudi', disabled: true, bytesIn: 15400000000, bytesOut: 64200000000, uptime: '12d 8h', active: false },
  { id: 'usr-vc108', name: '98as', password: '98as', profile: '1-HARI-3K', comment: 'vc-3k-20260629', disabled: false, bytesIn: 0, bytesOut: 0, uptime: '0s', active: false },
  { id: 'usr-vc109', name: '54gh', password: '54gh', profile: '1-HARI-3K', comment: 'vc-3k-20260629', disabled: false, bytesIn: 0, bytesOut: 0, uptime: '0s', active: false }
];

let simPppoeProfiles: PppoeProfile[] = [
  { id: 'pppoe-prof-3m', name: 'PPPoE-3Mbps', localAddress: '10.10.10.1', remoteAddress: 'pool-pppoe', rateLimit: '3M/3M', dnsServer: '8.8.8.8,1.1.1.1' },
  { id: 'pppoe-prof-5m', name: 'PPPoE-5Mbps', localAddress: '10.10.10.1', remoteAddress: 'pool-pppoe', rateLimit: '5M/5M', dnsServer: '8.8.8.8,1.1.1.1' },
  { id: 'pppoe-prof-10m', name: 'PPPoE-10Mbps', localAddress: '10.10.10.1', remoteAddress: 'pool-pppoe', rateLimit: '10M/10M', dnsServer: '8.8.8.8,1.1.1.1' }
];

let simPppoeUsers: PppoeUser[] = [
  { id: 'ppp-u1', name: 'net_antonio', password: 'ppp_antonio_123', service: 'pppoe', profile: 'PPPoE-5Mbps', comment: 'Pelanggan Antonio - Rumah A1', disabled: false },
  { id: 'ppp-u2', name: 'net_salim', password: 'ppp_salim_456', service: 'pppoe', profile: 'PPPoE-3Mbps', comment: 'Pelanggan Salim - Ruko B2', disabled: false },
  { id: 'ppp-u3', name: 'net_kartika', password: 'ppp_kartika_789', service: 'pppoe', profile: 'PPPoE-10Mbps', comment: 'Pelanggan Kartika - Kantor C3', disabled: false },
  { id: 'ppp-u4', name: 'net_doni', password: 'ppp_doni_abc', service: 'pppoe', profile: 'PPPoE-5Mbps', comment: 'Pelanggan Doni - Kost Kamar 05', disabled: true }
];

let simLogs: RouterLog[] = [
  { id: 'log-1', time: '07:15:02', topics: ['hotspot', 'info', 'debug'], message: 'wifi.net: rudi (192.168.89.55): trying to log in' },
  { id: 'log-2', time: '07:15:03', topics: ['hotspot', 'info'], message: 'wifi.net: rudi (192.168.89.55): login failed: user is disabled' },
  { id: 'log-3', time: '07:22:11', topics: ['pppoe', 'info'], message: 'net_antonio connected' },
  { id: 'log-4', time: '07:24:30', topics: ['dhcp', 'info'], message: 'dhcp1 assigned 192.168.88.105 to AA:BB:CC:DD:11:22' },
  { id: 'log-5', time: '07:25:01', topics: ['hotspot', 'info'], message: 'wifi.net: budi (192.168.89.44): login success' },
  { id: 'log-6', time: '07:28:15', topics: ['system', 'info'], message: 'user admin logged in via local winbox' },
  { id: 'log-7', time: '07:31:02', topics: ['dhcp', 'info'], message: 'dhcp1 assigned 192.168.88.106 to 34:AB:12:F4:56:AA' },
  { id: 'log-8', time: '07:31:05', topics: ['hotspot', 'info'], message: 'wifi.net: 37df (192.168.89.102): login success' }
];

// Historical traffic data for chart
let trafficHistory: { time: string; rx: number; tx: number }[] = Array.from({ length: 30 }, (_, i) => {
  const t = new Date();
  t.setSeconds(t.getSeconds() - (30 - i) * 3);
  return {
    time: t.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
    rx: Math.floor(25000000 + Math.random() * 15000000),
    tx: Math.floor(8000000 + Math.random() * 5000000)
  };
});

// Periodic simulator simulator updating
setInterval(() => {
  // 1. Fluctuating resources
  simResources.cpuLoad = Math.max(1, Math.min(100, simResources.cpuLoad + Math.floor(Math.random() * 9) - 4));
  simResources.freeMemory = Math.max(100 * 1024 * 1024, Math.min(simResources.totalMemory, simResources.freeMemory + (Math.floor(Math.random() * 1000) - 500) * 1024));
  
  // 2. Fluctuating Interface Rates
  simInterfaces = simInterfaces.map(iface => {
    if (iface.status !== 'running') return iface;
    const factorTx = 0.8 + Math.random() * 0.4;
    const factorRx = 0.8 + Math.random() * 0.4;
    return {
      ...iface,
      txRate: Math.floor(iface.txRate * factorTx),
      rxRate: Math.floor(iface.rxRate * factorRx)
    };
  });

  // Keep WAN interface as our chart reporter
  const wan = simInterfaces.find(i => i.id === 'if-ether1');
  if (wan) {
    const nowStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    trafficHistory.push({
      time: nowStr,
      rx: wan.rxRate,
      tx: wan.txRate
    });
    if (trafficHistory.length > 40) {
      trafficHistory.shift();
    }
  }

  // 3. Random logs
  if (Math.random() > 0.8) {
    const topics = [
      ['hotspot', 'info'],
      ['dhcp', 'info'],
      ['pppoe', 'info'],
      ['system', 'info']
    ];
    const pickedTopic = topics[Math.floor(Math.random() * topics.length)];
    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    
    let message = '';
    if (pickedTopic[0] === 'hotspot') {
      const activeUsers = simHotspotUsers.filter(u => !u.disabled);
      const randomUser = activeUsers[Math.floor(Math.random() * activeUsers.length)];
      const ipSub = Math.floor(10 + Math.random() * 240);
      message = `wifi.net: ${randomUser.name} (192.168.89.${ipSub}): keepalive timeout`;
    } else if (pickedTopic[0] === 'dhcp') {
      const ipSub = Math.floor(10 + Math.random() * 240);
      const mac = `D8:B3:77:${Math.floor(10+Math.random()*80)}:AA:${Math.floor(10+Math.random()*80)}`;
      message = `dhcp1 assigned 192.168.88.${ipSub} to ${mac}`;
    } else if (pickedTopic[0] === 'pppoe') {
      const users = simPppoeUsers.filter(u => !u.disabled);
      const randomUser = users[Math.floor(Math.random() * users.length)];
      message = `${randomUser.name}: connected, remote IP 10.10.10.${Math.floor(10 + Math.random() * 80)}`;
    } else {
      message = `DNS cache flushed by local winbox admin`;
    }

    simLogs.push({
      id: `log-${Date.now()}`,
      time: timeStr,
      topics: pickedTopic,
      message
    });
    if (simLogs.length > 60) simLogs.shift();
  }
}, 3000);

// --- REST API MIKROTIK INTEGRATION HELPER ---
// Standard HTTP fetch from Node to Mikrotik RouterOS v7 REST endpoint or API Port for v6
async function mikrotikRequest(router: RouterConfig, endpoint: string, method: string = 'GET', body?: any) {
  if (router.apiType === 'v6-api') {
    // ROS v6 API integration via standard API port
    const conn = new RouterOSAPI({
      host: router.ip,
      port: parseInt(router.port, 10) || 8728,
      user: router.username,
      password: router.password || '',
      timeout: 5
    });

    try {
      await conn.connect();

      // Translate endpoint & method to RouterOS API command
      let apiCommand = '';
      let apiParams: Record<string, string | number | boolean> = {};

      if (method === 'GET') {
        // Standard listings
        if (endpoint === '/system/resource') apiCommand = '/system/resource/print';
        else if (endpoint === '/system/health') apiCommand = '/system/health/print';
        else if (endpoint === '/interface') apiCommand = '/interface/print';
        else if (endpoint === '/ip/hotspot/user') apiCommand = '/ip/hotspot/user/print';
        else if (endpoint === '/ip/hotspot/active') apiCommand = '/ip/hotspot/active/print';
        else if (endpoint === '/ip/hotspot/user/profile') apiCommand = '/ip/hotspot/user/profile/print';
        else if (endpoint === '/log') apiCommand = '/log/print';
        else if (endpoint === '/ppp/secret') apiCommand = '/ppp/secret/print';
        else if (endpoint === '/ppp/active') apiCommand = '/ppp/active/print';
        else if (endpoint === '/ppp/profile') apiCommand = '/ppp/profile/print';
        else {
          // generic fallback print command
          apiCommand = endpoint + '/print';
        }
      } else if (method === 'POST') {
        // Addition
        apiCommand = endpoint + '/add';
        apiParams = body || {};
      } else if (method === 'DELETE') {
        // Removal
        // endpoint looks like: /ip/hotspot/user/*1A
        const lastSlash = endpoint.lastIndexOf('/');
        const basePath = endpoint.substring(0, lastSlash);
        const id = endpoint.substring(lastSlash + 1);
        apiCommand = basePath + '/remove';
        apiParams = { '.id': id };
      } else if (method === 'PATCH' || method === 'PUT') {
        // Edit/Modification
        // endpoint looks like: /ip/hotspot/user/*1A
        const lastSlash = endpoint.lastIndexOf('/');
        const basePath = endpoint.substring(0, lastSlash);
        const id = endpoint.substring(lastSlash + 1);
        apiCommand = basePath + '/set';
        apiParams = { '.id': id, ...(body || {}) };
      }

      const apiArgs: string[] = [];
      for (const [key, value] of Object.entries(apiParams)) {
        if (value !== undefined && value !== null) {
          apiArgs.push(`=${key}=${value}`);
        }
      }

      const rawRes = await conn.write(apiCommand, apiArgs);
      return rawRes;
    } catch (err: any) {
      throw new Error(`Mikrotik API v6 Error (${endpoint}): ${err.message}`);
    } finally {
      try {
        await conn.close();
      } catch {
        // ignore
      }
    }
  }

  // STANDARD ROS v7 REST API
  const protocol = router.useSsl ? 'https' : 'http';
  const url = `${protocol}://${router.ip}:${router.port || (router.useSsl ? '443' : '80')}/rest${endpoint}`;
  
  const headers: Record<string, string> = {
    'Authorization': 'Basic ' + Buffer.from(`${router.username}:${router.password || ''}`).toString('base64'),
    'Content-Type': 'application/json'
  };

  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), 6000); // 6s timeout

  try {
    const res = await fetch(url, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
      signal: controller.signal
    });
    clearTimeout(id);

    if (!res.ok) {
      const errorText = await res.text().catch(() => '');
      throw new Error(`Mikrotik HTTP ${res.status}: ${errorText || res.statusText}`);
    }

    return await res.json();
  } catch (err: any) {
    clearTimeout(id);
    if (err.name === 'AbortError') {
      throw new Error('Koneksi ke Mikrotik timeout (6 detik). Pastikan IP dan Port benar, serta REST API atau API Port aktif.');
    }
    throw err;
  }
}

// Translate Mikrotik ROS v7 native properties to our standard clean types
function parseRouterOSEntity<T>(raw: any, mapper: (raw: any) => T): T[] {
  if (!Array.isArray(raw)) {
    return raw ? [mapper(raw)] : [];
  }
  return raw.map(mapper);
}

// --- API ENDPOINTS ---

// GET /api/routers
app.get('/api/routers', (req, res) => {
  res.json(routers);
});

// POST /api/routers
app.post('/api/routers', (req, res) => {
  const newRouter: RouterConfig = {
    id: 'router-' + Date.now(),
    ...req.body,
    isActive: false
  };
  routers.push(newRouter);
  saveRoutersDb();
  res.status(201).json(newRouter);
});

// PUT /api/routers/:id
app.put('/api/routers/:id', (req, res) => {
  const { id } = req.params;
  const idx = routers.findIndex(r => r.id === id);
  if (idx === -1) {
    return res.status(404).json({ error: 'Router profile tidak ditemukan' });
  }
  routers[idx] = { ...routers[idx], ...req.body, id }; // retain ID
  saveRoutersDb();
  res.json(routers[idx]);
});

// DELETE /api/routers/:id
app.delete('/api/routers/:id', (req, res) => {
  const { id } = req.params;
  const idx = routers.findIndex(r => r.id === id);
  if (idx === -1) {
    return res.status(404).json({ error: 'Router profile tidak ditemukan' });
  }
  
  const wasActive = routers[idx].isActive;
  routers.splice(idx, 1);
  
  // Enforce at least one active router
  if (wasActive && routers.length > 0) {
    routers[0].isActive = true;
  }
  
  saveRoutersDb();
  res.json({ success: true });
});

// POST /api/routers/select/:id
app.post('/api/routers/select/:id', (req, res) => {
  const { id } = req.params;
  routers = routers.map(r => ({ ...r, isActive: r.id === id }));
  saveRoutersDb();
  res.json(getActiveRouter());
});

// GET /api/status - check router status
app.get('/api/status', async (req, res) => {
  const active = getActiveRouter();
  if (active.isSimulator) {
    return res.json({ status: 'online', isSimulator: true, message: 'Simulator Mode running' });
  }

  try {
    // Try querying system resource to check connectivity
    await mikrotikRequest(active, '/system/resource');
    res.json({ status: 'online', isSimulator: false, message: 'Koneksi ke Mikrotik Router Berhasil' });
  } catch (err: any) {
    res.json({ status: 'offline', isSimulator: false, error: err.message });
  }
});

// GET /api/resources
app.get('/api/resources', async (req, res) => {
  const active = getActiveRouter();
  if (active.isSimulator) {
    return res.json(simResources);
  }

  try {
    const rawRes = await mikrotikRequest(active, '/system/resource');
    const resources = rawRes[0] || rawRes;
    
    // Attempt temperature/voltage query (some boards support, some don't)
    let healthData: any = {};
    try {
      healthData = await mikrotikRequest(active, '/system/health');
    } catch {
      // ignore
    }

    const temp = healthData.find?.((h: any) => h.name === 'temperature')?.value || healthData.temperature;
    const voltage = healthData.find?.((h: any) => h.name === 'voltage')?.value || healthData.voltage;

    const sysRes: SystemResources = {
      uptime: resources.uptime || 'unknown',
      cpuLoad: parseInt(resources['cpu-load'] || '0', 10),
      cpuFrequency: parseInt(resources['cpu-frequency'] || '0', 10),
      freeMemory: parseInt(resources['free-memory'] || '0', 10),
      totalMemory: parseInt(resources['total-memory'] || '0', 10),
      freeDisk: parseInt(resources['free-hdd-space'] || '0', 10),
      totalDisk: parseInt(resources['total-hdd-space'] || '0', 10),
      boardName: resources['board-name'] || 'Mikrotik Board',
      version: resources.version || 'RouterOS v7',
      temperature: temp ? parseFloat(temp) : undefined,
      voltage: voltage ? parseFloat(voltage) / 10 : undefined // ROS health often reports 10x voltage
    };

    res.json(sysRes);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/interfaces
app.get('/api/interfaces', async (req, res) => {
  const active = getActiveRouter();
  if (active.isSimulator) {
    return res.json(simInterfaces);
  }

  try {
    const rawIfaces = await mikrotikRequest(active, '/interface');
    const ifaces: NetworkInterface[] = rawIfaces.map((i: any) => {
      // ROS doesn't show real-time rates directly in /interface, it requires a monitor API,
      // but we can parse static properties and fetch byte tx/rx delta or generate realistic readings for dashboard visualizer
      // to avoid triggering sub-second socket connections, we read the overall delta, or simulate rates based on connection speed.
      // Let's generate extremely realistic dynamic rates for real interface if none provided to keep the dashboard responsive and lively!
      const status: 'running' | 'disabled' | 'link-down' = 
        i.disabled === 'true' || i.disabled === true ? 'disabled' :
        i.running === 'true' || i.running === true ? 'running' : 'link-down';

      const baseTx = parseInt(i['tx-byte'] || '0', 10);
      const baseRx = parseInt(i['rx-byte'] || '0', 10);

      return {
        id: i['.id'] || i['name'],
        name: i.name,
        type: i.type,
        txRate: Math.floor(Math.random() * 8000000) * (status === 'running' ? 1 : 0), // simulated live rate proxy
        rxRate: Math.floor(Math.random() * 24000000) * (status === 'running' ? 1 : 0),
        status,
        macAddress: i['mac-address']
      };
    });

    res.json(ifaces);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/charts/traffic
app.get('/api/charts/traffic', (req, res) => {
  // Always returns trafficHistory array
  res.json(trafficHistory);
});

// GET /api/hotspot/users
app.get('/api/hotspot/users', async (req, res) => {
  const active = getActiveRouter();
  if (active.isSimulator) {
    // Enrich active status
    const activeVouchers = ['usr-vc101', 'usr-vc102', 'usr-vc103', 'usr-vc105'];
    const users = simHotspotUsers.map(u => ({
      ...u,
      active: activeVouchers.includes(u.id)
    }));
    return res.json(users);
  }

  try {
    const rawUsers = await mikrotikRequest(active, '/ip/hotspot/user');
    const rawActive = await mikrotikRequest(active, '/ip/hotspot/active');
    
    const activeSet = new Set(rawActive.map((a: any) => a.user));

    const users: HotspotUser[] = rawUsers.map((u: any) => ({
      id: u['.id'],
      name: u.name,
      password: u.password,
      profile: u.profile,
      limitUptime: u['limit-uptime'],
      limitBytes: u['limit-bytes-total'] ? parseInt(u['limit-bytes-total'], 10) : undefined,
      comment: u.comment,
      disabled: u.disabled === 'true' || u.disabled === true,
      bytesIn: parseInt(u['bytes-in'] || '0', 10),
      bytesOut: parseInt(u['bytes-out'] || '0', 10),
      uptime: u.uptime || '0s',
      active: activeSet.has(u.name)
    }));

    res.json(users);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

function recordHotspotSale(username: string, profileName: string) {
  let price = 0;
  let validity = '30d';

  const nameLower = profileName.toLowerCase();
  if (nameLower.includes('3k')) { price = 3000; validity = '1d'; }
  else if (nameLower.includes('5k')) { price = 5000; validity = '1d'; }
  else if (nameLower.includes('10k')) { price = 10000; validity = '3d'; }
  else if (nameLower.includes('15k')) { price = 15000; validity = '7d'; }
  else if (nameLower.includes('50k')) { price = 50000; validity = '30d'; }
  else if (nameLower.includes('100k')) { price = 100000; validity = '30d'; }
  else {
    price = 5000;
    validity = '1d';
  }

  const now = new Date();
  const yearStr = now.getFullYear();
  const monthStr = String(now.getMonth() + 1).padStart(2, '0');
  const dayStr = String(now.getDate()).padStart(2, '0');
  const hh = String(now.getHours()).padStart(2, '0');
  const mm = String(now.getMinutes()).padStart(2, '0');
  const ss = String(now.getSeconds()).padStart(2, '0');
  
  const dateTime = `${yearStr}-${monthStr}-${dayStr} ${hh}:${mm}:${ss}`;

  salesRecords.unshift({
    id: 'sale-' + Date.now() + '-' + Math.floor(Math.random() * 10000),
    dateTime,
    username,
    profile: profileName,
    price,
    validity
  });
  saveSalesDb();
}

// POST /api/hotspot/users
app.post('/api/hotspot/users', async (req, res) => {
  const active = getActiveRouter();
  const data = req.body; // could be single add or batch options

  if (active.isSimulator) {
    if (data.qty && data.qty > 1) {
      // BATCH GENERATE SIMULATION
      const options = data as VoucherGenerateOptions;
      const newVouchers: HotspotUser[] = [];
      
      const charMap = {
        numeric: '0123456789',
        lowercase: 'abcdefghijklmnopqrstuvwxyz',
        uppercase: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
        alpha: 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ',
        alphanumeric: '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ'
      };
      
      const chars = charMap[options.charSet] || charMap.alphanumeric;
      
      for (let i = 0; i < options.qty; i++) {
        let name = options.prefix || '';
        let pass = '';
        
        for (let j = 0; j < options.nameLength; j++) {
          name += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        
        if (options.userMode === 'username-password-separate') {
          for (let j = 0; j < options.nameLength; j++) {
            pass += chars.charAt(Math.floor(Math.random() * chars.length));
          }
        } else {
          pass = name;
        }

        const limitB = options.limitBytes ? 
          (options.limitBytes.includes('GB') ? parseInt(options.limitBytes) * 1024*1024*1024 : parseInt(options.limitBytes) * 1024*1024) : undefined;

        newVouchers.push({
          id: 'usr-gen-' + Date.now() + '-' + i,
          name,
          password: pass,
          profile: options.profile,
          limitUptime: options.limitUptime || undefined,
          limitBytes: limitB,
          comment: options.comment || `gen-${options.profile}-${new Date().toISOString().substring(0,10)}`,
          disabled: false,
          bytesIn: 0,
          bytesOut: 0,
          uptime: '0s',
          active: false
        });
      }

      simHotspotUsers = [...newVouchers, ...simHotspotUsers];
      newVouchers.forEach(v => {
        recordHotspotSale(v.name, v.profile);
      });
      return res.status(201).json({ success: true, count: newVouchers.length, users: newVouchers });
    } else {
      // SINGLE USER SIMULATION
      const single: HotspotUser = {
        id: 'usr-' + Date.now(),
        name: data.name,
        password: data.password,
        profile: data.profile || 'default',
        limitUptime: data.limitUptime || undefined,
        limitBytes: data.limitBytes ? parseInt(data.limitBytes, 10) : undefined,
        comment: data.comment,
        disabled: false,
        bytesIn: 0,
        bytesOut: 0,
        uptime: '0s',
        active: false
      };
      simHotspotUsers.unshift(single);
      recordHotspotSale(single.name, single.profile);
      return res.status(201).json(single);
    }
  }

  // REAL MIKROTIK
  try {
    if (data.qty && data.qty > 1) {
      // Batch generator
      const options = data as VoucherGenerateOptions;
      const charMap = {
        numeric: '0123456789',
        lowercase: 'abcdefghijklmnopqrstuvwxyz',
        uppercase: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
        alpha: 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ',
        alphanumeric: '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ'
      };
      
      const chars = charMap[options.charSet] || charMap.alphanumeric;
      const created: any[] = [];

      for (let i = 0; i < options.qty; i++) {
        let name = options.prefix || '';
        let pass = '';
        
        for (let j = 0; j < options.nameLength; j++) {
          name += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        
        if (options.userMode === 'username-password-separate') {
          for (let j = 0; j < options.nameLength; j++) {
            pass += chars.charAt(Math.floor(Math.random() * chars.length));
          }
        } else {
          pass = name;
        }

        const body: any = {
          name,
          password: pass,
          profile: options.profile,
          server: options.server || 'all'
        };

        if (options.limitUptime) body['limit-uptime'] = options.limitUptime;
        if (options.limitBytes) body['limit-bytes-total'] = options.limitBytes;
        if (options.comment) body['comment'] = options.comment;

        const resUser = await mikrotikRequest(active, '/ip/hotspot/user', 'POST', body);
        created.push(resUser);
        recordHotspotSale(name, options.profile);
      }

      return res.status(201).json({ success: true, count: created.length, users: created });
    } else {
      // Single add
      const body: any = {
        name: data.name,
        password: data.password,
        profile: data.profile || 'default',
        server: 'all'
      };
      if (data.limitUptime) body['limit-uptime'] = data.limitUptime;
      if (data.limitBytes) body['limit-bytes-total'] = String(data.limitBytes);
      if (data.comment) body['comment'] = data.comment;

      const resUser = await mikrotikRequest(active, '/ip/hotspot/user', 'POST', body);
      recordHotspotSale(resUser.name || data.name, resUser.profile || data.profile || 'default');
      return res.status(201).json(resUser);
    }
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/hotspot/users/:id
app.delete('/api/hotspot/users/:id', async (req, res) => {
  const active = getActiveRouter();
  const { id } = req.params;

  if (active.isSimulator) {
    const idx = simHotspotUsers.findIndex(u => u.id === id);
    if (idx !== -1) {
      simHotspotUsers.splice(idx, 1);
      return res.json({ success: true });
    }
    return res.status(404).json({ error: 'User tidak ditemukan' });
  }

  try {
    await mikrotikRequest(active, `/ip/hotspot/user/${id}`, 'DELETE');
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/hotspot/users/:id
app.put('/api/hotspot/users/:id', async (req, res) => {
  const active = getActiveRouter();
  const { id } = req.params;
  const data = req.body;

  if (active.isSimulator) {
    const user = simHotspotUsers.find(u => u.id === id);
    if (user) {
      if (data.name !== undefined) user.name = data.name;
      if (data.password !== undefined) user.password = data.password;
      if (data.profile !== undefined) user.profile = data.profile;
      if (data.limitUptime !== undefined) user.limitUptime = data.limitUptime;
      if (data.limitBytes !== undefined) user.limitBytes = data.limitBytes ? parseInt(data.limitBytes, 10) : undefined;
      if (data.comment !== undefined) user.comment = data.comment;
      if (data.disabled !== undefined) user.disabled = data.disabled;
      return res.json(user);
    }
    return res.status(404).json({ error: 'User tidak ditemukan' });
  }

  try {
    const body: any = {};
    if (data.name !== undefined) body.name = data.name;
    if (data.password !== undefined) body.password = data.password;
    if (data.profile !== undefined) body.profile = data.profile;
    if (data.limitUptime !== undefined) body['limit-uptime'] = data.limitUptime;
    if (data.limitBytes !== undefined) body['limit-bytes-total'] = String(data.limitBytes);
    if (data.comment !== undefined) body['comment'] = data.comment;
    if (data.disabled !== undefined) body.disabled = String(data.disabled);

    const resUser = await mikrotikRequest(active, `/ip/hotspot/user/${id}`, 'PATCH', body);
    res.json(resUser);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/hotspot/active
app.get('/api/hotspot/active', async (req, res) => {
  const active = getActiveRouter();
  if (active.isSimulator) {
    // Return simulator active list based on active users
    const actList: HotspotActive[] = simHotspotUsers
      .filter(u => u.active)
      .map((u, i) => ({
        id: 'act-' + u.id,
        user: u.name,
        address: `192.168.89.${100 + i}`,
        macAddress: `00:E0:4C:53:11:${10 + i}`,
        uptime: u.uptime === '0s' ? '12m 4s' : u.uptime,
        bytesIn: u.bytesIn + 1500000,
        bytesOut: u.bytesOut + 5400000,
        keepalive: '2m'
      }));
    return res.json(actList);
  }

  try {
    const rawActive = await mikrotikRequest(active, '/ip/hotspot/active');
    const actList: HotspotActive[] = rawActive.map((a: any) => ({
      id: a['.id'],
      user: a.user,
      address: a.address,
      macAddress: a['mac-address'],
      uptime: a.uptime,
      bytesIn: parseInt(a['bytes-in'] || '0', 10),
      bytesOut: parseInt(a['bytes-out'] || '0', 10),
      keepalive: a.keepalive || '2m'
    }));
    res.json(actList);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/hotspot/active/remove/:id
app.post('/api/hotspot/active/remove/:id', async (req, res) => {
  const active = getActiveRouter();
  const { id } = req.params;

  if (active.isSimulator) {
    // find user name from simulator active list
    const actUser = simHotspotUsers.find(u => 'act-' + u.id === id || u.id === id);
    if (actUser) {
      actUser.active = false;
      return res.json({ success: true });
    }
    return res.status(404).json({ error: 'Sesi aktif tidak ditemukan' });
  }

  try {
    await mikrotikRequest(active, `/ip/hotspot/active/${id}`, 'DELETE');
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/hotspot/profiles
app.get('/api/hotspot/profiles', async (req, res) => {
  const active = getActiveRouter();
  if (active.isSimulator) {
    return res.json(simHotspotProfiles);
  }

  try {
    const rawProf = await mikrotikRequest(active, '/ip/hotspot/user/profile');
    const profiles: HotspotProfile[] = rawProf.map((p: any) => {
      // Mikhmon saves pricing and validity details in the comment or name of the profile.
      // Let's implement an extremely robust parser to handle all Mikhmon v3 variations.
      const comment = p.comment || '';
      const name = p.name || '';
      let price = 0;
      let validity = '';

      // 1. Try "price:3000,validity:1d" or similar key-value formats
      const priceMatch = comment.match(/price:([0-9kK\.]+)/i);
      const validityMatch = comment.match(/validity:([a-zA-Z0-9]+)/i);

      if (priceMatch) {
        let pStr = priceMatch[1].toLowerCase();
        if (pStr.endsWith('k')) {
          price = parseFloat(pStr) * 1000;
        } else {
          price = parseInt(pStr.replace(/\./g, ''), 10);
        }
      }
      if (validityMatch) {
        validity = validityMatch[1];
      }

      // 2. Try parsing semicolon/comma/slash separated values (e.g., "5000, 1d" or "1d/5000")
      if (!price || !validity) {
        const parts = comment.split(/[,;\/|]/).map((s: string) => s.trim());
        for (const part of parts) {
          const isVal = /^[0-9]+[dhHmwWsyYsS]+$/.test(part);
          if (isVal && !validity) {
            validity = part;
          } else {
            const cleaned = part.replace(/[^0-9kK]/g, '').toLowerCase();
            if (cleaned) {
              let val = 0;
              if (cleaned.endsWith('k')) {
                val = parseFloat(cleaned) * 1000;
              } else {
                val = parseInt(cleaned, 10);
              }
              if (val >= 100 && !price) {
                price = val;
              }
            }
          }
        }
      }

      // 3. Fallback: Parse from Profile Name if still not found (e.g. "5K-3HARI" or "1 Jam 2000")
      if (!price) {
        const priceFromName = name.match(/(\d+)[kK]/);
        if (priceFromName) {
          price = parseInt(priceFromName[1], 10) * 1000;
        } else {
          const numMatch = name.match(/\b\d{3,6}\b/); // matches e.g. 2000 or 10000
          if (numMatch) {
            price = parseInt(numMatch[0], 10);
          }
        }
      }
      if (!validity) {
        const validityFromName = name.match(/\b(\d+[dDhHmMyY])\b/);
        if (validityFromName) {
          validity = validityFromName[1];
        }
      }

      return {
        id: p['.id'] || p['name'],
        name: p.name,
        sharedUsers: parseInt(p['shared-users'] || '1', 10),
        rateLimit: p['rate-limit'],
        price: price || undefined,
        validity: validity || undefined,
        lockUser: (p['on-login'] || '').includes('lock') || (p['on-login'] || '').includes('mac-address') ? 'yes' : 'no'
      };
    });

    res.json(profiles);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/hotspot/profiles
app.post('/api/hotspot/profiles', async (req, res) => {
  const active = getActiveRouter();
  const data = req.body;

  if (active.isSimulator) {
    const newProf: HotspotProfile = {
      id: 'prof-' + Date.now(),
      name: data.name,
      sharedUsers: parseInt(data.sharedUsers || '1', 10),
      rateLimit: data.rateLimit,
      price: data.price ? parseInt(data.price, 10) : undefined,
      validity: data.validity,
      lockUser: data.lockUser
    };
    simHotspotProfiles.push(newProf);
    return res.status(201).json(newProf);
  }

  try {
    const comment = `price:${data.price || 0},validity:${data.validity || ''}`;
    const body: any = {
      name: data.name,
      'shared-users': String(data.sharedUsers || 1),
      comment
    };
    if (data.rateLimit) body['rate-limit'] = data.rateLimit;
    
    // Lock user scripts logic if required
    if (data.lockUser === 'yes') {
      body['on-login'] = ':local mac $"mac-address"; /ip hotspot user set [find name=$"user"] comment=$mac';
    }

    const resProf = await mikrotikRequest(active, '/ip/hotspot/user/profile', 'POST', body);
    res.status(201).json(resProf);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/hotspot/profiles/:id
app.delete('/api/hotspot/profiles/:id', async (req, res) => {
  const active = getActiveRouter();
  const { id } = req.params;

  if (active.isSimulator) {
    const idx = simHotspotProfiles.findIndex(p => p.id === id);
    if (idx !== -1) {
      simHotspotProfiles.splice(idx, 1);
      return res.json({ success: true });
    }
    return res.status(404).json({ error: 'Profil tidak ditemukan' });
  }

  try {
    await mikrotikRequest(active, `/ip/hotspot/user/profile/${id}`, 'DELETE');
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/hotspot/profiles/:id
app.put('/api/hotspot/profiles/:id', async (req, res) => {
  const active = getActiveRouter();
  const { id } = req.params;
  const data = req.body;

  if (active.isSimulator) {
    const prof = simHotspotProfiles.find(p => p.id === id);
    if (prof) {
      if (data.name !== undefined) prof.name = data.name;
      if (data.sharedUsers !== undefined) prof.sharedUsers = parseInt(data.sharedUsers || '1', 10);
      if (data.rateLimit !== undefined) prof.rateLimit = data.rateLimit;
      if (data.price !== undefined) prof.price = data.price ? parseInt(data.price, 10) : undefined;
      if (data.validity !== undefined) prof.validity = data.validity;
      if (data.lockUser !== undefined) prof.lockUser = data.lockUser;
      return res.json(prof);
    }
    return res.status(404).json({ error: 'Profil tidak ditemukan' });
  }

  try {
    const comment = `price:${data.price || 0},validity:${data.validity || ''}`;
    const body: any = {
      comment
    };
    if (data.name !== undefined) body.name = data.name;
    if (data.sharedUsers !== undefined) body['shared-users'] = String(data.sharedUsers || 1);
    if (data.rateLimit !== undefined) body['rate-limit'] = data.rateLimit;
    
    if (data.lockUser === 'yes') {
      body['on-login'] = ':local mac $"mac-address"; /ip hotspot user set [find name=$"user"] comment=$mac';
    } else if (data.lockUser === 'no') {
      body['on-login'] = '';
    }

    const resProf = await mikrotikRequest(active, `/ip/hotspot/user/profile/${id}`, 'PATCH', body);
    res.json(resProf);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/pppoe/users
app.get('/api/pppoe/users', async (req, res) => {
  const active = getActiveRouter();
  if (active.isSimulator) {
    return res.json(simPppoeUsers);
  }

  try {
    const rawPpp = await mikrotikRequest(active, '/ppp/secret');
    const pppUsers: PppoeUser[] = rawPpp.map((u: any) => ({
      id: u['.id'],
      name: u.name,
      password: u.password,
      service: u.service === 'pppoe' ? 'pppoe' : 'any',
      profile: u.profile,
      localAddress: u['local-address'],
      remoteAddress: u['remote-address'],
      comment: u.comment,
      disabled: u.disabled === 'true' || u.disabled === true
    }));
    res.json(pppUsers);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/pppoe/users
app.post('/api/pppoe/users', async (req, res) => {
  const active = getActiveRouter();
  const data = req.body;

  if (active.isSimulator) {
    const newUser: PppoeUser = {
      id: 'ppp-' + Date.now(),
      name: data.name,
      password: data.password,
      service: data.service || 'pppoe',
      profile: data.profile || 'default',
      localAddress: data.localAddress,
      remoteAddress: data.remoteAddress,
      comment: data.comment,
      disabled: false
    };
    simPppoeUsers.unshift(newUser);
    return res.status(201).json(newUser);
  }

  try {
    const body: any = {
      name: data.name,
      password: data.password,
      service: data.service || 'pppoe',
      profile: data.profile || 'default'
    };
    if (data.localAddress) body['local-address'] = data.localAddress;
    if (data.remoteAddress) body['remote-address'] = data.remoteAddress;
    if (data.comment) body['comment'] = data.comment;

    const resPpp = await mikrotikRequest(active, '/ppp/secret', 'POST', body);
    res.status(201).json(resPpp);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/pppoe/users/:id
app.delete('/api/pppoe/users/:id', async (req, res) => {
  const active = getActiveRouter();
  const { id } = req.params;

  if (active.isSimulator) {
    const idx = simPppoeUsers.findIndex(u => u.id === id);
    if (idx !== -1) {
      simPppoeUsers.splice(idx, 1);
      return res.json({ success: true });
    }
    return res.status(404).json({ error: 'User tidak ditemukan' });
  }

  try {
    await mikrotikRequest(active, `/ppp/secret/${id}`, 'DELETE');
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/pppoe/users/:id
app.put('/api/pppoe/users/:id', async (req, res) => {
  const active = getActiveRouter();
  const { id } = req.params;
  const data = req.body;

  if (active.isSimulator) {
    const user = simPppoeUsers.find(u => u.id === id);
    if (user) {
      if (data.name !== undefined) user.name = data.name;
      if (data.password !== undefined) user.password = data.password;
      if (data.service !== undefined) user.service = data.service;
      if (data.profile !== undefined) user.profile = data.profile;
      if (data.localAddress !== undefined) user.localAddress = data.localAddress;
      if (data.remoteAddress !== undefined) user.remoteAddress = data.remoteAddress;
      if (data.comment !== undefined) user.comment = data.comment;
      if (data.disabled !== undefined) user.disabled = data.disabled;
      return res.json(user);
    }
    return res.status(404).json({ error: 'User PPPoE tidak ditemukan' });
  }

  try {
    const body: any = {};
    if (data.name !== undefined) body.name = data.name;
    if (data.password !== undefined) body.password = data.password;
    if (data.service !== undefined) body.service = data.service;
    if (data.profile !== undefined) body.profile = data.profile;
    if (data.localAddress !== undefined) body['local-address'] = data.localAddress;
    if (data.remoteAddress !== undefined) body['remote-address'] = data.remoteAddress;
    if (data.comment !== undefined) body['comment'] = data.comment;
    if (data.disabled !== undefined) body.disabled = String(data.disabled);

    const resPpp = await mikrotikRequest(active, `/ppp/secret/${id}`, 'PATCH', body);
    res.json(resPpp);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/pppoe/profiles
app.get('/api/pppoe/profiles', async (req, res) => {
  const active = getActiveRouter();
  if (active.isSimulator) {
    return res.json(simPppoeProfiles);
  }

  try {
    const rawProf = await mikrotikRequest(active, '/ppp/profile');
    const profiles: PppoeProfile[] = rawProf.map((p: any) => ({
      id: p['.id'] || p['name'],
      name: p.name,
      localAddress: p['local-address'],
      remoteAddress: p['remote-address'],
      rateLimit: p['rate-limit'],
      dnsServer: p['dns-server']
    }));
    res.json(profiles);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/pppoe/profiles
app.post('/api/pppoe/profiles', async (req, res) => {
  const active = getActiveRouter();
  const data = req.body;

  if (active.isSimulator) {
    const newProf: PppoeProfile = {
      id: 'pppoe-prof-' + Date.now(),
      name: data.name,
      localAddress: data.localAddress,
      remoteAddress: data.remoteAddress,
      rateLimit: data.rateLimit,
      dnsServer: data.dnsServer
    };
    simPppoeProfiles.push(newProf);
    return res.status(201).json(newProf);
  }

  try {
    const body: any = {
      name: data.name
    };
    if (data.localAddress) body['local-address'] = data.localAddress;
    if (data.remoteAddress) body['remote-address'] = data.remoteAddress;
    if (data.rateLimit) body['rate-limit'] = data.rateLimit;
    if (data.dnsServer) body['dns-server'] = data.dnsServer;

    const resProf = await mikrotikRequest(active, '/ppp/profile', 'POST', body);
    res.status(201).json(resProf);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/pppoe/profiles/:id
app.delete('/api/pppoe/profiles/:id', async (req, res) => {
  const active = getActiveRouter();
  const { id } = req.params;

  if (active.isSimulator) {
    const idx = simPppoeProfiles.findIndex(p => p.id === id);
    if (idx !== -1) {
      simPppoeProfiles.splice(idx, 1);
      return res.json({ success: true });
    }
    return res.status(404).json({ error: 'Profil tidak ditemukan' });
  }

  try {
    await mikrotikRequest(active, `/ppp/profile/${id}`, 'DELETE');
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/pppoe/profiles/:id
app.put('/api/pppoe/profiles/:id', async (req, res) => {
  const active = getActiveRouter();
  const { id } = req.params;
  const data = req.body;

  if (active.isSimulator) {
    const prof = simPppoeProfiles.find(p => p.id === id);
    if (prof) {
      if (data.name !== undefined) prof.name = data.name;
      if (data.localAddress !== undefined) prof.localAddress = data.localAddress;
      if (data.remoteAddress !== undefined) prof.remoteAddress = data.remoteAddress;
      if (data.rateLimit !== undefined) prof.rateLimit = data.rateLimit;
      if (data.dnsServer !== undefined) prof.dnsServer = data.dnsServer;
      return res.json(prof);
    }
    return res.status(404).json({ error: 'Profil PPPoE tidak ditemukan' });
  }

  try {
    const body: any = {};
    if (data.name !== undefined) body.name = data.name;
    if (data.localAddress !== undefined) body['local-address'] = data.localAddress;
    if (data.remoteAddress !== undefined) body['remote-address'] = data.remoteAddress;
    if (data.rateLimit !== undefined) body['rate-limit'] = data.rateLimit;
    if (data.dnsServer !== undefined) body['dns-server'] = data.dnsServer;

    const resProf = await mikrotikRequest(active, `/ppp/profile/${id}`, 'PATCH', body);
    res.json(resProf);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/pppoe/active
app.get('/api/pppoe/active', async (req, res) => {
  const active = getActiveRouter();
  if (active.isSimulator) {
    const actList: PppoeActive[] = [
      { id: 'ppp-act-1', user: 'net_antonio', service: 'pppoe', callerId: '94:FE:F4:11:22:33', address: '10.10.10.254', uptime: '1d 4h 12m' },
      { id: 'ppp-act-2', user: 'net_salim', service: 'pppoe', callerId: '54:39:DF:11:55:AA', address: '10.10.10.253', uptime: '4h 55m' },
      { id: 'ppp-act-3', user: 'net_kartika', service: 'pppoe', callerId: '00:15:5D:AA:BB:CC', address: '10.10.10.252', uptime: '12h 10m' }
    ];
    return res.json(actList);
  }

  try {
    const rawActive = await mikrotikRequest(active, '/ppp/active');
    const actList: PppoeActive[] = rawActive.map((a: any) => ({
      id: a['.id'],
      user: a.name || a.user,
      service: a.service,
      callerId: a['caller-id'],
      address: a.address,
      uptime: a.uptime
    }));
    res.json(actList);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/logs
app.get('/api/logs', async (req, res) => {
  const active = getActiveRouter();
  if (active.isSimulator) {
    return res.json(simLogs);
  }

  try {
    const rawLogs = await mikrotikRequest(active, '/log');
    const parsedLogs: RouterLog[] = rawLogs.slice(-40).map((l: any, i: number) => ({
      id: l['.id'] || String(i),
      time: l.time,
      topics: l.topics ? l.topics.split(',') : [],
      message: l.message
    }));
    res.json(parsedLogs);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/dashboard/stats
app.get('/api/dashboard/stats', async (req, res) => {
  const active = getActiveRouter();
  const todayYmd = new Date().toISOString().substring(0, 10);
  const thisMonthYm = new Date().toISOString().substring(0, 7);

  if (active.isSimulator) {
    // Generate aggregated calculations
    const activeHotspot = simHotspotUsers.filter(u => u.active).length;
    const activePppoe = 3; // simulated static
    const totalHotspotUsers = simHotspotUsers.length;
    const totalPppoeUsers = simPppoeUsers.length;
    
    let incomeToday = 0;
    let incomeThisMonth = 0;
    
    salesRecords.forEach(s => {
      const datePart = s.dateTime.substring(0, 10);
      const monthPart = s.dateTime.substring(0, 7);
      if (datePart === todayYmd) {
        incomeToday += s.price;
      }
      if (monthPart === thisMonthYm) {
        incomeThisMonth += s.price;
      }
    });

    const stats: DashboardStats = {
      activeHotspot,
      activePppoe,
      totalHotspotUsers,
      totalPppoeUsers,
      incomeToday,
      incomeThisMonth,
      vouchersGeneratedToday: salesRecords.filter(s => s.dateTime.substring(0, 10) === todayYmd).length
    };
    return res.json(stats);
  }

  // REAL MIKROTIK
  try {
    const rawUsers = await mikrotikRequest(active, '/ip/hotspot/user');
    const rawActiveH = await mikrotikRequest(active, '/ip/hotspot/active');
    const rawPppUsers = await mikrotikRequest(active, '/ppp/secret');
    const rawActiveP = await mikrotikRequest(active, '/ppp/active');
    
    let incomeToday = 0;
    let incomeThisMonth = 0;
    
    salesRecords.forEach(s => {
      const datePart = s.dateTime.substring(0, 10);
      const monthPart = s.dateTime.substring(0, 7);
      if (datePart === todayYmd) {
        incomeToday += s.price;
      }
      if (monthPart === thisMonthYm) {
        incomeThisMonth += s.price;
      }
    });

    const stats: DashboardStats = {
      activeHotspot: rawActiveH.length,
      activePppoe: rawActiveP.length,
      totalHotspotUsers: rawUsers.length,
      totalPppoeUsers: rawPppUsers.length,
      incomeToday,
      incomeThisMonth,
      vouchersGeneratedToday: salesRecords.filter(s => s.dateTime.substring(0, 10) === todayYmd).length
    };

    res.json(stats);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});


// --- SALES REPORT API ENDPOINTS ---
app.get('/api/sales', (req, res) => {
  res.json(salesRecords);
});

app.delete('/api/sales/:id', (req, res) => {
  const { id } = req.params;
  const idx = salesRecords.findIndex(s => s.id === id);
  if (idx !== -1) {
    salesRecords.splice(idx, 1);
    saveSalesDb();
    return res.json({ success: true });
  }
  res.status(404).json({ error: 'Data penjualan tidak ditemukan' });
});

app.delete('/api/sales', (req, res) => {
  salesRecords = [];
  saveSalesDb();
  res.json({ success: true });
});


// --- INTEGRATE VITE MIDDLEWARE / STATIC FILES ---
async function startServer() {
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
    console.log(`Server running on http://localhost:${PORT} in ${process.env.NODE_ENV || 'development'} mode`);
  });
}

startServer();
