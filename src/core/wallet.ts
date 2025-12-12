import { Keypair, Transaction, VersionedTransaction } from '@solana/web3.js';
import {
  generateMnemonic,
  validateMnemonic,
  mnemonicToSeed,
  deriveKeypair,
  encryptData,
  decryptData,
  generateSalt,
  generateIV,
  signMessage,
} from './crypto';
import type { WalletAccount, EncryptedVault } from '@/types';

const VAULT_STORAGE_KEY = 'sol_wallet_vault';
const LOCK_TIMEOUT_KEY = 'sol_wallet_lock_timeout';

export class WalletManager {
  private mnemonic: string | null = null;
  private keypairs: Map<string, Keypair> = new Map();
  private password: string | null = null;
  private lockTimeout: number = 5 * 60 * 1000; // 5 minutes default

  async createWallet(password: string): Promise<{ mnemonic: string; account: WalletAccount }> {
    const mnemonic = generateMnemonic();
    this.mnemonic = mnemonic;
    this.password = password;

    const seed = await mnemonicToSeed(mnemonic);
    const keypair = deriveKeypair(seed, 0);

    const account: WalletAccount = {
      publicKey: keypair.publicKey.toBase58(),
      name: 'Account 1',
      index: 0,
      isImported: false,
    };

    this.keypairs.set(account.publicKey, keypair);

    await this.saveVault([account]);

    return { mnemonic, account };
  }

  async importWallet(mnemonic: string, password: string): Promise<WalletAccount> {
    if (!validateMnemonic(mnemonic)) {
      throw new Error('Invalid mnemonic phrase');
    }

    this.mnemonic = mnemonic;
    this.password = password;

    const seed = await mnemonicToSeed(mnemonic);
    const keypair = deriveKeypair(seed, 0);

    const account: WalletAccount = {
      publicKey: keypair.publicKey.toBase58(),
      name: 'Account 1',
      index: 0,
      isImported: false,
    };

    this.keypairs.set(account.publicKey, keypair);

    await this.saveVault([account]);

    return account;
  }

  async unlock(password: string): Promise<WalletAccount[]> {
    const vault = await this.loadVault();
    if (!vault) {
      throw new Error('No wallet found');
    }

    try {
      const decryptedMnemonic = decryptData(
        vault.encryptedMnemonic,
        password,
        vault.salt,
        vault.iv
      );

      if (!validateMnemonic(decryptedMnemonic)) {
        throw new Error('Invalid password');
      }

      this.mnemonic = decryptedMnemonic;
      this.password = password;

      const seed = await mnemonicToSeed(decryptedMnemonic);

      for (const account of vault.accounts) {
        if (!account.isImported) {
          const keypair = deriveKeypair(seed, account.index);
          this.keypairs.set(account.publicKey, keypair);
        }
      }

      return vault.accounts;
    } catch (error) {
      throw new Error('Invalid password');
    }
  }

  lock(): void {
    this.mnemonic = null;
    this.password = null;
    this.keypairs.clear();
  }

  isLocked(): boolean {
    return this.mnemonic === null;
  }

  async addAccount(name?: string): Promise<WalletAccount> {
    if (!this.mnemonic || !this.password) {
      throw new Error('Wallet is locked');
    }

    const vault = await this.loadVault();
    if (!vault) {
      throw new Error('No vault found');
    }

    const nextIndex = vault.accounts.filter(a => !a.isImported).length;
    const seed = await mnemonicToSeed(this.mnemonic);
    const keypair = deriveKeypair(seed, nextIndex);

    const account: WalletAccount = {
      publicKey: keypair.publicKey.toBase58(),
      name: name || `Account ${nextIndex + 1}`,
      index: nextIndex,
      isImported: false,
    };

    this.keypairs.set(account.publicKey, keypair);
    vault.accounts.push(account);

    await this.saveVault(vault.accounts);

    return account;
  }

  async importPrivateKey(privateKey: Uint8Array, name?: string): Promise<WalletAccount> {
    if (!this.password) {
      throw new Error('Wallet is locked');
    }

    const keypair = Keypair.fromSecretKey(privateKey);

    const vault = await this.loadVault();
    if (!vault) {
      throw new Error('No vault found');
    }

    const existingAccount = vault.accounts.find(
      a => a.publicKey === keypair.publicKey.toBase58()
    );

    if (existingAccount) {
      throw new Error('Account already exists');
    }

    const account: WalletAccount = {
      publicKey: keypair.publicKey.toBase58(),
      name: name || `Imported Account`,
      index: -1,
      isImported: true,
    };

    this.keypairs.set(account.publicKey, keypair);
    vault.accounts.push(account);

    await this.saveVault(vault.accounts);

    return account;
  }

