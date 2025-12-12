import { PublicKey, Transaction, VersionedTransaction } from '@solana/web3.js';

export interface WalletAccount {
  publicKey: string;
  name: string;
  index: number;
  isImported: boolean;
}

export interface EncryptedVault {
  encryptedMnemonic: string;
  salt: string;
  iv: string;
  accounts: WalletAccount[];
}

export interface TokenBalance {
  mint: string;
  symbol: string;
  name: string;
  balance: number;
  decimals: number;
  uiBalance: string;
  logoUri?: string;
  usdValue?: number;
}

export interface NetworkConfig {
  name: string;
  endpoint: string;
  cluster: 'mainnet-beta' | 'testnet' | 'devnet' | 'localnet';
}

export interface Transaction {
  signature: string;
  timestamp: number;
  type: 'send' | 'receive' | 'swap' | 'unknown';
  amount?: number;
  token?: string;
  from?: string;
  to?: string;
  status: 'confirmed' | 'pending' | 'failed';
}

export interface ConnectedSite {
  origin: string;
  favicon?: string;
  name: string;
  connectedAt: number;
  permissions: string[];
}

export interface WalletState {
  isInitialized: boolean;
  isLocked: boolean;
  currentAccount: WalletAccount | null;
  accounts: WalletAccount[];
  network: NetworkConfig;
  connectedSites: ConnectedSite[];
}

export type MessageType =
  | 'CONNECT'
  | 'DISCONNECT'
  | 'SIGN_MESSAGE'
  | 'SIGN_TRANSACTION'
  | 'SIGN_ALL_TRANSACTIONS'
  | 'SIGN_AND_SEND_TRANSACTION'
  | 'GET_ACCOUNT'
  | 'GET_ACCOUNTS';

export interface WalletMessage {
  type: MessageType;
  payload?: unknown;
  id: string;
  origin?: string;
}

export interface WalletResponse {
  id: string;
  result?: unknown;
  error?: {
    code: number;
    message: string;
  };
}

export interface SignMessageRequest {
  message: Uint8Array;
  display?: 'hex' | 'utf8';
}

export interface SignTransactionRequest {
  transaction: Transaction | VersionedTransaction;
}

export interface SendTransactionRequest {
  transaction: Transaction | VersionedTransaction;
  options?: {
    skipPreflight?: boolean;
    preflightCommitment?: string;
    maxRetries?: number;
  };
}

export interface PendingRequest {
  id: string;
  type: MessageType;
  origin: string;
  favicon?: string;
  payload: unknown;
  timestamp: number;
}

// Wallet Standard Types
export interface SolanaWalletStandard {
  version: '1.0.0';
  name: string;
  icon: string;
  chains: string[];
  features: WalletFeature[];
  accounts: StandardAccount[];
}

export interface StandardAccount {
  address: string;
  publicKey: Uint8Array;
  chains: string[];
  features: string[];
}

export interface WalletFeature {
  [key: string]: unknown;
}
