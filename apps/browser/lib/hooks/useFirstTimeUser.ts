import { localOpenAiApiKeyAtom } from '@/lib/store';
import { useAtom } from 'jotai';
import { useSession } from "next-auth/react";

export const useFirstTimeUser = () => {
  const [localOpenAiApiKey] = useAtom(localOpenAiApiKeyAtom);
  const { status } = useSession();

  return !localOpenAiApiKey && status !== "authenticated";
};
