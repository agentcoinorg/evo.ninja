export interface EmbeddingCreationResult {
  embeddings: { embedding: number[] }[];
  model: string;
  promptTokensUsed: number,
  totalTokensUsed: number
}

export interface EmbeddingApi {
  createEmbeddings: (input: string | string[]) => Promise<EmbeddingCreationResult>
}
