// Inpage provider - Injected into web pages to provide wallet functionality

import { PublicKey, Transaction, VersionedTransaction, SendOptions } from '@solana/web3.js';

interface SolWalletEvents {
  connect: (publicKey: PublicKey) => void;
  disconnect: () => void;
  accountChanged: (publicKey: PublicKey | null) => void;
}

type EventName = keyof SolWalletEvents;

class SolWalletProvider {
  private _publicKey: PublicKey | null = null;
  private _isConnected: boolean = false;
  private _pendingRequests: Map<string, { resolve: Function; reject: Function }> = new Map();
  private _eventListeners: Map<EventName, Set<Function>> = new Map();

  constructor() {
    this._setupMessageListener();
    this._announceWallet();
  }

  get publicKey(): PublicKey | null {
    return this._publicKey;
  }

  get isConnected(): boolean {
    return this._isConnected;
  }

  get isPhantom(): boolean {
    return false; // We're not Phantom
  }

  get isSolWallet(): boolean {
    return true;
  }

  private _setupMessageListener(): void {
    window.addEventListener('message', (event) => {
      if (event.source !== window) return;

      if (event.data?.type === 'SOL_WALLET_RESPONSE') {
        this._handleResponse(event.data.data);
      } else if (event.data?.type === 'SOL_WALLET_EVENT') {
        this._handleEvent(event.data.data);
      }
    });
  }

  private _handleResponse(response: any): void {
    const pending = this._pendingRequests.get(response.id);
    if (!pending) return;

    this._pendingRequests.delete(response.id);

    if (response.error) {
      pending.reject(new Error(response.error.message));
    } else if (response.result?.pending) {
      // Request is pending user approval, don't resolve yet
      return;
    } else {
      pending.resolve(response.result);
    }
  }

  private _handleEvent(event: any): void {
    if (event.type === 'REQUEST_RESPONSE') {
      const pending = this._pendingRequests.get(event.id);
      if (!pending) return;

      this._pendingRequests.delete(event.id);

      if (event.error) {
        pending.reject(new Error(event.error.message));
      } else {
        // Handle specific response types
        if (event.result?.publicKey) {
          this._publicKey = new PublicKey(event.result.publicKey);
          this._isConnected = true;
          this._emit('connect', this._publicKey);
        }
        pending.resolve(event.result);
      }
    } else if (event.type === 'WALLET_LOCKED') {
      this._publicKey = null;
      this._isConnected = false;
      this._emit('disconnect');
    }
  }

  private _sendMessage(type: string, payload?: any): Promise<any> {
    return new Promise((resolve, reject) => {
      const id = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

      this._pendingRequests.set(id, { resolve, reject });

      window.postMessage({
        type: 'SOL_WALLET_REQUEST',
        data: { type, payload, id },
      }, '*');

      // Timeout after 5 minutes
      setTimeout(() => {
        if (this._pendingRequests.has(id)) {
          this._pendingRequests.delete(id);
          reject(new Error('Request timeout'));
        }
      }, 5 * 60 * 1000);
    });
  }

  async connect(): Promise<{ publicKey: PublicKey }> {
    const result = await this._sendMessage('CONNECT');

    if (result.publicKey) {
      this._publicKey = new PublicKey(result.publicKey);
      this._isConnected = true;
      this._emit('connect', this._publicKey);
    }

    return { publicKey: this._publicKey! };
  }

  async disconnect(): Promise<void> {
    await this._sendMessage('DISCONNECT');
    this._publicKey = null;
    this._isConnected = false;
    this._emit('disconnect');
  }

  async signMessage(message: Uint8Array): Promise<{ signature: Uint8Array }> {
    if (!this._isConnected) {
      throw new Error('Wallet not connected');
    }

    const result = await this._sendMessage('SIGN_MESSAGE', {
      message: Array.from(message),
    });

    return {
      signature: new Uint8Array(result.signature),
    };
  }

  async signTransaction<T extends Transaction | VersionedTransaction>(
    transaction: T
  ): Promise<T> {
    if (!this._isConnected) {
      throw new Error('Wallet not connected');
    }

    const serialized = transaction.serialize({
      requireAllSignatures: false,
      verifySignatures: false,
    });

    const result = await this._sendMessage('SIGN_TRANSACTION', {
      transaction: Array.from(serialized),
    });

    const signedTxBytes = new Uint8Array(result.signedTransaction);

    if (transaction instanceof VersionedTransaction) {
      return VersionedTransaction.deserialize(signedTxBytes) as T;
    } else {
      return Transaction.from(signedTxBytes) as T;
    }
  }

