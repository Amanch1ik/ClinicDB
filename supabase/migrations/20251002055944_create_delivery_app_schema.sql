/*
  # Karakol Delivery Application - Complete Database Schema

  ## Overview
  Complete database schema for a full-featured delivery application similar to Yandex/Glovo
  with support for customers, couriers, admins, real-time tracking, and payments.

  ## New Tables

  ### 1. profiles
  - Stores user profile information linked to auth.users
  - Fields: id, full_name, phone, avatar_url, role (customer/courier/admin), created_at, updated_at
  - Role-based access for different user types

  ### 2. categories
  - Product categories (Pizza, Burger, Salad, Drinks, etc.)
  - Fields: id, name, name_ru, name_uz, icon, sort_order, is_active

  ### 3. products
  - All available products in the catalog
  - Fields: id, category_id, name, name_ru, name_uz, description, description_ru, description_uz,
    price, image_url, color, is_available, created_at

  ### 4. orders
  - Customer orders with full tracking
  - Fields: id, customer_id, courier_id, status, total_amount, delivery_address, delivery_lat,
    delivery_lng, payment_method, payment_status, estimated_delivery_time, notes, created_at, updated_at

  ### 5. order_items
  - Items in each order
  - Fields: id, order_id, product_id, quantity, price_at_purchase

  ### 6. courier_locations
  - Real-time courier location tracking
  - Fields: id, courier_id, latitude, longitude, heading, speed, updated_at

  ### 7. order_tracking
  - Order status history and tracking
  - Fields: id, order_id, status, latitude, longitude, notes, created_at

  ### 8. payment_transactions
  - Payment records for Kyrgyzstan banks
  - Fields: id, order_id, amount, payment_method, bank_name, transaction_id, status, created_at

  ## Security
  - Enable RLS on all tables
  - Separate policies for customers, couriers, and admins
  - Customers can only see their own orders
  - Couriers can see assigned orders
  - Admins have full access

  ## Enums
  - user_role: customer, courier, admin
  - order_status: pending, confirmed, preparing, ready, picked_up, delivering, delivered, cancelled
  - payment_method: cash, mbank, optima, bakai, demir, balance
  - payment_status: pending, completed, failed, refunded
*/

-- Create enum types
DO $$ BEGIN
  CREATE TYPE user_role AS ENUM ('customer', 'courier', 'admin');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE order_status AS ENUM ('pending', 'confirmed', 'preparing', 'ready', 'picked_up', 'delivering', 'delivered', 'cancelled');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE payment_method AS ENUM ('cash', 'mbank', 'optima', 'bakai', 'demir', 'balance');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE payment_status AS ENUM ('pending', 'completed', 'failed', 'refunded');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text NOT NULL,
  phone text UNIQUE NOT NULL,
  avatar_url text,
  role user_role NOT NULL DEFAULT 'customer',
  balance decimal(10,2) DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Categories table
CREATE TABLE IF NOT EXISTS categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  name_ru text,
  name_uz text,
  icon text,
  sort_order int DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

-- Products table
CREATE TABLE IF NOT EXISTS products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id uuid REFERENCES categories(id) ON DELETE CASCADE,
  name text NOT NULL,
  name_ru text,
  name_uz text,
  description text,
  description_ru text,
  description_uz text,
  price decimal(10,2) NOT NULL,
  image_url text,
  color text DEFAULT '#F59E0B',
  is_available boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE products ENABLE ROW LEVEL SECURITY;

-- Orders table
CREATE TABLE IF NOT EXISTS orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number serial UNIQUE NOT NULL,
  customer_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  courier_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
  status order_status DEFAULT 'pending',
  total_amount decimal(10,2) NOT NULL,
  delivery_address text NOT NULL,
  delivery_lat decimal(10,8),
  delivery_lng decimal(11,8),
  payment_method payment_method NOT NULL,
  payment_status payment_status DEFAULT 'pending',
  estimated_delivery_time timestamptz,
  actual_delivery_time timestamptz,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- Order items table
CREATE TABLE IF NOT EXISTS order_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
  quantity int NOT NULL CHECK (quantity > 0),
  price_at_purchase decimal(10,2) NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

-- Courier locations table (for real-time tracking)
CREATE TABLE IF NOT EXISTS courier_locations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  courier_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  latitude decimal(10,8) NOT NULL,
  longitude decimal(11,8) NOT NULL,
  heading decimal(5,2),
  speed decimal(5,2),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE courier_locations ENABLE ROW LEVEL SECURITY;

