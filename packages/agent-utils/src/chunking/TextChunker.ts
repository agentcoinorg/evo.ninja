import { splitIntoSentences } from "./splitters";

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

  static bySentences(text: string, opts: { chunkLength: number, overlap: number }): string[] {
    const { chunkLength, overlap } = opts
    
    if (chunkLength <= overlap) {
        throw new Error("Character limit must be greater than overlap length.");
    }
  
    let chunks: string[] = [];
    let currentChunk = "";
  
    const sentences = splitIntoSentences(text);
  
    for (let sentence of sentences) {
        if ((currentChunk + sentence).length <= chunkLength) {
            currentChunk += sentence.trim() + ".";
        } else {
            if (currentChunk) {
                chunks.push(currentChunk.trim());
            }
            currentChunk = sentence.trim() + ".";
        }
    }
  
    if (currentChunk) {
        chunks.push(currentChunk.trim());
    }
  
    // Handle chunks that exceed the chunkLength by splitting them with overlap
    let finalChunks: string[] = [];
    for (let chunk of chunks) {
        if (chunk.length > chunkLength) {
            let startIndex = 0;
            while (startIndex < chunk.length) {
                let endIndex = startIndex + chunkLength;
                let subChunk = chunk.slice(startIndex, endIndex);
                finalChunks.push(subChunk);
                startIndex = endIndex - overlap;
            }
        } else {
            finalChunks.push(chunk);
        }
    }
  
    return finalChunks;
  }

  static parentDocRetrieval(text: string, opts: { chunkLength: number, overlap: number }) {
    const { chunkLength, overlap } = opts
    
    const parentChunks = splitIntoSentences(text)
    const parentAndChildDocs = parentChunks.map(parentChunk => {
      return {
        parent: parentChunk,
        children: TextChunker.fixedCharacterLength(parentChunk, { chunkLength, overlap })
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
