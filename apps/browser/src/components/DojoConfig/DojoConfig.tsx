import React, { useState } from "react";

// import "./DojoConfig.css";
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
    <div className="DojoConfig">
      <div className="DojoConfig-container">
        <h3>Please enter your OpenAI API key</h3>
        <input
          className="DojoConfig__Input"
          type="text"
          value={apiKey}
          onChange={(e) => setApiKey(e.target.value)}
        />
        <h3>Select a GPT model to use:</h3>
        <select
          value={model}
          onChange={(e) => setModel(e.target.value)}
          className="DojoConfig__Select"
        >
          {supportedModels.map((m) => (
            <option key={m} value={m}>{m}</option>
          ))}
        </select>
        <h3>Please enter your Serp API key</h3>
        <input
          className="DojoConfig__Input"
          type="text"
          value={serpApiKey}
          onChange={(e) => setSerpApiKey(e.target.value)}
        />
        <button
          className="DojoConfig__Btn"
          onClick={() => onConfigSaved(apiKey, model, serpApiKey)}
        >
          Save
        </button>
      </div>
    </div>
  );
}

export default DojoConfig;
