import { EmbeddingApi } from "./EmbeddingApi";
import { normalize, normalizedCosineSimilarity } from "./utils";
import { LocalDocumentStore } from "./LocalDocumentStore";
import { LocalDocument } from "./LocalDocument";
import { Workspace } from "../sys";
import path from "path-browserify";

export class LocalCollection {
  private documentStore: LocalDocumentStore;

  constructor(
    public readonly uri: string,
    private embeddingApi: EmbeddingApi,
    private workspace: Workspace
  ) {
    this.documentStore = new LocalDocumentStore(this.workspace, uri);
  }

  get name(): string {
    return path.basename(this.uri);
  }

  async add(items: string[]): Promise<void>{
    if (!items.length) {
      return;
    }

    const results = await this.embeddingApi.createEmbeddings(items)

    for await (const result of results) {
      this.documentStore.add({
        text: result.input,
        vector: result.embedding,
      })
    }
  }

  async search(query: string, limit: number): Promise<LocalDocument[]> {
    const queryEmbeddingResults = await this.embeddingApi.createEmbeddings(query);
    const queryVector = queryEmbeddingResults[0].embedding;
    const normalizedQueryVector = normalize(queryVector);

    const documents = this.documentStore.list();

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

  async searchUnique(query: string, limit: number): Promise<LocalDocument[]> {
    const queryEmbeddingResults = await this.embeddingApi.createEmbeddings(query);
    const queryVector = queryEmbeddingResults[0].embedding;
    const normalizedQueryVector = normalize(queryVector);

    const documents = this.documentStore.list();

    const distances = documents.map(document => {
      const vector = document.vector();
      const normalizedVector = normalize(vector);

      const distance = normalizedCosineSimilarity(queryVector, normalizedQueryVector, vector, normalizedVector);
      return { document, distance, text: document.text() };
    })

    const sortedDistances = [...new Map(distances.map(x =>
      [x.text, x])).values()]
      .sort((a, b) => b.distance - a.distance);
    
    const topDistances = sortedDistances.slice(0, limit);

    const results = topDistances.map(({ document }) => {
      return document
    })

    return results;
  }

  save(): void {
    this.workspace.mkdirSync(this.uri, { recursive: true });
  }

  delete(): void {
    this.workspace.rmdirSync(this.uri, { recursive: true });
  }
}
