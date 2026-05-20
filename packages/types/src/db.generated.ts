export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      activities: {
        Row: {
          archived_at: string | null
          cancellation_cutoff_minutes: number
          color: string | null
          created_at: string
          default_duration_minutes: number
          description: string | null
          id: string
          max_age: number | null
          max_duration_minutes: number
          min_age: number | null
          min_duration_minutes: number
          name: string
          organization_id: string
          self_book_min_age: number
          slug: string
          updated_at: string
        }
        Insert: {
          archived_at?: string | null
          cancellation_cutoff_minutes?: number
          color?: string | null
          created_at?: string
          default_duration_minutes?: number
          description?: string | null
          id?: string
          max_age?: number | null
          max_duration_minutes?: number
          min_age?: number | null
          min_duration_minutes?: number
          name: string
          organization_id: string
          self_book_min_age?: number
          slug: string
          updated_at?: string
        }
        Update: {
          archived_at?: string | null
          cancellation_cutoff_minutes?: number
          color?: string | null
          created_at?: string
          default_duration_minutes?: number
          description?: string | null
          id?: string
          max_age?: number | null
          max_duration_minutes?: number
          min_age?: number | null
          min_duration_minutes?: number
          name?: string
          organization_id?: string
          self_book_min_age?: number
          slug?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "activities_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      activity_resource_compatibility: {
        Row: {
          activity_id: string
          resource_id: string
        }
        Insert: {
          activity_id: string
          resource_id: string
        }
        Update: {
          activity_id?: string
          resource_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "activity_resource_compatibility_activity_id_fkey"
            columns: ["activity_id"]
            isOneToOne: false
            referencedRelation: "activities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "activity_resource_compatibility_resource_id_fkey"
            columns: ["resource_id"]
            isOneToOne: false
            referencedRelation: "resources"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_log: {
        Row: {
          action: Database["public"]["Enums"]["audit_action"]
          actor_user_id: string | null
          after_data: Json | null
          before_data: Json | null
          id: number
          occurred_at: string
          row_id: string
          table_name: string
        }
        Insert: {
          action: Database["public"]["Enums"]["audit_action"]
          actor_user_id?: string | null
          after_data?: Json | null
          before_data?: Json | null
          id?: number
          occurred_at?: string
          row_id: string
          table_name: string
        }
        Update: {
          action?: Database["public"]["Enums"]["audit_action"]
          actor_user_id?: string | null
          after_data?: Json | null
          before_data?: Json | null
          id?: number
          occurred_at?: string
          row_id?: string
          table_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "audit_log_actor_user_id_fkey"
            columns: ["actor_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      blocked_times: {
        Row: {
          created_at: string
          created_by: string | null
          ends_at: string
          id: string
          location_id: string
          reason: string | null
          resource_id: string | null
          starts_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          ends_at: string
          id?: string
          location_id: string
          reason?: string | null
          resource_id?: string | null
          starts_at: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          ends_at?: string
          id?: string
          location_id?: string
          reason?: string | null
          resource_id?: string | null
          starts_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "blocked_times_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "blocked_times_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "blocked_times_resource_id_fkey"
            columns: ["resource_id"]
            isOneToOne: false
            referencedRelation: "resources"
            referencedColumns: ["id"]
          },
        ]
      }
      booking_participants: {
        Row: {
          added_at: string
          booking_id: string
          is_organizer: boolean
          user_id: string
        }
        Insert: {
          added_at?: string
          booking_id: string
          is_organizer?: boolean
          user_id: string
        }
        Update: {
          added_at?: string
          booking_id?: string
          is_organizer?: boolean
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "booking_participants_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "booking_participants_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      bookings: {
        Row: {
          activity_id: string
          booked_by_user_id: string
          cancelled_at: string | null
          cancelled_by_user_id: string | null
          cancelled_reason: string | null
          created_at: string
          ends_at: string
          id: string
          notes: string | null
          on_behalf_of_user_id: string | null
          override_reason: string | null
          resource_id: string
          starts_at: string
          status: Database["public"]["Enums"]["booking_status"]
          updated_at: string
        }
        Insert: {
          activity_id: string
          booked_by_user_id: string
          cancelled_at?: string | null
          cancelled_by_user_id?: string | null
          cancelled_reason?: string | null
          created_at?: string
          ends_at: string
          id?: string
          notes?: string | null
          on_behalf_of_user_id?: string | null
          override_reason?: string | null
          resource_id: string
          starts_at: string
          status?: Database["public"]["Enums"]["booking_status"]
          updated_at?: string
        }
        Update: {
          activity_id?: string
          booked_by_user_id?: string
          cancelled_at?: string | null
          cancelled_by_user_id?: string | null
          cancelled_reason?: string | null
          created_at?: string
          ends_at?: string
          id?: string
          notes?: string | null
          on_behalf_of_user_id?: string | null
          override_reason?: string | null
          resource_id?: string
          starts_at?: string
          status?: Database["public"]["Enums"]["booking_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "bookings_activity_id_fkey"
            columns: ["activity_id"]
            isOneToOne: false
            referencedRelation: "activities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_booked_by_user_id_fkey"
            columns: ["booked_by_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "bookings_cancelled_by_user_id_fkey"
            columns: ["cancelled_by_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "bookings_on_behalf_of_user_id_fkey"
            columns: ["on_behalf_of_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "bookings_resource_id_fkey"
            columns: ["resource_id"]
            isOneToOne: false
            referencedRelation: "resources"
            referencedColumns: ["id"]
          },
        ]
      }
      guardian_links: {
        Row: {
          created_at: string
          created_by: string | null
          guardian_user_id: string
          minor_user_id: string
          verified_at: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          guardian_user_id: string
          minor_user_id: string
          verified_at?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          guardian_user_id?: string
          minor_user_id?: string
          verified_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "guardian_links_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "guardian_links_guardian_user_id_fkey"
            columns: ["guardian_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "guardian_links_minor_user_id_fkey"
            columns: ["minor_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      locations: {
        Row: {
          address: string | null
          archived_at: string | null
          created_at: string
          id: string
          name: string
          organization_id: string
          timezone: string
          updated_at: string
        }
        Insert: {
          address?: string | null
          archived_at?: string | null
          created_at?: string
          id?: string
          name: string
          organization_id: string
          timezone: string
          updated_at?: string
        }
        Update: {
          address?: string | null
          archived_at?: string | null
          created_at?: string
          id?: string
          name?: string
          organization_id?: string
          timezone?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "locations_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      opening_hours: {
        Row: {
          closes_at: string
          created_at: string
          id: string
          location_id: string
          opens_at: string
          updated_at: string
          weekday: number
        }
        Insert: {
          closes_at: string
          created_at?: string
          id?: string
          location_id: string
          opens_at: string
          updated_at?: string
          weekday: number
        }
        Update: {
          closes_at?: string
          created_at?: string
          id?: string
          location_id?: string
          opens_at?: string
          updated_at?: string
          weekday?: number
        }
        Relationships: [
          {
            foreignKeyName: "opening_hours_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
        ]
      }
      organizations: {
        Row: {
          created_at: string
          id: string
          name: string
          slug: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          slug: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          slug?: string
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          birth_year: number | null
          created_at: string
          deleted_at: string | null
          display_name: string
          guardian_email: string | null
          locale: string
          updated_at: string
          user_id: string
        }
        Insert: {
          birth_year?: number | null
          created_at?: string
          deleted_at?: string | null
          display_name: string
          guardian_email?: string | null
          locale?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          birth_year?: number | null
          created_at?: string
          deleted_at?: string | null
          display_name?: string
          guardian_email?: string | null
          locale?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      resource_types: {
        Row: {
          description: string | null
          id: string
          key: string
          label: string
        }
        Insert: {
          description?: string | null
          id?: string
          key: string
          label: string
        }
        Update: {
          description?: string | null
          id?: string
          key?: string
          label?: string
        }
        Relationships: []
      }
      resources: {
        Row: {
          archived_at: string | null
          capacity: number
          created_at: string
          description: string | null
          id: string
          location_id: string
          name: string
          type_id: string
          updated_at: string
        }
        Insert: {
          archived_at?: string | null
          capacity?: number
          created_at?: string
          description?: string | null
          id?: string
          location_id: string
          name: string
          type_id: string
          updated_at?: string
        }
        Update: {
          archived_at?: string | null
          capacity?: number
          created_at?: string
          description?: string | null
          id?: string
          location_id?: string
          name?: string
          type_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "resources_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "resources_type_id_fkey"
            columns: ["type_id"]
            isOneToOne: false
            referencedRelation: "resource_types"
            referencedColumns: ["id"]
          },
        ]
      }
      roles: {
        Row: {
          key: string
          label: string
        }
        Insert: {
          key: string
          label: string
        }
        Update: {
          key?: string
          label?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          granted_at: string
          granted_by: string | null
          role_key: string
          user_id: string
        }
        Insert: {
          granted_at?: string
          granted_by?: string | null
          role_key: string
          user_id: string
        }
        Update: {
          granted_at?: string
          granted_by?: string | null
          role_key?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_roles_granted_by_fkey"
            columns: ["granted_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "user_roles_role_key_fkey"
            columns: ["role_key"]
            isOneToOne: false
            referencedRelation: "roles"
            referencedColumns: ["key"]
          },
          {
            foreignKeyName: "user_roles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      book_resource: {
        Args: {
          p_activity_id: string
          p_ends_at: string
          p_notes?: string
          p_on_behalf_of_user_id?: string
          p_resource_id: string
          p_starts_at: string
        }
        Returns: {
          activity_id: string
          booked_by_user_id: string
          cancelled_at: string | null
          cancelled_by_user_id: string | null
          cancelled_reason: string | null
          created_at: string
          ends_at: string
          id: string
          notes: string | null
          on_behalf_of_user_id: string | null
          override_reason: string | null
          resource_id: string
          starts_at: string
          status: Database["public"]["Enums"]["booking_status"]
          updated_at: string
        }
        SetofOptions: {
          from: "*"
          to: "bookings"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      cancel_booking: {
        Args: { p_booking_id: string; p_reason?: string }
        Returns: {
          activity_id: string
          booked_by_user_id: string
          cancelled_at: string | null
          cancelled_by_user_id: string | null
          cancelled_reason: string | null
          created_at: string
          ends_at: string
          id: string
          notes: string | null
          on_behalf_of_user_id: string | null
          override_reason: string | null
          resource_id: string
          starts_at: string
          status: Database["public"]["Enums"]["booking_status"]
          updated_at: string
        }
        SetofOptions: {
          from: "*"
          to: "bookings"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      current_user_has_role: { Args: { role: string }; Returns: boolean }
      current_user_is_guardian_of: {
        Args: { target: string }
        Returns: boolean
      }
      current_user_is_staff: { Args: never; Returns: boolean }
      override_book_resource: {
        Args: {
          p_activity_id: string
          p_ends_at: string
          p_notes?: string
          p_on_behalf_of_user_id?: string
          p_override_reason: string
          p_resource_id: string
          p_starts_at: string
        }
        Returns: {
          activity_id: string
          booked_by_user_id: string
          cancelled_at: string | null
          cancelled_by_user_id: string | null
          cancelled_reason: string | null
          created_at: string
          ends_at: string
          id: string
          notes: string | null
          on_behalf_of_user_id: string | null
          override_reason: string | null
          resource_id: string
          starts_at: string
          status: Database["public"]["Enums"]["booking_status"]
          updated_at: string
        }
        SetofOptions: {
          from: "*"
          to: "bookings"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      profile_is_minor: { Args: { birth_year: number }; Returns: boolean }
    }
    Enums: {
      audit_action: "insert" | "update" | "delete"
      booking_status:
        | "pending"
        | "confirmed"
        | "cancelled"
        | "completed"
        | "no_show"
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
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      audit_action: ["insert", "update", "delete"],
      booking_status: [
        "pending",
        "confirmed",
        "cancelled",
        "completed",
        "no_show",
      ],
    },
  },
} as const

