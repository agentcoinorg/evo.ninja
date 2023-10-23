import {
  Chat,
  ChatLogType,
  ChatMessage,
  MessageChunker,
  LocalVectorDB,
  LocalCollection
} from "@evo-ninja/agent-utils";
import { v4 as uuid } from "uuid";

type MsgPtr = number;

interface ChunkMetadata {
  msgPtr: MsgPtr;
}

type ChunkMetadataPtr = number;

interface DocumentMetadata {
  chunkMetadataPtr: ChunkMetadataPtr;
  tokens: number;
}

export class ContextualizedChat {

  private _chunkMetadata: Record<ChatLogType, ChunkMetadata[]> = {
    "persistent": [],
    "temporary": []
  };

  private _collections: Record<ChatLogType, LocalCollection<DocumentMetadata>>;

  constructor(
    private _chat: Chat,
    private _chunker: MessageChunker,
    db: LocalVectorDB
  ) {
    this._collections = {
      persistent: db.addCollection<DocumentMetadata>(uuid()),
      temporary: db.addCollection<DocumentMetadata>(uuid())
    };
  }

  get rawChat(): Chat {
    return this._chat;
  }

  async contextualize(context: string, tokenLimits: Record<ChatLogType, number>): Promise<Chat> {
    // Ensure all new messages have been processed
    await this._processNewMessages();

    // Aggregate all "persistent" messages
    const persistentSmallMsgs = this._aggregateSmallMsgs(
      "persistent",
      tokenLimits["persistent"]
    );
    const persistentLargeMsgs = await this._contextualizeMsgs(
      context,
      "persistent",
      tokenLimits["persistent"] - persistentSmallMsgs.tokens
    );

    // join persistent msgs
    const persistentMsgs = {
      msgs: [...persistentSmallMsgs.msgs, ...persistentLargeMsgs.msgs],
      token: persistentSmallMsgs.tokens + persistentLargeMsgs.tokens
    };

    // Aggregate all "temporary" messages
    const temporaryMsgs = await this._contextualizeMsgs(
      context,
      "temporary",
      tokenLimits["temporary"]
    );

    // Sort persistent and temporary messages
    const sorted = {
      persistent: persistentMsgs.msgs.sort(
        (a, b) => a.chunkMetadataPtr - b.chunkMetadataPtr
      ).map((x) => x.msg),
      temporary: temporaryMsgs.msgs.sort(
        (a, b) => a.chunkMetadataPtr - b.chunkMetadataPtr
      ).map((x) => x.msg)
    };

    const chat = this._chat.cloneEmpty();
    chat.add("persistent", sorted.persistent);
    chat.add("temporary", sorted.temporary);
    return chat;
  }

  private _aggregateSmallMsgs(type: ChatLogType, tokenLimit: number): {
    msgs: {
      msg: ChatMessage;
      chunkMetadataPtr: ChunkMetadataPtr;
    }[];
    tokens: number;
  } {
    const msgs: {
      msg: ChatMessage;
      chunkMetadataPtr: ChunkMetadataPtr;
    }[] = [];
    const chatLog = this._chat.chatLogs;
    const smallMsgMetadataPtrs = this._getSmallMsgs(type);
    let tokenCounter = 0;

    const addMsg = (chunkMetadataPtr: ChunkMetadataPtr): boolean => {
      const chunkMetadata = this._chunkMetadata[type][chunkMetadataPtr];
      const msgPtr = chunkMetadata.msgPtr;
      const msg = chatLog.getMsg(type, msgPtr);

      if (!msg) {
        throw Error("Incorrect msg index, this should never happen.");
      }

      const tokens = chatLog.getMsgTokens(type, msgPtr);
      if (tokenCounter + tokens > tokenLimit) {
        return false;
      }
      msgs.push({ msg, chunkMetadataPtr });
      tokenCounter += tokens;
      return true;
    };

    for (const smallMsgMetadataPtr of smallMsgMetadataPtrs) {
      const added = addMsg(smallMsgMetadataPtr);
      if (!added) {
        break;
      }
    }

    return {
      msgs,
      tokens: tokenCounter
    };
  }

