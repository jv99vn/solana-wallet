import { walletManager } from '@/core/wallet';
import { solanaConnection } from '@/core/connection';
import {
  getConnectedSites,
  addConnectedSite,
  removeConnectedSite,
  isOriginConnected,
  getCurrentAccountPublicKey,
  setCurrentAccountPublicKey,
  addPendingRequest,
  removePendingRequest,
  getPendingRequest,
  getSettings,
} from '@/core/storage';
import type { WalletMessage, WalletResponse, ConnectedSite } from '@/types';
import { PublicKey, Transaction, VersionedTransaction } from '@solana/web3.js';

// Initialize connection on startup
solanaConnection.initialize();

// Auto-lock timer
let lockTimer: ReturnType<typeof setTimeout> | null = null;

async function resetLockTimer(): Promise<void> {
  if (lockTimer) {
    clearTimeout(lockTimer);
  }

  const settings = await getSettings();
  lockTimer = setTimeout(() => {
    walletManager.lock();
    chrome.runtime.sendMessage({ type: 'WALLET_LOCKED' }).catch(() => {});
  }, settings.autoLockTimeout);
}

// Message handler for internal extension communication
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  handleInternalMessage(message, sender)
    .then(sendResponse)
    .catch((error) => sendResponse({ error: error.message }));
  return true; // Keep channel open for async response
});

async function handleInternalMessage(
  message: any,
  _sender: chrome.runtime.MessageSender
): Promise<any> {
  await resetLockTimer();

  switch (message.type) {
    case 'CREATE_WALLET':
      return await walletManager.createWallet(message.password);

    case 'IMPORT_WALLET':
      return await walletManager.importWallet(message.mnemonic, message.password);

    case 'UNLOCK_WALLET':
      return await walletManager.unlock(message.password);

    case 'LOCK_WALLET':
      walletManager.lock();
      return { success: true };

    case 'IS_LOCKED':
      return { isLocked: walletManager.isLocked() };

    case 'HAS_WALLET':
      return { hasWallet: await walletManager.hasExistingWallet() };

    case 'GET_ACCOUNTS':
      return await walletManager.getAccounts();

    case 'ADD_ACCOUNT':
      return await walletManager.addAccount(message.name);

    case 'GET_CURRENT_ACCOUNT':
      return await getCurrentAccountPublicKey();

    case 'SET_CURRENT_ACCOUNT':
      await setCurrentAccountPublicKey(message.publicKey);
      return { success: true };

    case 'GET_BALANCE':
      return await solanaConnection.getBalance(message.publicKey);

    case 'GET_TOKENS':
      return await solanaConnection.getTokenAccounts(message.publicKey);

    case 'GET_NETWORK':
      return solanaConnection.getNetwork();

    case 'SET_NETWORK':
      await solanaConnection.setNetwork(message.network);
      return { success: true };

    case 'GET_CONNECTED_SITES':
      return await getConnectedSites();

    case 'DISCONNECT_SITE':
      await removeConnectedSite(message.origin);
      return { success: true };

    case 'SEND_SOL': {
      const from = new PublicKey(message.from);
      const to = new PublicKey(message.to);
      const tx = await solanaConnection.createTransferTransaction(from, to, message.amount);
      const signedTx = await walletManager.signTransaction(message.from, tx);
      const signature = await solanaConnection.sendTransaction(signedTx as Transaction);
      return { signature };
    }

    case 'SEND_TOKEN': {
      const from = new PublicKey(message.from);
      const to = new PublicKey(message.to);
      const mint = new PublicKey(message.mint);
      const tx = await solanaConnection.createTokenTransferTransaction(
        from,
        to,
        mint,
        message.amount,
        message.decimals
      );
      const signedTx = await walletManager.signTransaction(message.from, tx);
      const signature = await solanaConnection.sendTransaction(signedTx as Transaction);
      return { signature };
    }

    case 'REQUEST_AIRDROP':
      return { signature: await solanaConnection.requestAirdrop(message.publicKey, message.amount) };

    case 'GET_TRANSACTIONS':
      return await solanaConnection.getRecentTransactions(message.publicKey, message.limit);

    case 'EXPORT_MNEMONIC':
      return { mnemonic: await walletManager.exportMnemonic(message.password) };

    case 'CLEAR_WALLET':
      await walletManager.clearWallet();
      return { success: true };

    case 'APPROVE_REQUEST':
      return await approveRequest(message.requestId, message.publicKey);

    case 'REJECT_REQUEST':
      return await rejectRequest(message.requestId);

    default:
      throw new Error(`Unknown message type: ${message.type}`);
  }
}

