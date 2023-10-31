import { Workspace } from "../sys";
import { BaseDocumentMetadata, LocalDocument } from "./LocalDocument";

import path from "path-browserify";
import { v4 as uuid } from "uuid";

export class LocalDocumentStore<
  TMetadata extends BaseDocumentMetadata = BaseDocumentMetadata,
> {
  constructor(
    private workspace: Workspace,
    private uri: string
  ) {}

  add(data: {
    text: string;
    metadata?: TMetadata;
    vector: number[];
  }): LocalDocument<TMetadata> {
    const id = uuid();

    const document = new LocalDocument<TMetadata>(id, {
      uri: path.join(this.uri, id),
      workspace: this.workspace,
    });

    document.save({
      text: data.text,
      vector: data.vector,
      metadata: data.metadata,
    });

    return document;
  }

  list(): LocalDocument<TMetadata>[] {
    const ids = this.workspace.readdirSync(this.uri).map((entry) => entry.name);
    return ids.map(
      (id) =>
        new LocalDocument<TMetadata>(id, {
          uri: path.join(this.uri, id),
          workspace: this.workspace,
        })
    );
  }
}
