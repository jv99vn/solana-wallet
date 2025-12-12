import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  ArrowUpRight,
  ArrowDownLeft,
  Clock,
  CheckCircle2,
  XCircle,
  ExternalLink,
} from 'lucide-react';
import { useWallet } from '@/hooks/useWallet';
import { sendMessage } from '@/hooks/useWalletStore';
import { shortenAddress } from '@/core/crypto';

interface Transaction {
  signature: string;
  timestamp: number;
  status: 'confirmed' | 'pending' | 'failed';
  tx: any;
}

export function ActivityList() {
  const { currentAccount, network } = useWallet();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (currentAccount) {
      loadTransactions();
    }
  }, [currentAccount]);

  const loadTransactions = async () => {
    if (!currentAccount) return;

    setIsLoading(true);
    try {
      const txs = await sendMessage<Transaction[]>('GET_TRANSACTIONS', {
        publicKey: currentAccount.publicKey,
        limit: 20,
      });
      setTransactions(txs);
    } catch (error) {
      console.error('Failed to load transactions:', error);
    }
    setIsLoading(false);
  };

  const getTransactionType = (tx: Transaction): 'send' | 'receive' | 'unknown' => {
    if (!tx.tx?.transaction?.message?.accountKeys) return 'unknown';

    const accounts = tx.tx.transaction.message.accountKeys;
    const firstAccount = accounts[0]?.pubkey;

    if (firstAccount === currentAccount?.publicKey) {
      return 'send';
    }
    return 'receive';
  };

  const openExplorer = (signature: string) => {
    const baseUrl =
      network?.cluster === 'mainnet-beta'
        ? 'https://solscan.io'
        : `https://solscan.io?cluster=${network?.cluster}`;
    window.open(`${baseUrl}/tx/${signature}`, '_blank');
  };

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (diffDays === 1) {
      return 'Yesterday';
    } else if (diffDays < 7) {
      return date.toLocaleDateString([], { weekday: 'short' });
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
  };

  if (isLoading) {
    return (
      <div className="p-4 space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-dark-800/50">
            <div className="w-10 h-10 rounded-full skeleton" />
            <div className="flex-1">
              <div className="h-4 w-24 skeleton mb-2" />
              <div className="h-3 w-16 skeleton" />
            </div>
            <div className="h-4 w-12 skeleton" />
          </div>
        ))}
      </div>
    );
  }

  if (transactions.length === 0) {
    return (
      <div className="p-8 text-center">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-dark-800 flex items-center justify-center">
          <Clock className="w-8 h-8 text-dark-500" />
        </div>
        <p className="text-dark-400 font-medium">No transactions yet</p>
        <p className="text-sm text-dark-500 mt-1">Your activity will appear here</p>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-2">
      {transactions.map((tx, index) => {
        const type = getTransactionType(tx);
        const isSend = type === 'send';

        return (
          <motion.button
            key={tx.signature}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.05 }}
            onClick={() => openExplorer(tx.signature)}
            className="w-full flex items-center gap-3 p-3 rounded-xl bg-dark-800/50 hover:bg-dark-700/50 transition-colors"
          >
            {/* Icon */}
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center ${
                isSend ? 'bg-orange-500/10' : 'bg-green-500/10'
              }`}
            >
              {isSend ? (
                <ArrowUpRight className="w-5 h-5 text-orange-400" />
              ) : (
                <ArrowDownLeft className="w-5 h-5 text-green-400" />
              )}
            </div>

            {/* Info */}
            <div className="flex-1 text-left">
              <p className="font-medium text-dark-100">{isSend ? 'Sent' : 'Received'}</p>
              <p className="text-xs text-dark-500">{shortenAddress(tx.signature, 8)}</p>
            </div>

            {/* Status & Time */}
            <div className="text-right flex items-center gap-2">
              {tx.status === 'confirmed' ? (
                <CheckCircle2 className="w-4 h-4 text-green-500" />
              ) : tx.status === 'failed' ? (
                <XCircle className="w-4 h-4 text-red-500" />
              ) : (
                <Clock className="w-4 h-4 text-yellow-500" />
              )}
              <span className="text-xs text-dark-500">{formatDate(tx.timestamp)}</span>
              <ExternalLink className="w-3.5 h-3.5 text-dark-600" />
            </div>
          </motion.button>
        );
      })}
    </div>
  );
}
