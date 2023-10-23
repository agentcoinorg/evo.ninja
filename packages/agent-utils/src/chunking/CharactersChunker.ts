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

  let chunks: string[] = [];
  let currentChunk = "";

  const sentences = splitIntoSentences(text);

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

export const splitIntoSentences = (text: string): string[] => {
  const alphabets = "([A-Za-z])";
  const prefixes = "(Mr|St|Mrs|Ms|Dr)[.]";
  const suffixes = "(Inc|Ltd|Jr|Sr|Co)";
  const starters = "(Mr|Mrs|Ms|Dr|Prof|Capt|Cpt|Lt|He\\s|She\\s|It\\s|They\\s|Their\\s|Our\\s|We\\s|But\\s|However\\s|That\\s|This\\s|Wherever)";
  const acronyms = "([A-Z][.][A-Z][.](?:[A-Z][.])?)";
  const websites = "[.](com|net|org|io|gov|edu|me)";
  const digits = "([0-9])";
  const multipleDots = /\\.{2,}/g;

    text = " " + text + "  ";
    text = text.replaceAll("\n", " ");
    text = text.replaceAll(new RegExp(prefixes, 'g'), "$1<prd>");
    text = text.replaceAll(new RegExp(websites, 'g'), "<prd>$1");
    text = text.replaceAll(new RegExp(digits + "[.]" + digits, 'g'), "$1<prd>$2");
    text = text.replaceAll(multipleDots, match => "<prd>".repeat(match.length) + "<stop>");
    if (text.includes("Ph.D")) text = text.replaceAll("Ph.D.", "Ph<prd>D<prd>");
    text = text.replaceAll(new RegExp("\\s" + alphabets + "[.] ", 'g'), " $1<prd> ");
    text = text.replaceAll(new RegExp(acronyms + " " + starters, 'g'), "$1<stop> $2");
    text = text.replaceAll(new RegExp(alphabets + "[.]" + alphabets + "[.]" + alphabets + "[.]", 'g'), "$1<prd>$2<prd>$3<prd>");
    text = text.replaceAll(new RegExp(alphabets + "[.]" + alphabets + "[.]", 'g'), "$1<prd>$2<prd>");
    text = text.replaceAll(new RegExp(" " + suffixes + "[.] " + starters, 'g'), " $1<stop> $2");
    text = text.replaceAll(new RegExp(" " + suffixes + "[.]", 'g'), " $1<prd>");
    text = text.replaceAll(new RegExp(" " + alphabets + "[.]", 'g'), " $1<prd>");
    if (text.includes("”")) text = text.replaceAll(".”", "”.");
    if (text.includes("\"")) text = text.replaceAll(".\"", "\".");
    if (text.includes("!")) text = text.replaceAll("!\"", "\"!");
    if (text.includes("?")) text = text.replaceAll("?\"", "\"?");
    text = text.replaceAll(".", ".<stop>");
    text = text.replaceAll("?", "?<stop>");
    text = text.replaceAll("!", "!<stop>");
    text = text.replaceAll("<prd>", ".");
    const sentences = text.split("<stop>").map(s => s.trim());
    if (sentences && !sentences[sentences.length - 1]) sentences.pop();
    return sentences;
}