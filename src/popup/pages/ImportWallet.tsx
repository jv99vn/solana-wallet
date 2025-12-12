import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, AlertTriangle, Download, Shield } from 'lucide-react';
import { Button, Input } from '@/components/ui';
import { useWallet } from '@/hooks/useWallet';
import { validateMnemonic } from '@/core/crypto';

interface ImportWalletProps {
  onBack: () => void;
  onComplete: () => void;
}

type Step = 'mnemonic' | 'password';

export function ImportWallet({ onBack, onComplete }: ImportWalletProps) {
  const { importWallet, isLoading } = useWallet();
  const [step, setStep] = useState<Step>('mnemonic');
  const [mnemonic, setMnemonic] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');

  const handleValidateMnemonic = () => {
    const trimmedMnemonic = mnemonic.trim().toLowerCase();
    const words = trimmedMnemonic.split(/\s+/);

    if (words.length !== 12 && words.length !== 24) {
      setError('Recovery phrase must be 12 or 24 words');
      return;
    }

    if (!validateMnemonic(trimmedMnemonic)) {
      setError('Invalid recovery phrase');
      return;
    }

    setError('');
    setStep('password');
  };

  const handleImport = async () => {
    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setError('');

    try {
      const trimmedMnemonic = mnemonic.trim().toLowerCase();
      await importWallet(trimmedMnemonic, password);
      onComplete();
    } catch (err: any) {
      setError(err.message || 'Failed to import wallet');
    }
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-dark-700/50">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-dark-400 hover:text-dark-100 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="text-sm">Back</span>
        </button>
      </div>

      {/* Progress */}
      <div className="px-6 py-4">
        <div className="flex items-center gap-2">
          {['mnemonic', 'password'].map((s, i) => (
            <div key={s} className="flex-1 flex items-center">
              <div
                className={`h-1 flex-1 rounded-full transition-colors ${
                  i <= ['mnemonic', 'password'].indexOf(step)
                    ? 'bg-gradient-to-r from-solana-purple to-solana-green'
                    : 'bg-dark-700'
                }`}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        <AnimatePresence mode="wait">
          {step === 'mnemonic' && (
            <motion.div
              key="mnemonic"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <div className="text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-solana-green/20 flex items-center justify-center">
                  <Download className="w-8 h-8 text-solana-green" />
                </div>
                <h2 className="text-xl font-bold text-dark-100 mb-2">Import Wallet</h2>
                <p className="text-sm text-dark-400">
                  Enter your 12 or 24 word recovery phrase
                </p>
              </div>

              {/* Warning */}
              <div className="p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-yellow-400 mt-0.5 flex-shrink-0" />
                  <p className="text-xs text-yellow-400">
                    Never share your recovery phrase. Anyone with these words can access your
                    wallet.
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-dark-300 mb-1.5">
                    Recovery Phrase
                  </label>
                  <textarea
                    value={mnemonic}
                    onChange={(e) => setMnemonic(e.target.value)}
                    placeholder="Enter your recovery phrase with words separated by spaces"
                    className="w-full h-32 px-4 py-3 rounded-xl bg-dark-800 border border-dark-600 text-dark-100 placeholder-dark-500 focus:outline-none focus:ring-2 focus:ring-solana-purple focus:border-transparent resize-none"
                  />
                </div>

                {error && (
                  <p className="text-sm text-red-400 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4" />
                    {error}
                  </p>
                )}
              </div>

              <Button onClick={handleValidateMnemonic} className="w-full">
                Continue
              </Button>
            </motion.div>
          )}

          {step === 'password' && (
            <motion.div
              key="password"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <div className="text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-solana-purple/20 flex items-center justify-center">
                  <Shield className="w-8 h-8 text-solana-purple" />
                </div>
                <h2 className="text-xl font-bold text-dark-100 mb-2">Create Password</h2>
                <p className="text-sm text-dark-400">
                  This password will be used to unlock your wallet
                </p>
              </div>

              <div className="space-y-4">
                <Input
                  type="password"
                  label="Password"
                  placeholder="Enter password (min 8 characters)"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />

                <Input
                  type="password"
                  label="Confirm Password"
                  placeholder="Confirm your password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />

                {error && (
                  <p className="text-sm text-red-400 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4" />
                    {error}
                  </p>
                )}
              </div>

              <div className="flex gap-3">
                <Button variant="secondary" onClick={() => setStep('mnemonic')} className="flex-1">
                  Back
                </Button>
                <Button onClick={handleImport} isLoading={isLoading} className="flex-1">
                  Import Wallet
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
