import { AgentOutputType, Scripts, ChatMessageBuilder, AgentOutput, Agent, AgentFunctionResult, ChatMessage, Chat, WrapClient } from "@evo-ninja/agent-utils"
import { AgentFunctionBase } from "../AgentFunctionBase";
import { AgentBaseContext } from "../AgentBase";
import { QualityAssuranceAgent } from "../scriptedAgents/Developer/QualityAssurance";

interface FunctionParams {
  filename: string;
  context: string;
}

export class DelegateQualityAssuranceFunction extends AgentFunctionBase<FunctionParams> {
  constructor(private client: WrapClient, private scripts: Scripts) {
    super();
  }

  get name() {
    return "delegateQualityAssurance";
  }

  get description() {
    return `Run python test and analyses error. Provide all the information regarding implementation; so a more complete information can be returned.`
  }

  get parameters() {
    return {
      type: "object",
      properties: {
        filename: {
          type: "string"
        },
        context: {
          type: "string",
          description: "Necessary information required to fully understand tests."
        }
      },
      required: ["filename", "context"],
      additionalProperties: false
    }
  }

  onSuccess(name: string, params: any, messages: string[], result: AgentOutput): AgentFunctionResult {
    return {
      outputs: [
        result
      ],
      messages: [
        ChatMessageBuilder.functionCall(name, params),
        ...messages.map(x => ({
          role: "assistant",
          content: x,
        }) as ChatMessage),
        ChatMessageBuilder.functionCallResult(
          name,
          result.content || "Successfully run tests."
        )
      ]
    }
  }

  onFailure(name: string, params: any, error: string | undefined): AgentFunctionResult {
    return {
      outputs: [
        {
          type: AgentOutputType.Error,
          title: `"${name}" failed to run tests: "${params.task}"`,
          content: `Error: ${error}`
        }
      ],
      messages: [
        ChatMessageBuilder.functionCall(name, params),
        ChatMessageBuilder.functionCallResult(
          name,
          `Error: ${error}`
        )
      ]
    }
  }

  buildExecutor(_: Agent<unknown>, context: AgentBaseContext) {
    return async (params: FunctionParams): Promise<AgentFunctionResult> => {
      const qualityAssurance = new QualityAssuranceAgent(
        {
          chat: new Chat(context.chat.tokenizer),
          env: context.env,
          llm: context.llm,
          logger: context.logger,
          workspace: context.workspace,
          scripts: this.scripts,
          client: this.client,
        }
      );
      const goal = `Run tests from file ${params.filename}`

      let iterator = qualityAssurance.run({
        goal,
      }, params.context);

      const messages = [];

      while (true) {
        const response = await iterator.next();
        
        if (response.done) {
          if (!response.value.ok) {
            return this.onFailure(
              this.name,
              params,
              response.value.error
            );
          }
        
          return this.onSuccess(
            this.name,
            params,
            messages,
            response.value.value
          );
        } else {
          if (response.value.type === "message" && response.value.content) {
            messages.push(response.value.content);
          }
        }

        response.value && context.logger.info(response.value.title);
      }
    }
  }
}