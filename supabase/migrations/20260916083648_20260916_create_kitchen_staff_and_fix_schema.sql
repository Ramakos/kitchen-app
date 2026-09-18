/*
  # Create kitchen_staff table and align schema for Ramakos KDS

  ## Overview
  The live database is missing the `kitchen_staff` table that the kitchen app
  depends on for PIN-based login. Several columns the app expects also need to
  be added to existing tables. This migration creates the missing table and
  adds the needed columns without dropping or modifying any existing data.

  ## 1. New Table: kitchen_staff
  - `id` (uuid, primary key) — unique staff identifier
  - `name` (text) — staff member's full name
  - `pin` (text) — PIN for login (plain text for demo; app does client-side check)
  - `role` (text, default 'kitchen') — staff role
  - `is_active` (boolean, default true) — whether the account is active
  - `created_at` (timestamptz) — account creation timestamp

  ## 2. Column additions
  - `orders.notes` (text, nullable) — special instructions for the kitchen
  - `orders.customer_name` already exists — no change needed
  - `order_items.category` already exists — no change needed

  ## 3. Sample data
  - Insert two demo kitchen staff accounts (PINs 1234 and 5678)

  ## 4. Security
  - Enable RLS on kitchen_staff
  - Allow anon + authenticated to SELECT active staff (for PIN verification)
  - No inserts/updates/deletes from the client app
*/

-- 1. Create kitchen_staff table
CREATE TABLE IF NOT EXISTS kitchen_staff (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  pin text NOT NULL,
  role text DEFAULT 'kitchen',
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- 2. Enable RLS
ALTER TABLE kitchen_staff ENABLE ROW LEVEL SECURITY;

-- 3. RLS policies — anon can view active staff for PIN login
DROP POLICY IF EXISTS "anon_view_active_kitchen_staff" ON kitchen_staff;
CREATE POLICY "anon_view_active_kitchen_staff"
  ON kitchen_staff FOR SELECT
  TO anon, authenticated
  USING (is_active = true);

-- 4. Insert demo staff
INSERT INTO kitchen_staff (name, pin, role) VALUES
  ('Kitchen Staff 1', '1234', 'kitchen'),
  ('Kitchen Staff 2', '5678', 'kitchen')
ON CONFLICT DO NOTHING;

-- 5. Add notes column to orders if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'orders' AND column_name = 'notes'
  ) THEN
    ALTER TABLE orders ADD COLUMN notes text;
  END IF;
END $$;