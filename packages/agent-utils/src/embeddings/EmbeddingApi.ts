export interface EmbeddingCreationResult {
  embedding: number[];
  input: string;
}

export interface EmbeddingApi {
  createEmbeddings: (
    input: string | string[]
  ) => Promise<EmbeddingCreationResult[]>;
}
