import React from 'react';
import { AlertCircle } from 'lucide-react';

interface KitchenBriefingBannerProps {
  briefing: string | null;
  onDismiss: () => void;
}

export const KitchenBriefingBanner: React.FC<KitchenBriefingBannerProps> = ({
  briefing,
  onDismiss,
}) => {
  if (!briefing) return null;

  return (
    <div className="bg-blue-600 text-white px-6 py-2.5 shadow-md">
      <div className="flex items-start gap-3 max-w-7xl mx-auto">
        <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
        <div className="flex-1">
          <div className="font-bold text-sm mb-0.5">Today's Briefing</div>
          <div className="text-sm text-white/90 whitespace-pre-wrap">{briefing}</div>
        </div>
        <button
          onClick={onDismiss}
          className="text-white/70 hover:text-white transition-colors text-xl leading-none px-2"
        >
          ×
        </button>
      </div>
    </div>
  );
};
