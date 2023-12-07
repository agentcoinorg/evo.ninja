import { useQuery } from "@tanstack/react-query"
import { useSession } from "next-auth/react"
import { useSupabase } from "../hooks/useSupabase"
import { ChatMessage as AgentMessage } from "@evo-ninja/agents"
import { ChatMessage } from "@/components/Chat"

export interface Chat {
  id: string;
  created_at: string;
  messages: AgentMessage[];
  logs: ChatMessage[];
  variables: Map<string, string>
}

export const useChats = () => {
  const supabase = useSupabase()
  const { data: session } = useSession()

  return useQuery({
    queryKey: ['chats', session?.user?.email],
    enabled: !!session?.user?.email,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('chats')
        .select(`
          id,
          created_at,
          logs(id, created_at, title, content, user),
          variables(id, key, value),
          messages(
            id,
            created_at,
            content,
            name,
            function_call,
            tool_calls,
            temporary,
            role,
            tool_call_id
          )
        `)

      if (error) {
        console.error(error)
        throw new Error(error.message)
      }

      return data ?? []
    }
  })
}