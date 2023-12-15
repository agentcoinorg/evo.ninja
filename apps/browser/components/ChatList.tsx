import { useCreateChat } from "@/lib/mutations/useCreateChat";
import { useChats } from "@/lib/queries/useChats";
import { chatIdAtom } from "@/lib/store";
import { v4 as uuid } from "uuid";
import clsx from "clsx";
import { useRouter } from "next/navigation";
import { useAtom } from "jotai";

export default function ChatList() {
  const router = useRouter();
  const [chatId] = useAtom(chatIdAtom);
  const { mutateAsync: createChat } = useCreateChat()
  const { data: chats } = useChats()
  const mappedChats = chats?.map(chat => ({
    id: chat.id,
    name: chat.logs[0]?.title ?? "New session"
  }))

  return (
    <div className="flex h-auto max-h-96 w-full flex-col justify-between rounded border border-neutral-500 bg-neutral-900 p-4 text-neutral-50 gap-4">
      <h3 className="text-lg font-semibold">
        CHATS
      </h3>
      <button
        className="inline-block h-9 cursor-pointer rounded-xl border-none bg-orange-600 px-6 py-2.5 text-center text-neutral-900 shadow-md outline-none transition-all hover:bg-orange-500" 
        title="New chat" 
        onClick={async () => {
          const id = uuid()
          const createdChat = await createChat(id)
          router.push(`/chat/${createdChat.id}`)
        }}
      >
        New chat
      </button>
      <div className="flex-1 overflow-y-auto">
        <div className="flex flex-col gap-2 text-start">
          {mappedChats?.map(({name, id}) => (
            <span
              key={id}
              onClick={() => router.push(`/chat/${id}`)}
              className={clsx(
                "text-ellipsis whitespace-nowrap overflow-hidden p-2.5 cursor-pointer rounded border-2 border-neutral-500 hover:border-orange-600",
                id === chatId ? "border-orange-600 bg-[#813811]": ""
            )}>
              {name}
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}