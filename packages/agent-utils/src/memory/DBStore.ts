import { Workspace } from "../sys";
import path from "path-browserify";

interface Index {
  id: string;
  text: string;
  vector: number[];
}

const VECTOR_DOC_NAME = "vector.json"
const DOCUMENT_DOC_NAME = "document.json"

export class DBStore {
  constructor(
    private workspace: Workspace,
    private uri: string
  ) {}

  add(index: Index) {
    const { vector, ...indexData } = index;
    const indexPath = path.join(this.uri, index.id)

    const vectorPath = path.join(indexPath, VECTOR_DOC_NAME)
    const documentPath = path.join(indexPath, DOCUMENT_DOC_NAME)

    this.workspace.writeFileSync(vectorPath, JSON.stringify({
      id: index.id,
      vector,
    }))
    this.workspace.writeFileSync(documentPath, JSON.stringify({
      ...indexData,
    }))
  }

  list(): string[] {
    return this.workspace.readdirSync(this.uri)
  }

  getVector(id: string): number[] {
    const vectorPath = path.join(this.uri, id, VECTOR_DOC_NAME)
    const vectorFileContent = this.workspace.readFileSync(vectorPath)
    const vector = JSON.parse(vectorFileContent)

    return vector
  }

  getDocument(id: string): string {
    const documentPath = path.join(this.uri, id, DOCUMENT_DOC_NAME)
    const documentFileContent = this.workspace.readFileSync(documentPath)
    const document: { id: string; text: string; } = JSON.parse(documentFileContent)

    return document.text
  }
}