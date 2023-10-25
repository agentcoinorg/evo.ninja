import { StandardRagBuilder } from "./StandardRagBuilder";
import { AgentContext } from "../agent/AgentContext";
import { TextChunker, TextRecombiner } from "../chunking";
import { StandardRagBuilderV2 } from "./StandardRagBuilderV2";

export class Rag {
  static standard<TItem = string>(context: AgentContext, collectionName?: string): StandardRagBuilder<TItem> {
    return new StandardRagBuilder<TItem>(context, collectionName);
  }

  static standardV2<TItem = string>(context: AgentContext, collectionName?: string): StandardRagBuilderV2<TItem> {
    return new StandardRagBuilderV2<TItem>(context, collectionName);
  }

  static async filterWithSurroundingText(text: string, query: string, context: AgentContext, opts: { tokenLimit: number, surroundingCharacters: number, chunkLength: number, overlap: number}): Promise<string> {
    const { tokenLimit, surroundingCharacters, chunkLength, overlap } = opts;
    
    return Rag.standardV2(context)
      .addItems(TextChunker.fixedCharacterLength(text, { chunkLength: chunkLength, overlap }))
      .query(query)
      .recombine(TextRecombiner.surroundingTextWithPreview(surroundingCharacters, "...\n", tokenLimit, context.chat.tokenizer, overlap))
  }
}
