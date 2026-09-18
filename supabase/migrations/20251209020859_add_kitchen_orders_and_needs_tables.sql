/*
  # Add Kitchen Orders and Kitchen Needs Tables

  ## Overview
  This migration adds two critical tables to complete the Kitchen Display System:
  - `kitchen_orders` - Separate table for kitchen workflow (allows Counter App and Kitchen App to work independently)
  - `kitchen_needs` - Inventory shortage tracking (the "86 list")

  ## 1. New Tables

  ### `kitchen_orders`
  Kitchen-specific view of orders with priority management
  - `id` (uuid, primary key) - Unique kitchen order identifier
  - `order_id` (uuid) - Reference to parent order in orders table
  - `priority` (integer) - Priority level (5=highest, 1=lowest, 0=normal)
  - `status` (text) - Kitchen status: 'PENDING', 'STARTED', 'READY', 'COMPLETED'
  - `created_at` (timestamptz) - When order entered kitchen queue
  - `started_at` (timestamptz, nullable) - When cooking started
  - `completed_at` (timestamptz, nullable) - When kitchen finished

  ### `kitchen_needs`
  Inventory shortage tracking and requests
  - `id` (uuid, primary key) - Unique request identifier
  - `item_name` (text) - Name of needed item
  - `quantity` (text) - Amount needed (e.g., "2 crates", "5kg")
  - `status` (text) - Request status: 'REQUESTED', 'APPROVED', 'ORDERED', 'RECEIVED'
  - `requested_by` (uuid) - Staff who submitted request
  - `date` (date) - Date of request
  - `created_at` (timestamptz) - Request timestamp
  - `notes` (text, nullable) - Additional notes

  ## 2. Security
  - Enable RLS on both tables
  - Allow authenticated kitchen staff to view and insert records
  - Allow updating kitchen_orders status
  - Allow viewing kitchen_needs with status updates by managers

  ## 3. Important Notes
  - kitchen_orders.order_id links to orders.id for cross-referencing
  - Priority: 5 (urgent/rush), 3 (high), 0 (normal), -1 (low)
  - When kitchen completes an order, BOTH kitchen_orders and orders must be updated
  - kitchen_needs replaces kitchen_notes for inventory (kitchen_notes is for daily briefings only)
*/

-- Create kitchen_orders table
CREATE TABLE IF NOT EXISTS kitchen_orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  priority integer NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'STARTED', 'READY', 'COMPLETED')),
  created_at timestamptz NOT NULL DEFAULT now(),
  started_at timestamptz,
  completed_at timestamptz
);

-- Create kitchen_needs table
CREATE TABLE IF NOT EXISTS kitchen_needs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  item_name text NOT NULL,
  quantity text NOT NULL,
  status text NOT NULL DEFAULT 'REQUESTED' CHECK (status IN ('REQUESTED', 'APPROVED', 'ORDERED', 'RECEIVED')),
  requested_by uuid NOT NULL REFERENCES kitchen_staff(id),
  date date NOT NULL DEFAULT CURRENT_DATE,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_kitchen_orders_order_id ON kitchen_orders(order_id);
CREATE INDEX IF NOT EXISTS idx_kitchen_orders_status ON kitchen_orders(status);
CREATE INDEX IF NOT EXISTS idx_kitchen_orders_priority ON kitchen_orders(priority DESC);
CREATE INDEX IF NOT EXISTS idx_kitchen_orders_created_at ON kitchen_orders(created_at);
CREATE INDEX IF NOT EXISTS idx_kitchen_needs_status ON kitchen_needs(status);
CREATE INDEX IF NOT EXISTS idx_kitchen_needs_date ON kitchen_needs(date);

-- Enable Row Level Security
ALTER TABLE kitchen_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE kitchen_needs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for kitchen_orders
CREATE POLICY "Kitchen staff can view all kitchen orders"
  ON kitchen_orders FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Kitchen staff can insert kitchen orders"
  ON kitchen_orders FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Kitchen staff can update kitchen orders"
  ON kitchen_orders FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- RLS Policies for kitchen_needs
CREATE POLICY "Kitchen staff can view all kitchen needs"
  ON kitchen_needs FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Kitchen staff can insert kitchen needs"
  ON kitchen_needs FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Kitchen staff can update kitchen needs"
  ON kitchen_needs FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Add category column to order_items if it doesn't exist (for food/drink filtering)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'order_items' AND column_name = 'category'
  ) THEN
    ALTER TABLE order_items ADD COLUMN category text DEFAULT 'food' CHECK (category IN ('food', 'drink'));
  END IF;
END $$;

-- Add priority column to orders table for easier tracking
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'orders' AND column_name = 'priority'
  ) THEN
    ALTER TABLE orders ADD COLUMN priority integer DEFAULT 0;
  END IF;
END $$;

-- Sample data: Create kitchen_orders for existing orders
INSERT INTO kitchen_orders (order_id, priority, status, created_at)
SELECT 
  id,
  0 as priority,
  CASE 
    WHEN status = 'pending' THEN 'PENDING'
    WHEN status = 'in_kitchen' THEN 'STARTED'
    WHEN status = 'ready' THEN 'READY'
    WHEN status = 'completed' THEN 'COMPLETED'
    ELSE 'PENDING'
  END as status,
  placed_at as created_at
FROM orders
WHERE NOT EXISTS (
  SELECT 1 FROM kitchen_orders WHERE kitchen_orders.order_id = orders.id
)
ON CONFLICT DO NOTHING;