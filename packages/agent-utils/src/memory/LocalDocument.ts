import path from "path-browserify";
import { Workspace } from "../sys";

const VECTOR_FILENAME = "vector.json"
const METADATA_FILENAME = "metadata.json"
const DOCUMENT_FILENAME = "document.json"

export type DocumentMetadata = Record<string, any>

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

  metadata(): Record<string, any> | undefined {
    const metadataPath = path.join(this.config.uri, METADATA_FILENAME)

    if (!this.config.workspace.existsSync(metadataPath)) {
      return undefined;
    }

    const metadataFileContent = this.config.workspace.readFileSync(metadataPath)
    const metadataContent: { id: string; metadata: DocumentMetadata; } = JSON.parse(metadataFileContent)

    return metadataContent.metadata
  }

  save({
    text,
    vector,
    metadata,
  }: { text: string, vector: number[], metadata?: DocumentMetadata }) {
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

    if (metadata) {
      const metadataPath = path.join(docPath, METADATA_FILENAME)
      this.config.workspace.writeFileSync(metadataPath, JSON.stringify({
        id: this.id,
        metadata,
      }))
    }
  }
}