import { useState } from 'react';
import { motion } from 'framer-motion';
import { RefreshCw, Send, ArrowDownToLine, Droplets, Copy, Check, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui';
import { useWallet } from '@/hooks/useWallet';
import { shortenAddress } from '@/core/crypto';

interface BalanceProps {
  onSend: () => void;
  onReceive: () => void;
}

export function Balance({ onSend, onReceive }: BalanceProps) {
  const { currentAccount, balance, network, refreshBalance, requestAirdrop, isLoading } =
    useWallet();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isAirdropping, setIsAirdropping] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refreshBalance();
    setTimeout(() => setIsRefreshing(false), 500);
  };

  const handleAirdrop = async () => {
    if (network?.cluster === 'mainnet-beta') return;

    setIsAirdropping(true);
    try {
      await requestAirdrop(1);
    } catch (error) {
      console.error('Airdrop failed:', error);
    }
    setIsAirdropping(false);
  };

  const handleCopy = async () => {
    if (!currentAccount) return;
    await navigator.clipboard.writeText(currentAccount.publicKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const openExplorer = () => {
    if (!currentAccount) return;
    const baseUrl =
      network?.cluster === 'mainnet-beta'
        ? 'https://solscan.io'
        : `https://solscan.io?cluster=${network?.cluster}`;
    window.open(`${baseUrl}/account/${currentAccount.publicKey}`, '_blank');
  };

  return (
    <div className="p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-solana-purple/20 via-dark-800 to-solana-green/20 border border-dark-700/50 p-6"
      >
        {/* Background decoration */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-solana-purple/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-solana-green/10 rounded-full blur-3xl" />

        <div className="relative">
          {/* Address with actions */}
          <div className="flex items-center gap-2 mb-4">
            <button
              onClick={handleCopy}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-dark-800/50 hover:bg-dark-700/50 transition-colors"
            >
              <span className="text-sm font-mono text-dark-300">
                {currentAccount ? shortenAddress(currentAccount.publicKey, 6) : '---'}
              </span>
              {copied ? (
                <Check className="w-3.5 h-3.5 text-solana-green" />
              ) : (
                <Copy className="w-3.5 h-3.5 text-dark-500" />
              )}
            </button>

            <button
              onClick={openExplorer}
              className="p-1.5 rounded-lg hover:bg-dark-700/50 transition-colors"
              title="View on Explorer"
            >
              <ExternalLink className="w-4 h-4 text-dark-500" />
            </button>

            <button
              onClick={handleRefresh}
              className="p-1.5 rounded-lg hover:bg-dark-700/50 transition-colors ml-auto"
              disabled={isRefreshing}
            >
              <RefreshCw
                className={`w-4 h-4 text-dark-500 ${isRefreshing ? 'animate-spin' : ''}`}
              />
            </button>
          </div>

          {/* Balance display */}
          <div className="mb-6">
            <div className="flex items-baseline gap-2">
              <motion.span
                key={balance}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-4xl font-bold text-dark-50"
              >
                {balance.toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 4,
                })}
              </motion.span>
              <span className="text-xl font-medium text-dark-400">SOL</span>
            </div>

            {/* USD value placeholder */}
            <p className="text-sm text-dark-500 mt-1">
              ≈ ${(balance * 100).toLocaleString(undefined, { minimumFractionDigits: 2 })} USD
            </p>
          </div>

          {/* Action buttons */}
          <div className="flex gap-3">
            <Button onClick={onSend} className="flex-1" leftIcon={<Send className="w-4 h-4" />}>
              Send
            </Button>
            <Button
              onClick={onReceive}
              variant="secondary"
              className="flex-1"
              leftIcon={<ArrowDownToLine className="w-4 h-4" />}
            >
              Receive
            </Button>
            {network?.cluster !== 'mainnet-beta' && (
              <Button
                onClick={handleAirdrop}
                variant="ghost"
                isLoading={isAirdropping}
                leftIcon={<Droplets className="w-4 h-4" />}
                title="Request Airdrop"
                className="!px-3"
              />
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