  async signAllTransactions<T extends Transaction | VersionedTransaction>(
    transactions: T[]
  ): Promise<T[]> {
    return Promise.all(transactions.map((tx) => this.signTransaction(tx)));
  }

  async signAndSendTransaction<T extends Transaction | VersionedTransaction>(
    transaction: T,
    options?: SendOptions
  ): Promise<{ signature: string }> {
    if (!this._isConnected) {
      throw new Error('Wallet not connected');
    }

    const serialized = transaction.serialize({
      requireAllSignatures: false,
      verifySignatures: false,
    });

    const result = await this._sendMessage('SIGN_AND_SEND_TRANSACTION', {
      transaction: Array.from(serialized),
      options,
    });

    return { signature: result.signature };
  }

  on<E extends EventName>(event: E, callback: SolWalletEvents[E]): void {
    if (!this._eventListeners.has(event)) {
      this._eventListeners.set(event, new Set());
    }
    this._eventListeners.get(event)!.add(callback);
  }

  off<E extends EventName>(event: E, callback: SolWalletEvents[E]): void {
    this._eventListeners.get(event)?.delete(callback);
  }

  private _emit<E extends EventName>(event: E, ...args: Parameters<SolWalletEvents[E]>): void {
    this._eventListeners.get(event)?.forEach((callback) => {
      try {
        (callback as Function)(...args);
      } catch (error) {
        console.error(`Error in ${event} listener:`, error);
      }
    });
  }

  private _announceWallet(): void {
    // Wallet Standard announcement
    const walletInfo = {
      name: 'Sol Wallet',
      icon: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTI4IiBoZWlnaHQ9IjEyOCIgdmlld0JveD0iMCAwIDEyOCAxMjgiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIxMjgiIGhlaWdodD0iMTI4IiByeD0iMjQiIGZpbGw9InVybCgjcGFpbnQwX2xpbmVhcikiLz4KPHBhdGggZD0iTTk2IDQwSDMyQzI5Ljc5MSA0MCAyOCA0MS43OTEgMjggNDRWODRDMjggODYuMjA5IDI5Ljc5MSA4OCAzMiA4OEg5NkM5OC4yMDkgODggMTAwIDg2LjIwOSAxMDAgODRWNDRDMTAwIDQxLjc5MSA5OC4yMDkgNDAgOTYgNDBaIiBzdHJva2U9IndoaXRlIiBzdHJva2Utd2lkdGg9IjQiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCIvPgo8cGF0aCBkPSJNNjQgNzJDNjguNDE4MyA3MiA3MiA2OC40MTgzIDcyIDY0QzcyIDU5LjU4MTcgNjguNDE4MyA1NiA2NCA1NkM1OS41ODE3IDU2IDU2IDU5LjU4MTcgNTYgNjRDNTYgNjguNDE4MyA1OS41ODE3IDcyIDY0IDcyWiIgc3Ryb2tlPSJ3aGl0ZSIgc3Ryb2tlLXdpZHRoPSI0IiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiLz4KPGRlZnM+CjxsaW5lYXJHcmFkaWVudCBpZD0icGFpbnQwX2xpbmVhciIgeDE9IjAiIHkxPSIwIiB4Mj0iMTI4IiB5Mj0iMTI4IiBncmFkaWVudFVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+CjxzdG9wIHN0b3AtY29sb3I9IiM5OTQ1RkYiLz4KPHN0b3Agb2Zmc2V0PSIxIiBzdG9wLWNvbG9yPSIjMTRGMTk1Ii8+CjwvbGluZWFyR3JhZGllbnQ+CjwvZGVmcz4KPC9zdmc+',
      rdns: 'app.solwallet',
    };

    // Dispatch wallet standard event
    window.dispatchEvent(
      new CustomEvent('wallet-standard:app-ready', {
        detail: walletInfo,
      })
    );
  }
}

// Create and expose provider
const provider = new SolWalletProvider();

// Expose on window
declare global {
  interface Window {
    solana?: SolWalletProvider;
    solWallet?: SolWalletProvider;
  }
}

// Only expose if not already present or if we're preferred
if (!window.solana) {
  window.solana = provider;
}

// Always expose as solWallet
window.solWallet = provider;

// Announce to wallet-standard adapters
window.dispatchEvent(new Event('sol-wallet:ready'));

console.log('Sol Wallet provider injected');
