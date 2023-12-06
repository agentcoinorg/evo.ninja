import { Dialog, Transition } from "@headlessui/react";
import { Fragment, ChangeEvent } from "react";
import React, { useState } from "react";
import { useSession, signOut, signIn } from "next-auth/react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faTrash,
  faSmileWink,
  faExclamationCircle,
} from "@fortawesome/free-solid-svg-icons";
import { useAtom } from "jotai";
import { checkLlmModel } from "@/lib/checkLlmModel";
import {
  allowTelemetryAtom,
  capReachedAtom,
  localOpenAiApiKeyAtom,
} from "@/lib/store";
import IconButton from "./IconButton";
import { FloppyDisk } from "@phosphor-icons/react";
import TextField from "./TextField";

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
  const [capReached, setCapReached] = useAtom(capReachedAtom);
  const [error, setError] = useState<string | undefined>();
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
      <Transition appear show={isOpen} as={Fragment}>
        <Dialog as="div" className="relative z-10" onClose={onClose}>
          <div className="fixed inset-0 overflow-y-auto bg-zinc-500/50 backdrop-blur">
            <div className="flex min-h-full items-center justify-center p-4 text-center">
              <Transition.Child
                as={Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0 scale-95"
                enterTo="opacity-100 scale-100"
                leave="ease-in duration-200"
                leaveFrom="opacity-100 scale-100"
                leaveTo="opacity-0 scale-95"
              >
                <Dialog.Panel
                  className="w-full max-w-md transform overflow-hidden rounded-2xl bg-zinc-800 text-left align-middle text-zinc-50 shadow-xl transition-all"
                  onClick={(e) => {
                    e.stopPropagation();
                  }}
                >
                  <div className="flex items-center justify-between border-b-2 border-zinc-600 bg-zinc-800 px-6 py-4">
                    <Dialog.Title as="h3" className="text-lg font-semibold">
                      Account Settings
                    </Dialog.Title>
                    <IconButton
                      iconName="X"
                      onClick={onClose}
                      iconProps={{ weight: "bold", color: "white", size: 20 }}
                      buttonClassName="transform translate-x-2"
                    />
                  </div>

                  <div className="space-y-6 bg-zinc-900 p-6">
                    <TextField
                      value={apiKey}
                      placeholder="Enter API Key"
                      label="OpenAI Key"
                      onChange={(e: ChangeEvent<HTMLInputElement>) =>
                        setTelemetry(e.target.checked)
                      }
                      error={error}
                    />

                    <div className="space-y-1">
                      <h3 className="text-sm font-semibold">Data</h3>
                      <fieldset className="flex items-center justify-between">
                        <label className="text-sm text-zinc-200">
                          Share prompts with Evo
                        </label>
                        <TextField
                          type="checkbox"
                          checked={telemetry}
                          onChange={(e: ChangeEvent<HTMLInputElement>) =>
                            setTelemetry(!telemetry)
                          }
                        />
                      </fieldset>
                    </div>

                    {capReached && (
                      <div className="flex items-center justify-between px-8 py-2">
                        <FontAwesomeIcon
                          icon={faExclamationCircle}
                          color="yellow"
                          size="2x"
                        />
                        <h4 className="text-md text-white">
                          You have used all of your free daily prompts. Please
                          enter your OpenAI API key or try again tomorrow.
                        </h4>
                      </div>
                    )}

                    <div className="flex justify-end border-t-2 border-zinc-700 pt-4">
                      <button
                        className="inline-flex cursor-pointer items-center justify-center space-x-2 rounded-md border border-cyan-300 bg-cyan-500 px-6 py-1 text-sm text-white transition-all hover:bg-cyan-600"
                        onClick={onSave}
                      >
                        <FloppyDisk color="currentColor" weight="bold" />
                        <div>Save</div>
                      </button>
                    </div>
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>
    </>
  );
}
