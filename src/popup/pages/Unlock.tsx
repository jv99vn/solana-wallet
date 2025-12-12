import { useState } from 'react';
import { motion } from 'framer-motion';
import { Lock } from 'lucide-react';
import { Button, Input } from '@/components/ui';
import { useWallet } from '@/hooks/useWallet';

interface UnlockProps {
  onUnlock: () => void;
}

export function Unlock({ onUnlock }: UnlockProps) {
  const { unlock, isLoading } = useWallet();
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleUnlock = async () => {
    if (!password) {
      setError('Password is required');
      return;
    }

    setError('');

    try {
      await unlock(password);
      onUnlock();
    } catch (err: any) {
      setError(err.message || 'Invalid password');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleUnlock();
    }
  };

  return (
    <div className="h-full flex flex-col">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-solana-purple/10 via-transparent to-solana-green/10" />

      {/* Content */}
      <div className="relative flex-1 flex flex-col items-center justify-center p-8">
        {/* Logo */}
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', duration: 0.5 }}
          className="mb-8"
        >
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-solana-purple to-solana-green p-0.5">
            <div className="w-full h-full rounded-2xl bg-dark-900 flex items-center justify-center">
              <Lock className="w-10 h-10 text-white" />
            </div>
          </div>
        </motion.div>

        {/* Title */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-center mb-8"
        >
          <h1 className="text-2xl font-bold text-dark-100 mb-2">Welcome Back</h1>
          <p className="text-sm text-dark-400">Enter your password to unlock</p>
        </motion.div>

        {/* Form */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="w-full max-w-sm space-y-4"
        >
          <Input
            type="password"
            placeholder="Enter your password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={handleKeyDown}
            error={error}
            autoFocus
          />

          <Button onClick={handleUnlock} isLoading={isLoading} className="w-full">
            Unlock
          </Button>
        </motion.div>
      </div>

      {/* Footer */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="relative p-6 text-center"
      >
        <p className="text-xs text-dark-500">
          Forgot your password?{' '}
          <button className="text-solana-purple hover:underline">
            Restore with recovery phrase
          </button>
        </p>
      </motion.div>
    </div>
  );
}
