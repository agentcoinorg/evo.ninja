import { SupabaseBucketWorkspace } from "../supabase/SupabaseBucketWorkspace";
import { Chat } from "../queries/useChats";
import { chatIdAtom, userWorkspaceAtom } from "../store";
import { useSupabaseClient } from "../supabase/useSupabaseClient";

import { useAtom } from "jotai";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { v4 as uuid } from "uuid";

export const useCreateChat = (): (() => Promise<{
  chatId: string;
  workspace: SupabaseBucketWorkspace;
}>) => {
  const supabase = useSupabaseClient();
  const queryClient = useQueryClient();
  const [_1, setChatId] = useAtom(chatIdAtom);
  const [_2, setUserWorkspace] = useAtom(userWorkspaceAtom);

  const { mutateAsync: createChat } = useMutation({
    mutationFn: async (chatId: string) => {
      const { data, error } = await supabase
        .from("chats")
        .insert({
          id: chatId,
        })
        .select("id");

      if (error) {
        throw new Error(error.message);
      }

      return data[0];
    },
    onMutate: async (chatId: string) => {
      await queryClient.cancelQueries({ queryKey: ["chats"] });
      queryClient.setQueryData<Chat[]>(["chats"], (old) => [
        ...(old ?? []),
        {
          id: chatId,
          messages: [],
          logs: [],
          variables: new Map(),
          created_at: new Date().toISOString(),
        },
      ]);
    },
    onSettled: async () => {
      await queryClient.invalidateQueries({ queryKey: ["chats"] });
    },
  });

  return async () => {
    const chatId = uuid();

    window.history.pushState(null, "Chat", `/chat/${chatId}`);
    await createChat(chatId);
    setChatId(chatId);

    const workspace = new SupabaseBucketWorkspace(chatId, supabase.storage);
    setUserWorkspace(workspace);

    return {
      chatId,
      workspace,
    };
  };
};
