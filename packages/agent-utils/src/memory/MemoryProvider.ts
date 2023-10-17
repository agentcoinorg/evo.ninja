import { EmbeddingApi } from "./EmbeddingApi";
import { v4 as uuid } from "uuid";
import { normalize, normalizedCosineSimilarity } from "./utils";
import { DBStore } from "./DBStore";

export class MemoryProvider {
  constructor(
    private embeddingApi: EmbeddingApi,
    private store: DBStore
  ) {}

  async add(items: string[]) {
    await Promise.all(
      items.map(async item => {
        const embeddingsResult = await this.embeddingApi.createEmbedding(item)
        const index = {
          id: uuid(),
          text: item,
          vector: embeddingsResult.embedding,
        }
        this.store.add(index)
      })
    )
  }

  async search(query: string, limit: number): Promise<string[]> {
    const queryEmbeddingResponse = await this.embeddingApi.createEmbedding(query);
    const queryVector = queryEmbeddingResponse.embedding;
    const normalizedQueryVector = normalize(queryVector);

    const indexes = this.store.list();

    const distances = indexes.map(index => {
      const vector = this.store.getVector(index);
      const normalizedVector = normalize(vector);

      const distance = normalizedCosineSimilarity(queryVector, normalizedQueryVector, vector, normalizedVector);
      return { index, distance };
    })

    const sortedDistances = distances.sort((a, b) => b.distance - a.distance);
    const topDistances = sortedDistances.slice(0, limit);

    const results = topDistances.map(distance => {
      return this.store.getDocument(distance.index)
    })

    return results;
  }
}