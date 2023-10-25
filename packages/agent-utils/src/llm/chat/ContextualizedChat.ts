import {
  Chat,
  ChatLogType,
  ChatMessage
} from ".";
import {
  MessageChunker,
  BaseDocumentMetadata,
  AgentVariables
} from "../../";

import { StandardRagBuilder } from "../../rag/StandardRagBuilder";
import { Rag } from "../../rag/Rag";
import { AgentContext } from "../../agent/AgentContext";
import { StandardRagBuilderV2 } from "../../rag/StandardRagBuilderV2";
import { MessageRecombiner } from "../../chunking/MessageRecombiner";

type MsgIdx = number;

interface Chunk {
  msgIdx: MsgIdx;
}

type ChunkIdx = number;

interface DocumentMetadata extends BaseDocumentMetadata {
  tokens: number;
}

export type MessageChunk = {
  json: string;
  tokens: number;
  index: number;
};

export class ContextualizedChat {

  private _chunks: Record<ChatLogType, Chunk[]> = {
    "persistent": [],
    "temporary": []
  };

  private _rags: Record<ChatLogType, StandardRagBuilderV2<MessageChunk>>;

  constructor(
    _context: AgentContext,
    private _rawChat: Chat,
    private _chunker: MessageChunker,
    private _variables: AgentVariables
  ) {
    this._rags = {
      persistent: Rag.standardV2<MessageChunk>(_context)
        .selector(x => x.json),
      temporary: Rag.standardV2<MessageChunk>(_context)
        .selector(x => x.json)  
    };
  }

  get rawChat(): Chat {
    return this._rawChat;
  }

  async contextualize(context: string, tokenLimits: Record<ChatLogType, number>): Promise<Chat> {
    // Ensure all new messages have been processed
    this._processNewMessages();

    // Aggregate all "persistent" chunks
    const persistentSmallChunks = this._aggregateSmallChunks(
      "persistent",
      tokenLimits["persistent"]
    );

    const persistentLargeChunks = await this._rags["persistent"]
      .query(context)
      .recombine(MessageRecombiner.standard(tokenLimits["persistent"] - persistentSmallChunks.tokens));

    const temporaryChunks = await this._rags["temporary"]
      .query(context)
      .recombine(MessageRecombiner.standard(tokenLimits["temporary"]));

    // Sort persistent and temporary chunks
    const sorted = {
      persistent: [...persistentSmallChunks.chunks, ...persistentLargeChunks].sort(
        (a, b) => a.index - b.index
      ).map((x) => JSON.parse(x.json) as ChatMessage),
      temporary: temporaryChunks.sort(
        (a, b) => a.index - b.index
      ).map((x) => JSON.parse(x.json) as ChatMessage)
    };

    // Post-process the resulting message log,
    // allowing us to (for example) join variable previews
    sorted.persistent = postProcessMessages(sorted.persistent);
    sorted.temporary = postProcessMessages(sorted.temporary);

    const chat = this._rawChat.cloneEmpty();
    chat.add("persistent", sorted.persistent);
    chat.add("temporary", sorted.temporary);
    return chat;
  }

  private _aggregateSmallChunks(type: ChatLogType, tokenLimit: number): {
    chunks: MessageChunk[]
    tokens: number;
  } {
    const chatLog = this._rawChat.chatLogs;
    const smallChunkIdxs = getSmallChunks(this._chunks[type]);
    let tokenCounter = 0;
    
    const chunks: MessageChunk[] = [];

    for (const index of smallChunkIdxs) {
      const chunk = this._chunks[type][index];
      const msg = chatLog.getMsg(type, chunk.msgIdx);

      if (!msg) {
        throw Error("Incorrect msg index, this should never happen.");
      }

      const tokens = chatLog.getMsgTokens(type, chunk.msgIdx);
      if (tokenCounter + tokens > tokenLimit) {
        break;
      }
      chunks.push({
        json: JSON.stringify(msg),
        tokens,
        index
      });
      tokenCounter += tokens;
    }

    return { chunks, tokens: tokenCounter };
  }

  private async _processNewMessages() {
    this._processNewMessagesByType("persistent");
    this._processNewMessagesByType("temporary");
  }

