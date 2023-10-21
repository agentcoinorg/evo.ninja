import { cleanWhitespace } from "./cleanWhitespace";

export class TextChunker {
  static singleLine(content: string): string[] {
    const lines = cleanWhitespace(content).split("\n");
    return lines;
  }

  static multiLines(content: string, linesPerChunk: number): string[] {
    const lines = cleanWhitespace(content).split("\n");
    const chunks = [];
    for (let i = 0; i < lines.length; i += linesPerChunk) {
      chunks.push(lines.slice(i, i + linesPerChunk).join("\n"));
    }
    return chunks;
  }

  static characters(content: string, characterLimit: number): string[] {
    const trimmedContent = cleanWhitespace(content);
    const chunks = [];
    let currentChunk = "";
    for (const char of trimmedContent) {
      if (currentChunk.length + 1 > characterLimit) {
        chunks.push(currentChunk);
        currentChunk = "";
      }
      currentChunk += char;
    }
    return chunks;
  }

  static words(content: string, characterLimit: number): string[] {
    const trimmedContent = cleanWhitespace(content);
    const chunks = [];
    let currentChunk = "";
    for (const word of trimmedContent.split(" ")) {
      if (currentChunk.length + word.length > characterLimit) {
        chunks.push(currentChunk);
        currentChunk = "";
      }
      currentChunk += word;
    }
    return chunks;
  }
}
