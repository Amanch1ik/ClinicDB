# Karakol Delivery - Full-Featured Delivery Application

A comprehensive food delivery application similar to Yandex.Eats and Glovo, built with React, TypeScript, and Supabase.

## Features

### Customer Features
- **User Authentication**: Register and login with phone number and password
- **Product Catalog**: Browse products by categories (Pizza, Burgers, Salads, Drinks)
- **Shopping Cart**: Add/remove items, update quantities
- **Order Placement**: Checkout with delivery address and payment method selection
- **Payment Methods**: Cash, MBank, Optima Bank, Bakai Bank, Demir Bank, and Balance
- **Order Tracking**: Real-time order status updates
- **Order History**: View all past and current orders
- **User Profile**: Manage personal information and account balance

### Courier Features
- **Order Dashboard**: View available and assigned orders
- **Accept Orders**: Pick up available orders
- **Status Updates**: Update order status (Preparing → Ready → Picked Up → Delivering → Delivered)
- **Navigation**: Google Maps integration for route navigation
- **Real-time Updates**: Automatic order list updates

### Admin Features
- **Products Management**: Add, edit, and toggle product availability
- **Orders Management**: View all orders, update statuses, confirm/cancel orders
- **User Management**: View users, change roles (Customer/Courier/Admin), activate/deactivate accounts
- **Dashboard Overview**: Statistics and system overview

## Tech Stack

- **Frontend**: React 18, TypeScript, Tailwind CSS
- **Backend**: Supabase (PostgreSQL database, Authentication, Real-time subscriptions)
- **Icons**: Lucide React
- **Build Tool**: Vite

## Database Schema

- **profiles**: User profiles with roles (customer/courier/admin)
- **categories**: Product categories
- **products**: Available products with pricing
- **orders**: Customer orders with delivery information
- **order_items**: Line items for each order
- **courier_locations**: Real-time courier GPS tracking
- **order_tracking**: Order status history
- **payment_transactions**: Payment records

## Getting Started

### Prerequisites
- Node.js 16+ installed
- Supabase account (database is pre-configured)

### Installation

1. Install dependencies:
```bash
npm install
```

2. Environment variables are already configured in `.env`

3. Start the development server:
```bash
npm run dev
```

4. Open your browser to the URL shown in terminal (usually http://localhost:5173)

### Creating Test Accounts

#### Admin Account
1. Register a new account
2. Use Supabase dashboard to change the user's role to 'admin' in the profiles table

#### Courier Account
1. Register a new account
2. Use Supabase dashboard to change the user's role to 'courier' in the profiles table

#### Customer Account
- Any newly registered account is automatically a customer

## Usage Guide

### For Customers
1. **Browse Products**: View the product catalog on the home page
2. **Add to Cart**: Click the + button on any product
3. **View Cart**: Navigate to the cart page to review items
4. **Checkout**: Fill in delivery address, select payment method, and place order
5. **Track Order**: View order status in "My Orders" page

### For Couriers
1. **View Available Orders**: See all confirmed orders waiting for pickup
2. **Accept Order**: Click "Accept" to take responsibility for delivery
3. **Update Status**: Progress through statuses as you prepare and deliver
4. **Navigate**: Use the navigation button to open Google Maps with directions
5. **Complete Delivery**: Mark as delivered when order is handed to customer

### For Admins
1. **Manage Products**: Toggle availability, edit details
2. **Process Orders**: Confirm pending orders, monitor all deliveries
3. **Manage Users**: Change user roles, activate/deactivate accounts
4. **View Analytics**: Monitor overall system statistics

## Payment Integration

The app supports local Kyrgyzstan payment methods:
- **Cash**: Pay on delivery
- **MBank**: Mobile banking app
- **Optima Bank**: Bank transfer
- **Bakai Bank**: Bank transfer
- **Demir Bank**: Bank transfer
- **Balance**: Use account balance

## Real-time Features

- Order status updates are instant using Supabase real-time subscriptions
- Couriers see new orders immediately
- Customers see their order status updates in real-time
- Admins see all system changes live

## Security Features

- Row Level Security (RLS) enabled on all tables
- Users can only access their own data
- Couriers can only see assigned orders
- Admins have full system access
- Secure authentication with Supabase Auth

## Build for Production

```bash
npm run build
```

The optimized production files will be in the `dist/` directory.

## Project Structure

```
src/
├── components/
│   ├── Admin/          # Admin panel components
│   ├── Auth/           # Login and registration
│   ├── Courier/        # Courier dashboard
│   ├── Customer/       # Customer-facing components
│   └── Navigation.tsx  # Bottom navigation bar
├── contexts/
│   ├── AuthContext.tsx # Authentication state management
│   └── CartContext.tsx # Shopping cart state management
├── lib/
│   ├── supabase.ts     # Supabase client configuration
│   ├── database.types.ts # TypeScript types from database
│   └── utils.ts        # Utility functions
└── App.tsx             # Main application component
```

## Contributing

This is a full-featured delivery application ready for customization and deployment.

## License

MIT
