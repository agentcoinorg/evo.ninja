export class Env {
  public readonly OPENAI_API_KEY: string;
  public readonly GPT_MODEL: string;
  public readonly CONTEXT_WINDOW_TOKENS: number;
  public readonly MAX_RESPONSE_TOKENS: number;

  constructor(envVars: Record<string, string>) {
    const {
      OPENAI_API_KEY,
      GPT_MODEL,
      CONTEXT_WINDOW_TOKENS,
      MAX_RESPONSE_TOKENS
    } = envVars;

    if (!OPENAI_API_KEY) {
      throw missingEnvError("OPENAI_API_KEY");
    }

    if (!GPT_MODEL) {
      throw missingEnvError("GPT_MODEL");
    }
    if (!CONTEXT_WINDOW_TOKENS) {
      throw missingEnvError("CONTEXT_WINDOW_TOKENS");
    }
    if (!MAX_RESPONSE_TOKENS) {
      throw missingEnvError("MAX_RESPONSE_TOKENS");
    }

    return {
      OPENAI_API_KEY,
      GPT_MODEL,
      CONTEXT_WINDOW_TOKENS: Number(CONTEXT_WINDOW_TOKENS),
      MAX_RESPONSE_TOKENS: Number(MAX_RESPONSE_TOKENS)
    };
  }
}

function missingEnvError(prop: string): Error {
  return new Error(
    `Missing "${prop}" Environment Variable - please create a .env file, see .env.template for help.`
  );
}
