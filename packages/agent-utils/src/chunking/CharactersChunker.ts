// NOTE: yanked from Nestor's branch, remove and merge with his branch when it's ready
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
