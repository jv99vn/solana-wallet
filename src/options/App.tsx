import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Settings,
  Shield,
  Globe,
  Trash2,
  Key,
  ChevronRight,
  ExternalLink,
  AlertTriangle,
  Check,
  X,
} from 'lucide-react';
import { Button, Input, Card, CardContent, Modal } from '@/components/ui';
import { useWallet } from '@/hooks/useWallet';
import { NETWORKS } from '@/core/connection';

export function App() {
  const {
    network,
    setNetwork,
    connectedSites,
    disconnectSite,
    exportMnemonic,
    clearWallet,
    isLocked,
    unlock,
  } = useWallet();

  const [activeSection, setActiveSection] = useState('general');
  const [showExportModal, setShowExportModal] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);
  const [exportPassword, setExportPassword] = useState('');
  const [exportedMnemonic, setExportedMnemonic] = useState('');
  const [exportError, setExportError] = useState('');
  const [unlockPassword, setUnlockPassword] = useState('');

  const handleExportMnemonic = async () => {
    try {
      setExportError('');
      const mnemonic = await exportMnemonic(exportPassword);
      setExportedMnemonic(mnemonic);
    } catch (err: any) {
      setExportError(err.message || 'Failed to export');
    }
  };

  const handleResetWallet = async () => {
    await clearWallet();
    window.close();
  };

  const handleUnlock = async () => {
    try {
      await unlock(unlockPassword);
    } catch (err) {
      // Handle error
    }
  };

  if (isLocked) {
    return (
      <div className="min-h-screen bg-dark-900 flex items-center justify-center p-8">
        <Card className="max-w-md w-full p-6">
          <div className="text-center mb-6">
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-solana-purple/20 flex items-center justify-center">
              <Shield className="w-8 h-8 text-solana-purple" />
            </div>
            <h1 className="text-2xl font-bold text-dark-100 mb-2">Unlock Required</h1>
            <p className="text-dark-400">Enter your password to access settings</p>
          </div>

          <div className="space-y-4">
            <Input
              type="password"
              placeholder="Enter your password"
              value={unlockPassword}
              onChange={(e) => setUnlockPassword(e.target.value)}
            />
            <Button onClick={handleUnlock} className="w-full">
              Unlock
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  const sections = [
    { id: 'general', label: 'General', icon: Settings },
    { id: 'network', label: 'Network', icon: Globe },
    { id: 'security', label: 'Security', icon: Shield },
    { id: 'sites', label: 'Connected Sites', icon: ExternalLink },
  ];

  return (
    <div className="min-h-screen bg-dark-900">
      {/* Header */}
      <header className="border-b border-dark-700/50 bg-dark-800/50 backdrop-blur-xl sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-8 py-6">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-solana-purple to-solana-green p-0.5">
              <div className="w-full h-full rounded-xl bg-dark-900 flex items-center justify-center">
                <Settings className="w-5 h-5 text-white" />
              </div>
            </div>
            <div>
              <h1 className="text-xl font-bold text-dark-100">Settings</h1>
              <p className="text-sm text-dark-400">Manage your Sol Wallet preferences</p>
            </div>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-6xl mx-auto px-8 py-8">
        <div className="flex gap-8">
          {/* Sidebar */}
          <nav className="w-64 flex-shrink-0">
            <div className="space-y-1">
              {sections.map((section) => (
                <button
                  key={section.id}
                  onClick={() => setActiveSection(section.id)}
                  className={`
                    w-full flex items-center gap-3 px-4 py-3 rounded-xl
                    transition-colors text-left
                    ${
                      activeSection === section.id
                        ? 'bg-dark-700/50 text-dark-100'
                        : 'text-dark-400 hover:bg-dark-800 hover:text-dark-200'
                    }
                  `}
                >
                  <section.icon className="w-5 h-5" />
                  <span className="font-medium">{section.label}</span>
                </button>
              ))}
            </div>
          </nav>

          {/* Main content */}
          <div className="flex-1">
            {activeSection === 'general' && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
              >
                <Card>
                  <CardContent className="space-y-6">
                    <h2 className="text-lg font-semibold text-dark-100">General Settings</h2>

                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-4 rounded-xl bg-dark-700/30">
                        <div>
                          <p className="font-medium text-dark-200">Auto-lock Timer</p>
                          <p className="text-sm text-dark-500">
                            Automatically lock after inactivity
                          </p>
                        </div>
                        <select className="px-4 py-2 rounded-lg bg-dark-700 border border-dark-600 text-dark-200">
                          <option value="300000">5 minutes</option>
                          <option value="600000">10 minutes</option>
                          <option value="1800000">30 minutes</option>
                          <option value="3600000">1 hour</option>
                        </select>
                      </div>

                      <div className="flex items-center justify-between p-4 rounded-xl bg-dark-700/30">
                        <div>
                          <p className="font-medium text-dark-200">Currency</p>
                          <p className="text-sm text-dark-500">Display currency for values</p>
                        </div>
                        <select className="px-4 py-2 rounded-lg bg-dark-700 border border-dark-600 text-dark-200">
                          <option value="USD">USD</option>
                          <option value="EUR">EUR</option>
                          <option value="GBP">GBP</option>
                        </select>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {activeSection === 'network' && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
              >
                <Card>
                  <CardContent className="space-y-6">
                    <h2 className="text-lg font-semibold text-dark-100">Network Settings</h2>

                    <div className="space-y-2">
                      {NETWORKS.map((n) => (
                        <button
                          key={n.cluster}
                          onClick={() => setNetwork(n)}
                          className={`
                            w-full flex items-center justify-between p-4 rounded-xl
                            transition-colors
                            ${
                              network?.cluster === n.cluster
                                ? 'bg-solana-purple/10 border border-solana-purple/30'
                                : 'bg-dark-700/30 hover:bg-dark-700/50'
                            }
                          `}
                        >
                          <div className="flex items-center gap-3">
                            <span
                              className={`w-3 h-3 rounded-full ${
                                n.cluster === 'mainnet-beta'
                                  ? 'bg-green-500'
                                  : n.cluster === 'devnet'
                                  ? 'bg-yellow-500'
                                  : 'bg-blue-500'
                              }`}
                            />
                            <div className="text-left">
                              <p className="font-medium text-dark-200">{n.name}</p>
                              <p className="text-xs text-dark-500">{n.endpoint}</p>
                            </div>
                          </div>
                          {network?.cluster === n.cluster && (
                            <Check className="w-5 h-5 text-solana-purple" />
                          )}
                        </button>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {activeSection === 'security' && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
              >
                <Card>
                  <CardContent className="space-y-6">
                    <h2 className="text-lg font-semibold text-dark-100">Security</h2>

                    <div className="space-y-2">
                      <button
                        onClick={() => setShowExportModal(true)}
                        className="w-full flex items-center justify-between p-4 rounded-xl bg-dark-700/30 hover:bg-dark-700/50 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <Key className="w-5 h-5 text-dark-400" />
                          <div className="text-left">
                            <p className="font-medium text-dark-200">Export Recovery Phrase</p>
                            <p className="text-sm text-dark-500">
                              View your 12-word recovery phrase
                            </p>
                          </div>
                        </div>
                        <ChevronRight className="w-5 h-5 text-dark-500" />
                      </button>

                      <button
                        onClick={() => setShowResetModal(true)}
                        className="w-full flex items-center justify-between p-4 rounded-xl bg-red-500/10 hover:bg-red-500/20 transition-colors border border-red-500/20"
                      >
                        <div className="flex items-center gap-3">
                          <Trash2 className="w-5 h-5 text-red-400" />
                          <div className="text-left">
                            <p className="font-medium text-red-400">Reset Wallet</p>
                            <p className="text-sm text-red-400/70">
                              Remove all data and start fresh
                            </p>
                          </div>
                        </div>
                        <ChevronRight className="w-5 h-5 text-red-400" />
                      </button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {activeSection === 'sites' && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
              >
                <Card>
                  <CardContent className="space-y-6">
                    <h2 className="text-lg font-semibold text-dark-100">Connected Sites</h2>

                    {connectedSites.length === 0 ? (
                      <div className="text-center py-8">
                        <Globe className="w-12 h-12 mx-auto text-dark-600 mb-4" />
                        <p className="text-dark-400">No connected sites</p>
                        <p className="text-sm text-dark-500">
                          Sites you connect to will appear here
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {connectedSites.map((site) => (
                          <div
                            key={site.origin}
                            className="flex items-center justify-between p-4 rounded-xl bg-dark-700/30"
                          >
                            <div className="flex items-center gap-3">
                              {site.favicon ? (
                                <img
                                  src={site.favicon}
                                  alt=""
                                  className="w-8 h-8 rounded-lg"
                                />
                              ) : (
                                <div className="w-8 h-8 rounded-lg bg-dark-600 flex items-center justify-center">
                                  <Globe className="w-4 h-4 text-dark-400" />
                                </div>
                              )}
                              <div>
                                <p className="font-medium text-dark-200">{site.name}</p>
                                <p className="text-xs text-dark-500">{site.origin}</p>
                              </div>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => disconnectSite(site.origin)}
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </div>
        </div>
      </main>

      {/* Export Modal */}
      <Modal
        isOpen={showExportModal}
        onClose={() => {
          setShowExportModal(false);
          setExportPassword('');
          setExportedMnemonic('');
          setExportError('');
        }}
        title="Export Recovery Phrase"
      >
        {!exportedMnemonic ? (
          <div className="space-y-4">
            <div className="p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
              <div className="flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-yellow-400 mt-0.5 flex-shrink-0" />
                <p className="text-sm text-yellow-400">
                  Never share your recovery phrase. Anyone with these words can access your
                  wallet.
                </p>
              </div>
            </div>

            <Input
              type="password"
              label="Enter your password"
              placeholder="Password"
              value={exportPassword}
              onChange={(e) => setExportPassword(e.target.value)}
              error={exportError}
            />

            <Button onClick={handleExportMnemonic} className="w-full">
              Show Recovery Phrase
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-2 p-4 rounded-xl bg-dark-700 border border-dark-600">
              {exportedMnemonic.split(' ').map((word, i) => (
                <div key={i} className="flex items-center gap-2 p-2 rounded-lg bg-dark-600/50">
                  <span className="text-xs text-dark-500 w-4">{i + 1}.</span>
                  <span className="text-sm font-medium text-dark-200">{word}</span>
                </div>
              ))}
            </div>

            <Button
              onClick={() => {
                setShowExportModal(false);
                setExportPassword('');
                setExportedMnemonic('');
              }}
              className="w-full"
            >
              Done
            </Button>
          </div>
        )}
      </Modal>

      {/* Reset Modal */}
      <Modal
        isOpen={showResetModal}
        onClose={() => setShowResetModal(false)}
        title="Reset Wallet"
      >
        <div className="space-y-4">
          <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20">
            <div className="flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-red-400 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-red-400">
                This will permanently delete your wallet data. Make sure you have backed up
                your recovery phrase before proceeding.
              </p>
            </div>
          </div>

          <div className="flex gap-3">
            <Button variant="secondary" onClick={() => setShowResetModal(false)} className="flex-1">
              Cancel
            </Button>
            <Button variant="danger" onClick={handleResetWallet} className="flex-1">
              Reset Wallet
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
