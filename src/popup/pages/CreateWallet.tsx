import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Eye, EyeOff, Copy, Check, AlertTriangle, Shield } from 'lucide-react';
import { Button, Input } from '@/components/ui';
import { useWallet } from '@/hooks/useWallet';

interface CreateWalletProps {
  onBack: () => void;
  onComplete: () => void;
}

type Step = 'password' | 'mnemonic' | 'verify';

export function CreateWallet({ onBack, onComplete }: CreateWalletProps) {
  const { createWallet, isLoading } = useWallet();
  const [step, setStep] = useState<Step>('password');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [mnemonic, setMnemonic] = useState('');
  const [showMnemonic, setShowMnemonic] = useState(false);
  const [copied, setCopied] = useState(false);
  const [verifyWords, setVerifyWords] = useState<{ index: number; word: string }[]>([]);
  const [userVerify, setUserVerify] = useState<string[]>(['', '', '']);
  const [error, setError] = useState('');

  const handleCreateWallet = async () => {
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
      const generatedMnemonic = await createWallet(password);
      setMnemonic(generatedMnemonic);

      // Select 3 random words for verification
      const words = generatedMnemonic.split(' ');
      const indices = new Set<number>();
      while (indices.size < 3) {
        indices.add(Math.floor(Math.random() * words.length));
      }
      const selectedWords = Array.from(indices)
        .sort((a, b) => a - b)
        .map((i) => ({ index: i, word: words[i] }));
      setVerifyWords(selectedWords);

      setStep('mnemonic');
    } catch (err: any) {
      setError(err.message || 'Failed to create wallet');
    }
  };

  const handleCopyMnemonic = async () => {
    await navigator.clipboard.writeText(mnemonic);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleVerify = () => {
    const isValid = verifyWords.every((v, i) => userVerify[i].toLowerCase().trim() === v.word);

    if (!isValid) {
      setError('Words do not match. Please try again.');
      return;
    }

    onComplete();
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
          {['password', 'mnemonic', 'verify'].map((s, i) => (
            <div key={s} className="flex-1 flex items-center">
              <div
                className={`h-1 flex-1 rounded-full transition-colors ${
                  i <= ['password', 'mnemonic', 'verify'].indexOf(step)
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

              <Button
                onClick={handleCreateWallet}
                isLoading={isLoading}
                className="w-full"
              >
                Create Wallet
              </Button>
            </motion.div>
          )}

          {step === 'mnemonic' && (
            <motion.div
              key="mnemonic"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <div className="text-center">
                <h2 className="text-xl font-bold text-dark-100 mb-2">Secret Recovery Phrase</h2>
                <p className="text-sm text-dark-400">
                  Write down these 12 words in order and store them safely
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

              {/* Mnemonic grid */}
              <div className="relative">
                <div
                  className={`grid grid-cols-3 gap-2 p-4 rounded-xl bg-dark-800 border border-dark-700 ${
                    !showMnemonic ? 'blur-md select-none' : ''
                  }`}
                >
                  {mnemonic.split(' ').map((word, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-2 p-2 rounded-lg bg-dark-700/50"
                    >
                      <span className="text-xs text-dark-500 w-4">{i + 1}.</span>
                      <span className="text-sm font-medium text-dark-200">{word}</span>
                    </div>
                  ))}
                </div>

                {!showMnemonic && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Button
                      variant="secondary"
                      onClick={() => setShowMnemonic(true)}
                      leftIcon={<Eye className="w-4 h-4" />}
                    >
                      Reveal Phrase
                    </Button>
                  </div>
                )}
              </div>

              {showMnemonic && (
                <Button
                  variant="secondary"
                  onClick={handleCopyMnemonic}
                  className="w-full"
                  leftIcon={copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                >
                  {copied ? 'Copied!' : 'Copy to Clipboard'}
                </Button>
              )}

              <Button
                onClick={() => setStep('verify')}
                disabled={!showMnemonic}
                className="w-full"
              >
                I've Saved My Phrase
              </Button>
            </motion.div>
          )}

          {step === 'verify' && (
            <motion.div
              key="verify"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <div className="text-center">
                <h2 className="text-xl font-bold text-dark-100 mb-2">Verify Recovery Phrase</h2>
                <p className="text-sm text-dark-400">
                  Enter the following words from your recovery phrase
                </p>
              </div>

              <div className="space-y-4">
                {verifyWords.map((v, i) => (
                  <Input
                    key={v.index}
                    label={`Word #${v.index + 1}`}
                    placeholder={`Enter word #${v.index + 1}`}
                    value={userVerify[i]}
                    onChange={(e) => {
                      const newVerify = [...userVerify];
                      newVerify[i] = e.target.value;
                      setUserVerify(newVerify);
                      setError('');
                    }}
                  />
                ))}

                {error && (
                  <p className="text-sm text-red-400 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4" />
                    {error}
                  </p>
                )}
              </div>

              <Button onClick={handleVerify} className="w-full">
                Verify & Complete
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
