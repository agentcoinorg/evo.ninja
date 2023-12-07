import { Workspace } from "@evo-ninja/agent-utils";

interface DirectoryChunkerInput {
  workspace: Workspace;
  directory?: string;
}

export class DirectoryChunker {
  constructor(private readonly config: { maxChunkSize: number }) {}

  chunk(input: DirectoryChunkerInput): Promise<string[]> {
    return this.chunkDirectory(input.workspace, input.directory || "");
  }

  private async chunkDirectory(
    workspace: Workspace,
    directory: string
  ): Promise<string[]> {
    const entries = await workspace.readdir(directory);
    const chunks: string[] = [];

    let currentChunk: string[] = [];
    let currentSize = 0;

    for (const entry of entries) {
      const fullPath = `${directory}/${entry.name}`;

      if (entry.type === "file") {
        const fileContents = (await workspace.readFile(fullPath)).split("\n");
        let startLine = 0;

        while (startLine < fileContents.length) {
          const chunkHeader = `@@ { file: "${fullPath}", start: ${
            startLine + 1
          }, end: null } @@\n`;
          let spaceForContent =
            this.config.maxChunkSize - (currentSize + chunkHeader.length);
          let linesInThisChunk = [];

          while (
            startLine < fileContents.length &&
            fileContents[startLine].length + 1 <= spaceForContent
          ) {
            linesInThisChunk.push(fileContents[startLine]);
            spaceForContent -= fileContents[startLine].length + 1; // +1 for newline
            startLine++;
          }

          const contentString = linesInThisChunk.join("\n");
          const chunkWithPlaceholder = chunkHeader + contentString;

          // Now, we'll replace the 'null' end line with the correct value.
          const finalChunk = chunkWithPlaceholder.replace(
            "end: null",
            `end: ${startLine}`
          );
          currentSize += finalChunk.length;

          currentChunk.push(finalChunk);

          // If we have exceeded the maxChunkSize or if there's no space for another header, finalize the chunk.
          if (
            currentSize >= this.config.maxChunkSize ||
            (startLine < fileContents.length &&
              currentSize + chunkHeader.length > this.config.maxChunkSize)
          ) {
            chunks.push(currentChunk.join(""));
            currentChunk = [];
            currentSize = 0;
          }
        }
      } else if (entry.type === "directory") {
        // If it's a directory, recursively process its contents.
        const subchunks = await this.chunkDirectory(workspace, fullPath);
        chunks.push(...subchunks);
      }
    }

    // If there's remaining data in currentChunk, add it to the chunks array.
    if (currentChunk.length > 0) {
      chunks.push(currentChunk.join(""));
    }

    return chunks;
  }
}
