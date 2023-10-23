import { ChatMessage } from "../llm";
import { Chunker } from "./Chunker";
import { chunkByCharacters } from "./CharactersChunker";

export class MessageChunker implements Chunker<ChatMessage> {
  constructor(private readonly config: { maxChunkSize: number }) { }

  shouldChunk(message: ChatMessage): boolean {
    return JSON.stringify(message).length > this.config.maxChunkSize;
  }

  chunk(message: ChatMessage): string[] {
    return chunkByCharacters(
      message.content || "",
      this.config.maxChunkSize,
      0.08 * this.config.maxChunkSize
    ).map((chunk) => (JSON.stringify({
      ...message,
      content: chunk
    })));
  }
}
