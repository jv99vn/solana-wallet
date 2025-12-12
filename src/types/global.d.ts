import { Buffer } from 'buffer';

declare global {
  interface Window {
    Buffer: typeof Buffer;
    solana?: {
      isPhantom?: boolean;
      isSolWallet?: boolean;
      publicKey: import('@solana/web3.js').PublicKey | null;
      isConnected: boolean;
      connect(): Promise<{ publicKey: import('@solana/web3.js').PublicKey }>;
      disconnect(): Promise<void>;
      signMessage(message: Uint8Array): Promise<{ signature: Uint8Array }>;
      signTransaction<T extends import('@solana/web3.js').Transaction | import('@solana/web3.js').VersionedTransaction>(
        transaction: T
      ): Promise<T>;
      signAllTransactions<T extends import('@solana/web3.js').Transaction | import('@solana/web3.js').VersionedTransaction>(
        transactions: T[]
      ): Promise<T[]>;
      signAndSendTransaction<T extends import('@solana/web3.js').Transaction | import('@solana/web3.js').VersionedTransaction>(
        transaction: T,
        options?: import('@solana/web3.js').SendOptions
      ): Promise<{ signature: string }>;
      on(event: string, callback: (...args: unknown[]) => void): void;
      off(event: string, callback: (...args: unknown[]) => void): void;
    };
    solWallet?: Window['solana'];
  }
}

export {};
