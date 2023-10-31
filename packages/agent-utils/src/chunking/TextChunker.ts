import { cleanWhitespace } from "./cleanWhitespace";

export class TextChunker {
  static fixedCharacterLength(
    text: string,
    opts: { chunkLength: number; overlap: number }
  ): string[] {
    const { chunkLength, overlap } = opts;

    if (chunkLength <= overlap) {
      throw new Error("Chunk length must be greater than overlap length.");
    }

    const chunks: string[] = [];
    let startIndex = 0;

    while (startIndex < text.length) {
      const endIndex = startIndex + chunkLength;
      const chunk = text.slice(startIndex, endIndex);

      chunks.push(chunk);

      startIndex = endIndex - overlap;
    }

    return chunks;
  }

  static parentDocRetrieval(
    text: string,
    opts: {
      parentChunker: (text: string) => string[];
      childChunker: (parentText: string) => string[];
    }
  ): {
    doc: string;
    metadata: {
      parent: string;
    };
  }[] {
    const { parentChunker, childChunker } = opts;

    const parentChunks = parentChunker(text);
    const parentAndChildDocs = parentChunks
      .map((parentChunk) => {
        return {
          parent: parentChunk,
          children: childChunker(parentChunk),
        };
      })
      .map((parentAndChildDoc) => {
        return {
          metadatas: parentAndChildDoc.children.map(() => ({
            parent: parentAndChildDoc.parent,
          })),
          documents: parentAndChildDoc.children,
        };
      });

    const docs = parentAndChildDocs.flatMap(
      (parentAndChildDoc) => parentAndChildDoc.documents
    );
    const metadatas = parentAndChildDocs.flatMap(
      (parentAndChildDoc) => parentAndChildDoc.metadatas
    );

    const chunks = docs.map((doc, index) => {
      return {
        doc,
        metadata: metadatas[index],
      };
    });

    return chunks;
  }

  static sentences(text: string): string[] {
    const alphabets = "([A-Za-z])";
    const prefixes = "(Mr|St|Mrs|Ms|Dr)[.]";
    const suffixes = "(Inc|Ltd|Jr|Sr|Co)";
    const starters =
      "(Mr|Mrs|Ms|Dr|Prof|Capt|Cpt|Lt|He\\s|She\\s|It\\s|They\\s|Their\\s|Our\\s|We\\s|But\\s|However\\s|That\\s|This\\s|Wherever)";
    const acronyms = "([A-Z][.][A-Z][.](?:[A-Z][.])?)";
    const websites = "[.](com|net|org|io|gov|edu|me)";
    const digits = "([0-9])";
    const multipleDots = /\\.{2,}/g;

    text = " " + text + "  ";
    text = text.replaceAll("\n", " ");
    text = text.replaceAll(new RegExp(prefixes, "g"), "$1<prd>");
    text = text.replaceAll(new RegExp(websites, "g"), "<prd>$1");
    text = text.replaceAll(
      new RegExp(digits + "[.]" + digits, "g"),
      "$1<prd>$2"
    );
    text = text.replaceAll(
      multipleDots,
      (match) => "<prd>".repeat(match.length) + "<stop>"
    );
    if (text.includes("Ph.D")) text = text.replaceAll("Ph.D.", "Ph<prd>D<prd>");
    text = text.replaceAll(
      new RegExp("\\s" + alphabets + "[.] ", "g"),
      " $1<prd> "
    );
    text = text.replaceAll(
      new RegExp(acronyms + " " + starters, "g"),
      "$1<stop> $2"
    );
    text = text.replaceAll(
      new RegExp(
        alphabets + "[.]" + alphabets + "[.]" + alphabets + "[.]",
        "g"
      ),
      "$1<prd>$2<prd>$3<prd>"
    );
    text = text.replaceAll(
      new RegExp(alphabets + "[.]" + alphabets + "[.]", "g"),
      "$1<prd>$2<prd>"
    );
    text = text.replaceAll(
      new RegExp(" " + suffixes + "[.] " + starters, "g"),
      " $1<stop> $2"
    );
    text = text.replaceAll(new RegExp(" " + suffixes + "[.]", "g"), " $1<prd>");
    text = text.replaceAll(
      new RegExp(" " + alphabets + "[.]", "g"),
      " $1<prd>"
    );
    if (text.includes("”")) text = text.replaceAll(".”", "”.");
    if (text.includes('"')) text = text.replaceAll('."', '".');
    if (text.includes("!")) text = text.replaceAll('!"', '"!');
    if (text.includes("?")) text = text.replaceAll('?"', '"?');
    text = text.replaceAll(".", ".<stop>");
    text = text.replaceAll("?", "?<stop>");
    text = text.replaceAll("!", "!<stop>");
    text = text.replaceAll("<prd>", ".");
    const sentences = text.split("<stop>").map((s) => s.trim());
    if (sentences && !sentences[sentences.length - 1]) sentences.pop();
    return sentences;
  }

  static singleLine(content: string): string[] {
    const lines = cleanWhitespace(content).split("\n");
    return lines;
  }

  static multiLines(content: string, linesPerChunk: number): string[] {
    const lines = cleanWhitespace(content).split("\n");
    const chunks = [];
    for (let i = 0; i < lines.length; i += linesPerChunk) {
      chunks.push(lines.slice(i, i + linesPerChunk).join("\n"));
    }
    return chunks;
  }

  static characters(content: string, characterLimit: number): string[] {
    const trimmedContent = cleanWhitespace(content);
    const chunks = [];
    let currentChunk = "";
    for (const char of trimmedContent) {
      if (currentChunk.length + 1 > characterLimit) {
        chunks.push(currentChunk);
        currentChunk = "";
      }
      currentChunk += char;
    }
    return chunks;
  }

  static words(content: string, characterLimit: number): string[] {
    const trimmedContent = cleanWhitespace(content);
    const chunks = [];
    let currentChunk = "";
    for (const word of trimmedContent.split(" ")) {
      if (currentChunk.length + word.length > characterLimit) {
        chunks.push(currentChunk);
        currentChunk = "";
      }
      currentChunk += word;
    }
    // TODO: temp fix. Do more general solution
    return chunks.filter((x) => x.length > 0);
  }
}
