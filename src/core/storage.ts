import type { ConnectedSite } from '@/types';

const STORAGE_KEYS = {
  CONNECTED_SITES: 'sol_wallet_connected_sites',
  CURRENT_ACCOUNT: 'sol_wallet_current_account',
  SETTINGS: 'sol_wallet_settings',
  PENDING_REQUESTS: 'sol_wallet_pending_requests',
} as const;

export interface WalletSettings {
  autoLockTimeout: number;
  showTestNetworks: boolean;
  currency: string;
  language: string;
}

const defaultSettings: WalletSettings = {
  autoLockTimeout: 5 * 60 * 1000, // 5 minutes
  showTestNetworks: true,
  currency: 'USD',
  language: 'en',
};

export async function getConnectedSites(): Promise<ConnectedSite[]> {
  const result = await chrome.storage.local.get(STORAGE_KEYS.CONNECTED_SITES);
  return result[STORAGE_KEYS.CONNECTED_SITES] || [];
}

export async function addConnectedSite(site: ConnectedSite): Promise<void> {
  const sites = await getConnectedSites();
  const existingIndex = sites.findIndex(s => s.origin === site.origin);

  if (existingIndex >= 0) {
    sites[existingIndex] = site;
  } else {
    sites.push(site);
  }

  await chrome.storage.local.set({ [STORAGE_KEYS.CONNECTED_SITES]: sites });
}

export async function removeConnectedSite(origin: string): Promise<void> {
  const sites = await getConnectedSites();
  const filtered = sites.filter(s => s.origin !== origin);
  await chrome.storage.local.set({ [STORAGE_KEYS.CONNECTED_SITES]: filtered });
}

export async function isOriginConnected(origin: string): Promise<boolean> {
  const sites = await getConnectedSites();
  return sites.some(s => s.origin === origin);
}

export async function getCurrentAccountPublicKey(): Promise<string | null> {
  const result = await chrome.storage.local.get(STORAGE_KEYS.CURRENT_ACCOUNT);
  return result[STORAGE_KEYS.CURRENT_ACCOUNT] || null;
}

export async function setCurrentAccountPublicKey(publicKey: string): Promise<void> {
  await chrome.storage.local.set({ [STORAGE_KEYS.CURRENT_ACCOUNT]: publicKey });
}

export async function getSettings(): Promise<WalletSettings> {
  const result = await chrome.storage.local.get(STORAGE_KEYS.SETTINGS);
  return { ...defaultSettings, ...result[STORAGE_KEYS.SETTINGS] };
}

export async function updateSettings(settings: Partial<WalletSettings>): Promise<void> {
  const current = await getSettings();
  const updated = { ...current, ...settings };
  await chrome.storage.local.set({ [STORAGE_KEYS.SETTINGS]: updated });
}

export async function clearAllData(): Promise<void> {
  await chrome.storage.local.clear();
}

export interface PendingRequest {
  id: string;
  type: string;
  origin: string;
  favicon?: string;
  payload: unknown;
  timestamp: number;
}

export async function getPendingRequests(): Promise<PendingRequest[]> {
  const result = await chrome.storage.local.get(STORAGE_KEYS.PENDING_REQUESTS);
  return result[STORAGE_KEYS.PENDING_REQUESTS] || [];
}

export async function addPendingRequest(request: PendingRequest): Promise<void> {
  const requests = await getPendingRequests();
  requests.push(request);
  await chrome.storage.local.set({ [STORAGE_KEYS.PENDING_REQUESTS]: requests });
}

export async function removePendingRequest(id: string): Promise<void> {
  const requests = await getPendingRequests();
  const filtered = requests.filter(r => r.id !== id);
  await chrome.storage.local.set({ [STORAGE_KEYS.PENDING_REQUESTS]: filtered });
}

export async function getPendingRequest(id: string): Promise<PendingRequest | null> {
  const requests = await getPendingRequests();
  return requests.find(r => r.id === id) || null;
}

export async function clearPendingRequests(): Promise<void> {
  await chrome.storage.local.set({ [STORAGE_KEYS.PENDING_REQUESTS]: [] });
}
