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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      customers: {
        Row: {
          balance: number
          created_at: string
          id: string
          name: string
          owner_id: string
          phone: string | null
        }
        Insert: {
          balance?: number
          created_at?: string
          id?: string
          name: string
          owner_id: string
          phone?: string | null
        }
        Update: {
          balance?: number
          created_at?: string
          id?: string
          name?: string
          owner_id?: string
          phone?: string | null
        }
        Relationships: []
      }
      mpesa_transactions: {
        Row: {
          amount: number
          checkout_request_id: string | null
          created_at: string
          id: string
          merchant_request_id: string | null
          owner_id: string
          phone: string
          raw: Json | null
          receipt: string | null
          result_desc: string | null
          status: Database["public"]["Enums"]["mpesa_status"]
          updated_at: string
        }
        Insert: {
          amount: number
          checkout_request_id?: string | null
          created_at?: string
          id?: string
          merchant_request_id?: string | null
          owner_id: string
          phone: string
          raw?: Json | null
          receipt?: string | null
          result_desc?: string | null
          status?: Database["public"]["Enums"]["mpesa_status"]
          updated_at?: string
        }
        Update: {
          amount?: number
          checkout_request_id?: string | null
          created_at?: string
          id?: string
          merchant_request_id?: string | null
          owner_id?: string
          phone?: string
          raw?: Json | null
          receipt?: string | null
          result_desc?: string | null
          status?: Database["public"]["Enums"]["mpesa_status"]
          updated_at?: string
        }
        Relationships: []
      }
      products: {
        Row: {
          buy_price: number
          created_at: string
          id: string
          low_stock_threshold: number
          name: string
          owner_id: string
          sell_price: number
          sku: string | null
          stock: number
        }
        Insert: {
          buy_price?: number
          created_at?: string
          id?: string
          low_stock_threshold?: number
          name: string
          owner_id: string
          sell_price?: number
          sku?: string | null
          stock?: number
        }
        Update: {
          buy_price?: number
          created_at?: string
          id?: string
          low_stock_threshold?: number
          name?: string
          owner_id?: string
          sell_price?: number
          sku?: string | null
          stock?: number
        }
        Relationships: []
      }
      profiles: {
        Row: {
          business_name: string | null
          created_at: string
          full_name: string
          id: string
          owner_id: string | null
          phone: string | null
          updated_at: string
        }
        Insert: {
          business_name?: string | null
          created_at?: string
          full_name?: string
          id: string
          owner_id?: string | null
          phone?: string | null
          updated_at?: string
        }
        Update: {
          business_name?: string | null
          created_at?: string
          full_name?: string
          id?: string
          owner_id?: string | null
          phone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      purchases: {
        Row: {
          created_at: string
          id: string
          owner_id: string
          product_id: string
          qty: number
          supplier_id: string | null
          total: number
          unit_cost: number
        }
        Insert: {
          created_at?: string
          id?: string
          owner_id: string
          product_id: string
          qty: number
          supplier_id?: string | null
          total: number
          unit_cost: number
        }
        Update: {
          created_at?: string
          id?: string
          owner_id?: string
          product_id?: string
          qty?: number
          supplier_id?: string | null
          total?: number
          unit_cost?: number
        }
        Relationships: [
          {
            foreignKeyName: "purchases_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchases_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      sales: {
        Row: {
          created_at: string
          customer_id: string | null
          discount: number
          employee_id: string | null
          id: string
          notes: string | null
          owner_id: string
          payment_method: Database["public"]["Enums"]["payment_method"]
          product_id: string
          qty: number
          total: number
          unit_price: number
        }
        Insert: {
          created_at?: string
          customer_id?: string | null
          discount?: number
          employee_id?: string | null
          id?: string
          notes?: string | null
          owner_id: string
          payment_method?: Database["public"]["Enums"]["payment_method"]
          product_id: string
          qty: number
          total: number
          unit_price: number
        }
        Update: {
          created_at?: string
          customer_id?: string | null
          discount?: number
          employee_id?: string | null
          id?: string
          notes?: string | null
          owner_id?: string
          payment_method?: Database["public"]["Enums"]["payment_method"]
          product_id?: string
          qty?: number
          total?: number
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "sales_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sales_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      subscriptions: {
        Row: {
          current_period_end: string | null
          id: string
          last_receipt: string | null
          owner_id: string
          status: Database["public"]["Enums"]["sub_status"]
          trial_ends_at: string
          updated_at: string
        }
        Insert: {
          current_period_end?: string | null
          id?: string
          last_receipt?: string | null
          owner_id: string
          status?: Database["public"]["Enums"]["sub_status"]
          trial_ends_at?: string
          updated_at?: string
        }
        Update: {
          current_period_end?: string | null
          id?: string
          last_receipt?: string | null
          owner_id?: string
          status?: Database["public"]["Enums"]["sub_status"]
          trial_ends_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      suppliers: {
        Row: {
          created_at: string
          id: string
          name: string
          notes: string | null
          owner_id: string
          phone: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          notes?: string | null
          owner_id: string
          phone?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          notes?: string | null
          owner_id?: string
          phone?: string | null
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
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_owner_id: { Args: { _user_id: string }; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "super_admin" | "business_owner" | "employee"
      mpesa_status: "pending" | "success" | "failed" | "cancelled"
      payment_method: "cash" | "mpesa" | "credit"
      sub_status: "trial" | "active" | "expired"
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
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
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
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
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
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
      app_role: ["super_admin", "business_owner", "employee"],
      mpesa_status: ["pending", "success", "failed", "cancelled"],
      payment_method: ["cash", "mpesa", "credit"],
      sub_status: ["trial", "active", "expired"],
    },
  },
} as const
