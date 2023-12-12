import React from "react";
import Modal from "./ModalBase";
import Button from "../Button";
import { SignOut } from "@phosphor-icons/react";
import Image from "next/image";
import { signIn, signOut, useSession } from "next-auth/react";
import { useAccountConfig } from "@/lib/hooks/useAccountConfig";

interface AccountConfigProps {
  apiKey: string | null;
  allowTelemetry: boolean;
  isOpen: boolean;
  onClose: () => void;
}

export default function SignInModal(props: AccountConfigProps) {
  const { data: session } = useSession();
  const { isOpen, onClose } = props;
  const { AccountConfig } = useAccountConfig({
    onClose,
  });

  return (
    <>
      <Modal isOpen={isOpen} title="Sign In" onClose={onClose}>
        {session?.user?.email ? (
          <div className="space-y-6">
            <div className="border-b-2 border-zinc-700 pb-8 text-center">
              You're signed in!
            </div>
            <div className="flex items-center justify-between rounded-lg bg-zinc-800 p-4">
              <div className="flex items-center space-x-2">
                {session.user.image ? (
                  <img
                    src={session.user.image}
                    className="h-8 w-8 rounded-full bg-yellow-500"
                  />
                ) : (
                  <div className="h-8 w-8 rounded-full bg-yellow-500" />
                )}
                <div className="space-y-1">
                  <div className="text-sm font-semibold leading-none">
                    {session.user.name}
                  </div>
                  <div className="text-[12px] leading-none text-gray-400">
                    {session.user.email}
                  </div>
                </div>
              </div>
              <div className="space-x-2">
                <Button
                  className="!px-2 md:!px-4"
                  hierarchy="secondary"
                  onClick={() => signOut()}
                >
                  <SignOut color="currentColor" size={16} />
                  <div className="hidden md:block">Sign Out</div>
                </Button>
              </div>
            </div>
            {AccountConfig}
          </div>
        ) : (
          <div className="space-y-6">
            <p>Sign in below to save your sessions</p>
            <div className="space-y-2">
              <Button
                className="w-full"
                hierarchy="secondary"
                onClick={() => signIn("github")}
              >
                <Image
                  alt="Sign in with Github"
                  width={20}
                  height={20}
                  src="/github-logo.svg"
                />
                <div>Sign in with Github</div>
              </Button>
              <Button
                className="w-full"
                hierarchy="secondary"
                onClick={() => signIn("google")}
              >
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
      </Modal>
    </>
  );
}
