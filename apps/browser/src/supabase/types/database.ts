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
      assistant_messages: {
        Row: {
          function_call: Json | null
          id: number
          message_id: number | null
        }
        Insert: {
          function_call?: Json | null
          id?: number
          message_id?: number | null
        }
        Update: {
          function_call?: Json | null
          id?: number
          message_id?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "assistant_messages_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "messages"
            referencedColumns: ["id"]
          }
        ]
      }
      chats: {
        Row: {
          created_at: string
          id: number
          user_id: string | null
        }
        Insert: {
          created_at?: string
          id?: number
          user_id?: string | null
        }
        Update: {
          created_at?: string
          id?: number
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
      function_messages: {
        Row: {
          id: number
          message_id: number
          name: string
        }
        Insert: {
          id?: number
          message_id: number
          name: string
        }
        Update: {
          id?: number
          message_id?: number
          name?: string
        }
        Relationships: [
          {
            foreignKeyName: "function_messages_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "messages"
            referencedColumns: ["id"]
          }
        ]
      }
      messages: {
        Row: {
          chat_id: number | null
          content: string | null
          created_at: string
          id: number
          role: number
        }
        Insert: {
          chat_id?: number | null
          content?: string | null
          created_at?: string
          id?: number
          role: number
        }
        Update: {
          chat_id?: number | null
          content?: string | null
          created_at?: string
          id?: number
          role?: number
        }
        Relationships: [
          {
            foreignKeyName: "messages_chat_id_fkey"
            columns: ["chat_id"]
            isOneToOne: false
            referencedRelation: "chats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_role_fkey"
            columns: ["role"]
            isOneToOne: false
            referencedRelation: "roles"
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
      roles: {
        Row: {
          id: number
          name: string
        }
        Insert: {
          id?: number
          name: string
        }
        Update: {
          id?: number
          name?: string
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
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}
