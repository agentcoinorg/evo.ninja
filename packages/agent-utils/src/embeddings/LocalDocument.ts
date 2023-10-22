import path from "path-browserify";
import { Workspace } from "../sys";

const VECTOR_FILENAME = "vector.json"
const DOCUMENT_FILENAME = "document.json"

export interface LocalDocumentData {
  id: string;
  text: string;
  metadata: {
    index: number;
  }
}

export class LocalDocument {
  private _data: LocalDocumentData;

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
    if (!this._data) {
      this.loadData()
    }

    return this._data.text
  }

  metadata(): LocalDocumentData['metadata'] {
    if (!this._data) {
      this.loadData()
    }

    return this._data.metadata
  }

  save({
    text,
    vector,
    index
  }: { text: string, vector: number[]; index: number }): void {
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

    const documentData: LocalDocumentData = {
      id: this.id,
      text,
      metadata: {
        index,
      }
    }

    this.config.workspace.writeFileSync(documentPath, JSON.stringify(documentData))
  }

  private loadData() {
    const documentPath = path.join(this.config.uri, DOCUMENT_FILENAME)

    if (!this.config.workspace.existsSync(documentPath)) {
      throw new Error(`Document file for '${this.id}' does not exist: ${documentPath}. Did you forget to call .save()?`)
    }

    const documentFileContent = this.config.workspace.readFileSync(documentPath)
    const document: LocalDocumentData = JSON.parse(documentFileContent)

    this._data = document
  }
}