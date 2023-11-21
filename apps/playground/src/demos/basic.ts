import { TextChunker, TextRecombiner } from "@evo-ninja/agents";
import { LlmAdapter, log, pipe } from "../utils";

export async function run(adapter: LlmAdapter) {

  const { queryBuilder, rag, prompt, cache } = adapter.destructure();

  const source =
    "This is a cool tale. A fox chased a cat. The dog ate the chicken. The fox was unhappy";
  const queryFor = (query: string) => (source: string) =>
    cache("rag1", () =>
      rag()
        .addItems(
          TextChunker.fixedCharacterLength(source, {
            chunkLength: 20,
            overlap: 5,
          })
        )
        .query(query)
        .recombine(
          TextRecombiner.surroundingTextWithPreview(
            5,
            "...\n",
            20,
            adapter.context.chat.tokenizer,
            5
          )
        )
    );
  const explainText = (searchResult: string) =>
    cache("query1", () =>
      queryBuilder()
        .message(
          "user",
          prompt()
            .block(searchResult)
            .text("What does the above text say? Explain in your own words.")
        )
        .build()
        .content()
    );

  await pipe(
    source,
    
    queryFor("dog"),
    log,

    explainText,
    log
  );
};
