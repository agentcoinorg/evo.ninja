import { Chunker } from "./Chunker";

import { load, Element } from "cheerio";

export class HTMLChunker implements Chunker {
  constructor(private readonly config: { maxChunkSize: number }) {}

  private sanitize(html: string): string {
    return html
      .replaceAll("\t", "")
      .replaceAll("\\\\t", "")
      .replaceAll("\n", " ")
      .replaceAll("\\\\n", "\n")
      .replace(/ +(?= )/g, "")
      .trim();
  }

  chunk(html: string): string[] {
    const $ = load(html);
    const chunks: string[] = [];

    const extractContent = (element: Element): void => {
      let chunk: string = $(element).text().trim() || "";
      chunk = this.sanitize(chunk);

      while (chunk.length > this.config.maxChunkSize) {
        let indexToSplit = chunk.lastIndexOf("<", this.config.maxChunkSize);

        if (indexToSplit === -1) {
          indexToSplit = this.config.maxChunkSize; // Split at the max limit if no tags found.
        }

        const subChunk = chunk.substring(0, indexToSplit).trim();
        if (subChunk) chunks.push(subChunk);

        chunk = this.sanitize(chunk.substring(indexToSplit).trim());
      }

      if (chunk && !chunks.includes(chunk)) {
        chunks.push(chunk);
      }
    };

    const processElement = (selector: string): void => {
      $(selector).each(function () {
        if ($(this).find(selector).length > 0) {
          $(this)
            .children(selector)
            .each(function () {
              extractContent(this);
            });
        } else {
          const siblings = $(this)
            .nextUntil(":not(" + selector + ")")
            .addBack();
          extractContent(siblings as any);
        }
      });
    };

    ["div", "section", "article"].forEach(processElement);

    return chunks;
  }
}
