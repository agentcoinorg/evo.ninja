import { LlmModel } from "@evo-ninja/agents";
import OpenAi from "openai";

export const checkLlmModel = async (
  apiKey: string,
  currentModel: string
): Promise<LlmModel> => {
  try {
    const openai = new OpenAi({
      apiKey,
      dangerouslyAllowBrowser: true,
    });
    const models = await openai.models.list();
    if (models.data.some((m) => m.id === currentModel)) {
      return currentModel as LlmModel;
    } else {
      return "gpt-3.5-turbo-16k";
    }
  } catch (e) {
    throw e
  }
};
