import { yellow } from "tailwindcss/colors";
import React from "react";
import { useAtom } from "jotai";
import { capReachedAtom } from "@/lib/store";
import { FloppyDisk, WarningCircle } from "@phosphor-icons/react";
import Modal from "./ModalBase";
import Button from "../Button";
import { ArrowRight } from "@phosphor-icons/react/dist/ssr";
import { useAccountConfig } from "@/lib/hooks/useAccountConfig";
import AccountConfig from "./AccountConfig";

interface AccountConfigProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SettingsModal(props: AccountConfigProps) {
  const [capReached] = useAtom(capReachedAtom);
  const { isOpen, onClose } = props;
  const { onSave, error, setApiKey, apiKey, setTelemetry, telemetry } =
    useAccountConfig({ onClose });

  return (
    <>
      <Modal
        isOpen={isOpen}
        title={
          capReached
            ? "You've Used Your Free Prompts Today"
            : "Account Settings"
        }
        onClose={onClose}
      >
        <div className="space-y-6">
          {capReached && (
            <div className="flex items-start justify-between space-x-2 rounded-lg border-2 border-yellow-500/50 bg-cyan-600/20 p-4">
              <WarningCircle color={yellow[500]} size={32} />
              <p className="py-1.5 text-sm text-white">
                You have used all of your free daily prompts. Please enter your
                OpenAI API key or try again tomorrow.
              </p>
            </div>
          )}
          <AccountConfig
            apiKey={apiKey}
            setApiKey={setApiKey}
            setTelemetry={setTelemetry}
            telemetry={telemetry}
            error={error}
          />

          <div className="flex justify-end border-t-2 border-zinc-700 pt-6">
            <Button onClick={onSave}>
              {!capReached && <FloppyDisk color="currentColor" weight="bold" />}
              <div>{capReached ? "Update" : "Save"}</div>
              {capReached && <ArrowRight color="currentColor" weight="bold" />}
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}
