import { Fragment, ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'full';
}

const sizes = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  full: 'max-w-full mx-4',
};

export function Modal({ isOpen, onClose, title, children, size = 'md' }: ModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <Fragment>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', duration: 0.3 }}
            className={`
              fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50
              w-full ${sizes[size]} bg-dark-800 rounded-2xl shadow-2xl
              border border-dark-700
            `}
          >
            {/* Header */}
            {title && (
              <div className="flex items-center justify-between p-4 border-b border-dark-700">
                <h3 className="text-lg font-semibold text-dark-100">{title}</h3>
                <button
                  onClick={onClose}
                  className="p-1 rounded-lg hover:bg-dark-700 text-dark-400 hover:text-dark-100 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            )}

            {/* Content */}
            <div className="p-4">{children}</div>
          </motion.div>
        </Fragment>
      )}
    </AnimatePresence>
  );
}
