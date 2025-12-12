import { useCallback } from 'react';
import { useWalletStore, sendMessage } from './useWalletStore';
import type { WalletAccount, NetworkConfig } from '@/types';

export function useWallet() {
  const store = useWalletStore();

  const initialize = useCallback(async () => {
    try {
      store.setLoading(true);

      // Check if wallet exists
      const { hasWallet } = await sendMessage<{ hasWallet: boolean }>('HAS_WALLET');
      store.setHasWallet(hasWallet);

      if (hasWallet) {
        // Check if locked
        const { isLocked } = await sendMessage<{ isLocked: boolean }>('IS_LOCKED');
        store.setIsLocked(isLocked);

        if (!isLocked) {
          await loadAccountData();
        }
      }

      // Load network
      const network = await sendMessage<NetworkConfig>('GET_NETWORK');
      store.setNetwork(network);

      store.setInitialized(true);
    } catch (error: any) {
      store.setError(error.message);
    } finally {
      store.setLoading(false);
    }
  }, []);

  const loadAccountData = useCallback(async () => {
    try {
      // Get accounts
      const accounts = await sendMessage<WalletAccount[]>('GET_ACCOUNTS');
      store.setAccounts(accounts);

      // Get current account
      const currentPubkey = await sendMessage<string | null>('GET_CURRENT_ACCOUNT');
      const current = accounts.find((a) => a.publicKey === currentPubkey) || accounts[0];

      if (current) {
        store.setCurrentAccount(current);
        await sendMessage('SET_CURRENT_ACCOUNT', { publicKey: current.publicKey });

        // Load balance and tokens
        await Promise.all([loadBalance(current.publicKey), loadTokens(current.publicKey)]);
      }

      // Load connected sites
      const sites = await sendMessage<any[]>('GET_CONNECTED_SITES');
      store.setConnectedSites(sites);
    } catch (error: any) {
      store.setError(error.message);
    }
  }, []);

  const loadBalance = useCallback(async (publicKey: string) => {
    try {
      const balance = await sendMessage<number>('GET_BALANCE', { publicKey });
      store.setBalance(balance);
    } catch (error) {
      console.error('Failed to load balance:', error);
    }
  }, []);

  const loadTokens = useCallback(async (publicKey: string) => {
    try {
      const tokens = await sendMessage<any[]>('GET_TOKENS', { publicKey });
      store.setTokens(tokens);
    } catch (error) {
      console.error('Failed to load tokens:', error);
    }
  }, []);

  const createWallet = useCallback(async (password: string) => {
    try {
      store.setLoading(true);
      const result = await sendMessage<{ mnemonic: string; account: WalletAccount }>(
        'CREATE_WALLET',
        { password }
      );

      store.setHasWallet(true);
      store.setIsLocked(false);
      store.setAccounts([result.account]);
      store.setCurrentAccount(result.account);

      return result.mnemonic;
    } finally {
      store.setLoading(false);
    }
  }, []);

  const importWallet = useCallback(async (mnemonic: string, password: string) => {
    try {
      store.setLoading(true);
      const account = await sendMessage<WalletAccount>('IMPORT_WALLET', {
        mnemonic,
        password,
      });

      store.setHasWallet(true);
      store.setIsLocked(false);
      store.setAccounts([account]);
      store.setCurrentAccount(account);

      return account;
    } finally {
      store.setLoading(false);
    }
  }, []);

  const unlock = useCallback(async (password: string) => {
    try {
      store.setLoading(true);
      const accounts = await sendMessage<WalletAccount[]>('UNLOCK_WALLET', { password });

      store.setIsLocked(false);
      store.setAccounts(accounts);

      await loadAccountData();

      return true;
    } catch (error: any) {
      throw error;
    } finally {
      store.setLoading(false);
    }
  }, [loadAccountData]);

  const lock = useCallback(async () => {
    await sendMessage('LOCK_WALLET');
    store.setIsLocked(true);
    store.setBalance(0);
    store.setTokens([]);
  }, []);

  const switchAccount = useCallback(async (account: WalletAccount) => {
    store.setCurrentAccount(account);
    await sendMessage('SET_CURRENT_ACCOUNT', { publicKey: account.publicKey });

    await Promise.all([loadBalance(account.publicKey), loadTokens(account.publicKey)]);
  }, [loadBalance, loadTokens]);

  const addAccount = useCallback(async (name?: string) => {
    const account = await sendMessage<WalletAccount>('ADD_ACCOUNT', { name });
    store.setAccounts([...store.accounts, account]);
    return account;
  }, [store.accounts]);

  const setNetwork = useCallback(async (network: NetworkConfig) => {
    await sendMessage('SET_NETWORK', { network });
    store.setNetwork(network);

    if (store.currentAccount) {
      await Promise.all([
        loadBalance(store.currentAccount.publicKey),
        loadTokens(store.currentAccount.publicKey),
      ]);
    }
  }, [store.currentAccount, loadBalance, loadTokens]);

  const sendSol = useCallback(
    async (to: string, amount: number) => {
      if (!store.currentAccount) throw new Error('No account selected');

      const result = await sendMessage<{ signature: string }>('SEND_SOL', {
        from: store.currentAccount.publicKey,
        to,
        amount,
      });

      // Refresh balance after send
      await loadBalance(store.currentAccount.publicKey);

      return result.signature;
    },
    [store.currentAccount, loadBalance]
  );

  const sendToken = useCallback(
    async (to: string, mint: string, amount: number, decimals: number) => {
      if (!store.currentAccount) throw new Error('No account selected');

      const result = await sendMessage<{ signature: string }>('SEND_TOKEN', {
        from: store.currentAccount.publicKey,
        to,
        mint,
        amount,
        decimals,
      });

      // Refresh tokens after send
      await loadTokens(store.currentAccount.publicKey);

      return result.signature;
    },
    [store.currentAccount, loadTokens]
  );

  const requestAirdrop = useCallback(async (amount: number = 1) => {
    if (!store.currentAccount) throw new Error('No account selected');

    const result = await sendMessage<{ signature: string }>('REQUEST_AIRDROP', {
      publicKey: store.currentAccount.publicKey,
      amount,
    });

    // Refresh balance after airdrop
    await loadBalance(store.currentAccount.publicKey);

    return result.signature;
  }, [store.currentAccount, loadBalance]);

  const disconnectSite = useCallback(async (origin: string) => {
    await sendMessage('DISCONNECT_SITE', { origin });
    store.setConnectedSites(store.connectedSites.filter((s) => s.origin !== origin));
  }, [store.connectedSites]);

  const approveRequest = useCallback(async (requestId: string) => {
    if (!store.currentAccount) throw new Error('No account selected');

    await sendMessage('APPROVE_REQUEST', {
      requestId,
      publicKey: store.currentAccount.publicKey,
    });

    store.setPendingRequests(store.pendingRequests.filter((r) => r.id !== requestId));
  }, [store.currentAccount, store.pendingRequests]);

  const rejectRequest = useCallback(async (requestId: string) => {
    await sendMessage('REJECT_REQUEST', { requestId });
    store.setPendingRequests(store.pendingRequests.filter((r) => r.id !== requestId));
  }, [store.pendingRequests]);

  const exportMnemonic = useCallback(async (password: string) => {
    const result = await sendMessage<{ mnemonic: string }>('EXPORT_MNEMONIC', { password });
    return result.mnemonic;
  }, []);

  const clearWallet = useCallback(async () => {
    await sendMessage('CLEAR_WALLET');
    store.reset();
  }, []);

  const refreshBalance = useCallback(async () => {
    if (store.currentAccount) {
      await Promise.all([
        loadBalance(store.currentAccount.publicKey),
        loadTokens(store.currentAccount.publicKey),
      ]);
    }
  }, [store.currentAccount, loadBalance, loadTokens]);

  return {
    ...store,
    initialize,
    createWallet,
    importWallet,
    unlock,
    lock,
    switchAccount,
    addAccount,
    setNetwork,
    sendSol,
    sendToken,
    requestAirdrop,
    disconnectSite,
    approveRequest,
    rejectRequest,
    exportMnemonic,
    clearWallet,
    refreshBalance,
  };
}
