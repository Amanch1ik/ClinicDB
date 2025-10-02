export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      categories: {
        Row: {
          id: string
          name: string
          name_ru: string | null
          name_uz: string | null
          icon: string | null
          sort_order: number
          is_active: boolean
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          name_ru?: string | null
          name_uz?: string | null
          icon?: string | null
          sort_order?: number
          is_active?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          name_ru?: string | null
          name_uz?: string | null
          icon?: string | null
          sort_order?: number
          is_active?: boolean
          created_at?: string
        }
      }
      products: {
        Row: {
          id: string
          category_id: string | null
          name: string
          name_ru: string | null
          name_uz: string | null
          description: string | null
          description_ru: string | null
          description_uz: string | null
          price: number
          image_url: string | null
          color: string
          is_available: boolean
          created_at: string
        }
        Insert: {
          id?: string
          category_id?: string | null
          name: string
          name_ru?: string | null
          name_uz?: string | null
          description?: string | null
          description_ru?: string | null
          description_uz?: string | null
          price: number
          image_url?: string | null
          color?: string
          is_available?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          category_id?: string | null
          name?: string
          name_ru?: string | null
          name_uz?: string | null
          description?: string | null
          description_ru?: string | null
          description_uz?: string | null
          price?: number
          image_url?: string | null
          color?: string
          is_available?: boolean
          created_at?: string
        }
      }
      profiles: {
        Row: {
          id: string
          full_name: string
          phone: string
          avatar_url: string | null
          role: 'customer' | 'courier' | 'admin'
          balance: number
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          full_name: string
          phone: string
          avatar_url?: string | null
          role?: 'customer' | 'courier' | 'admin'
          balance?: number
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          full_name?: string
          phone?: string
          avatar_url?: string | null
          role?: 'customer' | 'courier' | 'admin'
          balance?: number
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      orders: {
        Row: {
          id: string
          order_number: number
          customer_id: string
          courier_id: string | null
          status: 'pending' | 'confirmed' | 'preparing' | 'ready' | 'picked_up' | 'delivering' | 'delivered' | 'cancelled'
          total_amount: number
          delivery_address: string
          delivery_lat: number | null
          delivery_lng: number | null
          payment_method: 'cash' | 'mbank' | 'optima' | 'bakai' | 'demir' | 'balance'
          payment_status: 'pending' | 'completed' | 'failed' | 'refunded'
          estimated_delivery_time: string | null
          actual_delivery_time: string | null
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          order_number?: number
          customer_id: string
          courier_id?: string | null
          status?: 'pending' | 'confirmed' | 'preparing' | 'ready' | 'picked_up' | 'delivering' | 'delivered' | 'cancelled'
          total_amount: number
          delivery_address: string
          delivery_lat?: number | null
          delivery_lng?: number | null
          payment_method: 'cash' | 'mbank' | 'optima' | 'bakai' | 'demir' | 'balance'
          payment_status?: 'pending' | 'completed' | 'failed' | 'refunded'
          estimated_delivery_time?: string | null
          actual_delivery_time?: string | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          order_number?: number
          customer_id?: string
          courier_id?: string | null
          status?: 'pending' | 'confirmed' | 'preparing' | 'ready' | 'picked_up' | 'delivering' | 'delivered' | 'cancelled'
          total_amount?: number
          delivery_address?: string
          delivery_lat?: number | null
          delivery_lng?: number | null
          payment_method?: 'cash' | 'mbank' | 'optima' | 'bakai' | 'demir' | 'balance'
          payment_status?: 'pending' | 'completed' | 'failed' | 'refunded'
          estimated_delivery_time?: string | null
          actual_delivery_time?: string | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      order_items: {
        Row: {
          id: string
          order_id: string
          product_id: string
          quantity: number
          price_at_purchase: number
          created_at: string
        }
        Insert: {
          id?: string
          order_id: string
          product_id: string
          quantity: number
          price_at_purchase: number
          created_at?: string
        }
        Update: {
          id?: string
          order_id?: string
          product_id?: string
          quantity?: number
          price_at_purchase?: number
          created_at?: string
        }
      }
      courier_locations: {
        Row: {
          id: string
          courier_id: string
          latitude: number
          longitude: number
          heading: number | null
          speed: number | null
          updated_at: string
        }
        Insert: {
          id?: string
          courier_id: string
          latitude: number
          longitude: number
          heading?: number | null
          speed?: number | null
          updated_at?: string
        }
        Update: {
          id?: string
          courier_id?: string
          latitude?: number
          longitude?: number
          heading?: number | null
          speed?: number | null
          updated_at?: string
        }
      }
      order_tracking: {
        Row: {
          id: string
          order_id: string
          status: 'pending' | 'confirmed' | 'preparing' | 'ready' | 'picked_up' | 'delivering' | 'delivered' | 'cancelled'
          latitude: number | null
          longitude: number | null
          notes: string | null
          created_at: string
        }
        Insert: {
          id?: string
          order_id: string
          status: 'pending' | 'confirmed' | 'preparing' | 'ready' | 'picked_up' | 'delivering' | 'delivered' | 'cancelled'
          latitude?: number | null
          longitude?: number | null
          notes?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          order_id?: string
          status?: 'pending' | 'confirmed' | 'preparing' | 'ready' | 'picked_up' | 'delivering' | 'delivered' | 'cancelled'
          latitude?: number | null
          longitude?: number | null
          notes?: string | null
          created_at?: string
        }
      }
      payment_transactions: {
        Row: {
          id: string
          order_id: string
          amount: number
          payment_method: 'cash' | 'mbank' | 'optima' | 'bakai' | 'demir' | 'balance'
          bank_name: string | null
          transaction_id: string | null
          status: 'pending' | 'completed' | 'failed' | 'refunded'
          created_at: string
        }
        Insert: {
          id?: string
          order_id: string
          amount: number
          payment_method: 'cash' | 'mbank' | 'optima' | 'bakai' | 'demir' | 'balance'
          bank_name?: string | null
          transaction_id?: string | null
          status?: 'pending' | 'completed' | 'failed' | 'refunded'
          created_at?: string
        }
        Update: {
          id?: string
          order_id?: string
          amount?: number
          payment_method?: 'cash' | 'mbank' | 'optima' | 'bakai' | 'demir' | 'balance'
          bank_name?: string | null
          transaction_id?: string | null
          status?: 'pending' | 'completed' | 'failed' | 'refunded'
          created_at?: string
        }
      }
    }
  }
}