// Handle messages from content scripts (dApp requests)
chrome.runtime.onConnect.addListener((port) => {
  if (port.name !== 'sol-wallet-provider') return;

  port.onMessage.addListener(async (message: WalletMessage) => {
    try {
      const response = await handleProviderMessage(message, port.sender?.tab?.url);
      port.postMessage(response);
    } catch (error: any) {
      port.postMessage({
        id: message.id,
        error: { code: -1, message: error.message },
      } as WalletResponse);
    }
  });
});

async function handleProviderMessage(
  message: WalletMessage,
  tabUrl?: string
): Promise<WalletResponse> {
  const origin = tabUrl ? new URL(tabUrl).origin : 'unknown';

  switch (message.type) {
    case 'CONNECT':
      return await handleConnect(message.id, origin);

    case 'DISCONNECT':
      return await handleDisconnect(message.id, origin);

    case 'GET_ACCOUNT':
      return await handleGetAccount(message.id, origin);

    case 'SIGN_MESSAGE':
      return await handleSignMessage(message.id, origin, message.payload as { message: number[] });

    case 'SIGN_TRANSACTION':
      return await handleSignTransaction(message.id, origin, message.payload);

    case 'SIGN_AND_SEND_TRANSACTION':
      return await handleSignAndSendTransaction(message.id, origin, message.payload);

    default:
      return {
        id: message.id,
        error: { code: -1, message: `Unknown message type: ${message.type}` },
      };
  }
}

async function handleConnect(id: string, origin: string): Promise<WalletResponse> {
  const isConnected = await isOriginConnected(origin);

  if (isConnected && !walletManager.isLocked()) {
    const publicKey = await getCurrentAccountPublicKey();
    return { id, result: { publicKey } };
  }

  // Create pending request and open popup for approval
  await addPendingRequest({
    id,
    type: 'CONNECT',
    origin,
    payload: null,
    timestamp: Date.now(),
  });

  await openPopupForApproval();

  return { id, result: { pending: true } };
}

async function handleDisconnect(id: string, origin: string): Promise<WalletResponse> {
  await removeConnectedSite(origin);
  return { id, result: { success: true } };
}

async function handleGetAccount(id: string, origin: string): Promise<WalletResponse> {
  const isConnected = await isOriginConnected(origin);

  if (!isConnected) {
    return {
      id,
      error: { code: 4001, message: 'Site not connected' },
    };
  }

  if (walletManager.isLocked()) {
    return {
      id,
      error: { code: 4002, message: 'Wallet is locked' },
    };
  }

  const publicKey = await getCurrentAccountPublicKey();
  return { id, result: { publicKey } };
}

async function handleSignMessage(
  id: string,
  origin: string,
  payload: { message: number[] }
): Promise<WalletResponse> {
  const isConnected = await isOriginConnected(origin);

  if (!isConnected) {
    return {
      id,
      error: { code: 4001, message: 'Site not connected' },
    };
  }

  await addPendingRequest({
    id,
    type: 'SIGN_MESSAGE',
    origin,
    payload,
    timestamp: Date.now(),
  });

  await openPopupForApproval();

  return { id, result: { pending: true } };
}

async function handleSignTransaction(
  id: string,
  origin: string,
  payload: unknown
): Promise<WalletResponse> {
  const isConnected = await isOriginConnected(origin);

  if (!isConnected) {
    return {
      id,
      error: { code: 4001, message: 'Site not connected' },
    };
  }

  await addPendingRequest({
    id,
    type: 'SIGN_TRANSACTION',
    origin,
    payload,
    timestamp: Date.now(),
  });

  await openPopupForApproval();

  return { id, result: { pending: true } };
}

