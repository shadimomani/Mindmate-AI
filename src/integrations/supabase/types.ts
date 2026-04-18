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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      chat_messages: {
        Row: {
          content: string
          conversation_id: string
          created_at: string
          id: string
          image_url: string | null
          role: string
          user_id: string
        }
        Insert: {
          content: string
          conversation_id: string
          created_at?: string
          id?: string
          image_url?: string | null
          role: string
          user_id: string
        }
        Update: {
          content?: string
          conversation_id?: string
          created_at?: string
          id?: string
          image_url?: string | null
          role?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      conversations: {
        Row: {
          created_at: string
          id: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          title?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      habit_completions: {
        Row: {
          completed_date: string
          created_at: string
          habit_id: string
          id: string
          user_id: string
        }
        Insert: {
          completed_date?: string
          created_at?: string
          habit_id: string
          id?: string
          user_id: string
        }
        Update: {
          completed_date?: string
          created_at?: string
          habit_id?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "habit_completions_habit_id_fkey"
            columns: ["habit_id"]
            isOneToOne: false
            referencedRelation: "habits"
            referencedColumns: ["id"]
          },
        ]
      }
      habits: {
        Row: {
          completed_today: boolean
          created_at: string
          description: string | null
          frequency: string | null
          id: string
          last_completed_at: string | null
          name: string
          streak: number
          updated_at: string
          user_id: string
        }
        Insert: {
          completed_today?: boolean
          created_at?: string
          description?: string | null
          frequency?: string | null
          id?: string
          last_completed_at?: string | null
          name: string
          streak?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          completed_today?: boolean
          created_at?: string
          description?: string | null
          frequency?: string | null
          id?: string
          last_completed_at?: string | null
          name?: string
          streak?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      monthly_achievements: {
        Row: {
          created_at: string
          current_streak: number
          habits_tracked: number
          id: string
          month_year: string
          productivity_score: number
          reflections_count: number
          tasks_completed: number
          user_id: string
        }
        Insert: {
          created_at?: string
          current_streak?: number
          habits_tracked?: number
          id?: string
          month_year: string
          productivity_score?: number
          reflections_count?: number
          tasks_completed?: number
          user_id: string
        }
        Update: {
          created_at?: string
          current_streak?: number
          habits_tracked?: number
          id?: string
          month_year?: string
          productivity_score?: number
          reflections_count?: number
          tasks_completed?: number
          user_id?: string
        }
        Relationships: []
      }
      mood_entries: {
        Row: {
          created_at: string
          id: string
          mood_label: string
          mood_value: number
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          mood_label: string
          mood_value: number
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          mood_label?: string
          mood_value?: number
          user_id?: string
        }
        Relationships: []
      }
      photos: {
        Row: {
          created_at: string
          file_name: string
          file_size: number | null
          id: string
          storage_path: string
          user_id: string
        }
        Insert: {
          created_at?: string
          file_name: string
          file_size?: number | null
          id?: string
          storage_path: string
          user_id: string
        }
        Update: {
          created_at?: string
          file_name?: string
          file_size?: number | null
          id?: string
          storage_path?: string
          user_id?: string
        }
        Relationships: []
      }
      planner_analyses: {
        Row: {
          commitment_score: number
          completion_rate: number
          created_at: string
          feedback_message: string | null
          id: string
          mood: string | null
          notes: string | null
          page_code: string | null
          tasks_completed: boolean
          user_id: string
        }
        Insert: {
          commitment_score?: number
          completion_rate?: number
          created_at?: string
          feedback_message?: string | null
          id?: string
          mood?: string | null
          notes?: string | null
          page_code?: string | null
          tasks_completed?: boolean
          user_id: string
        }
        Update: {
          commitment_score?: number
          completion_rate?: number
          created_at?: string
          feedback_message?: string | null
          id?: string
          mood?: string | null
          notes?: string | null
          page_code?: string | null
          tasks_completed?: boolean
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          created_at: string
          display_name: string | null
          goals_completed: boolean | null
          id: string
          language: string | null
          last_reminder_phrase: number | null
          onboarded: boolean
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          display_name?: string | null
          goals_completed?: boolean | null
          id: string
          language?: string | null
          last_reminder_phrase?: number | null
          onboarded?: boolean
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          display_name?: string | null
          goals_completed?: boolean | null
          id?: string
          language?: string | null
          last_reminder_phrase?: number | null
          onboarded?: boolean
          updated_at?: string
        }
        Relationships: []
      }
      reflections: {
        Row: {
          content: string
          created_at: string
          id: string
          question: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          question: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          question?: string
          user_id?: string
        }
        Relationships: []
      }
      tasks: {
        Row: {
          category: string | null
          completed: boolean
          created_at: string
          estimated_time: number | null
          id: string
          priority: string | null
          sort_order: number | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          category?: string | null
          completed?: boolean
          created_at?: string
          estimated_time?: number | null
          id?: string
          priority?: string | null
          sort_order?: number | null
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          category?: string | null
          completed?: boolean
          created_at?: string
          estimated_time?: number | null
          id?: string
          priority?: string | null
          sort_order?: number | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_behavior_logs: {
        Row: {
          actual_follow_through: number | null
          completed_tasks: number
          completion_rate: number
          created_at: string
          id: string
          mood_at_completion: string | null
          mood_at_planning: string | null
          planned_date: string
          planned_tasks: number
          predicted_commitment_score: number | null
          prediction_accuracy: number | null
          session_signals: Json | null
          tasks_completed_times: Json | null
          tasks_skipped_times: Json | null
          user_id: string
        }
        Insert: {
          actual_follow_through?: number | null
          completed_tasks?: number
          completion_rate?: number
          created_at?: string
          id?: string
          mood_at_completion?: string | null
          mood_at_planning?: string | null
          planned_date: string
          planned_tasks?: number
          predicted_commitment_score?: number | null
          prediction_accuracy?: number | null
          session_signals?: Json | null
          tasks_completed_times?: Json | null
          tasks_skipped_times?: Json | null
          user_id: string
        }
        Update: {
          actual_follow_through?: number | null
          completed_tasks?: number
          completion_rate?: number
          created_at?: string
          id?: string
          mood_at_completion?: string | null
          mood_at_planning?: string | null
          planned_date?: string
          planned_tasks?: number
          predicted_commitment_score?: number | null
          prediction_accuracy?: number | null
          session_signals?: Json | null
          tasks_completed_times?: Json | null
          tasks_skipped_times?: Json | null
          user_id?: string
        }
        Relationships: []
      }
      user_goals: {
        Row: {
          ai_analysis: Json | null
          biggest_problem: string
          commitment_score: number | null
          created_at: string
          daily_schedule: Json | null
          id: string
          main_goal: string
          motivational_feedback: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          ai_analysis?: Json | null
          biggest_problem: string
          commitment_score?: number | null
          created_at?: string
          daily_schedule?: Json | null
          id?: string
          main_goal: string
          motivational_feedback?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          ai_analysis?: Json | null
          biggest_problem?: string
          commitment_score?: number | null
          created_at?: string
          daily_schedule?: Json | null
          id?: string
          main_goal?: string
          motivational_feedback?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_learning_profiles: {
        Row: {
          avg_commitment_accuracy: number | null
          avg_completion_rate: number | null
          consistent_time_failure: boolean
          created_at: string
          id: string
          last_analysis_at: string | null
          low_productivity_hours: Json | null
          mood_performance_correlation: Json | null
          motivation_drop_pattern: boolean
          optimal_task_complexity: string | null
          optimistic_bias: boolean
          overplanning_detected: boolean
          peak_productivity_hours: Json | null
          preferred_task_volume: number | null
          recommended_daily_tasks: number | null
          recommended_structure: string | null
          recommended_tone: string | null
          task_complexity_too_high: boolean
          total_interactions: number | null
          undercommitment_detected: boolean
          updated_at: string
          user_id: string
        }
        Insert: {
          avg_commitment_accuracy?: number | null
          avg_completion_rate?: number | null
          consistent_time_failure?: boolean
          created_at?: string
          id?: string
          last_analysis_at?: string | null
          low_productivity_hours?: Json | null
          mood_performance_correlation?: Json | null
          motivation_drop_pattern?: boolean
          optimal_task_complexity?: string | null
          optimistic_bias?: boolean
          overplanning_detected?: boolean
          peak_productivity_hours?: Json | null
          preferred_task_volume?: number | null
          recommended_daily_tasks?: number | null
          recommended_structure?: string | null
          recommended_tone?: string | null
          task_complexity_too_high?: boolean
          total_interactions?: number | null
          undercommitment_detected?: boolean
          updated_at?: string
          user_id: string
        }
        Update: {
          avg_commitment_accuracy?: number | null
          avg_completion_rate?: number | null
          consistent_time_failure?: boolean
          created_at?: string
          id?: string
          last_analysis_at?: string | null
          low_productivity_hours?: Json | null
          mood_performance_correlation?: Json | null
          motivation_drop_pattern?: boolean
          optimal_task_complexity?: string | null
          optimistic_bias?: boolean
          overplanning_detected?: boolean
          peak_productivity_hours?: Json | null
          preferred_task_volume?: number | null
          recommended_daily_tasks?: number | null
          recommended_structure?: string | null
          recommended_tone?: string | null
          task_complexity_too_high?: boolean
          total_interactions?: number | null
          undercommitment_detected?: boolean
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_memories: {
        Row: {
          content: string
          created_at: string
          id: string
          importance: number
          memory_type: string
          source: string
          updated_at: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          importance?: number
          memory_type?: string
          source?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          importance?: number
          memory_type?: string
          source?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      weekly_plans: {
        Row: {
          brain_dump: string
          commitment_score: number | null
          created_at: string
          feedback_message: string | null
          id: string
          reflection_completion: string | null
          reflection_difficulty: string | null
          schedule: Json | null
          status: string
          task_priorities: Json | null
          updated_at: string
          user_id: string
          week_start: string
        }
        Insert: {
          brain_dump: string
          commitment_score?: number | null
          created_at?: string
          feedback_message?: string | null
          id?: string
          reflection_completion?: string | null
          reflection_difficulty?: string | null
          schedule?: Json | null
          status?: string
          task_priorities?: Json | null
          updated_at?: string
          user_id: string
          week_start: string
        }
        Update: {
          brain_dump?: string
          commitment_score?: number | null
          created_at?: string
          feedback_message?: string | null
          id?: string
          reflection_completion?: string | null
          reflection_difficulty?: string | null
          schedule?: Json | null
          status?: string
          task_priorities?: Json | null
          updated_at?: string
          user_id?: string
          week_start?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_send_reminders_secret: { Args: never; Returns: string }
    }
    Enums: {
      [_ in never]: never
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
    Enums: {},
  },
} as const
