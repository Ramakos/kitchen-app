/*
  # Fix RLS Policies for PIN-based Kitchen Authentication

  ## Overview
  This migration updates RLS policies to work with PIN-based authentication
  instead of requiring Supabase Auth. This allows the kitchen app to function
  properly while maintaining security through the anon key.

  ## Changes
  
  1. **Drop existing authenticated-only policies**
     - Remove policies that require `authenticated` role
  
  2. **Create new anon-accessible policies**
     - Allow `anon` role (public access with API key) to:
       - View and update orders
       - View order items
       - View kitchen staff (for PIN verification)
       - Create and view kitchen notes
  
  3. **Security Notes**
     - Access is still restricted by the anon key
     - PIN verification happens in the application layer
     - The counter and worker apps can also access these tables
     - All apps share the same backend and sync in real-time

  ## Important
  This setup assumes:
  - Counter app creates orders (status: 'pending')
  - Kitchen app updates order status ('in_kitchen', 'ready', 'completed')
  - Worker app views orders and marks them as served
  - All apps use the same Supabase anon key for access
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Kitchen staff can view active staff" ON kitchen_staff;
DROP POLICY IF EXISTS "Kitchen staff can view own record" ON kitchen_staff;
DROP POLICY IF EXISTS "Kitchen staff can view all orders" ON orders;
DROP POLICY IF EXISTS "Kitchen staff can insert orders" ON orders;
DROP POLICY IF EXISTS "Kitchen staff can update order status" ON orders;
DROP POLICY IF EXISTS "Kitchen staff can view all order items" ON order_items;
DROP POLICY IF EXISTS "Kitchen staff can insert order items" ON order_items;
DROP POLICY IF EXISTS "Kitchen staff can view all kitchen notes" ON kitchen_notes;
DROP POLICY IF EXISTS "Kitchen staff can insert kitchen notes" ON kitchen_notes;

-- Create new policies for anon role (used by all apps)

-- kitchen_staff policies
CREATE POLICY "Allow anon to view active kitchen staff"
  ON kitchen_staff FOR SELECT
  TO anon
  USING (is_active = true);

-- orders policies
CREATE POLICY "Allow anon to view all orders"
  ON orders FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Allow anon to insert orders"
  ON orders FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Allow anon to update orders"
  ON orders FOR UPDATE
  TO anon
  USING (true)
  WITH CHECK (true);

-- order_items policies
CREATE POLICY "Allow anon to view all order items"
  ON order_items FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Allow anon to insert order items"
  ON order_items FOR INSERT
  TO anon
  WITH CHECK (true);

-- kitchen_notes policies
CREATE POLICY "Allow anon to view kitchen notes"
  ON kitchen_notes FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Allow anon to insert kitchen notes"
  ON kitchen_notes FOR INSERT
  TO anon
  WITH CHECK (true);