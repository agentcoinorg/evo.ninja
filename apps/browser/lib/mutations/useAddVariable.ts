import { useMutation, useQueryClient } from "@tanstack/react-query"
import { Row } from "../supabase/types"
import { createSupabaseBrowserClient } from "../supabase/createBrowserClient"

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
  
  return useMutation({
    mutationFn: async (args: {
      chatId: string;
      key: string;
      value: string;
    }) => {
      const supabase = createSupabaseBrowserClient();
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