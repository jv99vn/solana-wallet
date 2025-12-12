import { motion } from 'framer-motion';
import { Coins, ImageOff } from 'lucide-react';
import { useWallet } from '@/hooks/useWallet';
import { shortenAddress } from '@/core/crypto';
import type { TokenBalance } from '@/types';

interface TokenListProps {
  onSelectToken?: (token: TokenBalance) => void;
}

export function TokenList({ onSelectToken }: TokenListProps) {
  const { tokens, isLoading } = useWallet();

  if (isLoading) {
    return (
      <div className="p-4 space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-dark-800/50">
            <div className="w-10 h-10 rounded-full skeleton" />
            <div className="flex-1">
              <div className="h-4 w-20 skeleton mb-2" />
              <div className="h-3 w-16 skeleton" />
            </div>
            <div className="text-right">
              <div className="h-4 w-16 skeleton mb-2" />
              <div className="h-3 w-12 skeleton" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (tokens.length === 0) {
    return (
      <div className="p-8 text-center">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-dark-800 flex items-center justify-center">
          <Coins className="w-8 h-8 text-dark-500" />
        </div>
        <p className="text-dark-400 font-medium">No tokens found</p>
        <p className="text-sm text-dark-500 mt-1">Your SPL tokens will appear here</p>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-2">
      {tokens.map((token, index) => (
        <motion.button
          key={token.mint}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: index * 0.05 }}
          onClick={() => onSelectToken?.(token)}
          className="w-full flex items-center gap-3 p-3 rounded-xl bg-dark-800/50 hover:bg-dark-700/50 transition-colors"
        >
          {/* Token icon */}
          <div className="token-icon">
            {token.logoUri ? (
              <img
                src={token.logoUri}
                alt={token.symbol}
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                }}
              />
            ) : (
              <Coins className="w-5 h-5 text-dark-400" />
            )}
          </div>

          {/* Token info */}
          <div className="flex-1 text-left">
            <p className="font-medium text-dark-100">{token.symbol || 'Unknown'}</p>
            <p className="text-xs text-dark-500">{shortenAddress(token.mint)}</p>
          </div>

          {/* Token balance */}
          <div className="text-right">
            <p className="font-medium text-dark-100">{token.uiBalance}</p>
            {token.usdValue && (
              <p className="text-xs text-dark-500">${token.usdValue.toFixed(2)}</p>
            )}
          </div>
        </motion.button>
      ))}
    </div>
  );
}
