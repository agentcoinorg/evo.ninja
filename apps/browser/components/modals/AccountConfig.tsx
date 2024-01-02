import React, { ChangeEvent, useEffect, useRef } from "react";
import TextField from "../inputs/TextField";
import { useSession, signOut } from "next-auth/react";
import Button from "../Button";
import { SignOut } from "@phosphor-icons/react/dist/ssr";
import Checkbox from "../inputs/Checkbox";

interface AccountConfigProps {
  setApiKey: (key: string) => void;
  apiKey: string | null;
  setTelemetry: (telemetry: boolean) => void;
  telemetry: boolean;
  error: string | undefined;
}

function AccountConfig(props: AccountConfigProps) {
  const { apiKey, setApiKey, telemetry, setTelemetry } = props;
  const apiKeyRef = useRef<HTMLInputElement | null>(null);
  const { data: session } = useSession();

  useEffect(() => {
    // Focus on the TextField when the component mounts
    if (apiKeyRef.current) {
      apiKeyRef.current.focus();
    }
  }, []);

  return (
    <>
      <div className="space-y-6">
        {session?.user.email && (
          <div className="flex items-center justify-between rounded-lg bg-zinc-800 p-4">
            <div className="flex items-center space-x-2">
              {session?.user.image ? (
                <img
                  src={session?.user.image}
                  className="h-8 w-8 rounded-full bg-cyan-600"
                />
              ) : (
                <div className="h-8 w-8 rounded-full bg-cyan-600" />
              )}
              <div className="space-y-1">
                <div className="text-sm font-semibold leading-none">
                  {session?.user.name}
                </div>
                <div className="text-[11px] leading-none text-gray-400">
                  {session?.user.email}
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
        )}
        {!apiKey && (
          <p>
            {!!session?.user.email
              ? "Provide your own OpenAI key to get started with Evo."
              : "Provide your own OpenAI key and use Evo as a guest. As a guest, your sessions will not be saved."}
          </p>
        )}
        <div className="space-y-3">
          <TextField
            ref={apiKeyRef}
            value={apiKey ? apiKey : ""}
            placeholder="Enter API Key"
            label="OpenAI Key"
            onChange={(e: ChangeEvent<HTMLInputElement>) =>
              setApiKey(e.target.value)
            }
            error={props.error}
            type="text"
          />
          {!apiKey && (
            <div className="text-xs text-zinc-400">
              Don't have an OpenAI key?
              <a
                className="ml-1 text-cyan-500 underline transition-colors duration-300 hover:text-white"
                href="https://platform.openai.com/account/api-keys"
                target="_blank"
                rel="noredirect"
              >
                Get one here.
              </a>
            </div>
          )}
        </div>

        <div className="w-full space-y-1">
          <h3 className="text-sm font-semibold">Data</h3>
          <fieldset className="flex w-full items-center justify-between">
            <label className="text-sm text-zinc-200">
              Share prompts with Evo
            </label>
            <Checkbox
              checked={telemetry}
              onChange={(e) => setTelemetry(e.target.checked)}
            />
          </fieldset>
        </div>
      </div>
    </>
  );
}

export default AccountConfig;
