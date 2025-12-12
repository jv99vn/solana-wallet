import { motion } from 'framer-motion';
import { Plus, Download, Wallet } from 'lucide-react';
import { Button } from '@/components/ui';

interface WelcomeProps {
  onCreateWallet: () => void;
  onImportWallet: () => void;
}

export function Welcome({ onCreateWallet, onImportWallet }: WelcomeProps) {
  return (
    <div className="h-full flex flex-col">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-solana-purple/20 via-transparent to-solana-green/20" />
      <div className="absolute top-0 right-0 w-64 h-64 bg-solana-purple/10 rounded-full blur-3xl" />
      <div className="absolute bottom-0 left-0 w-64 h-64 bg-solana-green/10 rounded-full blur-3xl" />

      {/* Content */}
      <div className="relative flex-1 flex flex-col items-center justify-center p-8 text-center">
        {/* Logo */}
        <motion.div
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: 'spring', duration: 0.8 }}
          className="mb-8"
        >
          <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-solana-purple to-solana-green p-0.5 animate-glow">
            <div className="w-full h-full rounded-3xl bg-dark-900 flex items-center justify-center">
              <Wallet className="w-12 h-12 text-white" />
            </div>
          </div>
        </motion.div>

        {/* Title */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <h1 className="text-3xl font-bold mb-2">
            <span className="gradient-text">Sol Wallet</span>
          </h1>
          <p className="text-dark-400 text-sm max-w-xs mx-auto">
            A secure and beautiful Solana wallet for the decentralized web
          </p>
        </motion.div>
      </div>

      {/* Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="relative p-6 space-y-3"
      >
        <Button
          onClick={onCreateWallet}
          className="w-full"
          leftIcon={<Plus className="w-5 h-5" />}
        >
          Create New Wallet
        </Button>

        <Button
          onClick={onImportWallet}
          variant="secondary"
          className="w-full"
          leftIcon={<Download className="w-5 h-5" />}
        >
          Import Existing Wallet
        </Button>

        <p className="text-xs text-dark-500 text-center pt-2">
          By continuing, you agree to our Terms of Service
        </p>
      </motion.div>
    </div>
  );
}
