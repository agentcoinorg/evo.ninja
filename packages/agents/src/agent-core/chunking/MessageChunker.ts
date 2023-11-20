import { ChatMessage } from "../llm";
import { Chunker } from "./Chunker";
import { TextChunker } from "./TextChunker";

export class MessageChunker implements Chunker<ChatMessage> {
  constructor(private readonly config: { maxChunkSize: number }) { }

  shouldChunk(message: ChatMessage): boolean {
    return JSON.stringify(message.content).length > this.config.maxChunkSize;
  }

  chunk(message: ChatMessage): string[] {
    return TextChunker.fixedCharacterLength(
      message.content || "",
      { 
        chunkLength: this.config.maxChunkSize,
        overlap: 0.08 * this.config.maxChunkSize
      }
    ).map((chunk) => (JSON.stringify({
      ...message,
      content: chunk
    })));
  }
}
