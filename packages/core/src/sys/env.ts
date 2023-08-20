import dotenv from "dotenv";
import path from "path";

dotenv.config({
  path: path.join(__dirname, "../../../../.env")
});

export interface Env {
  OPENAI_API_KEY: string;
  GPT_MODEL: string;
  CONTEXT_WINDOW_TOKENS: number;
  MAX_TOKENS_PER_RESPONSE: number;
}

let _env: Env | undefined;

function missingEnvError(prop: string): Error {
  return new Error(
    `Missing "${prop}" Environment Variable - please create a .env file, see .env.template for help.`
  );
}

export function env(): Env {
  if (_env) {
    return _env;
  }

  const {
    OPENAI_API_KEY,
    GPT_MODEL,
    CONTEXT_WINDOW_TOKENS,
    MAX_TOKENS_PER_RESPONSE
  } = process.env;

  if (!OPENAI_API_KEY) {
    throw missingEnvError("OPENAI_API_KEY");
  }

  if (!GPT_MODEL) {
    throw missingEnvError("GPT_MODEL");
  }
  if (!CONTEXT_WINDOW_TOKENS) {
    throw missingEnvError("CONTEXT_WINDOW_TOKENS");
  }
  if (!MAX_TOKENS_PER_RESPONSE) {
    throw missingEnvError("MAX_TOKENS_PER_RESPONSE");
  }

  return {
    OPENAI_API_KEY,
    GPT_MODEL,
    CONTEXT_WINDOW_TOKENS: Number(CONTEXT_WINDOW_TOKENS),
    MAX_TOKENS_PER_RESPONSE: Number(MAX_TOKENS_PER_RESPONSE)
  };
}
