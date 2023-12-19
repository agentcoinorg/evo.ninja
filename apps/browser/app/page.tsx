"use client";

import Chat from "@/components/Chat";
import { evoServiceAtom, chatInfoAtom } from "@/lib/store";
import { EvoService } from "@/lib/services/evo/EvoService";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useAtom } from "jotai";

function Dojo({ params }: { params: { id?: string } }) {
  const router = useRouter();
  const { status: sessionStatus, data: sessionData } = useSession();
  const [evoService, setEvoService] = useAtom(evoServiceAtom);
  const [,setChatInfo] = useAtom(chatInfoAtom);
  const [loading, setIsLoading] = useState(true);

  useEffect(() => {
    if (sessionStatus === "unauthenticated") {
      if (params.id) {
        router.push("/");
      }
      setChatInfo({ id: "<anon>" });
      return;
    }

    setChatInfo({ id: params.id });
  }, [sessionStatus, params.id]);

  useEffect(() => {
    if (sessionStatus === "loading") {
      return;
    }
    setIsLoading(false);

    const user = sessionData?.user.email || "<anon>";
    if (evoService.user === user) {
      return;
    }

    evoService.disconnect();
    evoService.destroy();
    setEvoService(new EvoService(user));
  }, [sessionStatus, sessionData]);

  return (
    <>
      {!loading ? (
        <Chat
          isAuthenticated={sessionStatus === "authenticated"}
          onCreateChat={(chatId: string) => {
            router.push(`/chat/${chatId}`);
            // setChatInfo({ id: chatId });
          }}
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center">
          <div className="h-9 w-9 animate-spin rounded-full border-4 border-black/10 border-l-cyan-600" />
        </div>
      )}
    </>
  );
}

export default Dojo;
