import { LlmApi, Tokenizer } from ".";
import { Logger } from "../sys";

import {
  ChatCompletionRequestMessageRoleEnum,
  ChatCompletionRequestMessage as ChatMessage
} from "openai";

export { ChatMessage };

export type MessageType =
  | "persistent"
  | "temporary";

interface MessageLog {
  tokens: number;
  msgs: ChatMessage[];
}

export type ChatRole = ChatCompletionRequestMessageRoleEnum;

export type ChatMessageLog = Record<MessageType, MessageLog>;

export class Chat {
  private _msgLogs: ChatMessageLog = {
    "persistent": {
      tokens: 0,
      msgs: []
    },
    "temporary": {
      tokens: 0,
      msgs: []
    }
  };
  private _maxContextTokens: number;
  private _summaryTokens: number;
  private _chunkTokens: number;

  constructor(
    private _llm: LlmApi,
    private _tokenizer: Tokenizer,
    private _logger?: Logger,
  ) {
    this._maxContextTokens = this._llm.getMaxContextTokens();

    // Summary size should be ~10% of total tokens
    const summaryPerc = 0.10;
    this._summaryTokens = Math.floor(
      this._maxContextTokens * summaryPerc
    );

    // Chunk size should be ~70% of total tokens
    const chunkPerc = 0.7;
    this._chunkTokens = Math.floor(
      this._maxContextTokens * chunkPerc
    );
  }

  get tokens(): number {
    return this._msgLogs["persistent"].tokens +
      this._msgLogs["temporary"].tokens;
  }

  get tokenizer(): Tokenizer {
    return this._tokenizer;
  }

  get messages(): ChatMessage[] {
    return [
      ...this._msgLogs["persistent"].msgs,
      ...this._msgLogs["temporary"].msgs
    ];
  }

  public add(
    type: MessageType,
    msg: ChatMessage | ChatMessage[]
  ) {
    const msgLog = this._msgLogs[type];
    let msgs = Array.isArray(msg) ? msg : [msg];
    msgs = msgs.map((m) => ({
      ...m,
    }));

    for (const msg of msgs) {
      const tokens = this._tokenizer.encode(msg.content || "").length;

      // If the message is larger than the context window
      if (tokens > this._chunkTokens) {
        const chunked = this._chunk(msg);
        msgLog.tokens += chunked.tokens;
        msgLog.msgs.push(...chunked.msgs);
      } else {
        msgLog.tokens += tokens;
        msgLog.msgs.push(msg);
      }
    }
  }

  public persistent(
    role: ChatRole,
    content: string
  ): string {
    this.add("persistent", { role, content });
    return content;
  }

  public temporary(
    role: ChatRole,
    content?: string
  ): string | undefined;
  public temporary(
    msg: ChatMessage
  ): string | undefined;
  public temporary(
    roleOrMsg: ChatRole | ChatMessage,
    content?: string
  ): string | undefined {
    switch(typeof roleOrMsg) {
      case "string":
        this.add("temporary", { role: roleOrMsg as ChatRole, content });
        return content;
      case "object":
        this.add("temporary", roleOrMsg as ChatMessage);
        return roleOrMsg.content;
      default:
        throw new Error(`Invalid type for roleOrMsg: ${typeof roleOrMsg}`);
    }
  }

  public async fitToContextWindow(): Promise<void> {
    if (this.tokens < this._maxContextTokens) {
      return;
    }

    this._logger?.error(`! Max Tokens Exceeded (${this.tokens} / ${this._maxContextTokens})`);

    // Start with "temporary" messages
    await this._summarize("temporary");

    if (this.tokens < this._maxContextTokens) {
      return;
    }

    // Move onto "persistent" messages
    await this._summarize("persistent");
  }

