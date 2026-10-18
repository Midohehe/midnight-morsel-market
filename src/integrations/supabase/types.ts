export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      cooks: {
        Row: {
          address_ar: string
          address_en: string
          avatar: string
          banned: boolean
          cover: string
          id: string
          is_open: boolean
          is_verified: boolean
          kitchen_name_ar: string
          kitchen_name_en: string
          kitchen_video_url: string
          lat: number
          lng: number
          name: string
          phone: string
          rating: number
          total_orders: number
          user_id: string | null
        }
        Insert: {
          address_ar?: string
          address_en?: string
          avatar?: string
          banned?: boolean
          cover?: string
          id?: string
          is_open?: boolean
          is_verified?: boolean
          kitchen_name_ar?: string
          kitchen_name_en?: string
          kitchen_video_url?: string
          lat?: number
          lng?: number
          name?: string
          phone?: string
          rating?: number
          total_orders?: number
          user_id?: string | null
        }
        Update: {
          address_ar?: string
          address_en?: string
          avatar?: string
          banned?: boolean
          cover?: string
          id?: string
          is_open?: boolean
          is_verified?: boolean
          kitchen_name_ar?: string
          kitchen_name_en?: string
          kitchen_video_url?: string
          lat?: number
          lng?: number
          name?: string
          phone?: string
          rating?: number
          total_orders?: number
          user_id?: string | null
        }
        Relationships: []
      }
      orders: {
        Row: {
          app_fee: number
          cook_id: string
          created_at: number
          customer_address: string
          customer_id: string | null
          customer_name: string
          customer_phone: string
          delivery_boy: Json | null
          delivery_boy_id: string | null
          delivery_fee: number
          id: string
          items: Json
          payment: string
          rated: boolean
          ready: boolean
          status: string
          subtotal: number
          total: number
        }
        Insert: {
          app_fee?: number
          cook_id: string
          created_at?: number
          customer_address?: string
          customer_id?: string | null
          customer_name?: string
          customer_phone?: string
          delivery_boy?: Json | null
          delivery_boy_id?: string | null
          delivery_fee?: number
          id?: string
          items?: Json
          payment?: string
          rated?: boolean
          ready?: boolean
          status?: string
          subtotal?: number
          total?: number
        }
        Update: {
          app_fee?: number
          cook_id?: string
          created_at?: number
          customer_address?: string
          customer_id?: string | null
          customer_name?: string
          customer_phone?: string
          delivery_boy?: Json | null
          delivery_boy_id?: string | null
          delivery_fee?: number
          id?: string
          items?: Json
          payment?: string
          rated?: boolean
          ready?: boolean
          status?: string
          subtotal?: number
          total?: number
        }
        Relationships: [
          {
            foreignKeyName: "orders_cook_id_fkey"
            columns: ["cook_id"]
            isOneToOne: false
            referencedRelation: "cooks"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          category: string
          cook_id: string
          description_ar: string
          description_en: string
          id: string
          image_url: string
          name_ar: string
          name_en: string
          price_LYD: number
          quantity_available: number
          unavailable: boolean
        }
        Insert: {
          category?: string
          cook_id: string
          description_ar?: string
          description_en?: string
          id?: string
          image_url?: string
          name_ar?: string
          name_en?: string
          price_LYD?: number
          quantity_available?: number
          unavailable?: boolean
        }
        Update: {
          category?: string
          cook_id?: string
          description_ar?: string
          description_en?: string
          id?: string
          image_url?: string
          name_ar?: string
          name_en?: string
          price_LYD?: number
          quantity_available?: number
          unavailable?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "products_cook_id_fkey"
            columns: ["cook_id"]
            isOneToOne: false
            referencedRelation: "cooks"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          address: string
          avatar: string
          cook_id: string | null
          created_at: number
          id: string
          name: string
          phone: string
          username: string
        }
        Insert: {
          address?: string
          avatar?: string
          cook_id?: string | null
          created_at?: number
          id: string
          name?: string
          phone?: string
          username: string
        }
        Update: {
          address?: string
          avatar?: string
          cook_id?: string | null
          created_at?: number
          id?: string
          name?: string
          phone?: string
          username?: string
        }
        Relationships: []
      }
      reviews: {
        Row: {
          comment: string
          cook_id: string
          created_at: number
          id: string
          order_id: string
          rating: number
        }
        Insert: {
          comment?: string
          cook_id: string
          created_at?: number
          id?: string
          order_id: string
          rating: number
        }
        Update: {
          comment?: string
          cook_id?: string
          created_at?: number
          id?: string
          order_id?: string
          rating?: number
        }
        Relationships: [
          {
            foreignKeyName: "reviews_cook_id_fkey"
            columns: ["cook_id"]
            isOneToOne: false
            referencedRelation: "cooks"
            referencedColumns: ["id"]
          },
        ]
      }
      topup_cards: {
        Row: {
          amount: number
          batch: string
          code: string
          created_at: number
          id: string
          used_at: number | null
          used_by: string | null
        }
        Insert: {
          amount: number
          batch?: string
          code: string
          created_at?: number
          id?: string
          used_at?: number | null
          used_by?: string | null
        }
        Update: {
          amount?: number
          batch?: string
          code?: string
          created_at?: number
          id?: string
          used_at?: number | null
          used_by?: string | null
        }
        Relationships: []
      }
      transactions: {
        Row: {
          amount: number
          created_at: number
          id: string
          note: string
          type: string
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: number
          id?: string
          note?: string
          type: string
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: number
          id?: string
          note?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      wallets: {
        Row: {
          balance: number
          user_id: string
        }
        Insert: {
          balance?: number
          user_id: string
        }
        Update: {
          balance?: number
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      _wallet_move: {
        Args: { _amount: number; _note: string; _type: string; _uid: string }
        Returns: undefined
      }
      admin_issue_cards: {
        Args: { _amount: number; _batch: string; _qty: number }
        Returns: number
      }
      cook_update_order: {
        Args: { _action: string; _order_id: string }
        Returns: undefined
      }
      driver_deliver: { Args: { _order_id: string }; Returns: undefined }
      driver_take: { Args: { _order_id: string }; Returns: undefined }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      now_ms: { Args: never; Returns: number }
      owns_cook: { Args: { _cook_id: string }; Returns: boolean }
      place_order: {
        Args: {
          _address: string
          _cook_id: string
          _items: Json
          _name: string
          _payment: string
          _phone: string
        }
        Returns: string
      }
      rate_order: {
        Args: { _comment: string; _order_id: string; _rating: number }
        Returns: undefined
      }
      redeem_card: { Args: { _code: string }; Returns: number }
      short_id: { Args: never; Returns: string }
      username_taken: { Args: { _u: string }; Returns: boolean }
    }
    Enums: {
      app_role: "ADMIN" | "COOK" | "DELIVERY" | "CUSTOMER"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["ADMIN", "COOK", "DELIVERY", "CUSTOMER"],
    },
  },
} as const
