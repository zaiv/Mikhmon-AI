/**
 * Types and interfaces for Mikhmon Winbox Modern Dashboard
 */

export interface RouterConfig {
  id: string;
  name: string;
  ip: string;
  port: string; // HTTP REST port (default 80 or 443) or API port
  username: string;
  password?: string;
  hotspotName: string;
  dnsName: string;
  useSsl: boolean;
  isSimulator: boolean;
  isActive: boolean;
  apiType?: 'v7-rest' | 'v6-api';
}

export interface SystemResources {
  uptime: string;
  cpuLoad: number; // percentage
  cpuFrequency: number; // MHz
  freeMemory: number; // bytes
  totalMemory: number; // bytes
  freeDisk: number; // bytes
  totalDisk: number; // bytes
  boardName: string;
  version: string;
  temperature?: number; // Celsius
  voltage?: number; // Volts
}

export interface NetworkInterface {
  id: string;
  name: string;
  type: string;
  txRate: number; // bps
  rxRate: number; // bps
  status: 'running' | 'disabled' | 'link-down';
  macAddress?: string;
}

export interface HotspotUser {
  id: string;
  name: string;
  password?: string;
  profile: string;
  limitUptime?: string;
  limitBytes?: number; // bytes
  comment?: string; // used for batch and price labels
  disabled: boolean;
  bytesIn: number;
  bytesOut: number;
  uptime: string;
  active: boolean;
}

export interface HotspotProfile {
  id: string;
  name: string;
  sharedUsers: number;
  rateLimit?: string; // e.g. "1M/1M"
  price?: number; // Rupiah
  validity?: string; // e.g. "1d", "12h"
  lockUser?: 'yes' | 'no';
}

export interface HotspotActive {
  id: string;
  user: string;
  address: string;
  macAddress: string;
  uptime: string;
  bytesIn: number;
  bytesOut: number;
  keepalive: string;
}

export interface PppoeUser {
  id: string;
  name: string;
  password?: string;
  service: 'pppoe' | 'any';
  profile: string;
  localAddress?: string;
  remoteAddress?: string;
  comment?: string;
  disabled: boolean;
}

export interface PppoeProfile {
  id: string;
  name: string;
  localAddress?: string;
  remoteAddress?: string;
  rateLimit?: string; // e.g. "5M/5M"
  dnsServer?: string;
}

export interface PppoeActive {
  id: string;
  user: string;
  service: string;
  callerId: string; // Mac Address or Interface
  address: string; // IP assigned
  uptime: string;
}

export interface RouterLog {
  id: string;
  time: string;
  topics: string[];
  message: string;
}

export interface DashboardStats {
  activeHotspot: number;
  activePppoe: number;
  totalHotspotUsers: number;
  totalPppoeUsers: number;
  incomeToday: number; // in Rp
  incomeThisMonth: number; // in Rp
  vouchersGeneratedToday: number;
}

export interface VoucherGenerateOptions {
  qty: number;
  server: string;
  userMode: 'username-equals-password' | 'username-password-separate';
  nameLength: number;
  prefix: string;
  charSet: 'numeric' | 'lowercase' | 'uppercase' | 'alpha' | 'alphanumeric';
  profile: string;
  limitUptime: string;
  limitBytes: string; // e.g. "1GB", "500MB", or empty
  comment: string;
}

export interface SalesRecord {
  id: string;
  dateTime: string; // e.g., "2026-06-29 10:15:30"
  username: string;
  profile: string;
  price: number;
  validity: string;
}

