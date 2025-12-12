import { useState } from 'react';
import { motion } from 'framer-motion';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui';
import {
  Header,
  Balance,
  TokenList,
  ActivityList,
  SendModal,
  ReceiveModal,
} from '@/components/wallet';

export function Dashboard() {
  const [showSendModal, setShowSendModal] = useState(false);
  const [showReceiveModal, setShowReceiveModal] = useState(false);

  return (
    <div className="h-full flex flex-col bg-dark-900">
      <Header />

      <Balance
        onSend={() => setShowSendModal(true)}
        onReceive={() => setShowReceiveModal(true)}
      />

      {/* Tabs */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <Tabs defaultValue="tokens" className="flex-1 flex flex-col">
          <div className="px-4">
            <TabsList>
              <TabsTrigger value="tokens">Tokens</TabsTrigger>
              <TabsTrigger value="activity">Activity</TabsTrigger>
            </TabsList>
          </div>

          <div className="flex-1 overflow-y-auto">
            <TabsContent value="tokens">
              <TokenList />
            </TabsContent>

            <TabsContent value="activity">
              <ActivityList />
            </TabsContent>
          </div>
        </Tabs>
      </div>

      {/* Modals */}
      <SendModal isOpen={showSendModal} onClose={() => setShowSendModal(false)} />
      <ReceiveModal isOpen={showReceiveModal} onClose={() => setShowReceiveModal(false)} />
    </div>
  );
}
