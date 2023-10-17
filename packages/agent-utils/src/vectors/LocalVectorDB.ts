import { EmbeddingApi } from "./EmbeddingApi";
import { normalize, normalizedCosineSimilarity } from "./utils";
import { LocalDocumentStore } from "./LocalDocumentStore";
import { LocalDocument } from "./LocalDocument";

export class LocalVectorDB {
  constructor(
    private embeddingApi: EmbeddingApi,
    private store: LocalDocumentStore,
    private config: {
      maxParallelRequests: number,
    }
  ) {}

  async add(item: {
    text: string,
    metadata?: Record<string, any>,
  }): Promise<void> {
    const embeddingsResult = await this.embeddingApi.createEmbedding(item.text)
    this.store.add({
      text: item.text,
      vector: embeddingsResult.embedding,
      metadata: item.metadata,
    })
  }

  async bulkAdd(items: {
    text: string,
    metadata?: Record<string, any>,
  }[]): Promise<void> {
    const batches = this.separateInBatches(items, this.config.maxParallelRequests)

    for await (const batch of batches) {
      await Promise.all(
        batch.map(async ({ text, metadata }) => this.add({ text, metadata }))
      )
    }
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

  private separateInBatches<T>(items: T[], batchSize: number): T[][] {
    return Array.from(
      {
        length: Math.ceil(items.length / batchSize)
      },
      (_, index) => items.slice(index * batchSize, index * batchSize + batchSize)
    );
  }
}