import { useState } from 'react';
import { Clock, User, ShoppingBag, Store, Flame, AlertCircle } from 'lucide-react';
import { KitchenOrder } from '../lib/supabase';

type OrderCardProps = {
  order: KitchenOrder;
  onUpdateStatus: (kitchenOrderId: string, orderId: number, newStatus: string) => void;
  now: Date;
};

const STATUS_NEW = 'new';
const STATUS_PREPARING = 'preparing';
const STATUS_READY = 'ready';
const STATUS_COMPLETED = 'completed';

export function OrderCard({ order, onUpdateStatus, now }: OrderCardProps) {
  const [expanded, setExpanded] = useState(false);

  const placedAt = new Date(order.created_at);
  const diffMs = now.getTime() - placedAt.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const remainingMins = diffMins % 60;

  const isLate = diffMins > 15;

  const timeElapsed = diffHours > 0
    ? `${diffHours}h ${remainingMins}m`
    : `${diffMins}m`;

  const getStatusStyles = () => {
    if (isLate && order.status !== STATUS_READY && order.status !== STATUS_COMPLETED) {
      return 'bg-red-50 border-red-400 text-red-900';
    }
    switch (order.status) {
      case STATUS_NEW:
        return 'bg-orange-50 border-orange-300 text-orange-900';
      case STATUS_PREPARING:
        return 'bg-amber-50 border-amber-300 text-amber-900';
      case STATUS_READY:
        return 'bg-emerald-50 border-emerald-300 text-emerald-900';
      case STATUS_COMPLETED:
        return 'bg-blue-50 border-blue-300 text-blue-900';
      default:
        return 'bg-slate-50 border-slate-300 text-slate-900';
    }
  };

  const typeStyles: Record<string, string> = {
    dine_in: 'bg-brand-blue text-white',
    takeaway: 'bg-amber-600 text-white',
    delivery: 'bg-purple-600 text-white',
  };

  const getNextStatus = () => {
    if (order.status === STATUS_NEW) return STATUS_PREPARING;
    if (order.status === STATUS_PREPARING) return STATUS_READY;
    if (order.status === STATUS_READY) return STATUS_COMPLETED;
    return null;
  };

  const getActionLabel = () => {
    if (order.status === STATUS_NEW) return 'Start Cooking';
    if (order.status === STATUS_PREPARING) return 'Mark Ready (Ding!)';
    if (order.status === STATUS_READY) return 'Bump';
    return null;
  };

  const nextStatus = getNextStatus();
  const actionLabel = getActionLabel();
  const orderData = order.orders;
  const orderType = orderData.order_type || orderData.mode || 'dine_in';

  return (
    <div
      className={`border-2 rounded-xl p-4 transition-all cursor-pointer hover:shadow-md ${getStatusStyles()} ${
        isLate && order.status !== STATUS_READY && order.status !== STATUS_COMPLETED ? 'animate-pulse-late ring-2 ring-red-400' : ''
      }`}
      onClick={() => setExpanded(!expanded)}
    >
      {/* Top row: order number + time */}
      <div className="flex items-start justify-between mb-3">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <div className="text-3xl font-black leading-none">#{orderData.order_number}</div>
            {order.priority > 0 && (
              <div className="bg-red-600 text-white px-2 py-0.5 rounded-full text-xs font-bold flex items-center gap-1">
                <Flame className="w-3 h-3" />
                RUSH
              </div>
            )}
          </div>
          <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${typeStyles[orderType] || typeStyles.dine_in}`}>
            {orderType === 'dine_in' ? (
              <span className="flex items-center gap-1">
                <Store className="w-3 h-3" />
                Dine-in
              </span>
            ) : orderType === 'takeaway' ? (
              <span className="flex items-center gap-1">
                <ShoppingBag className="w-3 h-3" />
                Takeaway
              </span>
            ) : (
              <span className="flex items-center gap-1">
                <ShoppingBag className="w-3 h-3" />
                Delivery
              </span>
            )}
          </span>
        </div>
        <div className="text-right">
          <div className={`flex items-center gap-1 text-lg font-bold ${isLate ? 'text-red-600' : ''}`}>
            <Clock className="w-4 h-4" />
            {timeElapsed}
          </div>
          {isLate && order.status !== STATUS_READY && order.status !== STATUS_COMPLETED && (
            <div className="text-xs font-bold text-red-600 mt-0.5">LATE!</div>
          )}
        </div>
      </div>

      {/* Customer name */}
      {orderData.customer_name && (
        <div className="flex items-center gap-1.5 text-sm mb-3 font-semibold opacity-80">
          <User className="w-4 h-4" />
          {orderData.customer_name}
        </div>
      )}

      {/* Items */}
      <div className="space-y-2 mb-3">
        {order.order_items.length === 0 ? (
          <div className="text-sm opacity-60 italic">No items</div>
        ) : (
          order.order_items.map((item) => (
            <div key={item.id} className="font-bold">
              <span className="text-4xl font-black mr-2 leading-none">{item.quantity}</span>
              <span className="text-lg">{item.menu_item_name}</span>
              {item.modifiers && (
                <div className="mt-1 ml-1 text-xs font-bold text-red-700 bg-red-100 inline-block px-2.5 py-1 rounded-full border border-red-300">
                  <AlertCircle className="w-3 h-3 inline mr-1" />
                  {item.modifiers}
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Order notes */}
      {orderData.notes && (
        <div className="text-sm mb-3 p-2.5 rounded-lg border bg-white/60 border-current/20 font-medium">
          <span className="font-bold">Note:</span> {orderData.notes}
        </div>
      )}

      {/* Action button */}
      {expanded && nextStatus && (
        <div className="mt-3 pt-3 border-t border-current/20 animate-fade-in">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onUpdateStatus(order.id, order.order_id, nextStatus);
            }}
            className={`w-full font-bold py-3.5 px-4 rounded-xl transition-all shadow-md hover:shadow-lg text-base active:scale-[0.98] ${
              isLate && order.status !== STATUS_READY
                ? 'bg-white text-red-600 hover:bg-red-50 border-2 border-red-400'
                : 'bg-slate-900 text-white hover:bg-slate-800'
            }`}
          >
            {actionLabel}
          </button>
        </div>
      )}
    </div>
  );
}
