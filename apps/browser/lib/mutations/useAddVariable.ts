import { useMutation, useQueryClient } from "@tanstack/react-query"
import { useSession } from "next-auth/react"
import { Row } from "../supabase/types"
import { createSupabaseClient } from "../supabase/supabase"

const mapVariableToVariableDTO = (
  chatId: string,
  variable: string,
  value: string
): Omit<Row<'variables'>, "id" | "created_at"> => {
  return {
    chat_id: chatId,
    key: variable,
    value
  }
}

export const useAddVariable = () => {
  const { data: session } = useSession()
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (args: {
      chatId: string;
      key: string;
      value: string;
    }) => {
      const supabase = createSupabaseClient(session?.supabaseAccessToken as string)
      const { error } = await supabase
        .from("variables")
        .insert(
          mapVariableToVariableDTO(args.chatId, args.key, args.value)
        )

      if (error) {
        throw new Error(error.message);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chats', session?.user?.email] })
    },
  })
}