-- Order tracking table (status history)
CREATE TABLE IF NOT EXISTS order_tracking (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  status order_status NOT NULL,
  latitude decimal(10,8),
  longitude decimal(11,8),
  notes text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE order_tracking ENABLE ROW LEVEL SECURITY;

-- Payment transactions table
CREATE TABLE IF NOT EXISTS payment_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  amount decimal(10,2) NOT NULL,
  payment_method payment_method NOT NULL,
  bank_name text,
  transaction_id text,
  status payment_status DEFAULT 'pending',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE payment_transactions ENABLE ROW LEVEL SECURITY;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_profiles_phone ON profiles(phone);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_orders_customer ON orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_orders_courier ON orders(courier_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_courier_locations_courier ON courier_locations(courier_id);
CREATE INDEX IF NOT EXISTS idx_order_tracking_order ON order_tracking(order_id);

-- RLS Policies

-- Profiles: Users can read all profiles but only update their own
CREATE POLICY "Anyone can view profiles"
  ON profiles FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Categories: Everyone can read active categories
CREATE POLICY "Anyone can view active categories"
  ON categories FOR SELECT
  TO authenticated
  USING (is_active = true);

CREATE POLICY "Admins can manage categories"
  ON categories FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

-- Products: Everyone can read available products
CREATE POLICY "Anyone can view available products"
  ON products FOR SELECT
  TO authenticated
  USING (is_available = true);

CREATE POLICY "Admins can manage products"
  ON products FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

-- Orders: Customers see their orders, couriers see assigned orders, admins see all
CREATE POLICY "Customers can view own orders"
  ON orders FOR SELECT
  TO authenticated
  USING (
    customer_id = auth.uid() OR
    courier_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Customers can create orders"
  ON orders FOR INSERT
  TO authenticated
  WITH CHECK (customer_id = auth.uid());

CREATE POLICY "Couriers and admins can update orders"
  ON orders FOR UPDATE
  TO authenticated
  USING (
    courier_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

-- Order items: Access follows order access
CREATE POLICY "Users can view order items for their orders"
  ON order_items FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM orders
      WHERE orders.id = order_items.order_id
      AND (
        orders.customer_id = auth.uid() OR
        orders.courier_id = auth.uid() OR
        EXISTS (
          SELECT 1 FROM profiles
          WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
        )
      )
    )
  );

CREATE POLICY "Customers can insert order items"
  ON order_items FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM orders
      WHERE orders.id = order_items.order_id
      AND orders.customer_id = auth.uid()
    )
  );

-- Courier locations: Couriers update their location, customers see assigned courier location
CREATE POLICY "Couriers can manage own location"
  ON courier_locations FOR ALL
  TO authenticated
  USING (courier_id = auth.uid());

CREATE POLICY "Users can view courier locations for their orders"
  ON courier_locations FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM orders
      WHERE orders.courier_id = courier_locations.courier_id
      AND (orders.customer_id = auth.uid() OR orders.courier_id = auth.uid())
    ) OR
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

-- Order tracking: Same as orders
CREATE POLICY "Users can view tracking for their orders"
  ON order_tracking FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM orders
      WHERE orders.id = order_tracking.order_id
      AND (
        orders.customer_id = auth.uid() OR
        orders.courier_id = auth.uid() OR
        EXISTS (
          SELECT 1 FROM profiles
          WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
        )
      )
    )
  );

CREATE POLICY "Couriers and admins can insert tracking"
  ON order_tracking FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM orders
      WHERE orders.id = order_tracking.order_id
      AND (
        orders.courier_id = auth.uid() OR
        EXISTS (
          SELECT 1 FROM profiles
          WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
        )
      )
    )
  );

-- Payment transactions: Follow order access
CREATE POLICY "Users can view payments for their orders"
  ON payment_transactions FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM orders
      WHERE orders.id = payment_transactions.order_id
      AND (
        orders.customer_id = auth.uid() OR
        EXISTS (
          SELECT 1 FROM profiles
          WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
        )
      )
    )
  );

CREATE POLICY "System can insert payment transactions"
  ON payment_transactions FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM orders
      WHERE orders.id = payment_transactions.order_id
      AND orders.customer_id = auth.uid()
    )
  );

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updated_at
DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_orders_updated_at ON orders;
CREATE TRIGGER update_orders_updated_at
  BEFORE UPDATE ON orders
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();