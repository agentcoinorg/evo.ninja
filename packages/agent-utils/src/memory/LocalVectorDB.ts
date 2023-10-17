import { EmbeddingApi } from "./EmbeddingApi";
import { normalize, normalizedCosineSimilarity } from "./utils";
import { LocalDocumentStore } from "./LocalDocumentStore";
import { LocalDocument } from "./LocalDocument";

export class LocalVectorDB {
  constructor(
    private embeddingApi: EmbeddingApi,
    private store: LocalDocumentStore
  ) {}

  async add(items: {
    text: string,
    metadata?: Record<string, any>,
  }[]) {
    await Promise.all(
      items.map(async ({ text, metadata }) => {
        const embeddingsResult = await this.embeddingApi.createEmbedding(text)
        this.store.add({
          text: text,
          vector: embeddingsResult.embedding,
          metadata,
        })
      })
    )
  }

  async search(query: string, limit: number): Promise<LocalDocument[]> {
    const queryEmbeddingResponse = await this.embeddingApi.createEmbedding(query);
    const queryVector = queryEmbeddingResponse.embedding;
    const normalizedQueryVector = normalize(queryVector);

    const documents = this.store.list();

    const distances = documents.map(document => {
      const vector = document.vector();
      const normalizedVector = normalize(vector);

      const distance = normalizedCosineSimilarity(queryVector, normalizedQueryVector, vector, normalizedVector);
      return { document, distance };
    })

    const sortedDistances = distances.sort((a, b) => b.distance - a.distance);
    const topDistances = sortedDistances.slice(0, limit);

    const results = topDistances.map(({ document }) => {
      return document
    })

    return results;
  }
}