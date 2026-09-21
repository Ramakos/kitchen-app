import { useState } from 'react';
import { RefreshCw } from 'lucide-react';
import { EndOfDayModal } from './EndOfDayModal';
import { ShortageModal } from './ShortageModal';
import { useKitchenOrders } from '../hooks/useKitchenOrders';
import { KitchenHeader } from './kitchen/KitchenHeader';
import { KitchenBriefingBanner } from './kitchen/KitchenBriefingBanner';
import { KitchenColumnsView } from './kitchen/KitchenColumnsView';
import { KitchenFooter } from './kitchen/KitchenFooter';

type KitchenDashboardProps = {
  staffId: string;
  staffName: string;
  onLogout: () => void;
};

export function KitchenDashboard({ staffId, staffName, onLogout }: KitchenDashboardProps) {
  const [showEndOfDayModal, setShowEndOfDayModal] = useState(false);
  const [showShortageModal, setShowShortageModal] = useState(false);
  const [showCompleted, setShowCompleted] = useState(false);

  const {
    loading,
    dailyBriefing,
    setDailyBriefing,
    now,
    loadOrders,
    handleUpdateStatus,
    newOrders,
    cookingOrders,
    readyOrders,
    completedOrders,
  } = useKitchenOrders();

  return (
    <div className="min-h-screen bg-slate-50">
      <KitchenHeader
        staffName={staffName}
        now={now}
        onRefresh={loadOrders}
        onLogout={onLogout}
      />

      <KitchenBriefingBanner
        briefing={dailyBriefing}
        onDismiss={() => setDailyBriefing(null)}
      />

      {loading ? (
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <RefreshCw className="w-8 h-8 text-brand mx-auto mb-3 animate-spin" />
            <div className="text-slate-500 text-sm font-medium">Loading orders...</div>
          </div>
        </div>
      ) : (
        <KitchenColumnsView
          newOrders={newOrders}
          cookingOrders={cookingOrders}
          readyOrders={readyOrders}
          completedOrders={completedOrders}
          showCompleted={showCompleted}
          onHideCompleted={() => setShowCompleted(false)}
          onUpdateStatus={handleUpdateStatus}
          now={now}
        />
      )}

      <KitchenFooter
        onOpenShortage={() => setShowShortageModal(true)}
        onOpenEndOfDay={() => setShowEndOfDayModal(true)}
        showCompleted={showCompleted}
        completedCount={completedOrders.length}
        onToggleCompleted={() => setShowCompleted(true)}
      />

      <EndOfDayModal
        isOpen={showEndOfDayModal}
        onClose={() => setShowEndOfDayModal(false)}
        staffId={staffId}
      />

      <ShortageModal
        isOpen={showShortageModal}
        onClose={() => setShowShortageModal(false)}
        staffId={staffId}
      />
    </div>
  );
}
