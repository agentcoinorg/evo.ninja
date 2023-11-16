import { ChatCompletionTool, ChatCompletionMessage } from "openai/resources";
import { OpenAI } from "openai"
import { Blob } from 'fetch-blob';
import { File } from 'fetch-blob/file.js'
import { LlmApi, LlmModel, LlmOptions } from "./LlmApi";
import { ChatLogs } from "./chat";
import { Logger, Workspace } from "@evo-ninja/agent-utils";
import { RunSubmitToolOutputsParams } from "openai/resources/beta/threads/runs/runs";
import {
  Assistant,
  AssistantCreateParams,
} from "openai/resources/beta/assistants/assistants";
import { ThreadCreateParams } from "openai/resources/beta/threads/threads";

interface RunThreadOptions {
  assistantId: string;
  instructions?: string;
  goal: string;
}

interface AssistantOptions {
  name: string;
  persona: string;
  fileIds?: string[];
  functions?: AssistantCreateParams.AssistantToolsFunction["function"][];
}

export class OpenAIAssistants implements LlmApi {
  private _api: OpenAI;

  constructor(
    private _apiKey: string,
    private _defaultModel: LlmModel,
    private _defaultMaxTokens: number,
    private _defaultMaxResponseTokens: number,
    private _logger: Logger,
    private _maxRateLimitRetries: number = 5,
    private _workspace: Workspace
  ) {
    this._api = new OpenAI({
      apiKey: this._apiKey,
      dangerouslyAllowBrowser: true
    });
  }
  
  getMaxContextTokens(): number {
    throw new Error("Method not implemented.");
  }
  getMaxResponseTokens(): number {
    throw new Error("Method not implemented.");
  }
  getModel(): string {
    throw new Error("Method not implemented.");
  }
  getResponse(chatLog: ChatLogs, functionDefinitions?: ChatCompletionTool.Function[] | undefined, options?: LlmOptions | undefined): Promise<ChatCompletionMessage | undefined> {
    throw new Error("Method not implemented.");
  }

  async getAssistant(opts: {
    id?: string;
    name?: string;
  }): Promise<Assistant | void> {
    const assistants = await this._api.beta.assistants.list();
    if (opts.id) {
      const assistant = assistants.data.find(({ id }) => id == opts.id);
      if (assistant) return assistant;
    }
  
    if (opts.name) {
      const assistant = assistants.data.find(({ name }) => name == opts.name);
      if (assistant) return assistant;
    }
  };
  
  async createAssistant({
    name,
    persona,
    fileIds,
    functions,
  }: AssistantOptions) {
    console.log("Creating assistant....");
  
    const tools: AssistantCreateParams["tools"] = [];
  
    if (fileIds) {
      tools.push({ type: "retrieval" });
    }
  
    if (functions) {
      for (let i = 0; i < functions.length; i++) {
        tools.push({ type: "function", function: functions[i] });
      }
    }
  
    const assistant = await this._api.beta.assistants.create({
      name,
      instructions: persona,
      tools,
      model: "gpt-4-1106-preview",
      file_ids: fileIds,
    });
    console.log(`Assistant ${name} created`);
    return assistant;
  };
  
  async runThread(threadId: string, assistantId: string) {
    const run = await this._api.beta.threads.runs.create(threadId, {
      assistant_id: assistantId,
    });
    return run;
  };
  
  async createThread(goal?: string) {
    let messages: ThreadCreateParams.Message[] = [];
    if (goal) {
      messages.push({
        role: "user",
        content: goal,
      });
    }
    return await this._api.beta.threads.create({
      messages,
    });
  };
  
  async addMessage(threadId: string, content: string) {
    await this._api.beta.threads.messages.create(threadId, {
      content,
      role: "user",
    });
  };
  
  async createThreadAndRun(options: RunThreadOptions) {
    const thread = await this._api.beta.threads.createAndRun({
      assistant_id: options.assistantId,
      instructions: options.instructions,
      thread: {
        messages: [
          {
            role: "user",
            content: options.goal,
          },
        ],
      },
    });
  
    return thread;
  };
  
  async addFile(args: { path: string; name: string }) {
    const fileContent = this._workspace.readFileSync(args.path);
    const blob = new Blob([fileContent], { type: 'text/plain' });
    const file = new File([blob], args.name, { type: 'text/plain' })

    const createdFile = await this._api.files.create({
      file,
      purpose: "assistants",
    });
    return createdFile.id;
  };
  
  async getMessages(threadId: string) {
    const messages = await this._api.beta.threads.messages.list(threadId);
    return messages.data.flatMap((m) => m.content.map((c) => {
      if (c.type === "text") {
        return c.text;
      }

      // TODO: Handle image messages
      throw new Error(`Unexpected message content type: ${c.type}`);
    }));
  };
  
  async getThread(threadId: string) {
    return await this._api.beta.threads.retrieve(threadId);
  };
  
  async getRun(threadId: string, runId: string) {
    return await this._api.beta.threads.runs.retrieve(threadId, runId);
  };
  
  async submitResponses(
    threadId: string,
    runId: string,
    toolOutputs: RunSubmitToolOutputsParams["tool_outputs"]
  ) {
    await this._api.beta.threads.runs.submitToolOutputs(threadId, runId, {
      tool_outputs: toolOutputs,
    });
  };
}