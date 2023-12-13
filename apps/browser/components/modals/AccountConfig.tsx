import React, { ChangeEvent } from "react";
import TextField from "../TextField";

interface AccountConfigProps {
  setApiKey: (key: string) => void;
  apiKey: string | null;
  setTelemetry: (telemetry: boolean) => void;
  telemetry: boolean;
  isLoggedIn: boolean;
  error: string | undefined;
}

function AccountConfig(props: AccountConfigProps) {
  const { isLoggedIn, apiKey, setApiKey, setTelemetry, telemetry, error } =
    props;

  return (
    <>
      <div className="space-y-6">
        {!apiKey && (
          <p>
            {isLoggedIn
              ? "Provide your own OpenAI key to get started with Evo."
              : "Provide your own OpenAI key and use Evo as a guest. As a guest, your sessions will not be saved."}
          </p>
        )}
        <div className="space-y-3">
          <TextField
            value={apiKey ? apiKey : ""}
            placeholder="Enter API Key"
            label="OpenAI Key"
            onChange={(e: ChangeEvent<HTMLInputElement>) =>
              setApiKey(e.target.value)
            }
            error={error}
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
            <TextField
              checked={telemetry}
              onChange={(e) => setTelemetry(e.target.checked)}
              type="checkbox"
            />
          </fieldset>
        </div>
      </div>
    </>
  );
}

export default AccountConfig;