  public async condenseFindScriptMessages(): Promise<void> {
    const log = this._msgLogs.temporary;
    for (let i = log.msgs.length - 1; i >= 0; i--) {
      const executeScriptMsg = log.msgs[i];

      // we can use fnNamespace to identify the findScript results message
      let fnNamespace: string | undefined = undefined;
      if (executeScriptMsg.role === "assistant" && executeScriptMsg.function_call?.name === "executeScript") {
        const args = executeScriptMsg.function_call.arguments;
        fnNamespace = JSON.parse(args ?? "{}").namespace;
      }

      if (fnNamespace) {
        for (let j = i - 1; j >= 0; j--) {
          const foundScriptMsg = log.msgs[j];
          // stop searching if we find a system message that indicates we have already modified the log
          if (
            foundScriptMsg.role === "system" &&
            foundScriptMsg.content?.startsWith("Found the following script\n")
          ) {
            break;
          }

          if (
            foundScriptMsg.role === "system" &&
            foundScriptMsg.content?.startsWith("Found the following results for script") &&
            foundScriptMsg.content?.includes(`Namespace: ${fnNamespace}`)
          ) {
            // condense findScript results message
            const nsIndex = foundScriptMsg.content.indexOf(`Namespace: ${fnNamespace}`);
            const scriptEndIndex = foundScriptMsg.content.indexOf("\n--------------", nsIndex);
            const newContent = "Found the following script\n" + foundScriptMsg.content.slice(nsIndex, scriptEndIndex) + "\n\`\`\`";
            this._replaceMessageContentAtIndex(log, j, newContent);

            // remove findScript function call message (currently always precedes findScript results message)
            const prevMsgIndex = j - 1;
            const findScriptMsg = log.msgs[prevMsgIndex];
            if (findScriptMsg.role === "assistant" && findScriptMsg.function_call?.name === "findScript") {
              this._removeMessageAtIndex(log, prevMsgIndex);
            }
            break;
          }
        }
      }
    }
    this._logger?.notice("Internally condensed findScript messages. This won't be reflected in the logs");
  }

  public export(): ChatMessageLog {
    return JSON.parse(JSON.stringify(this._msgLogs));
  }

  public toString() {
    return JSON.stringify(this, null, 2);
  }

  public toJSON() {
    return this._msgLogs;
  }

  private _chunk(msg: ChatMessage): MessageLog {
    const chunks: MessageLog = {
      tokens: 0,
      msgs: []
    };
    let content = msg.content || "";

    while (content.length > 0) {
      // Slice a chunk
      const contentChunk = content.slice(0, this._chunkTokens);

      // Append the chunk
      chunks.tokens += this._tokenizer.encode(contentChunk).length;
      chunks.msgs.push({
        ...msg,
        content: contentChunk
      });

      // Remove the chunk
      content = content.slice(this._chunkTokens);
    }

    return chunks;
  }

  private async _summarize(
    msgType: MessageType
  ): Promise<void> {
    const msgLog = this._msgLogs[msgType];

    const message = await this._summarizeMessages(msgLog.msgs);

    if (!message) {
      return;
    }

    const tokens = this._tokenizer.encode(message.content || "").length;

    this._msgLogs[msgType] = {
      tokens,
      msgs: [message]
    };
  }

  private async _summarizeMessages(
    msgs: ChatMessage[]
  ): Promise<ChatMessage | undefined> {
    let result: ChatMessage | undefined;
    let queue = msgs;

    // While we still have more than 1 message to summarize
    while (queue.length > 1) {
      // Aggregate as many messages as possible,
      // based on max size of the context window
      const toSummarize: ChatMessage[] = [];
      let tokenCounter = 0;
      let index = 0;

      while (index < queue.length) {
        const msg = queue[index];
        const content = msg.content || "";
        const contentTokens = this._tokenizer.encode(content).length;

        if ((tokenCounter + contentTokens) > (this._maxContextTokens - this._summaryTokens)) {
          break;
        }

        // TODO: this is the only usage of the toSummarize array, so only the index variable is used outside the loop
        toSummarize.push(msg);
        tokenCounter += this._tokenizer.encode(content).length;
        index++;
      }

      // TODO: should we have a summarization prompt?
      // Summarize
      const message = await this._llm.getResponse(
        this,
        [],
        {
          temperature: 0,
          max_tokens: this._summaryTokens
        }
      );

      // Remove messages from the queue
      queue = queue.splice(index);

      // Add the new message to the queue
      if (message) {
        queue = [
          message,
          ...queue
        ];
      }
    }

    if (queue.length > 0) {
      result = queue[0];
    }

    return result;
  }

  private _removeMessageAtIndex(log: MessageLog, index: number) {
    const msg = log.msgs[index];
    const content = msg.content || "";
    const contentTokens = this._tokenizer.encode(content).length;
    log.msgs.splice(index, 1);
    log.tokens -= contentTokens;
  }

  private _replaceMessageContentAtIndex(log: MessageLog, index: number, newContent: string) {
    const msg = log.msgs[index];
    const content = msg.content || "";
    const contentTokens = this._tokenizer.encode(content).length;
    const newContentTokens = this._tokenizer.encode(newContent).length;
    log.tokens += (newContentTokens - contentTokens);
    msg.content = newContent;
  }
}
