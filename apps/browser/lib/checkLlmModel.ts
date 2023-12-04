import { LlmModel } from "@evo-ninja/agents";
import OpenAi from "openai";

export const checkLlmModel = async (
  apiKey: string,
  currentModel: LlmModel
): Promise<void> => {
  try {
    const openai = new OpenAi({
      apiKey,
      dangerouslyAllowBrowser: true,
    });
    const models = await openai.models.list();
    const supportCurrentModel = models.data.some((m) => m.id === currentModel)
    if (!supportCurrentModel) {
      throw new Error("Model not supported")
    }
  } catch (e) {
    throw e
  }
};
