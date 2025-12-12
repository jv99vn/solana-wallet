import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronDown,
  Copy,
  Check,
  Plus,
  LogOut,
} from 'lucide-react';
import { Avatar } from '@/components/ui';
import { useWallet } from '@/hooks/useWallet';
import { shortenAddress } from '@/core/crypto';
import { NETWORKS } from '@/core/connection';

export function Header() {
  const { currentAccount, accounts, network, switchAccount, addAccount, setNetwork, lock } =
    useWallet();
  const [showAccountMenu, setShowAccountMenu] = useState(false);
  const [showNetworkMenu, setShowNetworkMenu] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    if (!currentAccount) return;
    await navigator.clipboard.writeText(currentAccount.publicKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleAddAccount = async () => {
    await addAccount();
    setShowAccountMenu(false);
  };

  return (
    <header className="relative p-4 border-b border-dark-700/50">
      <div className="flex items-center justify-between">
        {/* Network Selector */}
        <div className="relative">
          <button
            onClick={() => setShowNetworkMenu(!showNetworkMenu)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-dark-800 hover:bg-dark-700 transition-colors"
          >
            <span
              className={`w-2 h-2 rounded-full ${
                network?.cluster === 'mainnet-beta'
                  ? 'bg-green-500'
                  : network?.cluster === 'devnet'
                  ? 'bg-yellow-500'
                  : 'bg-blue-500'
              }`}
            />
            <span className="text-sm font-medium text-dark-200">
              {network?.name || 'Network'}
            </span>
            <ChevronDown className="w-4 h-4 text-dark-400" />
          </button>

          <AnimatePresence>
            {showNetworkMenu && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="absolute top-full left-0 mt-2 w-48 bg-dark-800 rounded-xl border border-dark-700 shadow-xl z-50"
              >
                {NETWORKS.map((n) => (
                  <button
                    key={n.cluster}
                    onClick={() => {
                      setNetwork(n);
                      setShowNetworkMenu(false);
                    }}
                    className={`
                      w-full flex items-center gap-3 px-4 py-3 text-left
                      hover:bg-dark-700/50 transition-colors first:rounded-t-xl last:rounded-b-xl
                      ${network?.cluster === n.cluster ? 'bg-dark-700/50' : ''}
                    `}
                  >
                    <span
                      className={`w-2 h-2 rounded-full ${
                        n.cluster === 'mainnet-beta'
                          ? 'bg-green-500'
                          : n.cluster === 'devnet'
                          ? 'bg-yellow-500'
                          : 'bg-blue-500'
                      }`}
                    />
                    <span className="text-sm font-medium text-dark-200">{n.name}</span>
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Account Selector */}
        {currentAccount && (
          <div className="relative">
            <button
              onClick={() => setShowAccountMenu(!showAccountMenu)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-dark-800 transition-colors"
            >
              <Avatar address={currentAccount.publicKey} size="sm" />
              <div className="text-left">
                <p className="text-sm font-medium text-dark-100">{currentAccount.name}</p>
                <p className="text-xs text-dark-400">
                  {shortenAddress(currentAccount.publicKey)}
                </p>
              </div>
              <ChevronDown className="w-4 h-4 text-dark-400" />
            </button>

            <AnimatePresence>
              {showAccountMenu && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="absolute top-full right-0 mt-2 w-64 bg-dark-800 rounded-xl border border-dark-700 shadow-xl z-50"
                >
                  <div className="p-2 border-b border-dark-700">
                    <p className="px-2 py-1 text-xs font-medium text-dark-500 uppercase">
                      Accounts
                    </p>
                  </div>

                  <div className="max-h-48 overflow-y-auto">
                    {accounts.map((account) => (
                      <button
                        key={account.publicKey}
                        onClick={() => {
                          switchAccount(account);
                          setShowAccountMenu(false);
                        }}
                        className={`
                          w-full flex items-center gap-3 px-4 py-3
                          hover:bg-dark-700/50 transition-colors
                          ${
                            currentAccount?.publicKey === account.publicKey
                              ? 'bg-dark-700/50'
                              : ''
                          }
                        `}
                      >
                        <Avatar address={account.publicKey} size="sm" />
                        <div className="flex-1 text-left">
                          <p className="text-sm font-medium text-dark-200">{account.name}</p>
                          <p className="text-xs text-dark-500">
                            {shortenAddress(account.publicKey)}
                          </p>
                        </div>
                        {currentAccount?.publicKey === account.publicKey && (
                          <Check className="w-4 h-4 text-solana-green" />
                        )}
                      </button>
                    ))}
                  </div>

                  <div className="p-2 border-t border-dark-700 space-y-1">
                    <button
                      onClick={handleCopy}
                      className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-dark-700/50 transition-colors"
                    >
                      {copied ? (
                        <Check className="w-4 h-4 text-solana-green" />
                      ) : (
                        <Copy className="w-4 h-4 text-dark-400" />
                      )}
                      <span className="text-sm text-dark-300">
                        {copied ? 'Copied!' : 'Copy Address'}
                      </span>
                    </button>

                    <button
                      onClick={handleAddAccount}
                      className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-dark-700/50 transition-colors"
                    >
                      <Plus className="w-4 h-4 text-dark-400" />
                      <span className="text-sm text-dark-300">Add Account</span>
                    </button>

                    <button
                      onClick={() => lock()}
                      className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-dark-700/50 transition-colors"
                    >
                      <LogOut className="w-4 h-4 text-dark-400" />
                      <span className="text-sm text-dark-300">Lock Wallet</span>
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Click outside handler */}
      {(showAccountMenu || showNetworkMenu) && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => {
            setShowAccountMenu(false);
            setShowNetworkMenu(false);
          }}
        />
      )}
    </header>
  );
}
