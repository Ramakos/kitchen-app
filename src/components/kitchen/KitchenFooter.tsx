import React from 'react';
import { AlertCircle, ClipboardList, CheckCircle2 } from 'lucide-react';

interface KitchenFooterProps {
  onOpenShortage: () => void;
  onOpenEndOfDay: () => void;
  showCompleted: boolean;
  completedCount: number;
  onToggleCompleted: () => void;
}

export const KitchenFooter: React.FC<KitchenFooterProps> = ({
  onOpenShortage,
  onOpenEndOfDay,
  showCompleted,
  completedCount,
  onToggleCompleted,
}) => {
  return (
    <footer className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 shadow-lg p-3 z-30">
      <div className="flex gap-3 max-w-7xl mx-auto">
        <button
          onClick={onOpenShortage}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-red-50 hover:bg-red-100 text-red-600 font-bold rounded-xl transition-all border border-red-200 active:scale-95 text-sm"
        >
          <AlertCircle className="w-5 h-5" />
          Report Shortage (86)
        </button>
        <button
          onClick={onOpenEndOfDay}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-gradient-brand hover:opacity-90 text-white font-bold rounded-xl transition-all shadow-brand active:scale-95 text-sm"
        >
          <ClipboardList className="w-5 h-5" />
          End of Day List
        </button>
        {!showCompleted && completedCount > 0 && (
          <button
            onClick={onToggleCompleted}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-blue-50 hover:bg-blue-100 text-blue-600 font-bold rounded-xl transition-all border border-blue-200 active:scale-95 text-sm"
          >
            <CheckCircle2 className="w-5 h-5" />
            Completed ({completedCount})
          </button>
        )}
      </div>
    </footer>
  );
};
