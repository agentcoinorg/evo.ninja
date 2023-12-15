import React, { useState } from "react";
import Modal from "./ModalBase";
import Button from "../Button";
import Image from "next/image";
import { signIn, useSession } from "next-auth/react";
import { useAccountConfig } from "@/lib/hooks/useAccountConfig";
import AccountConfig from "./AccountConfig";

interface AccountConfigProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SignInModal(props: AccountConfigProps) {
  const { data: session } = useSession();
  const { isOpen, onClose } = props;
  const { onSave, error, setApiKey, apiKey, setTelemetry, telemetry } =
    useAccountConfig({ onClose });

  return (
    <>
      <Modal isOpen={isOpen} title="Sign In" onClose={onClose}>
        {session?.user?.email ? (
          <AccountConfig
            setApiKey={setApiKey}
            apiKey={apiKey}
            telemetry={telemetry}
            setTelemetry={setTelemetry}
            error={error}
          />
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
            <>
              <AccountConfig
                setApiKey={setApiKey}
                apiKey={apiKey}
                telemetry={telemetry}
                setTelemetry={setTelemetry}
                error={error}
              />
              <div className="flex justify-end border-t-2 border-zinc-700 pt-6">
                <Button onClick={onSave}>Save</Button>
              </div>
            </>
          </div>
        )}
      </Modal>
    </>
  );
}
