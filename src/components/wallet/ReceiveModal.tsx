import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Copy, Check, Share2 } from 'lucide-react';
import { Button, Modal } from '@/components/ui';
import { useWallet } from '@/hooks/useWallet';

interface ReceiveModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ReceiveModal({ isOpen, onClose }: ReceiveModalProps) {
  const { currentAccount } = useWallet();
  const [copied, setCopied] = useState(false);

  const qrCodeUrl = useMemo(() => {
    if (!currentAccount) return '';
    // Use a public QR code API
    return `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${currentAccount.publicKey}&bgcolor=1e293b&color=f1f5f9&format=svg`;
  }, [currentAccount]);

  const handleCopy = async () => {
    if (!currentAccount) return;
    await navigator.clipboard.writeText(currentAccount.publicKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = async () => {
    if (!currentAccount) return;

    if (navigator.share) {
      try {
        await navigator.share({
          title: 'My Solana Address',
          text: currentAccount.publicKey,
        });
      } catch (err) {
        // User cancelled or share failed
      }
    } else {
      handleCopy();
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Receive SOL">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex flex-col items-center"
      >
        {/* QR Code */}
        <div className="relative p-4 bg-dark-700 rounded-2xl mb-6">
          <div className="absolute inset-0 bg-gradient-to-br from-solana-purple/20 to-solana-green/20 rounded-2xl" />
          <img
            src={qrCodeUrl}
            alt="Wallet QR Code"
            className="relative w-48 h-48 rounded-lg"
          />
        </div>

        {/* Address */}
        <div className="w-full">
          <p className="text-xs text-dark-500 text-center mb-2">Your Solana Address</p>
          <div className="p-4 rounded-xl bg-dark-700/50 break-all">
            <p className="font-mono text-sm text-dark-200 text-center">
              {currentAccount?.publicKey}
            </p>
          </div>
        </div>

        {/* Warning */}
        <div className="w-full mt-4 p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
          <p className="text-xs text-yellow-400 text-center">
            Only send SOL and SPL tokens to this address. Sending other assets may result in
            permanent loss.
          </p>
        </div>

        {/* Action buttons */}
        <div className="w-full flex gap-3 mt-4">
          <Button
            variant="secondary"
            onClick={handleCopy}
            className="flex-1"
            leftIcon={copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
          >
            {copied ? 'Copied!' : 'Copy'}
          </Button>
          <Button
            onClick={handleShare}
            className="flex-1"
            leftIcon={<Share2 className="w-4 h-4" />}
          >
            Share
          </Button>
        </div>
      </motion.div>
    </Modal>
  );
}
