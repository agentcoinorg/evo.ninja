import React from "react";
import Modal from "./ModalBase";
import Button from "../Button";
import { ArrowRight, SignOut } from "@phosphor-icons/react";
import Image from "next/image";
import { signIn, signOut, useSession } from "next-auth/react";
import { useAccountConfig } from "@/lib/hooks/useAccountConfig";
import AccountConfig from "./AccountConfig";

export const WELCOME_MODAL_SEEN_STORAGE_KEY = "welcome-modal-seen";

interface WelcomeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function WelcomeModal(props: WelcomeModalProps) {
  const { data: session } = useSession();
  const { isOpen, onClose } = props;
  const { onSave, error, setApiKey, apiKey, setTelemetry, telemetry } =
    useAccountConfig({ onClose });

  return (
    <>
      <Modal isOpen={isOpen} title="Welcome to Evo Ninja" onClose={onClose}>
        {session?.user?.email ? (
          <div className="space-y-6">
            <div className="border-b-2 border-zinc-700 pb-8 text-center">
              You're signed in!
            </div>
          </div>
        ) : (
          <>
            <div className="border-b-2 border-zinc-700 pb-8 text-center">
              Evo is an agent that can do many things. This is a technical
              preview, feedback and questions are appreciated!
            </div>
            <div className="space-y-6 border-b-2 border-zinc-700 pb-8">
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
          </>
        )}
        <AccountConfig
          setApiKey={setApiKey}
          apiKey={apiKey}
          telemetry={telemetry}
          setTelemetry={setTelemetry}
          error={error}
        />
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
