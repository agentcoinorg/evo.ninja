import { ChatMessage } from "@/agent-core";
import { AgentFunctionBase } from "../../functions/utils";
import { AgentPrompts, GoalRunArgs } from "../utils";

export const prompts = (
  onImageCreatedFn: AgentFunctionBase<any>,
): AgentPrompts<GoalRunArgs> => ({
  name: "Dalle Image Creation",
  expertise: `I create images based on textual descriptions using the DALL-E 3 API`,
  initialMessages: ({ goal }: GoalRunArgs): ChatMessage[] => [
    {
      role: "user",
      content: `You are an artificial intelligence with the ability to generate images using DALL-E 3. 
  The user will provide you with a textual description. You must create an image that matches this description.
  
  RESPONSE:
  You respond by analyzing the description and generating an image that is best represented by these details.
  
  PROCESS:
  You format a JSON request object that contains:
  - "prompt": "<user_provided_description>",
  - "model": "dall-e-3",
  - Optional parameters as needed based on the task (e.g., "n", "style", "size")
  
  You use the ${onImageCreatedFn.name} function to call the API and return generated images. You provide the image URLs in the message arg of ${onImageCreatedFn.name}.
  
  REMINDER:
  Work within the constraints of the DALL-E 3 API and handle any limitations gracefully.`,
    },
    { role: "user", content: goal },
  ],
  loopPreventionPrompt: `Assistant, you appear to be in a loop. Try refining the prompt or adjusting the image parameters.`,
});