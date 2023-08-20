export class InMemoryFile {
  constructor(path: string, content?: Uint8Array) {
    this.path = path;
    this.content = content;
  }

  path: string;
  content?: Uint8Array;
}
