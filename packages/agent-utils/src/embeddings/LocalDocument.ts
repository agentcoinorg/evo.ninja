import path from "path-browserify";
import { Workspace } from "../sys";

const VECTOR_FILENAME = "vector.json"
const DOCUMENT_FILENAME = "document.json"

export class LocalDocument {
  constructor(
    readonly id: string,
    private config: {
      uri: string,
      workspace: Workspace,
    }
  ) {}

  vector(): number[] {
    const vectorPath = path.join(this.config.uri, VECTOR_FILENAME)

    if (!this.config.workspace.existsSync(vectorPath)) {
      throw new Error(`Vector file for '${this.id}' does not exist: ${vectorPath}. Did you forget to call .save()?`)
    }

    const vectorFileContent = this.config.workspace.readFileSync(vectorPath)
    const vector: { id: string; vector: number[]; } = JSON.parse(vectorFileContent)

    return vector.vector
  }

  text(): string {
    const documentPath = path.join(this.config.uri, DOCUMENT_FILENAME)

    if (!this.config.workspace.existsSync(documentPath)) {
      throw new Error(`Document file for '${this.id}' does not exist: ${documentPath}. Did you forget to call .save()?`)
    }

    const documentFileContent = this.config.workspace.readFileSync(documentPath)
    const document: { id: string; text: string; } = JSON.parse(documentFileContent)

    return document.text
  }

  save({
    text,
    vector,
  }: { text: string, vector: number[] }): void {
    const docPath = this.config.uri

    const vectorPath = path.join(docPath, VECTOR_FILENAME)
    const documentPath = path.join(docPath, DOCUMENT_FILENAME)

    if (!this.config.workspace.existsSync(docPath)) {
      this.config.workspace.mkdirSync(docPath, { recursive: true });
    }

    this.config.workspace.writeFileSync(vectorPath, JSON.stringify({
      id: this.id,
      vector,
    }))

    this.config.workspace.writeFileSync(documentPath, JSON.stringify({
      id: this.id,
      text,
    }))
  }
}