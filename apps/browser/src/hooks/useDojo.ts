import { useEffect, useState } from "react";

export interface DojoConfig {
  openAiApiKey: string | null;
  allowTelemetry: boolean;
  loaded: boolean;
  complete: boolean;
}

export interface Dojo {
  config: DojoConfig;
  error?: string;
}

export function useDojo() {
  const [dojo, setDojo] = useState<Dojo>({
    config: {
      openAiApiKey: null,
      allowTelemetry: false,
      loaded: false,
      complete: false,
    },
    error: undefined,
  });

  useEffect(() => {
    const openAiApiKey = localStorage.getItem("openai-api-key");
    const allowTelemetry =
      localStorage.getItem("allow-telemetry") === "true" ? true : false;
    const config = {
      openAiApiKey,
      allowTelemetry,
      loaded: true,
      complete: !!openAiApiKey,
    };

    setDojo({ config });
  }, []);

  useEffect(() => {}, [dojo.config]);

//   const setC

  return { dojo, setDojo };
}
