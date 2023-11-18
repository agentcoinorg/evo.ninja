import { Tokenizer } from "./";
import { FunctionDefinition } from "../";
import { ChatCompletionRole } from "openai/resources";

export type ChatLogType =
  | "persistent"
  | "temporary";

export interface ChatMessage {
  role: ChatCompletionRole;
  content: string | null;

}

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
  private _tokensPerMsg: Record<ChatLogType, number[]> = {
    "persistent": [],
    "temporary": []
  };
  private _functions: ChatFunctions = {
    tokens: 0,
    definitions: []
  };

  constructor(logs?: Record<ChatLogType, ChatLog>, tokensPerMsg?: Record<ChatLogType, number[]>, functions?: ChatFunctions) {
    if (logs) {
      this._logs = logs;
    }
    if (tokensPerMsg) {
      this._tokensPerMsg = tokensPerMsg;
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

  public getMsg(type: ChatLogType, index: number): ChatMessage | undefined {
    return this._logs[type].msgs.at(index);
  }

  public getMsgTokens(type: ChatLogType, index: number): number {
    const tokens = this._tokensPerMsg[type];
    if (index < 0 || index >= tokens.length) {
      throw Error("invalid index");
    }
    return tokens[index];
  }

  public add(type: ChatLogType, msgs: ChatMessage[], tokens: number[]) {
    if (msgs.length !== tokens.length) {
      throw Error("msgs & tokens must be equal size.");
    }

    this._logs[type].tokens += tokens.reduce((acc, cur) => acc + cur, 0);
    this._tokensPerMsg[type].push(...tokens);
    this._logs[type].msgs.push(...msgs);
  }

  public insert(type: ChatLogType, msgs: ChatMessage[], tokens: number[], index: number) {
    this._logs[type].tokens += tokens.reduce((acc, cur) => acc + cur, 0);
    this._tokensPerMsg[type].splice(index, 0, ...tokens);
    this._logs[type].msgs.splice(index, 0, ...msgs);
  }

  public addFunction(fn: FunctionDefinition, tokens: number): void {
    this._functions.tokens += tokens;
    this._functions.definitions.push(fn);
  }

  public clone(): ChatLogs {
    return new ChatLogs(
      JSON.parse(JSON.stringify(this._logs)),
      JSON.parse(JSON.stringify(this._tokensPerMsg)),
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
    const persistentTokens = persistentMsgs
      .map(x => x.content ? tokenizer.encode(x.content as string).length : 0);
    const temporaryTokens = persistentMsgs
      .map(x => x.content ? tokenizer.encode(x.content as string).length : 0);

    return new ChatLogs({
      "persistent": {
        tokens: persistentTokens.reduce((a, b) => a + b, 0),
        msgs: persistentMsgs
      },
      "temporary": {
        tokens: temporaryTokens.reduce((a, b) => a + b, 0),
        msgs: temporaryMsgs
      }
    }, {
      "persistent": persistentTokens,
      "temporary": temporaryTokens
    });
  }
}
