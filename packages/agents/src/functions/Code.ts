import {
  AgentFunctionResult,
  AgentOutputType,
  ChatMessageBuilder,
  LlmApi,
  Tokenizer,
  trimText,
} from "@evo-ninja/agent-utils";
import { LlmAgentFunctionBase } from "../LlmAgentFunctionBase";
import { Agent } from "../Agent";
import fs from "fs";
import { WriteFileFunction } from "./WriteFile";

interface CreateCodeFuncParameters {
  path: string;
  data: string;
}

export class CodeFunction extends LlmAgentFunctionBase<CreateCodeFuncParameters> {
  constructor(llm: LlmApi, tokenizer: Tokenizer) {
    super(llm, tokenizer);
  }
  name: string = "createCode";
  description: string = "Writes code for a given query";
  parameters: any = {
    type: "object",
    properties: {
      path: {
        type: "string",
      },
      data: {
        type: "string",
      },
    },
    required: ["path", "data"],
    additionalProperties: false,
  };
  buildExecutor(agent: Agent<unknown>) {
    return async (
      params: CreateCodeFuncParameters,
      rawParams?: string | undefined
    ): Promise<AgentFunctionResult> => {
      const write = new WriteFileFunction(agent.context.scripts);
      await write.buildExecutor(agent)({
        path: params.path,
        data: params.data,
        encoding: "utf-8",
      });

      return {
        outputs: [
          {
            type: AgentOutputType.Success,
            title: "[Developer] createCode",
            content: `${params.path}\n` + `${trimText(params.data, 200)}`,
          },
        ],
        messages: [
          ChatMessageBuilder.functionCall(this.name, rawParams),
          ChatMessageBuilder.functionCallResult(
            this.name,
            "Succesfully wrote file."
          ),
        ],
      };
    };
  }
}
