import { useMutation, useQueryClient } from "@tanstack/react-query"
import { Row } from "../supabase/types"
import { createSupabaseBrowserClient } from "../supabase/createBrowserClient"
import { useSession } from "next-auth/react"

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
  const queryClient = useQueryClient();
  const { data: session } = useSession();
  return useMutation({
    mutationFn: async (args: {
      chatId: string;
      key: string;
      value: string;
    }) => {
      if (!session?.supabaseAccessToken) {
        throw new Error("Not authenticated");
      }
      const supabase = createSupabaseBrowserClient(session.supabaseAccessToken);
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
      queryClient.invalidateQueries({ queryKey: ['chats'] })
    },
  })
}