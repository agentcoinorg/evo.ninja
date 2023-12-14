"use client";

import Chat from "@/components/Chat";
import { evoServiceAtom, chatIdAtom } from "@/lib/store";
import { EvoService } from "@/lib/services/evo/EvoService";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useAtom } from "jotai";

function Dojo({ params }: { params: { id?: string } }) {

  const router = useRouter()
  const { status: sessionStatus, data } = useSession();
  const [evoService, setEvoService] = useAtom(evoServiceAtom);
  const [, setChatId] = useAtom(chatIdAtom);

  useEffect(() => {
    if (sessionStatus === "unauthenticated") {
      setChatId("<anon>");
      return;
    }

    setChatId(params.id);
  }, [sessionStatus, params.id]);

  useEffect(() => {
    if (sessionStatus === "loading") {
      return;
    }

    evoService.disconnect();
    evoService.destroy();
    setEvoService(new EvoService());
  }, [sessionStatus])

  useEffect(() => {
    if (sessionStatus === "unauthenticated" && params.id) {
      router.push('/')
    }
  }, [sessionStatus, params.id])

  return (
    <Chat
      isAuthenticated={sessionStatus === "authenticated"}
      onCreateChat={(chatId: string) => {
        window.history.pushState(null, "Chat", `/chat/${chatId}`);
        setChatId(chatId);
      }}
    />
  );
}

export default Dojo;
