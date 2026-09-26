// Generated from the live schema of Supabase project kodqghpawpfvnchbngrn with
// the Supabase MCP tool `generate_typescript_types`. Never edit by hand:
// re-generate after every migration. The command is in docs/DATA.md.
//
// Last regenerated after 20260907093114_teacher_availability.

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
      languages: {
        Row: {
          id: number
          name: string
          slug: string
          sort_order: number
        }
        Insert: {
          id?: never
          name: string
          slug: string
          sort_order?: number
        }
        Update: {
          id?: never
          name?: string
          slug?: string
          sort_order?: number
        }
        Relationships: []
      }
      levels: {
        Row: {
          id: number
          name: string
          slug: string
          sort_order: number
        }
        Insert: {
          id?: never
          name: string
          slug: string
          sort_order?: number
        }
        Update: {
          id?: never
          name?: string
          slug?: string
          sort_order?: number
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_path: string | null
          city: string | null
          created_at: string
          full_name: string
          id: string
          role: Database["public"]["Enums"]["user_role"]
          ui_locale: string
          updated_at: string
        }
        Insert: {
          avatar_path?: string | null
          city?: string | null
          created_at?: string
          full_name: string
          id: string
          role: Database["public"]["Enums"]["user_role"]
          ui_locale?: string
          updated_at?: string
        }
        Update: {
          avatar_path?: string | null
          city?: string | null
          created_at?: string
          full_name?: string
          id?: string
          role?: Database["public"]["Enums"]["user_role"]
          ui_locale?: string
          updated_at?: string
        }
        Relationships: []
      }
      profiles_private: {
        Row: {
          birth_date: string | null
          created_at: string
          guardian_email: string | null
          guardian_name: string | null
          phone: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          birth_date?: string | null
          created_at?: string
          guardian_email?: string | null
          guardian_name?: string | null
          phone?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          birth_date?: string | null
          created_at?: string
          guardian_email?: string | null
          guardian_name?: string | null
          phone?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_private_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      student_profiles: {
        Row: {
          bio: string | null
          class_label: string | null
          created_at: string
          level_id: number | null
          role: Database["public"]["Enums"]["user_role"]
          school: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          bio?: string | null
          class_label?: string | null
          created_at?: string
          level_id?: number | null
          role?: Database["public"]["Enums"]["user_role"]
          school?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          bio?: string | null
          class_label?: string | null
          created_at?: string
          level_id?: number | null
          role?: Database["public"]["Enums"]["user_role"]
          school?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "student_profiles_level_id_fkey"
            columns: ["level_id"]
            isOneToOne: false
            referencedRelation: "levels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_profiles_profile_fkey"
            columns: ["user_id", "role"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id", "role"]
          },
        ]
      }
      student_subjects: {
        Row: {
          created_at: string
          student_id: string
          subject_id: number
        }
        Insert: {
          created_at?: string
          student_id: string
          subject_id: number
        }
        Update: {
          created_at?: string
          student_id?: string
          subject_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "student_subjects_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "student_profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "student_subjects_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
        ]
      }
      subjects: {
        Row: {
          id: number
          name: string
          slug: string
          sort_order: number
        }
        Insert: {
          id?: never
          name: string
          slug: string
          sort_order?: number
        }
        Update: {
          id?: never
          name?: string
          slug?: string
          sort_order?: number
        }
        Relationships: []
      }
      teacher_availability: {
        Row: {
          created_at: string
          ends_at: string
          id: string
          starts_at: string
          teacher_id: string
          updated_at: string
          weekday: number
        }
        Insert: {
          created_at?: string
          ends_at: string
          id?: string
          starts_at: string
          teacher_id: string
          updated_at?: string
          weekday: number
        }
        Update: {
          created_at?: string
          ends_at?: string
          id?: string
          starts_at?: string
          teacher_id?: string
          updated_at?: string
          weekday?: number
        }
        Relationships: [
          {
            foreignKeyName: "teacher_availability_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "teacher_profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "teacher_availability_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "teacher_public_profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      teacher_languages: {
        Row: {
          created_at: string
          language_id: number
          teacher_id: string
        }
        Insert: {
          created_at?: string
          language_id: number
          teacher_id: string
        }
        Update: {
          created_at?: string
          language_id?: number
          teacher_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "teacher_languages_language_id_fkey"
            columns: ["language_id"]
            isOneToOne: false
            referencedRelation: "languages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "teacher_languages_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "teacher_profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "teacher_languages_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "teacher_public_profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      teacher_levels: {
        Row: {
          created_at: string
          level_id: number
          teacher_id: string
        }
        Insert: {
          created_at?: string
          level_id: number
          teacher_id: string
        }
        Update: {
          created_at?: string
          level_id?: number
          teacher_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "teacher_levels_level_id_fkey"
            columns: ["level_id"]
            isOneToOne: false
            referencedRelation: "levels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "teacher_levels_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "teacher_profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "teacher_levels_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "teacher_public_profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      teacher_profiles: {
        Row: {
          bio: string | null
          created_at: string
          currency: string
          hourly_rate_minor: number | null
          role: Database["public"]["Enums"]["user_role"]
          tagline: string | null
          timezone: string
          updated_at: string
          user_id: string
          username: string
          years_experience: number | null
        }
        Insert: {
          bio?: string | null
          created_at?: string
          currency?: string
          hourly_rate_minor?: number | null
          role?: Database["public"]["Enums"]["user_role"]
          tagline?: string | null
          timezone?: string
          updated_at?: string
          user_id: string
          username: string
          years_experience?: number | null
        }
        Update: {
          bio?: string | null
          created_at?: string
          currency?: string
          hourly_rate_minor?: number | null
          role?: Database["public"]["Enums"]["user_role"]
          tagline?: string | null
          timezone?: string
          updated_at?: string
          user_id?: string
          username?: string
          years_experience?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "teacher_profiles_profile_fkey"
            columns: ["user_id", "role"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id", "role"]
          },
        ]
      }
      teacher_subjects: {
        Row: {
          created_at: string
          subject_id: number
          teacher_id: string
        }
        Insert: {
          created_at?: string
          subject_id: number
          teacher_id: string
        }
        Update: {
          created_at?: string
          subject_id?: number
          teacher_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "teacher_subjects_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "teacher_subjects_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "teacher_profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "teacher_subjects_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "teacher_public_profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      user_devices: {
        Row: {
          auth_session_id: string | null
          city: string | null
          country_code: string | null
          created_at: string
          device_label: string
          id: string
          ip: unknown
          kind: Database["public"]["Enums"]["device_kind"]
          last_seen_at: string
          updated_at: string
          user_agent: string | null
          user_id: string
        }
        Insert: {
          auth_session_id?: string | null
          city?: string | null
          country_code?: string | null
          created_at?: string
          device_label: string
          id?: string
          ip?: unknown
          kind: Database["public"]["Enums"]["device_kind"]
          last_seen_at?: string
          updated_at?: string
          user_agent?: string | null
          user_id: string
        }
        Update: {
          auth_session_id?: string | null
          city?: string | null
          country_code?: string | null
          created_at?: string
          device_label?: string
          id?: string
          ip?: unknown
          kind?: Database["public"]["Enums"]["device_kind"]
          last_seen_at?: string
          updated_at?: string
          user_agent?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_devices_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      teacher_public_profiles: {
        Row: {
          avatar_path: string | null
          bio: string | null
          city: string | null
          created_at: string | null
          currency: string | null
          full_name: string | null
          hourly_rate_minor: number | null
          tagline: string | null
          timezone: string | null
          user_id: string | null
          username: string | null
          years_experience: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      device_kind: "desktop" | "mobile"
      user_role: "student" | "teacher"
      verification_status: "pending" | "in-progress" | "approved" | "rejected"
      verification_step: "identity" | "diplomas" | "bio" | "final"
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
      device_kind: ["desktop", "mobile"],
      user_role: ["student", "teacher"],
      verification_status: ["pending", "in-progress", "approved", "rejected"],
      verification_step: ["identity", "diplomas", "bio", "final"],
    },
  },
} as const
