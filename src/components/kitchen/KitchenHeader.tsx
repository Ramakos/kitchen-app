import React from 'react';
import { LogOut, RefreshCw } from 'lucide-react';
import ramakosLogo from '../../assets/ramakos-logo.png';

interface KitchenHeaderProps {
  staffName: string;
  now: Date;
  onRefresh: () => void;
  onLogout: () => void;
}

export const KitchenHeader: React.FC<KitchenHeaderProps> = ({
  staffName,
  now,
  onRefresh,
  onLogout,
}) => {
  const currentDate = now.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  const currentTime = now.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });

  return (
    <header className="bg-white border-b border-slate-200 shadow-sm sticky top-0 z-40">
      <div className="px-6 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img
              src={ramakosLogo}
              alt="Ramakos Mascot"
              className="h-11 w-auto object-contain shrink-0 drop-shadow-sm"
            />
            <div>
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Kitchen Display</h1>
              <p className="text-xs text-slate-500 mt-0.5">
                {currentDate} · {currentTime}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={onRefresh}
              className="flex items-center gap-2 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg transition-all text-sm border border-slate-200 active:scale-95"
            >
              <RefreshCw className="w-4 h-4" />
              <span className="hidden sm:inline">Refresh</span>
            </button>
            <div className="text-right px-3">
              <div className="text-xs text-slate-500">Signed in</div>
              <div className="font-semibold text-slate-900 text-sm">{staffName}</div>
            </div>
            <button
              onClick={onLogout}
              className="flex items-center gap-2 px-4 py-2 bg-red-50 hover:bg-red-100 text-red-600 font-semibold rounded-lg transition-all text-sm border border-red-200 active:scale-95"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
