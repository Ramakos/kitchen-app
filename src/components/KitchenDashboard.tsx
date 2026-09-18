import { useState, useEffect, useRef } from 'react';
import { LogOut, RefreshCw, AlertCircle, ClipboardList, CheckCircle2, Flame, Clock } from 'lucide-react';
import { supabase, KitchenOrder, OrderItem } from '../lib/supabase';
import { OrderCard } from './OrderCard';
import { EndOfDayModal } from './EndOfDayModal';
import { ShortageModal } from './ShortageModal';
import { useToast } from './Toast';
import ramakosLogo from '../assets/ramakos-logo.png';

type KitchenDashboardProps = {
  staffId: string;
  staffName: string;
  onLogout: () => void;
};

const STATUS_NEW = 'new';
const STATUS_PREPARING = 'preparing';
const STATUS_READY = 'ready';
const STATUS_COMPLETED = 'completed';

export function KitchenDashboard({ staffId, staffName, onLogout }: KitchenDashboardProps) {
  const [orders, setOrders] = useState<KitchenOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [showEndOfDayModal, setShowEndOfDayModal] = useState(false);
  const [showShortageModal, setShowShortageModal] = useState(false);
  const [showCompleted, setShowCompleted] = useState(false);
  const [dailyBriefing, setDailyBriefing] = useState<string | null>(null);
  const [now, setNow] = useState(new Date());
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const previousOrderCountRef = useRef(0);
  const { showToast } = useToast();

  useEffect(() => {
    loadOrders();
    loadDailyBriefing();
    subscribeToOrders();
    initAudio();

    const tick = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(tick);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const initAudio = () => {
    audioRef.current = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBjGJ0fPTgjMGHm7A7+OZUQ8NSKXi8bllHAY4kdfy0YE0BiBx0O/blEoME1qy6OuqWBQKR6Dg8r9uIwY0jNLy1YU1Bx9twO/fmVIPDkmo4vG7ahwGOpLY8tSBNQgfcsrv2ZRLDBNasufrq1kUCkeg4PK/byMGNY3T8tWHNwceZwA=');
  };

  const loadOrders = async () => {
    setLoading(true);
    try {
      const { data: kitchenOrdersData, error } = await supabase
        .from('kitchen_orders')
        .select(`
          id,
          order_id,
          priority,
          status,
          notes,
          created_at,
          started_at,
          completed_at,
          updated_at,
          orders!inner (
            id,
            order_number,
            order_type,
            mode,
            status,
            customer_name,
            notes,
            created_at,
            ready_at
          )
        `)
        .in('status', [STATUS_NEW, STATUS_COOKING, STATUS_READY])
        .order('priority', { ascending: false })
        .order('created_at', { ascending: true });

      if (error) throw error;

      const ordersWithItems = await Promise.all(
        (kitchenOrdersData || []).map(async (ko: Record<string, unknown>) => {
          const orderData = ko.orders as Record<string, unknown>;
          const { data: items } = await supabase
            .from('order_items')
            .select('id, order_id, menu_item_name, quantity, modifiers, notes, category, created_at')
            .eq('order_id', orderData.id);

          return {
            ...ko,
            order_items: (items || []) as OrderItem[],
          } as unknown as KitchenOrder;
        })
      );

      const prevCount = previousOrderCountRef.current;
      const newCount = ordersWithItems.filter(o => o.status === STATUS_NEW).length;

      if (prevCount > 0 && newCount > prevCount && audioRef.current) {
        audioRef.current.play().catch(() => {});
      }

      previousOrderCountRef.current = newCount;
      setOrders(ordersWithItems);
    } catch (err) {
      console.error('Error loading orders:', err);
      showToast('Failed to load orders', 'error');
    } finally {
      setLoading(false);
    }
  };

  const loadDailyBriefing = async () => {
    const today = new Date().toISOString().split('T')[0];
    const { data } = await supabase
      .from('kitchen_notes')
      .select('items_needed')
      .eq('date', today)
      .order('submitted_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (data) {
      setDailyBriefing(data.items_needed);
    }
  };

  const subscribeToOrders = () => {
    const channel = supabase
      .channel('kitchen-orders-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'kitchen_orders' },
        () => loadOrders()
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'order_items' },
        () => loadOrders()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const handleUpdateStatus = async (kitchenOrderId: string, orderId: number, newStatus: string) => {
    const updateData: Record<string, unknown> = { status: newStatus };

    if (newStatus === STATUS_PREPARING) {
      updateData.started_at = new Date().toISOString();
    } else if (newStatus === STATUS_READY || newStatus === STATUS_COMPLETED) {
      updateData.completed_at = new Date().toISOString();
    }

    const { error: koError } = await supabase
      .from('kitchen_orders')
      .update(updateData)
      .eq('id', kitchenOrderId);

    if (koError) {
      console.error('Error updating kitchen order:', koError);
      showToast('Failed to update order status', 'error');
      return;
    }

    if (newStatus === STATUS_PREPARING) {
      const { error: orderError } = await supabase
        .from('orders')
        .update({ status: 'in_kitchen' })
        .eq('id', orderId);

      if (orderError) {
        console.error('Error updating parent order:', orderError);
      }
    } else if (newStatus === STATUS_READY) {
      const { error: orderError } = await supabase
        .from('orders')
        .update({ status: 'ready', ready_at: new Date().toISOString() })
        .eq('id', orderId);

      if (orderError) {
        console.error('Error updating parent order:', orderError);
      }
    }

    showToast(`Order moved to ${newStatus.toUpperCase()}`, 'success');
    loadOrders();
  };

  const getOrdersByStatus = (status: string) => orders.filter(o => o.status === status);

  const newOrders = getOrdersByStatus(STATUS_NEW);
  const cookingOrders = getOrdersByStatus(STATUS_PREPARING);
  const readyOrders = getOrdersByStatus(STATUS_READY);
  const completedOrders = getOrdersByStatus(STATUS_COMPLETED);

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

  const columns = [
    {
      title: 'New Orders',
      icon: Clock,
      orders: newOrders,
      headerClass: 'bg-gradient-to-r from-orange-500 to-orange-600',
      accent: 'orange',
    },
    {
      title: 'Cooking',
      icon: Flame,
      orders: cookingOrders,
      headerClass: 'bg-gradient-to-r from-amber-500 to-yellow-500',
      accent: 'amber',
    },
    {
      title: 'Ready',
      icon: CheckCircle2,
      orders: readyOrders,
      headerClass: 'bg-gradient-to-r from-emerald-500 to-green-600',
      accent: 'emerald',
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
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
                <p className="text-xs text-slate-500 mt-0.5">{currentDate} · {currentTime}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={loadOrders}
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

      {/* Daily briefing banner */}
      {dailyBriefing && (
        <div className="bg-blue-600 text-white px-6 py-2.5 shadow-md">
          <div className="flex items-start gap-3 max-w-7xl mx-auto">
            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <div className="font-bold text-sm mb-0.5">Today's Briefing</div>
              <div className="text-sm text-white/90 whitespace-pre-wrap">{dailyBriefing}</div>
            </div>
            <button
              onClick={() => setDailyBriefing(null)}
              className="text-white/70 hover:text-white transition-colors text-xl leading-none px-2"
            >
              ×
            </button>
          </div>
        </div>
      )}

      {/* Main content */}
      {loading ? (
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <RefreshCw className="w-8 h-8 text-brand mx-auto mb-3 animate-spin" />
            <div className="text-slate-500 text-sm font-medium">Loading orders...</div>
          </div>
        </div>
      ) : (
        <main className="p-4 lg:p-6 pb-28">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
            {columns.map((col) => (
              <div key={col.title} className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
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
                    col.orders.map((order) => (
                      <OrderCard
                        key={order.id}
                        order={order}
                        onUpdateStatus={handleUpdateStatus}
                        now={now}
                      />
                    ))
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Completed orders */}
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
                  onClick={() => setShowCompleted(false)}
                  className="text-white/80 hover:text-white text-sm font-medium transition-colors"
                >
                  Hide
                </button>
              </div>
              <div className="p-3 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-80 overflow-y-auto scrollbar-thin">
                {completedOrders.map((order) => (
                  <OrderCard
                    key={order.id}
                    order={order}
                    onUpdateStatus={handleUpdateStatus}
                    now={now}
                  />
                ))}
              </div>
            </div>
          )}
        </main>
      )}

      {/* Footer actions */}
      <footer className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 shadow-lg p-3 z-30">
        <div className="flex gap-3 max-w-7xl mx-auto">
          <button
            onClick={() => setShowShortageModal(true)}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-red-50 hover:bg-red-100 text-red-600 font-bold rounded-xl transition-all border border-red-200 active:scale-95 text-sm"
          >
            <AlertCircle className="w-5 h-5" />
            Report Shortage (86)
          </button>
          <button
            onClick={() => setShowEndOfDayModal(true)}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-gradient-brand hover:opacity-90 text-white font-bold rounded-xl transition-all shadow-brand active:scale-95 text-sm"
          >
            <ClipboardList className="w-5 h-5" />
            End of Day List
          </button>
          {!showCompleted && completedOrders.length > 0 && (
            <button
              onClick={() => setShowCompleted(true)}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-blue-50 hover:bg-blue-100 text-blue-600 font-bold rounded-xl transition-all border border-blue-200 active:scale-95 text-sm"
            >
              <CheckCircle2 className="w-5 h-5" />
              Completed ({completedOrders.length})
            </button>
          )}
        </div>
      </footer>

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