  getKeypair(publicKey: string): Keypair | undefined {
    return this.keypairs.get(publicKey);
  }

  async signTransaction(
    publicKey: string,
    transaction: Transaction | VersionedTransaction
  ): Promise<Transaction | VersionedTransaction> {
    const keypair = this.keypairs.get(publicKey);
    if (!keypair) {
      throw new Error('Keypair not found');
    }

    if (transaction instanceof Transaction) {
      transaction.partialSign(keypair);
    } else {
      transaction.sign([keypair]);
    }

    return transaction;
  }

  async signAllTransactions(
    publicKey: string,
    transactions: (Transaction | VersionedTransaction)[]
  ): Promise<(Transaction | VersionedTransaction)[]> {
    const signedTransactions: (Transaction | VersionedTransaction)[] = [];

    for (const tx of transactions) {
      const signedTx = await this.signTransaction(publicKey, tx);
      signedTransactions.push(signedTx);
    }

    return signedTransactions;
  }

  signMessageWithKey(publicKey: string, message: Uint8Array): Uint8Array {
    const keypair = this.keypairs.get(publicKey);
    if (!keypair) {
      throw new Error('Keypair not found');
    }

    return signMessage(message, keypair.secretKey);
  }

  private async saveVault(accounts: WalletAccount[]): Promise<void> {
    if (!this.mnemonic || !this.password) {
      throw new Error('Cannot save vault: wallet is locked');
    }

    const salt = generateSalt();
    const iv = generateIV();

    const encryptedMnemonic = encryptData(this.mnemonic, this.password, salt, iv);

    const vault: EncryptedVault = {
      encryptedMnemonic,
      salt,
      iv,
      accounts,
    };

    await chrome.storage.local.set({ [VAULT_STORAGE_KEY]: vault });
  }

  private async loadVault(): Promise<EncryptedVault | null> {
    const result = await chrome.storage.local.get(VAULT_STORAGE_KEY);
    return result[VAULT_STORAGE_KEY] || null;
  }

  async hasExistingWallet(): Promise<boolean> {
    const vault = await this.loadVault();
    return vault !== null;
  }

  async getAccounts(): Promise<WalletAccount[]> {
    const vault = await this.loadVault();
    return vault?.accounts || [];
  }

  async updateAccountName(publicKey: string, name: string): Promise<void> {
    const vault = await this.loadVault();
    if (!vault) {
      throw new Error('No vault found');
    }

    const account = vault.accounts.find(a => a.publicKey === publicKey);
    if (!account) {
      throw new Error('Account not found');
    }

    account.name = name;
    await chrome.storage.local.set({ [VAULT_STORAGE_KEY]: vault });
  }

  async removeAccount(publicKey: string): Promise<void> {
    const vault = await this.loadVault();
    if (!vault) {
      throw new Error('No vault found');
    }

    const accountIndex = vault.accounts.findIndex(a => a.publicKey === publicKey);
    if (accountIndex === -1) {
      throw new Error('Account not found');
    }

    if (vault.accounts.length === 1) {
      throw new Error('Cannot remove the last account');
    }

    vault.accounts.splice(accountIndex, 1);
    this.keypairs.delete(publicKey);

    await chrome.storage.local.set({ [VAULT_STORAGE_KEY]: vault });
  }

  async setLockTimeout(timeout: number): Promise<void> {
    this.lockTimeout = timeout;
    await chrome.storage.local.set({ [LOCK_TIMEOUT_KEY]: timeout });
  }

  async getLockTimeout(): Promise<number> {
    const result = await chrome.storage.local.get(LOCK_TIMEOUT_KEY);
    return result[LOCK_TIMEOUT_KEY] || this.lockTimeout;
  }

  async clearWallet(): Promise<void> {
    this.lock();
    await chrome.storage.local.remove([VAULT_STORAGE_KEY, LOCK_TIMEOUT_KEY]);
  }

  async exportMnemonic(password: string): Promise<string> {
    const vault = await this.loadVault();
    if (!vault) {
      throw new Error('No wallet found');
    }

    try {
      const mnemonic = decryptData(
        vault.encryptedMnemonic,
        password,
        vault.salt,
        vault.iv
      );

      if (!validateMnemonic(mnemonic)) {
        throw new Error('Invalid password');
      }

      return mnemonic;
    } catch {
      throw new Error('Invalid password');
    }
  }
}

export const walletManager = new WalletManager();
