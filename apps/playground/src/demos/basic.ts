import { TextChunker, TextRecombiner } from "@evo-ninja/agents";
import { LlmAdapter, log, pipe } from "../utils";

export async function run(adapter: LlmAdapter) {

  const { queryBuilder, rag, prompt, cache } = adapter.destructure();

  await pipe(
    "This is a cool tale. A fox chased a cat. The dog ate the chicken. The fox was unhappy",
    (source: string) => cache("rag1", () => 
      rag()
        .addItems(TextChunker.fixedCharacterLength(source, { chunkLength: 20, overlap: 5}))
        .query("dog")
        .recombine(TextRecombiner.surroundingTextWithPreview(5, "...\n", 20, adapter.context.chat.tokenizer, 5))
    ),
    log,

    (searchResult: string) => cache("query1", () => 
      queryBuilder()
        .message("user", prompt()
          .block(searchResult)
          .text("What does the above text say? Explain in your own words.")
        )
        .build()
        .content()
    ),
    log
  );
};
