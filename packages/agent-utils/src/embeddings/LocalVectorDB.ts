import { Workspace } from "../sys";
import { LocalCollection } from "./LocalCollection";
import { EmbeddingApi } from "./EmbeddingApi";
import path from "path-browserify";
import { BaseDocumentMetadata } from "./LocalDocument";

export class LocalVectorDB {
  constructor(
    private workspace: Workspace,
    private uri: string,
    private embeddingApi: EmbeddingApi,
  ) {}

  addCollection<TMetadata>(name: string): LocalCollection<TMetadata> {
    const collection = new LocalCollection<TMetadata>(
      path.join(this.uri, name),
      this.embeddingApi,
      this.workspace,
    )

    collection.save()
    return collection
  }

  removeCollection(name: string): void {
    try {

      const collection = new LocalCollection(
        path.join(this.uri, name),
        this.embeddingApi,
        this.workspace,
      )
  
      collection.delete();
    } catch {}
  }

  listCollections<TMetadata extends BaseDocumentMetadata = BaseDocumentMetadata>(): LocalCollection<TMetadata>[] {
    const names = this.workspace.readdirSync(this.uri).map(entry => entry.name)
    return names.map(name => new LocalCollection(
      path.join(this.uri, name),
      this.embeddingApi,
      this.workspace,
    ))
  }
}