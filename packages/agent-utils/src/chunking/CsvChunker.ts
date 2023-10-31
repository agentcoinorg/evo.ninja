export class CsvChunker {
  static newlinesWithHeader(
    csvData: string,
    opts: { chunkLength: number; overlap: number }
  ): string[] {
    const { chunkLength, overlap } = opts;

    if (chunkLength <= overlap) {
      throw new Error("Chunk length must be greater than overlap length.");
    }

    const rows = csvData.split("\n");

    if (!rows.length) {
      return [];
    }

    const header = rows.splice(0, 1);
    const chunks: string[] = [];
    let startIndex = 0;

    while (startIndex < rows.length) {
      const endIndex = startIndex + chunkLength;
      const chunk = [header, ...rows.slice(startIndex, endIndex)].join("\n");
      chunks.push(chunk);
      startIndex = endIndex - overlap;
    }

    return chunks;
  }
}
