/*
  # Fix RLS Policies for Anonymous Access

  ## Problem
  The kitchen app uses PIN-based authentication which connects as the `anon` role,
  but the RLS policies on `kitchen_orders` and `kitchen_needs` only allow `authenticated` users.

  ## Solution
  Update all policies to allow both `anon` and `authenticated` roles so PIN authentication works.

  ## Changes
  - Drop existing policies that only allow `authenticated`
  - Recreate policies to allow both `anon` and `authenticated` roles
  - Applies to both `kitchen_orders` and `kitchen_needs` tables
*/

-- Drop existing kitchen_orders policies
DROP POLICY IF EXISTS "Kitchen staff can view all kitchen orders" ON kitchen_orders;
DROP POLICY IF EXISTS "Kitchen staff can insert kitchen orders" ON kitchen_orders;
DROP POLICY IF EXISTS "Kitchen staff can update kitchen orders" ON kitchen_orders;

-- Recreate kitchen_orders policies for both anon and authenticated
CREATE POLICY "Kitchen staff can view all kitchen orders"
  ON kitchen_orders FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Kitchen staff can insert kitchen orders"
  ON kitchen_orders FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Kitchen staff can update kitchen orders"
  ON kitchen_orders FOR UPDATE
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

-- Drop existing kitchen_needs policies
DROP POLICY IF EXISTS "Kitchen staff can view all kitchen needs" ON kitchen_needs;
DROP POLICY IF EXISTS "Kitchen staff can insert kitchen needs" ON kitchen_needs;
DROP POLICY IF EXISTS "Kitchen staff can update kitchen needs" ON kitchen_needs;

-- Recreate kitchen_needs policies for both anon and authenticated
CREATE POLICY "Kitchen staff can view all kitchen needs"
  ON kitchen_needs FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Kitchen staff can insert kitchen needs"
  ON kitchen_needs FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Kitchen staff can update kitchen needs"
  ON kitchen_needs FOR UPDATE
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);
