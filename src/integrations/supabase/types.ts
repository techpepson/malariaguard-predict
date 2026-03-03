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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      predictions: {
        Row: {
          age: number
          body_aches: boolean | null
          chills: boolean | null
          contributing_factors: Json | null
          created_at: string
          diarrhea: boolean | null
          duffy_antigen_negative: boolean | null
          fatigue: boolean | null
          fever: boolean | null
          g6pd_deficiency: boolean | null
          gender: string
          hbas_trait: boolean | null
          headache: boolean | null
          hemoglobin: number | null
          id: string
          nausea: boolean | null
          patient_name: string
          platelet_count: number | null
          pregnancy_status: string | null
          recommendation: string | null
          region: string | null
          risk_level: Database["public"]["Enums"]["risk_level"] | null
          risk_score: number | null
          sweating: boolean | null
          temperature: number | null
          travel_history: string | null
          user_id: string | null
          vomiting: boolean | null
        }
        Insert: {
          age: number
          body_aches?: boolean | null
          chills?: boolean | null
          contributing_factors?: Json | null
          created_at?: string
          diarrhea?: boolean | null
          duffy_antigen_negative?: boolean | null
          fatigue?: boolean | null
          fever?: boolean | null
          g6pd_deficiency?: boolean | null
          gender: string
          hbas_trait?: boolean | null
          headache?: boolean | null
          hemoglobin?: number | null
          id?: string
          nausea?: boolean | null
          patient_name: string
          platelet_count?: number | null
          pregnancy_status?: string | null
          recommendation?: string | null
          region?: string | null
          risk_level?: Database["public"]["Enums"]["risk_level"] | null
          risk_score?: number | null
          sweating?: boolean | null
          temperature?: number | null
          travel_history?: string | null
          user_id?: string | null
          vomiting?: boolean | null
        }
        Update: {
          age?: number
          body_aches?: boolean | null
          chills?: boolean | null
          contributing_factors?: Json | null
          created_at?: string
          diarrhea?: boolean | null
          duffy_antigen_negative?: boolean | null
          fatigue?: boolean | null
          fever?: boolean | null
          g6pd_deficiency?: boolean | null
          gender?: string
          hbas_trait?: boolean | null
          headache?: boolean | null
          hemoglobin?: number | null
          id?: string
          nausea?: boolean | null
          patient_name?: string
          platelet_count?: number | null
          pregnancy_status?: string | null
          recommendation?: string | null
          region?: string | null
          risk_level?: Database["public"]["Enums"]["risk_level"] | null
          risk_score?: number | null
          sweating?: boolean | null
          temperature?: number | null
          travel_history?: string | null
          user_id?: string | null
          vomiting?: boolean | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      risk_level: "low" | "moderate" | "high" | "very_high"
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
      risk_level: ["low", "moderate", "high", "very_high"],
    },
  },
} as const
