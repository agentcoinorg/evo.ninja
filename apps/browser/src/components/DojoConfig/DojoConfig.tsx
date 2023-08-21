import React, { useState } from "react";

import "./DojoConfig.css";

export interface DojoConfigProps {
  apiKey: string | null;
  onConfigSaved: (apiKey: string) => void;
}

function DojoConfig(props: DojoConfigProps) {
  const [apiKey, setApiKey] = useState<string>(props.apiKey || "");
  const { onConfigSaved } = props;

  return (
    <div className="DojoConfig">
      <div className="DojoConfig-apikey">
        <h2>Please enter your OpenAI API key</h2>
        <div className="DojoConfig__InputContainer">
          <input
            className="DojoConfig__Input"
            type="text"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
          />
          <button
            className="DojoConfig__Btn"
            onClick={() => onConfigSaved(apiKey)}
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}

export default DojoConfig;
