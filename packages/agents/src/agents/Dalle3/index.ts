import { AgentFunctionBase } from "../../functions/utils";
import { AgentFunctionResult, ChatMessageBuilder, AgentContext } from "@/agent-core";
import {prompts} from "./prompt";
import { Agent, AgentConfig } from "../utils";
import fetch from 'node-fetch';

interface ImageData {
  url: string;
}

class OnImageCreatedFunction extends AgentFunctionBase<AgentFunctionResult> {
  public description: string = 'Function to create images using DALL-E.';
  public name: string = 'OnImageCreated';
  public parameters: { [key: string]: any } = {
    type: "object",
    properties: {
      prompt: { type: "string" },
      n: { type: "number" },
      size: { type: "string" },
    },
    required: ["prompt"],
  };
  
  context: AgentContext;

  constructor(context: AgentContext) {
    super();
    this.context = context;
  }

  buildExecutor(agent: Agent<unknown>): (params: any, rawParams?: string | undefined) => Promise<AgentFunctionResult> {
    return async (params: any, rawParams?: string): Promise<AgentFunctionResult> => {
      const parsedParams = rawParams ? JSON.parse(rawParams) : {};
      const { prompt, n = 1, size = "1024x1024" } = parsedParams;

      const requestBody = {
        model: "dall-e-3",
        prompt: prompt,
        n: n,
        size: size,
      };

      try {
        const response = await fetch('https://api.openai.com/v1/images/generations', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
          },
          body: JSON.stringify(requestBody)
        });

        const imageData = await response.json();
        if (!response.ok) {
          throw new Error(imageData.error || 'Failed to generate image');
        }

        const outputs = imageData.data.map((img: ImageData) => ({
          type: 'image',
          imageUrl: img.url
        }));
        console.log(outputs)


        const functionCallMessage = ChatMessageBuilder.functionCall(this.name, rawParams);
        const functionCallResultMessage = ChatMessageBuilder.functionCallResult(this.name, `Successfully generated ${imageData.data.length} image(s). And this is the URL of the first image: ${imageData.data[0].url}`);

        return {
          outputs: outputs,
          messages: [functionCallMessage, functionCallResultMessage]
        };
      
      } catch (error) {
        console.error('Error creating image:', error.message);
        const errorMessage = ChatMessageBuilder.system(`Error creating image: ${error instanceof Error ? error.message : String(error)}`);
        
        return {
          outputs: [],
          messages: [errorMessage] 
        };
        
      }
    };
  }


}
export class DalleAgent extends Agent<unknown> {
  private onImageCreatedFunction: OnImageCreatedFunction;

  constructor(context: AgentContext) {
    const onImageCreatedFunction = new OnImageCreatedFunction(context);

    super(
      new AgentConfig(
        () => prompts(onImageCreatedFunction),
        [onImageCreatedFunction],
        context.scripts,
        undefined,
        (functionCalled) => functionCalled.name === onImageCreatedFunction.name,
        true
      ),
      context
    );
    this.onImageCreatedFunction = onImageCreatedFunction;
  }
}

export default DalleAgent;