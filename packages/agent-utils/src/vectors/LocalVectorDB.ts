import { EmbeddingApi } from "./EmbeddingApi";
import { normalize, normalizedCosineSimilarity } from "./utils";
import { LocalDocumentStore } from "./LocalDocumentStore";
import { LocalDocument } from "./LocalDocument";

export class LocalVectorDB {
  constructor(
    private embeddingApi: EmbeddingApi,
    private store: LocalDocumentStore,
  ) {}

  async add(item: {
    text: string,
    metadata?: Record<string, any>,
  }): Promise<void> {
    const embeddingsResult = await this.embeddingApi.createEmbeddings(item.text)
    this.store.add({
      text: item.text,
      vector: embeddingsResult.embeddings[0].embedding,
      metadata: item.metadata,
    })
  }

  async bulkAdd(items: {
    text: string,
    metadata?: Record<string, any>,
  }[]): Promise<void> {
    const itemTexts = items.map(item => item.text);
    const { embeddings } = await this.embeddingApi.createEmbeddings(itemTexts)

    let i = 0;

    for await (const { embedding } of embeddings) {
      this.store.add({
        text: items[i].text,
        vector: embedding,
        metadata: items[i].metadata,
      })

      i++;
    }
  }

  async search(query: string, limit: number): Promise<LocalDocument[]> {
    const queryEmbeddingResponse = await this.embeddingApi.createEmbeddings(query);
    const queryVector = queryEmbeddingResponse.embeddings[0].embedding;
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