  private _processNewMessagesByType(type: ChatLogType) {
    const messages = this._rawChat.chatLogs.get(type).msgs;

    // If no messages exist
    if (messages.length === 0) {
      return;
    }

    const lastProcessedIdx = getLastProcessedMessageIndex(this._chunks[type]);

    // If we've already processed all messages
    if (lastProcessedIdx === messages.length - 1) {
      return;
    }

    // Process all messages from lastProcessedIdx -> messages.length
    for (let i = lastProcessedIdx + 1; i < messages.length; ++i) {
      const message = messages[i];
      this._processNewMessage(message, i, type);
    }
  }

  private _processNewMessage(message: ChatMessage, msgIdx: number, type: ChatLogType) {

    const newChunks: string[] = [];

    // If the message contains a variable, load the variable's data
    const varName = message.content || "";
    let isVariable = false;

    if (AgentVariables.hasSyntax(varName)) {
      const data = this._variables.get(varName);
      if (data) {
        message.content = data;
        isVariable = true;
      }
    }

    // If the message is large and requires chunking
    if (this._chunker.shouldChunk(message)) {
      // If it was a variable, prepend its name
      if (isVariable) {
        newChunks.push(...this._chunker.chunk(message).map(
          (chunk, index) => variableChunkText(chunk, index, varName)
        ));
      } else {
        newChunks.push(...this._chunker.chunk(message));
      }
    } else {
      newChunks.push(JSON.stringify(message));
    }

    const chunks = this._chunks[type];

    // Save the starting chunk index (used later for document index)
    const startChunkIdx = chunks.length;

    // Add message index pointers for each new chunk
    for (const _ of newChunks) {
      chunks.push({ msgIdx });
    }

    // If we're processing persistent messages,
    // and it isn't a large message, early out
    if (type === "persistent" && newChunks.length === 1) {
      return;
    }

    // Add the chunks to the rag
    this._rags[type].addItems(
      newChunks.map((chunk, index) => ({
        index: startChunkIdx + index,
        tokens: this._rawChat.tokenizer.encode(chunk).length,
        json: chunk
      }))
    );

    return;
  }
}

// Helpers

function getLastProcessedMessageIndex(chunks: Chunk[]): number {
  const lastIdx = chunks.length - 1;

  // Nothing has been processed
  if (lastIdx < 0) {
    return -1;
  }

  // Return the message index of the last metadata
  return chunks[lastIdx].msgIdx;
}

function getSmallChunks(chunks: Chunk[]): ChunkIdx[] {
  const smallChunksIdxs: ChunkIdx[] = [];
  let prevMsgIdx = -1;

  // Iterate through and grab all unique msg indexes.
  // If a msg is not small, it will be chunked,
  // meaning more than one index will exist
  for (let i = 0; i < chunks.length; ++i) {
    const currMsgIdx = chunks[i].msgIdx;
    const nextMsgIdx = i + 1 < chunks.length ? chunks[i + 1] : -1;
    if (currMsgIdx !== prevMsgIdx && currMsgIdx !== nextMsgIdx) {
      // We've found a unique index with no siblings, it is small
      smallChunksIdxs.push(i);
    }
  }

  return smallChunksIdxs;
}

function postProcessMessages(messages: ChatMessage[]): ChatMessage[] {
  const result: ChatMessage[] = [];
  const varChunkPrefix = "Variable \"\${";
  const varNameRegex = /\$\{([^}]+)\}/;
  let prevVarName: undefined | string = undefined;

  for (const message of messages) {

    // Detect variable preview messages
    let varName: undefined | string = undefined;
    if (message.content?.startsWith(varChunkPrefix)) {
      const match = message.content.match(varNameRegex);
      varName = (match && match[1]) || undefined;
    }

    if (varName && prevVarName === varName) {
      // Join this preview with the previous
      const lastMessage = result.at(-1) as ChatMessage;
      lastMessage.content += `\n\n${message.content}`;
      result[result.length - 1] = lastMessage;
    } else {
      result.push(message);
    }

    if (prevVarName && !varName) {
      // Append a helpful message
      const lastMessage = result.at(-1) as ChatMessage;
      lastMessage.content += `\nThe above function result was too large, so it was stored in the variable \"\${${prevVarName}}\".`
    }

    prevVarName = varName;
  }

  return result;
}

function variableChunkText(chunk: string, index: number, varName: string): string {
  const message = JSON.parse(chunk) as ChatMessage;
  return JSON.stringify({
    ...message,
    content: `Variable "${varName}" chunk #${index}\n\`\`\`\n${message.content}\n\`\`\``
  });
}
