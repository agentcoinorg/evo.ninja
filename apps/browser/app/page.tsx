"use client";

import Chat from "@/components/Chat";
import { evoServiceAtom } from "@/lib/store";
import { EvoService } from "@/lib/services/evo/EvoService";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useAtom } from "jotai";

function Dojo({ params }: { params: { id?: string } }) {

  const router = useRouter()
  const { status: sessionStatus } = useSession();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [evoService, setEvoService] = useAtom(evoServiceAtom);

  useEffect(() => {
    if (sessionStatus === "loading") {
      return;
    }

    setIsAuthenticated(sessionStatus === "authenticated");

    const reconnectEvo = !(!isAuthenticated && sessionStatus === "unauthenticated");
    if (reconnectEvo) {
      evoService.disconnect();
      evoService.destroy();
      setEvoService(new EvoService());
    }
  }, [sessionStatus])

  useEffect(() => {
    if (sessionStatus === "unauthenticated" && params.id) {
      router.push('/')
    }
  }, [sessionStatus, params.id])

  return (
    <Chat
      chatId={isAuthenticated ? params.id : "<anon>"}
      isAuthenticated={isAuthenticated}
      onCreateChat={(chatId: string) => 
        window.history.pushState(null, "Chat", `/chat/${chatId}`)
      }
    />
  );
}

export default Dojo;
