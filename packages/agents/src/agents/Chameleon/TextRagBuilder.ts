import { AgentContext } from "../../AgentContext";
import { Rag } from "./Rag";

export class TextRagBuilder {
  private _limit: number;
  private _characterLimit: number;
  private _chunks: string[];

  constructor(private readonly context: AgentContext) {
  }

  chunks(chunks: string[]): TextRagBuilder {
    this._chunks = chunks;
    return this;
  }

  limit(limit: number): TextRagBuilder {
    this._limit = limit;
    return this;
  }

  characterLimit(characterLimit: number): TextRagBuilder {
    this._characterLimit = characterLimit;
    return this;
  }

  async query(query: string): Promise<string[]> {
    const result = await Rag.standard(this._chunks, this.context)
      .limit(this._limit)
      .selector(x => x)
      .query(query);
    const relevantLines = result
      .sortByIndex()
      .onlyUnique();

    let totalLength = 0;
    const returnedLines = [];
    for (const line of relevantLines) {
      if (totalLength + line.length > this._characterLimit) {
        const remainingCharacters = this._characterLimit - totalLength;
        if (remainingCharacters > 0) {
          returnedLines.push(line.substring(0, remainingCharacters));
        }
        break;
      }
      returnedLines.push(line);
      totalLength += line.length;
    }
    return returnedLines;
  }
}