async function handleSignAndSendTransaction(
  id: string,
  origin: string,
  payload: unknown
): Promise<WalletResponse> {
  const isConnected = await isOriginConnected(origin);

  if (!isConnected) {
    return {
      id,
      error: { code: 4001, message: 'Site not connected' },
    };
  }

  await addPendingRequest({
    id,
    type: 'SIGN_AND_SEND_TRANSACTION',
    origin,
    payload,
    timestamp: Date.now(),
  });

  await openPopupForApproval();

  return { id, result: { pending: true } };
}

async function approveRequest(requestId: string, publicKey: string): Promise<any> {
  const request = await getPendingRequest(requestId);
  if (!request) {
    throw new Error('Request not found');
  }

  let result: any;

  switch (request.type) {
    case 'CONNECT': {
      const site: ConnectedSite = {
        origin: request.origin,
        name: request.origin,
        connectedAt: Date.now(),
        permissions: ['signMessage', 'signTransaction'],
      };
      await addConnectedSite(site);
      result = { publicKey };
      break;
    }

    case 'SIGN_MESSAGE': {
      const payload = request.payload as { message: number[] };
      const messageBytes = new Uint8Array(payload.message);
      const signature = walletManager.signMessageWithKey(publicKey, messageBytes);
      result = { signature: Array.from(signature) };
      break;
    }

    case 'SIGN_TRANSACTION': {
      const payload = request.payload as { transaction: number[] };
      const txBytes = new Uint8Array(payload.transaction);
      let tx: Transaction | VersionedTransaction;

      try {
        tx = VersionedTransaction.deserialize(txBytes);
      } catch {
        tx = Transaction.from(txBytes);
      }

      const signedTx = await walletManager.signTransaction(publicKey, tx);
      result = { signedTransaction: Array.from(signedTx.serialize()) };
      break;
    }

    case 'SIGN_AND_SEND_TRANSACTION': {
      const payload = request.payload as { transaction: number[]; options?: any };
      const txBytes = new Uint8Array(payload.transaction);
      let tx: Transaction | VersionedTransaction;

      try {
        tx = VersionedTransaction.deserialize(txBytes);
      } catch {
        tx = Transaction.from(txBytes);
      }

      const signedTx = await walletManager.signTransaction(publicKey, tx);
      const signature = await solanaConnection.sendTransaction(
        signedTx,
        payload.options
      );
      result = { signature };
      break;
    }

    default:
      throw new Error(`Unknown request type: ${request.type}`);
  }

  await removePendingRequest(requestId);

  // Send response back to content script
  broadcastToTabs({
    type: 'REQUEST_RESPONSE',
    id: requestId,
    result,
  });

  return result;
}

async function rejectRequest(requestId: string): Promise<void> {
  await removePendingRequest(requestId);

  // Send rejection to content script
  broadcastToTabs({
    type: 'REQUEST_RESPONSE',
    id: requestId,
    error: { code: 4001, message: 'User rejected the request' },
  });
}

async function openPopupForApproval(): Promise<void> {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

  if (tab?.id) {
    await chrome.action.openPopup();
  }
}

function broadcastToTabs(message: any): void {
  chrome.tabs.query({}, (tabs) => {
    tabs.forEach((tab) => {
      if (tab.id) {
        chrome.tabs.sendMessage(tab.id, message).catch(() => {});
      }
    });
  });
}

// Listen for tab updates to update connected site info
chrome.tabs.onUpdated.addListener(async (_tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url) {
    try {
      const origin = new URL(tab.url).origin;
      const isConnected = await isOriginConnected(origin);

      if (isConnected && tab.favIconUrl) {
        const sites = await getConnectedSites();
        const site = sites.find(s => s.origin === origin);
        if (site && !site.favicon) {
          site.favicon = tab.favIconUrl;
          await addConnectedSite(site);
        }
      }
    } catch {}
  }
});

console.log('Sol Wallet background script initialized');
