import { yellow } from "tailwindcss/colors";
import React, { useState } from "react";
import { useAtom } from "jotai";
import { checkLlmModel } from "@/lib/checkLlmModel";
import {
  allowTelemetryAtom,
  capReachedAtom,
  localOpenAiApiKeyAtom,
} from "@/lib/store";
import { FloppyDisk, WarningCircle } from "@phosphor-icons/react";
import Modal from "./Modal";
import Button from "./Button";
import { ArrowRight } from "@phosphor-icons/react/dist/ssr";
import AccountConfig from "./modals/AccountConfig";
import { useSession } from "next-auth/react";

interface AccountConfigProps {
  apiKey: string | null;
  allowTelemetry: boolean;
  isOpen: boolean;
  onClose: () => void;
  firstTimeUser: boolean;
}

const validateOpenAiApiKey = async (
  openAiApiKey: string
): Promise<string | void> => {
  try {
    // Make sure that given api key has access to GPT-4
    await checkLlmModel(openAiApiKey, "gpt-4-1106-preview");
  } catch (e: any) {
    if (e.message.includes("Incorrect API key provided")) {
      throw new Error(
        "Open AI API key is not correct. Please make sure it has the correct format"
      );
    }

    if (e.message.includes("Model not supported")) {
      throw new Error(
        "You API Key does not support GPT-4. Make sure to enable billing"
      );
    }

    throw new Error("Error validating OpenAI API Key");
  }
};

export default function SettingsModal(props: AccountConfigProps) {
  const [localApiKey, setLocalApiKey] = useAtom(localOpenAiApiKeyAtom);
  const [apiKey, setApiKey] = useState<string>(localApiKey || "");
  const [allowTelemetry, setAllowTelemetry] = useAtom(allowTelemetryAtom);
  const [telemetry, setTelemetry] = useState(allowTelemetry);
  const [, setError] = useState<string | undefined>();
  const [capReached, setCapReached] = useAtom(capReachedAtom);
  const { data: session } = useSession()
  const { isOpen, onClose } = props;

  const onSave = async () => {
    if (apiKey) {
      try {
        await validateOpenAiApiKey(apiKey);
        setLocalApiKey(apiKey);
        if (capReached) {
          setCapReached(false);
        }
      } catch (e: any) {
        setError(e.message);
        return;
      }
    } else {
      setLocalApiKey(null);
    }
    setAllowTelemetry(telemetry);
    onClose();
  };
  return (
    <>
      <Modal
        isOpen={isOpen}
        title={
          capReached
            ? "You've Used Your Free Prompts Today"
            : "Account Settings"
        }
        onClose={onSave}
      >
        <div className="space-y-6">
          {capReached && (
            <div className="flex items-start justify-between space-x-2 rounded-lg border-2 border-yellow-500/50 bg-yellow-500/20 p-4">
              <WarningCircle color={yellow[500]} size={32} />
              <p className="py-1.5 text-sm text-white">
                You have used all of your free daily prompts. Please enter your
                OpenAI API key or try again tomorrow.
              </p>
            </div>
          )}

          <AccountConfig
            isLoggedIn={!!session?.user}
            apiKey={apiKey}
            showText={false}
            telemetry={telemetry}
            setTelemetry={setTelemetry}
            setApiKey={setApiKey}
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
