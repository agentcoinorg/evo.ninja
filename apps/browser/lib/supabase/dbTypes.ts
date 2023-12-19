export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      chats: {
        Row: {
          created_at: string
          id: string
          title: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          title?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          title?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "chats_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      goals: {
        Row: {
          chat_id: string | null
          created_at: string
          id: string
          prompt: string
          submission_date: string
          subsidized: boolean
          subsidized_completion_req: number
          subsidized_embedding_req: number
          user_email: string | null
        }
        Insert: {
          chat_id?: string | null
          created_at?: string
          id?: string
          prompt: string
          submission_date: string
          subsidized: boolean
          subsidized_completion_req?: number
          subsidized_embedding_req?: number
          user_email?: string | null
        }
        Update: {
          chat_id?: string | null
          created_at?: string
          id?: string
          prompt?: string
          submission_date?: string
          subsidized?: boolean
          subsidized_completion_req?: number
          subsidized_embedding_req?: number
          user_email?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "goals_user_email_fkey"
            columns: ["user_email"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["email"]
          }
        ]
      }
      goals_duplicate: {
        Row: {
          created_at: string
          id: string
          prompt: string
          submission_date: string
          subsidized: boolean
          subsidized_completion_req: number
          subsidized_embedding_req: number
          user_email: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          prompt: string
          submission_date: string
          subsidized: boolean
          subsidized_completion_req?: number
          subsidized_embedding_req?: number
          user_email?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          prompt?: string
          submission_date?: string
          subsidized?: boolean
          subsidized_completion_req?: number
          subsidized_embedding_req?: number
          user_email?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "goals_duplicate_user_email_fkey"
            columns: ["user_email"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["email"]
          }
        ]
      }
      logs: {
        Row: {
          chat_id: string
          content: string | null
          created_at: string
          id: string
          title: string
          user: string
        }
        Insert: {
          chat_id: string
          content?: string | null
          created_at?: string
          id?: string
          title: string
          user: string
        }
        Update: {
          chat_id?: string
          content?: string | null
          created_at?: string
          id?: string
          title?: string
          user?: string
        }
        Relationships: [
          {
            foreignKeyName: "logs_chat_id_fkey"
            columns: ["chat_id"]
            isOneToOne: false
            referencedRelation: "chats"
            referencedColumns: ["id"]
          }
        ]
      }
      messages: {
        Row: {
          chat_id: string
          content: string | null
          created_at: string
          function_call: Json | null
          id: string
          name: string | null
          role: string
          temporary: boolean
          tool_call_id: string | null
          tool_calls: Json | null
        }
        Insert: {
          chat_id: string
          content?: string | null
          created_at?: string
          function_call?: Json | null
          id?: string
          name?: string | null
          role: string
          temporary: boolean
          tool_call_id?: string | null
          tool_calls?: Json | null
        }
        Update: {
          chat_id?: string
          content?: string | null
          created_at?: string
          function_call?: Json | null
          id?: string
          name?: string | null
          role?: string
          temporary?: boolean
          tool_call_id?: string | null
          tool_calls?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "messages_chat_id_fkey"
            columns: ["chat_id"]
            isOneToOne: false
            referencedRelation: "chats"
            referencedColumns: ["id"]
          }
        ]
      }
      prompts: {
        Row: {
          created_at: string
          id: string
          llm_requests: number
          prompt: string
          submission_date: string
          user_email: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          llm_requests?: number
          prompt: string
          submission_date: string
          user_email?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          llm_requests?: number
          prompt?: string
          submission_date?: string
          user_email?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "prompts_user_email_fkey"
            columns: ["user_email"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["email"]
          }
        ]
      }
      users: {
        Row: {
          email: string | null
          id: string
          image: string | null
          name: string | null
        }
        Insert: {
          email?: string | null
          id: string
          image?: string | null
          name?: string | null
        }
        Update: {
          email?: string | null
          id?: string
          image?: string | null
          name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "users_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      variables: {
        Row: {
          chat_id: string
          id: string
          key: string
          value: string
        }
        Insert: {
          chat_id: string
          id?: string
          key: string
          value: string
        }
        Update: {
          chat_id?: string
          id?: string
          key?: string
          value?: string
        }
        Relationships: [
          {
            foreignKeyName: "variables_chat_id_fkey"
            columns: ["chat_id"]
            isOneToOne: false
            referencedRelation: "chats"
            referencedColumns: ["id"]
          }
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (Database["public"]["Tables"] & Database["public"]["Views"])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
      Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (Database["public"]["Tables"] &
      Database["public"]["Views"])
  ? (Database["public"]["Tables"] &
      Database["public"]["Views"])[PublicTableNameOrOptions] extends {
      Row: infer R
    }
    ? R
    : never
  : never

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof Database["public"]["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof Database["public"]["Tables"]
  ? Database["public"]["Tables"][PublicTableNameOrOptions] extends {
      Insert: infer I
    }
    ? I
    : never
  : never

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof Database["public"]["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof Database["public"]["Tables"]
  ? Database["public"]["Tables"][PublicTableNameOrOptions] extends {
      Update: infer U
    }
    ? U
    : never
  : never

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof Database["public"]["Enums"]
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof Database["public"]["Enums"]
  ? Database["public"]["Enums"][PublicEnumNameOrOptions]
  : never

