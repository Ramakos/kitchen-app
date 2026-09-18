import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Matches live `orders` table (integer PK, order_type, status enum, created_at)
export type Order = {
  id: number;
  order_number: number;
  order_type: 'dine_in' | 'takeaway' | 'delivery';
  mode: 'dine_in' | 'takeaway' | 'delivery';
  source: 'pos' | 'app' | 'phone' | 'walk_in';
  status: 'pending' | 'confirmed' | 'in_kitchen' | 'ready' | 'served' | 'delivered' | 'cancelled' | 'held';
  customer_name?: string | null;
  notes?: string | null;
  items?: Record<string, unknown>[];
  created_at: string;
  ready_at?: string | null;
  created_by?: string | null;
};

// Matches live `order_items` table (menu_item_name, integer PK)
export type OrderItem = {
  id: number;
  order_id: number;
  menu_item_name: string;
  quantity: number;
  modifiers?: string | null;
  notes?: string | null;
  category?: string | null;
  unit_price?: number | null;
  subtotal?: number | null;
  created_at?: string | null;
};

export type KitchenStaff = {
  id: string;
  name: string;
  pin: string;
  role: string;
  is_active: boolean;
  created_at: string;
};

export type KitchenNote = {
  id: string;
  date: string;
  items_needed: string;
  submitted_by: string;
  submitted_at: string;
  created_at: string;
};

// kitchen_orders.status enum: 'new' | 'preparing' | 'ready' | 'completed' | 'cancelled'
export type KitchenOrderStatus = 'new' | 'preparing' | 'ready' | 'completed' | 'cancelled';

export type KitchenOrder = {
  id: string;
  order_id: number;
  priority: number;
  status: KitchenOrderStatus;
  notes?: string | null;
  created_at: string;
  started_at?: string | null;
  completed_at?: string | null;
  updated_at?: string | null;
  orders: Order;
  order_items: OrderItem[];
};

// kitchen_needs.status CHECK: 'pending' | 'approved' | 'ordered' | 'received'
export type KitchenNeedStatus = 'pending' | 'approved' | 'ordered' | 'received';

export type KitchenNeed = {
  id: string;
  item_name: string;
  quantity?: number | null;
  unit?: string | null;
  notes?: string | null;
  status: KitchenNeedStatus;
  requested_by?: string | null;
  approved_by?: string | null;
  date: string;
  created_at: string;
  updated_at?: string | null;
};
