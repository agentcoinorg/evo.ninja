import { LocalDocument } from "../embeddings";
import {
  MessageChunk,
  MsgIdx,
  ChunkIdx,
  ChatMessage,
  ChatLogs,
  ChatLogType,
} from "../llm";
import { Recombiner } from "../rag/StandardRagBuilder";

export class MessageRecombiner {
  static standard(
    tokenLimit: number,
    chatLogs: ChatLogs,
    chatLogType: ChatLogType,
    initChunks: ChunkIdx[]
  ): Recombiner<MessageChunk, MessageChunk[]> {
    return async (
      results: () => Promise<AsyncGenerator<LocalDocument<{ index: number }>>>,
      originalItems: MessageChunk[]
    ): Promise<MessageChunk[]> => {
      if (calculateTotalTokens(originalItems) < tokenLimit) {
        return originalItems;
      }

      const chunks: MessageChunk[] = [];
      const chunksAdded: Set<ChunkIdx> = new Set();
      const msgsAdded: Record<MsgIdx, number> = {};
      let tokenCount = 0;
      const canAddTokens = (tokens: number) =>
        tokenCount + tokens <= tokenLimit;

      const addChunk = (
        chunkIdx: ChunkIdx,
        recursive: boolean = false
      ): boolean => {
        const chunk = originalItems[chunkIdx];

        // Only add a chunk once
        if (chunksAdded.has(chunkIdx)) {
          return true;
        } else {
          chunksAdded.add(chunkIdx);
        }

        // Break if we're over the token limit
        if (!canAddTokens(chunk.tokens)) {
          return false;
        }

        // Only add up to 4 chunks per message
        if (!msgsAdded[chunk.msgIdx]) {
          msgsAdded[chunk.msgIdx] = 0;
        }
        if (msgsAdded[chunk.msgIdx] >= 4) {
          return true;
        }
        msgsAdded[chunk.msgIdx] += 1;

        chunks.push(chunk);
        tokenCount += chunk.tokens;

        // Ensure that the first chunk is always added
        const firstChunkIdx = originalItems
          .slice(0, chunkIdx)
          .findIndex((item) => item.msgIdx === chunk.msgIdx);

        if (firstChunkIdx !== -1) {
          addChunk(firstChunkIdx);
        }

        // Ensure that function call + result messages
        // are always added as a pair to the chat
        if (!recursive) {
          const funcPairChunk = tryGetFunctionMessagePair(
            chunk,
            chunkIdx,
            originalItems,
            chatLogs,
            chatLogType
          );
          if (funcPairChunk) {
            return addChunk(funcPairChunk, true);
          }
        }

        return true;
      };

      const iterator = await results();

      if (chatLogType === "persistent") {
        // Add all small persistent chunks
        const smallPersistentChunks = [];
        let lastMsgIndex = -1;
        for (const chunk of originalItems) {
          if (chunk.msgIdx !== lastMsgIndex) {
            smallPersistentChunks.push(chunk);
            lastMsgIndex = chunk.msgIdx;
          } else {
            smallPersistentChunks.pop();
            break;
          }
        }

        for (const chunk of smallPersistentChunks) {
          addChunk(chunk.chunkIdx);
        }
      }

      // Add any initial chunks
      for (const chunk of initChunks) {
        addChunk(chunk);
      }

      for await (const result of iterator) {
        const chunkIdx = result.metadata().index;
        addChunk(chunkIdx);
      }

      return chunks.sort((a, b) => a.chunkIdx - b.chunkIdx);
    };
  }
}

const calculateTotalTokens = (chunks: MessageChunk[]) => {
  return chunks.reduce((acc, chunk) => acc + chunk.tokens, 0);
};

const tryGetFunctionMessagePair = (
  chunk: MessageChunk,
  chunkIdx: ChunkIdx,
  originalItems: MessageChunk[],
  chatLogs: ChatLogs,
  chatLogType: ChatLogType
): ChunkIdx | undefined => {
  const msg = JSON.parse(chunk.json) as ChatMessage;

  if (
    (msg.role === "assistant" && msg.function_call) ||
    msg.role === "function"
  ) {
    // Ensure function call + results are always added together.
    // We must traverse the chunk array to find the nearest neighbor
    const direction = msg.role === "assistant" ? 1 : -1;
    const search = msg.role === "assistant" ? "function" : "assistant";
    let funcChunkIdx: number | undefined = undefined;
    let nextChunkIdx = chunkIdx + direction;

    while (!funcChunkIdx) {
      if (originalItems.length >= nextChunkIdx || nextChunkIdx < 0) {
        break;
      }

      const msg = chatLogs.getMsg(
        chatLogType,
        originalItems[nextChunkIdx].msgIdx
      );

      if (msg?.role === search) {
        // We found it
        funcChunkIdx = nextChunkIdx;
      } else {
        nextChunkIdx += direction;
      }
    }

    if (funcChunkIdx) {
      return funcChunkIdx;
    }
  }

  return undefined;
};
