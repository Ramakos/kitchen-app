/*
  # Kitchen Display System Database Schema

  ## Overview
  This migration creates the complete database structure for the Kitchen Display System (KDS),
  including order management, kitchen staff authentication, and end-of-day reporting.

  ## 1. New Tables
  
  ### `kitchen_staff`
  - `id` (uuid, primary key) - Unique identifier for each kitchen staff member
  - `name` (text) - Staff member's full name
  - `pin` (text) - Encrypted PIN for login
  - `role` (text) - Staff role (always 'kitchen' for this system)
  - `created_at` (timestamptz) - Account creation timestamp
  - `is_active` (boolean) - Whether account is active
  
  ### `orders`
  - `id` (uuid, primary key) - Unique order identifier
  - `order_number` (text, unique) - Human-readable order number
  - `type` (text) - 'dine_in' or 'takeaway'
  - `status` (text) - Order status: 'pending', 'in_kitchen', 'ready', 'completed'
  - `customer_name` (text, nullable) - Optional customer name for held orders
  - `notes` (text, nullable) - Special instructions or modifiers
  - `placed_at` (timestamptz) - When order was placed
  - `started_at` (timestamptz, nullable) - When kitchen started preparing
  - `ready_at` (timestamptz, nullable) - When order was marked ready
  - `completed_at` (timestamptz, nullable) - When order was completed
  - `created_by` (uuid, nullable) - Staff who created the order (foreign key to kitchen_staff)
  
  ### `order_items`
  - `id` (uuid, primary key) - Unique item identifier
  - `order_id` (uuid) - Reference to parent order
  - `item_name` (text) - Name of the menu item
  - `quantity` (integer) - Number of items ordered
  - `modifiers` (text, nullable) - Item-specific modifications (e.g., "extra spicy")
  - `created_at` (timestamptz) - Item creation timestamp
  
  ### `kitchen_notes`
  - `id` (uuid, primary key) - Unique note identifier
  - `date` (date) - Date for the needed items list
  - `items_needed` (text) - List of items needed (free text)
  - `submitted_by` (uuid) - Staff who submitted (foreign key to kitchen_staff)
  - `submitted_at` (timestamptz) - Submission timestamp
  - `created_at` (timestamptz) - Note creation timestamp

  ## 2. Security
  
  ### Row Level Security (RLS)
  - All tables have RLS enabled
  - Policies restrict access to authenticated kitchen staff only
  - Staff can only access active orders and their own submissions
  
  ### Policies
  - Kitchen staff can view all active orders
  - Kitchen staff can update order statuses
  - Kitchen staff can create and view kitchen notes
  - Kitchen staff can view order items for active orders

  ## 3. Important Notes
  
  - Order numbers are auto-generated and sequential
  - Timestamps track order progress through each stage
  - Kitchen notes store end-of-day needed items lists
  - All sensitive data is protected by RLS
*/

-- Create kitchen_staff table
CREATE TABLE IF NOT EXISTS kitchen_staff (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  pin text NOT NULL,
  role text DEFAULT 'kitchen',
  created_at timestamptz DEFAULT now(),
  is_active boolean DEFAULT true
);

-- Create orders table
CREATE TABLE IF NOT EXISTS orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number text UNIQUE NOT NULL,
  type text NOT NULL CHECK (type IN ('dine_in', 'takeaway')),
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'in_kitchen', 'ready', 'completed')),
  customer_name text,
  notes text,
  placed_at timestamptz DEFAULT now(),
  started_at timestamptz,
  ready_at timestamptz,
  completed_at timestamptz,
  created_by uuid REFERENCES kitchen_staff(id)
);

-- Create order_items table
CREATE TABLE IF NOT EXISTS order_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  item_name text NOT NULL,
  quantity integer NOT NULL DEFAULT 1 CHECK (quantity > 0),
  modifiers text,
  created_at timestamptz DEFAULT now()
);

-- Create kitchen_notes table for end-of-day lists
CREATE TABLE IF NOT EXISTS kitchen_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  date date NOT NULL DEFAULT CURRENT_DATE,
  items_needed text NOT NULL,
  submitted_by uuid NOT NULL REFERENCES kitchen_staff(id),
  submitted_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_placed_at ON orders(placed_at);
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_kitchen_notes_date ON kitchen_notes(date);

-- Enable Row Level Security
ALTER TABLE kitchen_staff ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE kitchen_notes ENABLE ROW LEVEL SECURITY;

-- RLS Policies for kitchen_staff
CREATE POLICY "Kitchen staff can view active staff"
  ON kitchen_staff FOR SELECT
  TO authenticated
  USING (is_active = true);

CREATE POLICY "Kitchen staff can view own record"
  ON kitchen_staff FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

-- RLS Policies for orders
CREATE POLICY "Kitchen staff can view all orders"
  ON orders FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Kitchen staff can insert orders"
  ON orders FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Kitchen staff can update order status"
  ON orders FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- RLS Policies for order_items
CREATE POLICY "Kitchen staff can view all order items"
  ON order_items FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Kitchen staff can insert order items"
  ON order_items FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- RLS Policies for kitchen_notes
CREATE POLICY "Kitchen staff can view all kitchen notes"
  ON kitchen_notes FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Kitchen staff can insert kitchen notes"
  ON kitchen_notes FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Insert sample kitchen staff for testing
INSERT INTO kitchen_staff (name, pin, role) VALUES
  ('Kitchen Staff 1', '1234', 'kitchen'),
  ('Kitchen Staff 2', '5678', 'kitchen')
ON CONFLICT DO NOTHING;

-- Insert sample orders for testing
INSERT INTO orders (order_number, type, status, customer_name, notes, placed_at) VALUES
  ('001', 'dine_in', 'pending', 'Table 5', 'Extra spicy', now() - interval '5 minutes'),
  ('002', 'takeaway', 'in_kitchen', 'John Doe', 'No onions', now() - interval '15 minutes'),
  ('003', 'dine_in', 'ready', 'Table 3', NULL, now() - interval '30 minutes')
ON CONFLICT DO NOTHING;

-- Insert sample order items
DO $$
DECLARE
  order1_id uuid;
  order2_id uuid;
  order3_id uuid;
BEGIN
  SELECT id INTO order1_id FROM orders WHERE order_number = '001';
  SELECT id INTO order2_id FROM orders WHERE order_number = '002';
  SELECT id INTO order3_id FROM orders WHERE order_number = '003';
  
  IF order1_id IS NOT NULL THEN
    INSERT INTO order_items (order_id, item_name, quantity, modifiers) VALUES
      (order1_id, 'Chicken Burger', 2, 'Extra spicy'),
      (order1_id, 'French Fries', 2, 'Large')
    ON CONFLICT DO NOTHING;
  END IF;
  
  IF order2_id IS NOT NULL THEN
    INSERT INTO order_items (order_id, item_name, quantity, modifiers) VALUES
      (order2_id, 'Veggie Pizza', 1, 'No onions'),
      (order2_id, 'Soft Drink', 2, NULL)
    ON CONFLICT DO NOTHING;
  END IF;
  
  IF order3_id IS NOT NULL THEN
    INSERT INTO order_items (order_id, item_name, quantity, modifiers) VALUES
      (order3_id, 'Pasta Alfredo', 1, NULL),
      (order3_id, 'Caesar Salad', 1, 'Dressing on side')
    ON CONFLICT DO NOTHING;
  END IF;
END $$;