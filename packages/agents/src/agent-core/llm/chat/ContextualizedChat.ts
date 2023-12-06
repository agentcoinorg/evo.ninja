import {
  Chat,
  ChatLogType,
  ChatMessage
} from ".";
import {
  MessageChunker,
  BaseDocumentMetadata,
  AgentVariables,
  PriorityContainer
} from "../../";

import { Rag } from "../../rag/Rag";
import { AgentContext } from "../../agent/AgentContext";
import { StandardRagBuilder } from "../../rag/StandardRagBuilder";
import { MessageRecombiner } from "../../chunking/MessageRecombiner";

export type MsgIdx = number;

interface Chunk {
  msgIdx: MsgIdx;
}

export type ChunkIdx = number;

export type MessageChunk = {
  json: string;
  tokens: number;
  chunkIdx: ChunkIdx;
  msgIdx: MsgIdx;
};

export class ContextualizedChat {

  private _chunks: Record<ChatLogType, Chunk[]> = {
    "persistent": [],
    "temporary": []
  };

  private _rags: Record<ChatLogType, StandardRagBuilder<MessageChunk>>;

  private _functionCallResultFirstChunks: Record<ChunkIdx, {
    text: string,
    metadata: BaseDocumentMetadata
  }> = {};

  private _lastTwoMsgs: Record<ChatLogType, PriorityContainer<ChunkIdx>> = {
    "persistent": new PriorityContainer(2, (a, b) => b - a),
    "temporary": new PriorityContainer(2, (a, b) => b - a),
  };

  constructor(
    _context: AgentContext,
    private _rawChat: Chat,
    private _chunker: MessageChunker,
    private _variables: AgentVariables
  ) {
    this._rags = {
      persistent: Rag.standard<MessageChunk>(_context)
        .selector(x => x.json),
      temporary: Rag.standard<MessageChunk>(_context)
        .selector(x => x.json)  
    };
  }

  get rawChat(): Chat {
    return this._rawChat;
  }

  async contextualize(contextVector: number[], tokenLimits: Record<ChatLogType, number>): Promise<Chat> {
    // Ensure all new messages have been processed
    this._processNewMessages();

    const persistentLargeChunks = await this._rags["persistent"]
      .query(contextVector)
      .recombine(MessageRecombiner.standard(
        tokenLimits["persistent"],
        this._rawChat.chatLogs,
        "persistent",
        this._lastTwoMsgs["persistent"].getItems()
      ));

    const temporaryChunks = await this._rags["temporary"]
      .query(contextVector)
      .recombine(MessageRecombiner.standard(
        tokenLimits["temporary"],
        this._rawChat.chatLogs,
        "temporary",
        this._lastTwoMsgs["temporary"].getItems()
      ));

    // Sort persistent and temporary chunks
    const sorted = {
      persistent: persistentLargeChunks.map((x) => JSON.parse(x.json) as ChatMessage),
      temporary: temporaryChunks.map((x) => JSON.parse(x.json) as ChatMessage)
    };

    // Post-process the resulting message log,
    // allowing us to (for example) join variable previews
    sorted.persistent = postProcessMessages(sorted.persistent);
    sorted.temporary = postProcessMessages(sorted.temporary);

    const chat = this._rawChat.cloneEmpty();
    await chat.persistent(sorted.persistent);
    await chat.temporary(sorted.temporary);
    return chat;
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
      if (isVariable) {
        newChunks.push(variableChunkText(message, 0, varName));
      } else {
        newChunks.push(JSON.stringify(message));
      }
    }

    const chunks = this._chunks[type];

    // Save the starting chunk index (used later for document index)
    const startChunkIdx = chunks.length;

    // Add message index pointers for each new chunk
    for (const _ of newChunks) {
      chunks.push({ msgIdx });
    }

    // Add the chunks to the rag
    this._rags[type].addItems(
      newChunks.map((chunk, index) => ({
        chunkIdx: startChunkIdx + index,
        msgIdx,
        tokens: this._rawChat.tokenizer.encode(chunk).length,
        json: chunk
      }))
    );

    // If the message is a function call or result,
    // store the first chunk's text so we can easily retrieve it
    if (message.role === "function" || "function_call" in message) {
        this._functionCallResultFirstChunks[startChunkIdx] = {
        text: newChunks[0],
        metadata: { index: startChunkIdx }
      };
    }

    // Keep track of the 2 most recent messages
    this._lastTwoMsgs[type].addItem(startChunkIdx);

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

function variableChunkText(chunk: string | ChatMessage, index: number, varName: string): string {
  const message = typeof chunk === "string" ? JSON.parse(chunk) as ChatMessage : chunk;
  return JSON.stringify({
    ...message,
    content: `Variable "${varName}" chunk #${index}\n\`\`\`\n${message.content}\n\`\`\``
  });
}
