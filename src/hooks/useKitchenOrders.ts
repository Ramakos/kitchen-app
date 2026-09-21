import { useState, useEffect, useRef } from 'react';
import { supabase, KitchenOrder, OrderItem } from '../lib/supabase';
import { useToast } from '../components/Toast';

export const STATUS_NEW = 'new';
export const STATUS_PREPARING = 'preparing';
export const STATUS_READY = 'ready';
export const STATUS_COMPLETED = 'completed';

export const useKitchenOrders = () => {
  const [orders, setOrders] = useState<KitchenOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [dailyBriefing, setDailyBriefing] = useState<string | null>(null);
  const [now, setNow] = useState(new Date());
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const previousOrderCountRef = useRef(0);
  const { showToast } = useToast();

  const initAudio = () => {
    audioRef.current = new Audio(
      'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBjGJ0fPTgjMGHm7A7+OZUQ8NSKXi8bllHAY4kdfy0YE0BiBx0O/blEoME1qy6OuqWBQKR6Dg8r9uIwY0jNLy1YU1Bx9twO/fmVIPDkmo4vG7ahwGOpLY8tSBNQgfcsrv2ZRLDBNasufrq1kUCkeg4PK/byMGNY3T8tWHNwceZwA='
    );
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
        .in('status', [STATUS_NEW, STATUS_PREPARING, STATUS_READY])
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

  useEffect(() => {
    loadOrders();
    loadDailyBriefing();
    const unsub = subscribeToOrders();
    initAudio();

    const tick = setInterval(() => setNow(new Date()), 1000);
    return () => {
      clearInterval(tick);
      unsub();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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

  return {
    orders,
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
  };
};
