export interface EmbeddingCreationResult {
  embedding: number[];
  model: string;
  promptTokensUsed: number,
  totalTokensUsed: number
}

export interface EmbeddingApi {
  createEmbedding: (text: string) => Promise<EmbeddingCreationResult>
}
