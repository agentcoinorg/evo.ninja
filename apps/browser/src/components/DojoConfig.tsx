import React, { useState } from "react";

interface DojoConfigProps {
  apiKey: string | null;
  onConfigSaved: (apiKey: string) => void;
  capReached: boolean;
}

function DojoConfig(props: DojoConfigProps) {
  const [apiKey, setApiKey] = useState<string>(props.apiKey || "");
  const { onConfigSaved, capReached } = props;
  return (
    <div className="absolute inset-0 z-50 bg-neutral-900/80">
      <div className="fixed left-1/2 top-1/2 flex w-96 -translate-x-1/2 -translate-y-1/2 flex-col gap-4 rounded-lg bg-neutral-900 p-12 text-neutral-50">
        <h3 className="text-lg font-semibold">
          Please enter your OpenAI API key
        </h3>
        {capReached && (
          <h4 className="text-md">
            You have reached the cap of 5 prompts daily. Please enter your
            OpenAI API Key or try again tomorrow
          </h4>
        )}
        <input
          className="rounded border border-neutral-600 bg-neutral-950 p-2.5 text-neutral-50 outline-none transition-all"
          type="text"
          value={apiKey}
          onChange={(e) => setApiKey(e.target.value)}
        />
        <button
          className="cursor-pointer rounded-xl border-none bg-orange-600 p-2.5 text-white transition-all hover:bg-orange-500"
          onClick={() => onConfigSaved(apiKey)}
        >
          Save
        </button>
      </div>
    </div>
  );
}

export default DojoConfig;
