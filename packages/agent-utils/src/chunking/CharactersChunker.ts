export function chunkByCharacters(text: string, chunkLength: number, overlapLength: number): string[] {
  // Check if the chunkLength is greater than overlapLength
  if (chunkLength <= overlapLength) {
      throw new Error("Chunk length must be greater than overlap length.");
  }

  let chunks: string[] = [];

  // Initialize the start index for the first chunk
  let startIndex = 0;

  // While there's still text to be chunked
  while (startIndex < text.length) {
      // Calculate the end index for the current chunk
      let endIndex = startIndex + chunkLength;

      // Extract the chunk from the text
      let chunk = text.slice(startIndex, endIndex);

      // Append the chunk to the array of chunks
      chunks.push(chunk);

      // Move the start index for the next chunk, considering the overlap
      startIndex = endIndex - overlapLength;
  }

  return chunks;
}

export function chunkTextBySentences(text: string, charLimit: number, overlapLength: number): string[] {
  if (charLimit <= overlapLength) {
      throw new Error("Character limit must be greater than overlap length.");
  }

  const sentenceEndings = /[.!?]/;
  let chunks: string[] = [];
  let currentChunk = "";

  const sentences = text.split(sentenceEndings);

  for (let sentence of sentences) {
      if ((currentChunk + sentence).length <= charLimit) {
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

  // Handle chunks that exceed the charLimit by splitting them with overlap
  let finalChunks: string[] = [];
  for (let chunk of chunks) {
      if (chunk.length > charLimit) {
          let startIndex = 0;
          while (startIndex < chunk.length) {
              let endIndex = startIndex + charLimit;
              let subChunk = chunk.slice(startIndex, endIndex);
              finalChunks.push(subChunk);
              startIndex = endIndex - overlapLength;
          }
      } else {
          finalChunks.push(chunk);
      }
  }

  return finalChunks;
}
