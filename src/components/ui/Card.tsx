import { HTMLAttributes, forwardRef } from 'react';
import { motion, HTMLMotionProps } from 'framer-motion';

interface CardProps extends HTMLMotionProps<'div'> {
  variant?: 'default' | 'hover' | 'gradient';
}

export const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ children, variant = 'default', className = '', ...props }, ref) => {
    const variants = {
      default: 'card',
      hover: 'card-hover',
      gradient: 'card gradient-border',
    };

    return (
      <motion.div
        ref={ref}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        className={`${variants[variant]} ${className}`}
        {...props}
      >
        {children}
      </motion.div>
    );
  }
);

Card.displayName = 'Card';

interface CardHeaderProps extends HTMLAttributes<HTMLDivElement> {}

export const CardHeader = forwardRef<HTMLDivElement, CardHeaderProps>(
  ({ children, className = '', ...props }, ref) => (
    <div ref={ref} className={`p-4 border-b border-dark-700/50 ${className}`} {...props}>
      {children}
    </div>
  )
);

CardHeader.displayName = 'CardHeader';

interface CardContentProps extends HTMLAttributes<HTMLDivElement> {}

export const CardContent = forwardRef<HTMLDivElement, CardContentProps>(
  ({ children, className = '', ...props }, ref) => (
    <div ref={ref} className={`p-4 ${className}`} {...props}>
      {children}
    </div>
  )
);

CardContent.displayName = 'CardContent';

interface CardFooterProps extends HTMLAttributes<HTMLDivElement> {}

export const CardFooter = forwardRef<HTMLDivElement, CardFooterProps>(
  ({ children, className = '', ...props }, ref) => (
    <div ref={ref} className={`p-4 border-t border-dark-700/50 ${className}`} {...props}>
      {children}
    </div>
  )
);

CardFooter.displayName = 'CardFooter';
