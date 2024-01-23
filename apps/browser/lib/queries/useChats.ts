import { useQuery } from "@tanstack/react-query"
import { useSession } from "next-auth/react"
import { ChatMessage } from "@evo-ninja/agents"
import { PostgrestError } from "@supabase/supabase-js"
import { ChatLog } from "@/components/Chat"
import { Json } from "../supabase/dbTypes"
import { createSupabaseBrowserClient } from "../supabase/createBrowserClient"

export interface Chat {
  id: string;
  created_at: string;
  title: string | null;
  messages: SavedMessage[];
  logs: ChatLog[];
  variables: Map<string, string>
}

export interface SavedMessage {
  msg: ChatMessage, 
  temporary: boolean
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
  title: string | null;
  logs: LogDTO[];
  variables: VariableDTO[];
  messages: MessageDTO[];
}

const mapMessageDTOtoMessage = (dto: MessageDTO): SavedMessage => {
  const messageRole = dto.role as "function" | "user" | "tool" | "system" | "assistant"
  
  switch (messageRole) {
    case "user":
    case "system": {
      return {
        msg: {
          role: messageRole,
          content: dto.content,
        },
        temporary: dto.temporary,
      }
    }
    case "function": {
      return {
        msg: {
          role: messageRole,
          content: dto.content,
          name: dto.name as string
        },
        temporary: dto.temporary,
      }
    }
    case "assistant": {
      return {
        msg: {
          role: messageRole,
          content: dto.content,
          // TODO: Json casting
          function_call: dto.function_call as any ?? undefined,
          tool_calls: dto.tool_calls as any
            ? dto.tool_calls as any
            : undefined,
        },
        temporary: dto.temporary,
      }
    }
    case "tool": {
      return {
        msg: {
          role: messageRole,
          content: dto.content,
          tool_call_id: dto.tool_call_id as string,
        },
        temporary: dto.temporary,
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
    title: dto.title,
    messages: messages,
    variables,
    logs
  }
}

export const fetchChats = async (supabaseToken: string): Promise<{
  data: Chat[] | undefined,
  error: PostgrestError | undefined
}> => {
  const supabase = createSupabaseBrowserClient(supabaseToken);
  const { data, error } = await supabase
    .from('chats')
    .select(`
      id,
      created_at,
      logs(id, created_at, title, content, user),
      variables(id, key, value),
      title,
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
    return {
      data: undefined,
      error: error
    }
  }

  return {
    data: data.map(mapChatDTOtoChat),
    error: undefined
  };
}

export const useChats = () => {
  const { data: session } = useSession();

  return useQuery({
    queryKey: ['chats', session?.user?.email],
    enabled: !!session?.user?.email,
    refetchOnMount: false,
    queryFn: async () => {
      if (!session?.user?.email || !session?.supabaseAccessToken) {
        throw new Error("Not authenticated")
      }

      const { data, error } = await fetchChats(session.supabaseAccessToken);

      if (error) {
        console.error(error)
        throw new Error(error.message);
      }

      return data;
    }
  })
}