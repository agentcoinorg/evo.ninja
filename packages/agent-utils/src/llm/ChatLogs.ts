import { ChatCompletionRequestMessage as ChatMessage } from "openai";
import { Tokenizer } from "./Tokenizer";
import { FunctionDefinition } from ".";

export { ChatMessage };

export type ChatLogType =
  | "persistent"
  | "temporary";

export interface ChatLog {
  tokens: number;
  msgs: ChatMessage[];
}

export interface ChatFunctions {
  tokens: number;
  definitions: FunctionDefinition[];
}

export class ChatLogs {
  private _logs: Record<ChatLogType, ChatLog> = {
    "persistent": {
      tokens: 0,
      msgs: [],
    },
    "temporary": {
      tokens: 0,
      msgs: [],
    },
  };
  private _functions: ChatFunctions = {
    tokens: 0,
    definitions: []
  };

  constructor(logs?: Record<ChatLogType, ChatLog>, functions?: ChatFunctions) {
    if (logs) {
      this._logs = logs;
    }
    if (functions) {
      this._functions = functions;
    }
  }

  get tokens(): number {
    return this._logs["persistent"].tokens +
      this._logs["temporary"].tokens +
      this._functions.tokens;
  }

  get messages(): ChatMessage[] {
    return [
      ...this._logs["persistent"].msgs,
      ...this._logs["temporary"].msgs
    ];
  }

  public get(type: ChatLogType): ChatLog {
    return this._logs[type];
  }

  public add(type: ChatLogType, log: ChatLog) {
    this._logs[type].tokens += log.tokens;
    this._logs[type].msgs.push(...log.msgs);
  }

  public addFunction(fn: FunctionDefinition, tokens: number): void {
    this._functions.tokens += tokens;
    this._functions.definitions.push(fn);
  }

  public clone(): ChatLogs {
    return new ChatLogs(
      JSON.parse(JSON.stringify(this._logs)),
      JSON.parse(JSON.stringify(this._functions))
    );
  }

  public toString(): string {
    return JSON.stringify(this, null, 2);
  }

  public toJSON(): {
    msgs: Record<ChatLogType, ChatLog>;
    functions: {
      tokens: number;
      names: string[];
    };
  } {
    return {
      msgs: this._logs,
      functions: {
        tokens: this._functions.tokens,
        names: this._functions.definitions.map((d) => d.name)
      }
    };
  }

  static from(persistentMsgs: ChatMessage[], temporaryMsgs: ChatMessage[], tokenizer: Tokenizer): ChatLogs {
    return new ChatLogs({
      "persistent": {
        tokens: persistentMsgs
          .map(x => x.content ? tokenizer.encode(x.content).length : 0)
          .reduce((a, b) => a + b, 0),
        msgs: persistentMsgs
      },
      "temporary": {
        tokens: temporaryMsgs
          .map(x => x.content ? tokenizer.encode(x.content).length : 0)
          .reduce((a, b) => a + b, 0),
        msgs: temporaryMsgs
      }
    });
  }
}
