import { create } from 'zustand';
import type { WalletAccount, NetworkConfig, TokenBalance, ConnectedSite } from '@/types';
import type { PendingRequest } from '@/core/storage';

interface WalletStore {
  // State
  isInitialized: boolean;
  isLoading: boolean;
  hasWallet: boolean;
  isLocked: boolean;
  accounts: WalletAccount[];
  currentAccount: WalletAccount | null;
  balance: number;
  tokens: TokenBalance[];
  network: NetworkConfig | null;
  connectedSites: ConnectedSite[];
  pendingRequests: PendingRequest[];
  error: string | null;

  // Actions
  setInitialized: (value: boolean) => void;
  setLoading: (value: boolean) => void;
  setHasWallet: (value: boolean) => void;
  setIsLocked: (value: boolean) => void;
  setAccounts: (accounts: WalletAccount[]) => void;
  setCurrentAccount: (account: WalletAccount | null) => void;
  setBalance: (balance: number) => void;
  setTokens: (tokens: TokenBalance[]) => void;
  setNetwork: (network: NetworkConfig) => void;
  setConnectedSites: (sites: ConnectedSite[]) => void;
  setPendingRequests: (requests: PendingRequest[]) => void;
  setError: (error: string | null) => void;
  reset: () => void;
}

const initialState = {
  isInitialized: false,
  isLoading: true,
  hasWallet: false,
  isLocked: true,
  accounts: [],
  currentAccount: null,
  balance: 0,
  tokens: [],
  network: null,
  connectedSites: [],
  pendingRequests: [],
  error: null,
};

export const useWalletStore = create<WalletStore>((set) => ({
  ...initialState,

  setInitialized: (value) => set({ isInitialized: value }),
  setLoading: (value) => set({ isLoading: value }),
  setHasWallet: (value) => set({ hasWallet: value }),
  setIsLocked: (value) => set({ isLocked: value }),
  setAccounts: (accounts) => set({ accounts }),
  setCurrentAccount: (account) => set({ currentAccount: account }),
  setBalance: (balance) => set({ balance }),
  setTokens: (tokens) => set({ tokens }),
  setNetwork: (network) => set({ network }),
  setConnectedSites: (sites) => set({ connectedSites: sites }),
  setPendingRequests: (requests) => set({ pendingRequests: requests }),
  setError: (error) => set({ error }),
  reset: () => set(initialState),
}));

// Helper hook for sending messages to background script
export function sendMessage<T = unknown>(type: string, payload?: unknown): Promise<T> {
  return new Promise((resolve, reject) => {
    chrome.runtime.sendMessage({ type, ...payload }, (response) => {
      if (chrome.runtime.lastError) {
        reject(new Error(chrome.runtime.lastError.message));
      } else if (response?.error) {
        reject(new Error(response.error));
      } else {
        resolve(response);
      }
    });
  });
}
