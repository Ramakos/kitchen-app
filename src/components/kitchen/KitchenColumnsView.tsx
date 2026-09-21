import React from 'react';
import { Clock, Flame, CheckCircle2 } from 'lucide-react';
import { KitchenOrder } from '../../lib/supabase';
import { OrderCard } from '../OrderCard';

interface KitchenColumnsViewProps {
  newOrders: KitchenOrder[];
  cookingOrders: KitchenOrder[];
  readyOrders: KitchenOrder[];
  completedOrders: KitchenOrder[];
  showCompleted: boolean;
  onHideCompleted: () => void;
  onUpdateStatus: (kitchenOrderId: string, orderId: number, newStatus: string) => Promise<void>;
  now: Date;
}

export const KitchenColumnsView: React.FC<KitchenColumnsViewProps> = ({
  newOrders,
  cookingOrders,
  readyOrders,
  completedOrders,
  showCompleted,
  onHideCompleted,
  onUpdateStatus,
  now,
}) => {
  const columns = [
    {
      title: 'New Orders',
      icon: Clock,
      orders: newOrders,
      headerClass: 'bg-gradient-to-r from-orange-500 to-orange-600',
    },
    {
      title: 'Cooking',
      icon: Flame,
      orders: cookingOrders,
      headerClass: 'bg-gradient-to-r from-amber-500 to-yellow-500',
    },
    {
      title: 'Ready',
      icon: CheckCircle2,
      orders: readyOrders,
      headerClass: 'bg-gradient-to-r from-emerald-500 to-green-600',
    },
  ];

  return (
    <main className="p-4 lg:p-6 pb-28">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        {columns.map(col => (
          <div
            key={col.title}
            className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden"
          >
            <div className={`${col.headerClass} px-4 py-3 flex items-center justify-between`}>
              <div className="flex items-center gap-2">
                <col.icon className="w-5 h-5 text-white" />
                <h2 className="text-lg font-bold text-white">{col.title}</h2>
              </div>
              <span className="bg-white/20 text-white text-sm font-bold px-2.5 py-1 rounded-full">
                {col.orders.length}
              </span>
            </div>
            <div className="p-3 space-y-3 max-h-[calc(100vh-300px)] overflow-y-auto scrollbar-thin">
              {col.orders.length === 0 ? (
                <div className="text-center py-10">
                  <p className="text-slate-400 text-sm font-medium">No {col.title.toLowerCase()}</p>
                </div>
              ) : (
                col.orders.map(order => (
                  <OrderCard
                    key={order.id}
                    order={order}
                    onUpdateStatus={onUpdateStatus}
                    now={now}
                  />
                ))
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Completed orders drawer */}
      {showCompleted && completedOrders.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden mb-6 animate-fade-in">
          <div className="bg-blue-600 px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-white" />
              <h2 className="text-lg font-bold text-white">Completed</h2>
              <span className="bg-white/20 text-white text-sm font-bold px-2.5 py-1 rounded-full">
                {completedOrders.length}
              </span>
            </div>
            <button
              onClick={onHideCompleted}
              className="text-white/80 hover:text-white text-sm font-medium transition-colors"
            >
              Hide
            </button>
          </div>
          <div className="p-3 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-80 overflow-y-auto scrollbar-thin">
            {completedOrders.map(order => (
              <OrderCard
                key={order.id}
                order={order}
                onUpdateStatus={onUpdateStatus}
                now={now}
              />
            ))}
          </div>
        </div>
      )}
    </main>
  );
};
