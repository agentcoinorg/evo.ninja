export interface Chunker {
  chunk(text: string): string[];
}