  private async _contextualizeMsgs(
    context: string,
    type: ChatLogType,
    tokenLimit: number
  ): Promise<{
    msgs: {
      msg: ChatMessage;
      chunkMetadataPtr: ChunkMetadataPtr;
    }[];
    tokens: number;
  }> {
    // Search the collection for relevant msgs
    const results = await this._collections[type].search(context, -1);

    // Aggregate as many as possible
    const msgs: {
      msg: ChatMessage;
      chunkMetadataPtr: ChunkMetadataPtr;
    }[] = [];
    let tokenCounter = 0;

    const addMsg = (chunkText: string, metadata: DocumentMetadata): boolean => {
      if (tokenCounter + metadata.tokens > tokenLimit) {
        return false;
      }

      const chunkMetadataPtr = metadata.chunkMetadataPtr;

      const msg = JSON.parse(chunkText) as ChatMessage;
      msgs.push({ msg, chunkMetadataPtr });
      tokenCounter += metadata.tokens;
      return true;
    }

    for (const result of results) {
      const chunkText = result.text();
      const chunkMetadata = result.metadata();

      if (!chunkMetadata) {
        throw Error("chunkmetadata is missing, this should never happen")
      }

      if (!addMsg(chunkText, chunkMetadata)) {
        break;
      }
    }

    return {
      msgs,
      tokens: tokenCounter
    };
  }

  private async _processNewMessages(): Promise<void> {
    // ensure all new messages have been processed
    await this._processNewMessagesByType("persistent");
    await this._processNewMessagesByType("temporary");
  }

  private async _processNewMessagesByType(type: ChatLogType): Promise<void> {
    const messages = this._chat.chatLogs.get(type).msgs;

    // If no messages exist
    if (messages.length === 0) {
      return Promise.resolve();
    }

    const lastProcessedIdx = this._getLastProcessedMessageIndex(type);

    // If we've already processed all messages
    if (lastProcessedIdx === messages.length - 1) {
      return Promise.resolve();
    }

    // Process all messages from lastProcessedIdx -> messages.length
    for (let i = lastProcessedIdx + 1; i < messages.length; ++i) {
      const message = messages[i];
      await this._processNewMessage(message, i, type);
    }
  }

  private async _processNewMessage(message: ChatMessage, msgPtr: number, type: ChatLogType): Promise<void> {

    const chunks: string[] = [];

    // If the message is large and requires chunking
    if (this._chunker.shouldChunk(message)) { 
      chunks.push(...this._chunker.chunk(message));
    } else {
      // TODO: should this be what is used for embedding?
      //       should we instead just extract the values of the struct?
      chunks.push(JSON.stringify(message));
    }

    const chunkMetadata = this._chunkMetadata[type];

    // Save the starting chunk index (used later for document index)
    const startChunkIdx = chunkMetadata.length;

    // Add message index pointers for each new chunk
    for (const _ of chunks) {
      chunkMetadata.push({
        msgPtr
      });
    }

    // If we're processing persistent messages,
    // and it isn't a large message, early out
    if (type === "persistent" && chunks.length === 1) {
      return Promise.resolve();
    }

    // Create an array of chunk document metadata
    const metadatas: DocumentMetadata[] = chunks.map((chunk, index) => ({
      chunkMetadataPtr: startChunkIdx + index,
      tokens: this._chat.tokenizer.encode(chunk).length
    }));

    // Add the chunks to the vectordb collection
    await this._collections[type].add(chunks, metadatas);

    return Promise.resolve();
  }

  private _getLastProcessedMessageIndex(type: ChatLogType): number {
    const chunkMsgPtrs = this._chunkMetadata[type];
    const lastIdx = chunkMsgPtrs.length - 1;

    // Nothing has been processed
    if (lastIdx < 0) {
      return -1;
    }

    // Return the message index of the last metadata
    return chunkMsgPtrs[lastIdx].msgPtr;
  }

  private _getSmallMsgs(type: ChatLogType): ChunkMetadataPtr[] {
    const chunkMetadataPtrs: ChunkMetadataPtr[] = [];
    const chunkMetadata = this._chunkMetadata[type];
    let prevMsgPtr = -1;

    // Iterate through and grab all unique msg ptrs.
    // If a msg is not small, it will be chunked,
    // meaning more than one ptr will exist
    for (let i = 0; i < chunkMetadata.length; ++i) {
      const currMsgPtr = chunkMetadata[i].msgPtr;
      const nextMsgPtr = i + 1 < chunkMetadata.length ? chunkMetadata[i + 1] : -1;
      if (currMsgPtr !== prevMsgPtr && currMsgPtr !== nextMsgPtr) {
        // We've found a unique ptr with no siblings, it is small
        chunkMetadataPtrs.push(i);
      }
    }

    return chunkMetadataPtrs;
  }
}
