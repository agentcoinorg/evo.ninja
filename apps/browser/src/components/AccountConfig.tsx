import React, { useState } from "react";
import { useSession, signOut, signIn } from "next-auth/react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faTrash,
  faSmileWink,
  faExclamationCircle,
} from "@fortawesome/free-solid-svg-icons";
import { useAtom } from "jotai";
import {
  useDojo,
} from "../hooks/useDojo";
import { checkLlmModel } from "../checkLlmModel";
import { allowTelemetryAtom, capReachedAtom, localOpenAiApiKeyAtom } from "../store";

interface AccountConfigProps {
  apiKey: string | null;
  allowTelemetry: boolean;
  onClose: () => void;
  firstTimeUser: boolean;
}

const validateOpenAiApiKey = async (
  openAiApiKey: string
): Promise<string | void> => {
  try {
    // Point by default to GPT-4 unless the given api key's account doesn't support it
    const model = await checkLlmModel(openAiApiKey, "gpt-4");
    return model;
  } catch (e: any) {
    if (e.message.includes("Incorrect API key provided")) {
      throw new Error(
        "Open AI API key is not correct. Please make sure it has the correct format"
      );
    } else {
      throw new Error("Error validating OpenAI API Key");
    }
  }
};

function AccountConfig(props: AccountConfigProps) {
  const [localApiKey, setLocalApiKey] = useAtom(localOpenAiApiKeyAtom);
  const [apiKey, setApiKey] = useState<string>(localApiKey || "");
  const [allowTelemetry, setAllowTelemetry] = useAtom(allowTelemetryAtom);
  const [capReached, setCapReached] = useAtom(capReachedAtom)
  const { onClose, firstTimeUser } = props;
  const { data: session } = useSession();
  const { dojo, setDojo, setDojoError } = useDojo();

  const onSave = async () => {
    if (apiKey) {
      try {
        const model = await validateOpenAiApiKey(apiKey);
        setDojo({
          config: {
            ...dojo.config,
            model: model as string,
          },
          error: dojo.error,
        });
        setLocalApiKey(apiKey);
        if (capReached) {
          setCapReached(false)
        }
      } catch (e: any) {
        setDojoError(e.message);
        return
      }
    } else {
      setLocalApiKey(null)
    }
    onClose();
  };

  return (
    <div className="absolute inset-0 z-50 bg-neutral-900/80" onClick={onClose}>
      <div
        className="fixed left-1/2 top-1/2 flex w-[100%] max-w-[38rem] -translate-x-1/2 -translate-y-1/2 flex-col gap-4 rounded-lg bg-neutral-900 p-12 text-neutral-50"
        onClick={(e) => {
          e.stopPropagation();
        }}
      >
        <div className="border-b px-4 py-2 flex justify-between items-center">
          <h3 className="font-semibold text-lg">Account</h3>
          <button onClick={onClose}>X</button>
        </div>

        {firstTimeUser && (
          <div className="px-8 py-2 flex justify-between items-center">
            <FontAwesomeIcon icon={faSmileWink} color="yellow" size="2x" />
            <h4 className="text-md text-white">
              Welcome! Please sign in or add an OpenAI API key.
            </h4>
          </div>
        )}

        <div className="px-8 py-2 flex justify-between items-center">
          <h3 className="font-semibold text-lg">Email</h3>
          {session ? (
            <div className="w-[65%] flex flex-row gap-5 justify-end">
              <h4 className="text-md">{session.user?.email}</h4>
              <button
                className="cursor-pointer"
                onClick={() => signOut()}
              >
                <FontAwesomeIcon icon={faTrash} />
              </button>
            </div>
          ) : (
            <button
              className="cursor-pointer rounded-xl border-none bg-orange-600 p-1.5 text-white transition-all hover:bg-orange-500"
              onClick={() => signIn()}
            >
              Sign in
            </button>
          )}
        </div>

        <div className="px-8 py-2 flex justify-between items-center">
          <h3 className="font-semibold text-lg">OpenAI Key</h3>
          <input
            className="w-[65%] justify-end rounded border border-neutral-600 bg-neutral-950 p-1.5 text-neutral-50 outline-none transition-all"
            type="text"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
          />
        </div>

        {capReached && (
          <div className="px-8 py-2 flex justify-between items-center">
            <FontAwesomeIcon icon={faExclamationCircle} color="yellow" size="2x" />
            <h4 className="text-md text-white">
              You have used all of your free daily prompts. Please enter your
              OpenAI API key or try again tomorrow.
            </h4>
          </div>
        )}

        <div className="px-8 py-2 flex justify-between items-center">
          <h3 className="font-semibold text-lg">Data</h3>
          <div className="flex flex-row gap-7 justify-end">
            <h4 className="text-md">
              Share prompts with Evo devs
            </h4>
            <input type="checkbox" style={{ accentColor: "#f0541a" }} checked={allowTelemetry} onChange={(e) => setAllowTelemetry(!allowTelemetry)} />
          </div>
        </div>

        <div className="px-8 py-2 flex justify-center items-center">
          <button
            className="w-[30%] cursor-pointer rounded-xl border-none bg-orange-600 p-2.5 text-white transition-all hover:bg-orange-500"
            onClick={onSave}
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}

export default AccountConfig;
