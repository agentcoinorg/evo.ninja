export class TextChunker {
  private constructor() {}

  static fixedCharacterLength(text: string, opts: { chunkLength: number, overlap: number }): string[] {
    const { chunkLength, overlap } = opts
    
    if (chunkLength <= overlap) {
        throw new Error("Chunk length must be greater than overlap length.");
    }
  
    let chunks: string[] = [];
    let startIndex = 0;
  
    while (startIndex < text.length) {
        let endIndex = startIndex + chunkLength;
        let chunk = text.slice(startIndex, endIndex);
  
        chunks.push(chunk);
  
        startIndex = endIndex - overlap;
    }
  
    return chunks;
  }

  static parentDocRetrieval(text: string, opts: {
    parentChunker: (text: string) => string[],
    childChunker: (parentText: string) => string[],
  }) {
    const { parentChunker, childChunker } = opts
    
    const parentChunks = parentChunker(text)
    const parentAndChildDocs = parentChunks.map(parentChunk => {
      return {
        parent: parentChunk,
        children: childChunker(parentChunk)
      }
    }).map(parentAndChildDoc => {
      return {
        metadatas: parentAndChildDoc.children.map(() => ({ parent: parentAndChildDoc.parent })),
        documents: parentAndChildDoc.children
      }
    })

    const docs = parentAndChildDocs.flatMap(parentAndChildDoc => parentAndChildDoc.documents)
    const metadatas = parentAndChildDocs.flatMap(parentAndChildDoc => parentAndChildDoc.metadatas)

    return { docs, metadatas }
  }
}
