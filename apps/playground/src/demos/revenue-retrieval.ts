import fs from "fs";
import { searchOnGoogle, processWebpage, Rag, StandardRagBuilder, TextChunker, TextRecombiner } from "@evo-ninja/agents";
import { FileSystemWorkspace } from "@evo-ninja/agent-utils-fs";
import { LlmAdapter, log, pipe } from "../utils";

export async function run(adapter: LlmAdapter) {
  const { queryBuilder, rag, prompt, cache } = adapter.destructure();

  const workspace = new FileSystemWorkspace("../../workspace/rag-db");

  const query = "What is tesla's revenue between 2003 and 2023?";

  await pipe(
    cache("google1", () =>
      searchOnGoogle(query, adapter.context.env.SERP_API_KEY!)
    ),
    (results: { url: string }[]) =>
      Promise.all(results.map((x) => undefinedIfError(processWebpage(x.url)))),
    (results: string[]) => results.filter((x) => !!x).join("\n\n"),

    async (result: string) => {
      if (!fs.existsSync("../../workspace/db")) {
        const rag = await Rag.standard(
          adapter.context,
          "rag-over-google",
          workspace
        )
          .addItems(
            TextChunker.fixedCharacterLength(result, {
              chunkLength: 1000,
              overlap: 100,
            })
          )
          .forceAddItemsToCollection();

        fs.writeFileSync("../../workspace/db", "initialized");
        return rag;
      } else {
        return Rag.standard(
          adapter.context,
          "rag-over-google",
          workspace,
          TextChunker.fixedCharacterLength(result, {
            chunkLength: 100,
            overlap: 50,
          })
        );
      }
    },

    (rag: StandardRagBuilder<string>) =>
      pipe(
        cache("results", () =>
          pipe(
            imagineAnswerTo(query, adapter),
            log,

            (answer: string) =>
              rag
                .query(answer)
                .recombine(
                  TextRecombiner.surroundingTextWithPreview(
                    100,
                    "\n...\n",
                    5000,
                    adapter.context.chat.tokenizer,
                    50
                  )
                ),
            log,
            (r: any) => {
              console.log("done");
              return r;
            }
          )
        ),

        (data: string) => summarizeData(data, query, adapter),
        log
      )
  );
}

const imagineAnswerTo = (
  query: string,
  adapter: LlmAdapter
): Promise<string> => {
  const { queryBuilder, prompt } = adapter.destructure();

  return queryBuilder()
    .message(
      "user",
      prompt(
        `You are an imaginary expert search engine. You can answer any question the user asks you in great detail.`
      )
    )
    .message(
      "user",
      prompt()
        .block(query)
        .line((x) =>
          x.text(`
          Consider the above query.
          Do not answer it, but imagine how an answer could look like.
          Write out the imagined answer, and make it seem like a real answer.
          Only respond with the imagined answer and nothing else.`)
        )
    )
    .build()
    .content({ model: "gpt-3.5-turbo-16k" });
};

const summarizeData = (
  data: string,
  query: string,
  adapter: LlmAdapter
): Promise<string> => {
  const { queryBuilder, prompt } = adapter.destructure();

  return queryBuilder()
    .message(
      "user",
      prompt().text(`
        This system is an expert at summarizing and extracting information. 
        It can distill jumbled text into concise summaries and pull relevant details. 
        It can also collate data from multiple sources and consolidate it.`)
    )
    .message(
      "user",
      prompt()
        .text(`Data sources:`)
        .line((x) => x.block(data)).line(`
        Goal:
        Extract the information corresponding to ${query} from the provided data sources. 
        Ensure to comb through all chunks, as the information might be scattered or fragmented.
        You MUST get all the requested information. Structure the answer in a way that makes it easy to read.`)
    )
    .build()
    .content();
};

function undefinedIfError<T>(promise: Promise<T>): Promise<T | undefined> {
  return promise.catch(() => undefined);
}
