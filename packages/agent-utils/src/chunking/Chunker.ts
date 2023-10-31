export interface Chunker<TInput = string> {
  chunk(input: TInput): string[];
}
