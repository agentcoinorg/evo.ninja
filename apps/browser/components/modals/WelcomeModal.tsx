import React from "react";
import Modal from "./ModalBase";
import Button from "../Button";
import { ArrowRight, SignOut } from "@phosphor-icons/react";
import Image from "next/image";
import { signIn, signOut, useSession } from "next-auth/react";
import { useAccountConfig } from "@/lib/hooks/useAccountConfig";

export const WELCOME_MODAL_SEEN_STORAGE_KEY = "welcome-modal-seen";

interface WelcomeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function WelcomeModal(props: WelcomeModalProps) {
  const { data: session } = useSession()
  const { isOpen, onClose } = props;
  const { onSave, AccountConfig, firstTimeUser } = useAccountConfig({ onClose })
  
  return (
    <>
      <Modal isOpen={isOpen} title="Welcome to Evo Ninja" onClose={onClose}>
        {!firstTimeUser && (
          <div className="border-b-2 border-zinc-700 pb-8 text-center">
            Evo is an agent that can do many things. This is a technical
            preview, feedback and questions are appreciated!
          </div>
        )}
        {session?.user?.email ? (
          <div className="space-y-6">
            <div className="border-b-2 border-zinc-700 pb-8 text-center">
              You're signed in!
            </div>
            <div className="flex items-center justify-between rounded-lg bg-zinc-800 p-4">
              <div className="flex items-center space-x-2">
                <div className="h-8 w-8 rounded-full bg-yellow-500" />
                <div className="space-y-1">
                  <div className="text-sm font-semibold leading-none">
                    {session.user.name}
                  </div>
                  <div className="text-xs leading-none text-gray-400 underline">
                    {session.user.email}
                  </div>
                </div>
              </div>
              <div className="space-x-2">
                <Button className="!px-4" hierarchy="secondary" onClick={() => signOut()}>
                  <SignOut color="currentColor" size={16} />
                  <div>Sign Out</div>
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-6 border-b-2 border-zinc-700 pb-8">
            <p>Sign in below to save your sessions</p>
            <div className="space-y-2">
              <Button className="w-full" hierarchy="secondary" onClick={() => signIn("github")}>
                <Image
                  alt="Sign in with Github"
                  width={20}
                  height={20}
                  src="/github-logo.svg"
                />
                <div>Sign in with Github</div>
              </Button>
              <Button className="w-full" hierarchy="secondary" onClick={() => signIn("google")}>
                <Image
                  alt="Sign in with Google"
                  width={20}
                  height={20}
                  src="/google-logo.svg"
                />
                <div>Sign in with Google</div>
              </Button>
            </div>
          </div>
        )}
        {AccountConfig}
        <div className="flex justify-end border-t-2 border-zinc-700 pt-8">
          <Button onClick={onSave}>
            <div>Get Started</div>
            <ArrowRight size={16} color="white" />
          </Button>
        </div>
      </Modal>
    </>
  );
}
