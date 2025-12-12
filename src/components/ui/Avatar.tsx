import { useMemo } from 'react';

interface AvatarProps {
  address: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

const sizes = {
  sm: 'w-6 h-6',
  md: 'w-8 h-8',
  lg: 'w-10 h-10',
  xl: 'w-12 h-12',
};

// Generate a unique gradient based on address
function generateGradient(address: string): string {
  const hash = address.split('').reduce((acc, char) => {
    return char.charCodeAt(0) + ((acc << 5) - acc);
  }, 0);

  const h1 = Math.abs(hash % 360);
  const h2 = (h1 + 40) % 360;

  return `linear-gradient(135deg, hsl(${h1}, 70%, 60%), hsl(${h2}, 70%, 50%))`;
}

export function Avatar({ address, size = 'md', className = '' }: AvatarProps) {
  const gradient = useMemo(() => generateGradient(address), [address]);
  const initials = useMemo(() => {
    return address.slice(0, 2).toUpperCase();
  }, [address]);

  return (
    <div
      className={`
        ${sizes[size]}
        rounded-full flex items-center justify-center
        text-white font-bold text-xs
        ring-2 ring-dark-600
        ${className}
      `}
      style={{ background: gradient }}
    >
      {initials}
    </div>
  );
}
