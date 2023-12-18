import { useQuery } from "@tanstack/react-query"
import { useSession } from "next-auth/react"
import { ChatMessage } from "@evo-ninja/agents"
import { ChatLog } from "@/components/Chat"
import { Json } from "../supabase/dbTypes"
import { createSupabaseClient } from "../supabase/createSupabaseClient"

export interface Chat {
  id: string;
  created_at: string;
  messages: ChatMessage[];
  logs: ChatLog[];
  variables: Map<string, string>
}

interface MessageDTO {
  id: string;
  created_at: string;
  content: string | null;
  name: string | null;
  function_call: Json;
  tool_calls: Json;
  temporary: boolean;
  role: string;
  tool_call_id: string | null;
}

interface VariableDTO {
  id: string;
  key: string;
  value: string;
}

interface LogDTO {
  id: string;
  created_at: string;
  title: string;
  content: string | null;
  user: string;
}

interface ChatDTO {
  id: string;
  created_at: string;
  logs: LogDTO[];
  variables: VariableDTO[];
  messages: MessageDTO[];
}

const mapMessageDTOtoMessage = (dto: MessageDTO): ChatMessage & { temporary: boolean } => {
  const messageRole = dto.role as "function" | "user" | "tool" | "system" | "assistant"
  
  switch (messageRole) {
    case "user":
    case "system": {
      return {
        role: messageRole,
        content: dto.content,
        temporary: dto.temporary
      }
    }
    case "function": {
      return {
        role: messageRole,
        content: dto.content,
        temporary: dto.temporary,
        name: dto.name as string
      }
    }
    case "assistant": {
      return {
        role: messageRole,
        content: dto.content,
        temporary: dto.temporary,
        // TODO: Json casting
        function_call: dto.function_call as any,
        tool_calls: dto.tool_calls as any,
      }
    }
    case "tool": {
      return {
        role: messageRole,
        content: dto.content,
        temporary: dto.temporary,
        tool_call_id: dto.tool_call_id as string,
      }
    }
  }
}

const mapChatDTOtoChat = (dto: ChatDTO): Chat => {
  const messages = dto.messages.map(mapMessageDTOtoMessage)
  const variables = new Map(
    dto.variables.map(v => ([v.key, v.value]))
  )
  const logs = dto.logs.map(log => ({
    ...log,
    content: log.content ?? undefined
  }))

  return {
    id: dto.id,
    created_at: dto.created_at,
    messages,
    variables,
    logs
  }
}

export const useChats = () => {
  const { data: session } = useSession()

  return useQuery({
    queryKey: ['chats'],
    enabled: !!session?.user?.email,
    refetchOnMount: false,
    queryFn: async () => {
      const supabase = createSupabaseClient(session?.supabaseAccessToken as string)
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
        `).order(
          'created_at',
          { ascending: false }
        )

      if (error) {
        console.error(error)
        throw new Error(error.message)
      }

      return data.map(mapChatDTOtoChat)
    }
  })
}