import { LocalDocument } from "../embeddings";
import { MessageChunk } from "../llm";
import { Recombiner } from "../rag/StandardRagBuilderV2";

export class MessageRecombiner {
  static standard(
    tokenLimit: number,
  ): Recombiner<MessageChunk, MessageChunk[]> {
    
    return async (results: () => Promise<AsyncGenerator<LocalDocument<{ index: number }>>>, originalItems: MessageChunk[]): Promise<MessageChunk[]> => {
      if (calculateTotalTokens(originalItems) < tokenLimit) {
        return originalItems;
      }
      
      const iterator = await results();

      let messages = [];

      let tokenCount = 0;
      for await (const result of iterator) {
        const index = result.metadata()!.index;
        const msg = originalItems[index];

        if (tokenCount + msg.tokens > tokenLimit) {
          break;
        }

        messages.push(msg);
      }

      return messages
        .sort((a, b) => a.index - b.index);
    };
  }
}

const calculateTotalTokens = (chunks: MessageChunk[]) => {
  return chunks.reduce((acc, chunk) => acc + chunk.tokens, 0);
};