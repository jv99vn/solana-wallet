import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import { useWallet } from '@/hooks/useWallet';
import { Welcome, CreateWallet, ImportWallet, Unlock, Dashboard } from './pages';

type Page = 'loading' | 'welcome' | 'create' | 'import' | 'unlock' | 'dashboard';

export function App() {
  const { initialize, isLoading, hasWallet, isLocked, isInitialized } = useWallet();
  const [currentPage, setCurrentPage] = useState<Page>('loading');

  useEffect(() => {
    initialize();
  }, [initialize]);

  useEffect(() => {
    if (!isInitialized) return;

    if (!hasWallet) {
      setCurrentPage('welcome');
    } else if (isLocked) {
      setCurrentPage('unlock');
    } else {
      setCurrentPage('dashboard');
    }
  }, [isInitialized, hasWallet, isLocked]);

  if (currentPage === 'loading' || (isLoading && !isInitialized)) {
    return (
      <div className="h-[600px] w-[375px] flex items-center justify-center bg-dark-900">
        <div className="text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-solana-purple to-solana-green p-0.5"
          >
            <div className="w-full h-full rounded-2xl bg-dark-900 flex items-center justify-center">
              <Loader2 className="w-8 h-8 text-white animate-spin" />
            </div>
          </motion.div>
          <p className="text-dark-400 text-sm">Loading wallet...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-[600px] w-[375px] bg-dark-900 overflow-hidden">
      <AnimatePresence mode="wait">
        {currentPage === 'welcome' && (
          <motion.div
            key="welcome"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="h-full"
          >
            <Welcome
              onCreateWallet={() => setCurrentPage('create')}
              onImportWallet={() => setCurrentPage('import')}
            />
          </motion.div>
        )}

        {currentPage === 'create' && (
          <motion.div
            key="create"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="h-full"
          >
            <CreateWallet
              onBack={() => setCurrentPage('welcome')}
              onComplete={() => setCurrentPage('dashboard')}
            />
          </motion.div>
        )}

        {currentPage === 'import' && (
          <motion.div
            key="import"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="h-full"
          >
            <ImportWallet
              onBack={() => setCurrentPage('welcome')}
              onComplete={() => setCurrentPage('dashboard')}
            />
          </motion.div>
        )}

        {currentPage === 'unlock' && (
          <motion.div
            key="unlock"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="h-full"
          >
            <Unlock onUnlock={() => setCurrentPage('dashboard')} />
          </motion.div>
        )}

        {currentPage === 'dashboard' && (
          <motion.div
            key="dashboard"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="h-full"
          >
            <Dashboard />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
