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
      profiles: {
        Row: {
          id: string
          email: string
          full_name: string | null
          avatar_url: string | null
          role: 'client' | 'admin' | 'developer'
          license: 'none' | 'starter' | 'pro' | 'elite'
          license_valid_until: string | null
          stripe_customer_id: string | null
          created_at: string
          updated_at: string | null
        }
        Insert: {
          id: string
          email: string
          full_name?: string | null
          avatar_url?: string | null
          role?: 'client' | 'admin' | 'developer'
          license?: 'none' | 'starter' | 'pro' | 'elite'
          license_valid_until?: string | null
          stripe_customer_id?: string | null
          created_at?: string
          updated_at?: string | null
        }
        Update: {
          id?: string
          email?: string
          full_name?: string | null
          avatar_url?: string | null
          role?: 'client' | 'admin' | 'developer'
          license?: 'none' | 'starter' | 'pro' | 'elite'
          license_valid_until?: string | null
          stripe_customer_id?: string | null
          created_at?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      purchases: {
        Row: {
          id: string
          user_id: string
          module_id: string
          stripe_session_id: string
          status: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          module_id: string
          stripe_session_id: string
          status: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          module_id?: string
          stripe_session_id?: string
          status?: string
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "purchases_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchases_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "training_modules"
            referencedColumns: ["id"]
          }
        ]
      }
      training_access: {
        Row: {
          id: string
          user_id: string
          module_id: string
          access_type: string
          granted_at: string
        }
        Insert: {
          id?: string
          user_id: string
          module_id: string
          access_type?: string
          granted_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          module_id?: string
          access_type?: string
          granted_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "training_access_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "training_access_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "training_modules"
            referencedColumns: ["id"]
          }
        ]
      }
      training_lessons: {
        Row: {
          id: string
          module_id: string
          title: string
          description: string | null
          bunny_video_id: string | null
          position: number
          is_preview: boolean
          created_at: string
        }
        Insert: {
          id?: string
          module_id: string
          title: string
          description?: string | null
          bunny_video_id?: string | null
          position?: number
          is_preview?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          module_id?: string
          title?: string
          description?: string | null
          bunny_video_id?: string | null
          position?: number
          is_preview?: boolean
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "training_lessons_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "training_modules"
            referencedColumns: ["id"]
          }
        ]
      }
      training_modules: {
        Row: {
          id: string
          title: string
          description: string | null
          position: number
          is_active: boolean
          required_license: 'starter' | 'pro' | 'elite'
          created_at: string
        }
        Insert: {
          id?: string
          title: string
          description?: string | null
          position?: number
          is_active?: boolean
          required_license?: 'starter' | 'pro' | 'elite'
          created_at?: string
        }
        Update: {
          id?: string
          title?: string
          description?: string | null
          position?: number
          is_active?: boolean
          required_license?: 'starter' | 'pro' | 'elite'
          created_at?: string
        }
        Relationships: []
      }
      training_progress: {
        Row: {
          id: string
          user_id: string
          lesson_id: string
          done: boolean
          last_viewed: string | null
        }
        Insert: {
          id?: string
          user_id: string
          lesson_id: string
          done?: boolean
          last_viewed?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          lesson_id?: string
          done?: boolean
          last_viewed?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "training_progress_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "training_progress_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "training_lessons"
            referencedColumns: ["id"]
          }
        ]
      }
      developer_license: {
        Row: {
          id: string
          is_active: boolean
          last_payment_date: string
          deactivated_at: string | null
          admin_revocation_days: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          is_active?: boolean
          last_payment_date?: string
          deactivated_at?: string | null
          admin_revocation_days?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          is_active?: boolean
          last_payment_date?: string
          deactivated_at?: string | null
          admin_revocation_days?: number
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      is_admin: {
        Args: {
          uid: string
        }
        Returns: boolean
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type PublicSchema = Database[keyof Database]

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (PublicSchema["Tables"] & PublicSchema["Views"])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
      Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (PublicSchema["Tables"] &
        PublicSchema["Views"])
    ? (PublicSchema["Tables"] &
        PublicSchema["Views"])[PublicTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof PublicSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof PublicSchema["Enums"]
    ? PublicSchema["Enums"][PublicEnumNameOrOptions]
    : never

