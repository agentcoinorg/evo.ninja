import { Workspace } from "../sys";
import path from "path-browserify";
import { v4 as uuid } from "uuid";
import { DocumentMetadata, LocalDocument } from "./LocalDocument";

export class LocalDocumentStore {
  constructor(
    private workspace: Workspace,
    private uri: string
  ) {}

  add(data: { text: string, vector: number[], metadata?: DocumentMetadata }): LocalDocument {
    const id = uuid()

    const document = new LocalDocument(id, {
      uri: path.join(this.uri, id),
      workspace: this.workspace,
    })

    document.save({
      text: data.text,
      vector: data.vector,
      metadata: data.metadata,
    })
    return document
  }

  list(): LocalDocument[] {
    const ids = this.workspace.readdirSync(this.uri)
    return ids.map(id => new LocalDocument(id, {
      uri: path.join(this.uri, id),
      workspace: this.workspace,
    }))
  }
}