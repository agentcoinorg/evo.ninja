import React, { useState } from "react";

import { defaultModel, supportedModels } from "../../supportedModels";

interface DojoConfigProps {
  apiKey: string | null;
  model: string | null;
  serpApiKey: string | null;
  onConfigSaved: (apiKey: string, model: string, serpApiKey: string) => void;
}

function DojoConfig(props: DojoConfigProps) {
  const [apiKey, setApiKey] = useState<string>(props.apiKey || "");
  const [serpApiKey, setSerpApiKey] = useState<string>(props.serpApiKey || "");
  const [model, setModel] = useState<string>(props.model || defaultModel);
  const { onConfigSaved } = props;

  return (
    <div className="absolute inset-0 z-50 bg-neutral-900/80">
      <div className="fixed left-1/2 top-1/2 flex w-96 -translate-x-1/2 -translate-y-1/2 flex-col gap-4 rounded-lg bg-neutral-900 p-12 text-neutral-50">
        <h3 className="text-lg font-semibold">Please enter your OpenAI API key</h3>
        <input
          className="rounded border border-neutral-600 bg-neutral-950 p-2.5 text-neutral-50 outline-none transition-all"
          type="text"
          value={apiKey}
          onChange={(e) => setApiKey(e.target.value)}
        />
        <h3 className="text-lg font-semibold">Select a GPT model to use:</h3>
        <select
          value={model}
          onChange={(e) => setModel(e.target.value)}
          className="rounded bg-neutral-950 p-2.5 text-neutral-50"
        >
          {supportedModels.map((m) => (
            <option key={m} value={m}>{m}</option>
          ))}
        </select>
        <h3 className="text-lg font-semibold">Please enter your Serp API key</h3>
        <input
          className="rounded border border-neutral-600 bg-neutral-950 p-2.5 text-neutral-50 outline-none transition-all"
          type="text"
          value={serpApiKey}
          onChange={(e) => setSerpApiKey(e.target.value)}
        />
        <button
          className="cursor-pointer rounded-xl border-none bg-orange-600 p-2.5 text-white transition-all hover:bg-orange-700"
          onClick={() => onConfigSaved(apiKey, model, serpApiKey)}
        >
          Save
        </button>
      </div>
    </div>
  );
}

export default DojoConfig;
