import OpenAIApi from "openai";

export function createOpenAIApiClient() {
  if (!process.env.OPENAI_API_KEY) {
    throw Error("Env missing OPENAI_API_KEY");
  }
  return new OpenAIApi({
    apiKey: process.env.OPENAI_API_KEY,
    baseURL: process.env.OPENAI_API_BASE_URL
  });
}
