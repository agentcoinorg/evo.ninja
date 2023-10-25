import { StandardRagBuilder } from "./StandardRagBuilder";
import { AgentContext } from "../agent/AgentContext";
import { previewChunks } from "../utils";
import { TextChunker, TextRecombiner } from "../chunking";
import { StandardRagBuilderV2 } from "./StandardRagBuilderV2";

export class Rag {
  static standard<TItem = string>(context: AgentContext, collectionName?: string): StandardRagBuilder<TItem> {
    return new StandardRagBuilder<TItem>(context, collectionName);
  }

  static standardV2<TItem = string>(context: AgentContext, collectionName?: string): StandardRagBuilderV2<TItem> {
    return new StandardRagBuilderV2<TItem>(context, collectionName);
  }

  static async filterWithSurroundingText(text: string, query: string, context: AgentContext, opts: { charLimit: number, surroundingCharacters: number, chunkLength: number, overlap: number}): Promise<string> {
    const { charLimit, surroundingCharacters, chunkLength, overlap } = opts;
    
    return Rag.standard(context)
      .addItems(TextChunker.fixedCharacterLength(text, { chunkLength: chunkLength, overlap }))
      .limit(charLimit / (chunkLength + surroundingCharacters))
      .sortByIndex()
      .onlyUnique()
      .recombine(TextRecombiner.surroundingText(surroundingCharacters, overlap))
      .query(query)
      .then(x => previewChunks(x, charLimit));
  }
}
