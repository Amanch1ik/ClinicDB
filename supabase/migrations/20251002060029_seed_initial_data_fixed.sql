/*
  # Seed Initial Data for Karakol Delivery

  ## Description
  This migration seeds the database with initial data matching your design:
  - Product categories
  - Sample products (Margarita, Peperoni, Classic Burger, Caesar Salad, drinks)
  - Sets up realistic pricing in Kyrgyzstan som

  ## Data Inserted
  1. Categories: Pizza, Burgers, Salads, Drinks
  2. Products: Popular menu items with descriptions in Russian/Uzbek
*/

-- Insert categories
INSERT INTO categories (name, name_ru, name_uz, icon, sort_order, is_active) VALUES
  ('Pizza', 'Пицца', 'Pitsa', '🍕', 1, true),
  ('Burgers', 'Бургеры', 'Burgerlar', '🍔', 2, true),
  ('Salads', 'Салаты', 'Salatlar', '🥗', 3, true),
  ('Drinks', 'Напитки', 'Ichimliklar', '🥤', 4, true)
ON CONFLICT DO NOTHING;

-- Insert products (Pizza)
INSERT INTO products (category_id, name, name_ru, name_uz, description, description_ru, description_uz, price, color, is_available)
SELECT 
  c.id,
  'Margarita',
  'Маргарита',
  'Margarita',
  'Tomato and mozzarella classic pizza',
  'Помидор и моццарелла классическая пицца',
  'Pomidor va mozzarella bilan klassik pitsa',
  45000,
  '#F59E0B',
  true
FROM categories c WHERE c.name = 'Pizza'
ON CONFLICT DO NOTHING;

INSERT INTO products (category_id, name, name_ru, name_uz, description, description_ru, description_uz, price, color, is_available)
SELECT 
  c.id,
  'Peperoni',
  'Пеперони',
  'Peperoni',
  'Pepperoni sausage and spicy cheese pizza',
  'Пеперони колбаса и острый сыр пицца',
  'Peperoni kolbasasi va pishloq bilan pitsa',
  55000,
  '#EF4444',
  true
FROM categories c WHERE c.name = 'Pizza'
ON CONFLICT DO NOTHING;

-- Insert products (Burgers)
INSERT INTO products (category_id, name, name_ru, name_uz, description, description_ru, description_uz, price, color, is_available)
SELECT 
  c.id,
  'Classic Burger',
  'Бургер Классик',
  'Burger Klassik',
  'Beef, lettuce, pickles, onions, and special sauce',
  'Говядина, салат, огурцы, лук и специальный соус',
  'Mol goshti, pishloq, salat bargi, piyoz va maxsus sous',
  35000,
  '#3B82F6',
  true
FROM categories c WHERE c.name = 'Burgers'
ON CONFLICT DO NOTHING;

-- Insert products (Salads)
INSERT INTO products (category_id, name, name_ru, name_uz, description, description_ru, description_uz, price, color, is_available)
SELECT 
  c.id,
  'Caesar Salad',
  'Сезар Салат',
  'Sezar Salati',
  'Chicken, tomato, parmesan cheese and caesar sauce',
  'Курица, помидор, сыр пармезан и соус цезарь',
  'Tovuq, pomidor, parmezanpishlogi va sezar sousi',
  25000,
  '#10B981',
  true
FROM categories c WHERE c.name = 'Salads'
ON CONFLICT DO NOTHING;

-- Insert products (Drinks)
INSERT INTO products (category_id, name, name_ru, name_uz, description, description_ru, description_uz, price, color, is_available)
SELECT 
  c.id,
  'Coca-Cola',
  'Кока-Кола',
  'Koka-kola',
  '750 ml',
  '750 мл',
  '750 ml',
  12000,
  '#3B82F6',
  true
FROM categories c WHERE c.name = 'Drinks'
ON CONFLICT DO NOTHING;

INSERT INTO products (category_id, name, name_ru, name_uz, description, description_ru, description_uz, price, color, is_available)
SELECT 
  c.id,
  'Pepsi',
  'Пепси',
  'Pepsi',
  '1 liter',
  '1 литр',
  '1 litr',
  13000,
  '#9CA3AF',
  true
FROM categories c WHERE c.name = 'Drinks'
ON CONFLICT DO NOTHING;