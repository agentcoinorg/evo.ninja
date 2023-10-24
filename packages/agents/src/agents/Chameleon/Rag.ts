import { TextChunker, TextRecombiner } from "@evo-ninja/agent-utils";
import { AgentContext } from "../../AgentContext";
import { StandardRagBuilder } from "./StandardRagBuilder";
import { previewChunks } from "./helpers";

export class Rag {
  static standard<TItem = string>(items: TItem[], context: AgentContext): StandardRagBuilder<TItem> {
    return new StandardRagBuilder<TItem>(items, context);
  }

  static async filterWithSurroundingText(text: string, query: string, context: AgentContext, opts: { charLimit: number, surroundingCharacters: number, chunkLength: number, overlap: number}): Promise<string> {
    const { charLimit, surroundingCharacters, chunkLength, overlap } = opts;
    
    return Rag.standard(
      TextChunker.fixedCharacterLength(text, { chunkLength: chunkLength, overlap }), 
      context
    )
      .limit(charLimit / (chunkLength + surroundingCharacters))
      .sortByIndex()
      .onlyUnique()
      .recombine(TextRecombiner.surroundingText(surroundingCharacters, overlap))
      .query(query)
      .then(x => previewChunks(x, charLimit));
  }
}
