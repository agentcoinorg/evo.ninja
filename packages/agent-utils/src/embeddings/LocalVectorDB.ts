import { EmbeddingApi } from "./EmbeddingApi";
import { normalize, normalizedCosineSimilarity } from "./utils";
import { LocalDocumentStore } from "./LocalDocumentStore";
import { LocalDocument } from "./LocalDocument";

export class LocalVectorDB {
  constructor(
    private embeddingApi: EmbeddingApi,
    private store: LocalDocumentStore,
  ) {}

  async add(items: {
    text: string
  }[]): Promise<void> {
    const itemTexts = items.map(item => item.text);
    const results = await this.embeddingApi.createEmbeddings(itemTexts)

    for await (const result of results) {
      this.store.add({
        text: result.input,
        vector: result.embedding,
      })
    }
  }

  async search(query: string, limit: number): Promise<LocalDocument[]> {
    const queryEmbeddingResults = await this.embeddingApi.createEmbeddings(query);
    const queryVector = queryEmbeddingResults[0].embedding;
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