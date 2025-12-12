import { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, AlertCircle, Check } from 'lucide-react';
import { Button, Input, Modal } from '@/components/ui';
import { useWallet } from '@/hooks/useWallet';
import { isValidSolanaAddress, shortenAddress } from '@/core/crypto';

interface SendModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type Step = 'form' | 'confirm' | 'success';

export function SendModal({ isOpen, onClose }: SendModalProps) {
  const { sendSol, balance, currentAccount } = useWallet();
  const [step, setStep] = useState<Step>('form');
  const [recipient, setRecipient] = useState('');
  const [amount, setAmount] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [signature, setSignature] = useState('');

  const handleClose = () => {
    setStep('form');
    setRecipient('');
    setAmount('');
    setError('');
    setSignature('');
    onClose();
  };

  const validateForm = (): boolean => {
    if (!recipient) {
      setError('Recipient address is required');
      return false;
    }

    if (!isValidSolanaAddress(recipient)) {
      setError('Invalid Solana address');
      return false;
    }

    if (recipient === currentAccount?.publicKey) {
      setError('Cannot send to yourself');
      return false;
    }

    const amountNum = parseFloat(amount);
    if (!amount || isNaN(amountNum) || amountNum <= 0) {
      setError('Invalid amount');
      return false;
    }

    if (amountNum > balance) {
      setError('Insufficient balance');
      return false;
    }

    setError('');
    return true;
  };

  const handleContinue = () => {
    if (validateForm()) {
      setStep('confirm');
    }
  };

  const handleSend = async () => {
    try {
      setIsLoading(true);
      setError('');

      const sig = await sendSol(recipient, parseFloat(amount));
      setSignature(sig);
      setStep('success');
    } catch (err: any) {
      setError(err.message || 'Transaction failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleMax = () => {
    // Leave some SOL for transaction fees
    const maxAmount = Math.max(0, balance - 0.01);
    setAmount(maxAmount.toString());
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Send SOL">
      {step === 'form' && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="space-y-4"
        >
          <Input
            label="Recipient Address"
            placeholder="Enter Solana address"
            value={recipient}
            onChange={(e) => setRecipient(e.target.value)}
            error={error && error.includes('address') ? error : undefined}
          />

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-sm font-medium text-dark-300">Amount</label>
              <button
                onClick={handleMax}
                className="text-xs font-medium text-solana-purple hover:text-solana-purple/80"
              >
                MAX
              </button>
            </div>
            <div className="relative">
              <Input
                type="number"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                error={error && error.includes('amount') ? error : undefined}
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-dark-500 font-medium">
                SOL
              </span>
            </div>
            <p className="mt-1.5 text-xs text-dark-500">
              Available: {balance.toFixed(4)} SOL
            </p>
          </div>

          {error && !error.includes('address') && !error.includes('amount') && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20">
              <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
              <p className="text-sm text-red-400">{error}</p>
            </div>
          )}

          <Button onClick={handleContinue} className="w-full">
            Continue
          </Button>
        </motion.div>
      )}

      {step === 'confirm' && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="space-y-4"
        >
          <div className="p-4 rounded-xl bg-dark-700/50 space-y-3">
            <div className="flex justify-between">
              <span className="text-dark-400">To</span>
              <span className="font-mono text-dark-200">{shortenAddress(recipient, 8)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-dark-400">Amount</span>
              <span className="font-medium text-dark-100">{amount} SOL</span>
            </div>
            <div className="flex justify-between">
              <span className="text-dark-400">Network Fee</span>
              <span className="text-dark-300">~0.000005 SOL</span>
            </div>
            <div className="border-t border-dark-600 pt-3 flex justify-between">
              <span className="font-medium text-dark-200">Total</span>
              <span className="font-bold text-dark-100">
                {(parseFloat(amount) + 0.000005).toFixed(6)} SOL
              </span>
            </div>
          </div>

          {error && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20">
              <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
              <p className="text-sm text-red-400">{error}</p>
            </div>
          )}

          <div className="flex gap-3">
            <Button variant="secondary" onClick={() => setStep('form')} className="flex-1">
              Back
            </Button>
            <Button
              onClick={handleSend}
              isLoading={isLoading}
              className="flex-1"
              leftIcon={<ArrowRight className="w-4 h-4" />}
            >
              Confirm
            </Button>
          </div>
        </motion.div>
      )}

      {step === 'success' && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center py-4"
        >
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-solana-green/20 flex items-center justify-center">
            <Check className="w-8 h-8 text-solana-green" />
          </div>

          <h3 className="text-lg font-semibold text-dark-100 mb-2">Transaction Sent!</h3>
          <p className="text-sm text-dark-400 mb-4">
            Your transaction has been submitted to the network
          </p>

          <div className="p-3 rounded-lg bg-dark-700/50 mb-4">
            <p className="text-xs text-dark-500 mb-1">Transaction Signature</p>
            <p className="font-mono text-xs text-dark-300 break-all">{signature}</p>
          </div>

          <Button onClick={handleClose} className="w-full">
            Done
          </Button>
        </motion.div>
      )}
    </Modal>
  );
}
