import { AgentContext, ArrayRecombiner, Chat, Env, InMemoryWorkspace, LlmApi, Logger, Rag, Scripts, StandardRagBuilder, TextChunker, TextRecombiner, Tokenizer, WrapClient } from "@evo-ninja/agent-utils";
import { LlmQueryBuilder } from "./LlmQueryBuilder";
import { Prompt } from "@evo-ninja/agents/build/agents/Chameleon/Prompt";
import fs from "fs";
import { searchOnGoogle, processWebpage } from "@evo-ninja/agents";
import { FileSystemWorkspace } from "@evo-ninja/agent-utils-fs";

export class LlmAdapter {
  constructor(private readonly context: AgentContext) {
  }

  queryBuilder() {
    return new LlmQueryBuilder(this.context.llm, this.context.chat.tokenizer);
  }

  rag<TItem>() {
    return Rag.standard<TItem>(this.context);
  }

  prompt(text?: string) {
    return new Prompt(text);
  }

  cache<TRes>(id: string, func: () => TRes | Promise<TRes>) {
    return new CachedFunc(id, func, this.context.chat.tokenizer);
  }

  destructure(): {
    queryBuilder: () => LlmQueryBuilder;
    rag: <TItem>() => StandardRagBuilder<TItem>;
    prompt: (text?: string) => Prompt;
    cache: <TRes>(id: string, func: () => TRes | Promise<TRes>) => CachedFunc<TRes>;
  } {
    return {
      queryBuilder: this.queryBuilder.bind(this),
      rag: this.rag.bind(this),
      prompt: this.prompt.bind(this),
      cache: this.cache.bind(this),
    };
  }
}

export async function run(llm: LlmApi, env: Env, logger: Logger, chat: Chat) {
  const context = new AgentContext(llm, chat, logger, new InMemoryWorkspace(), new InMemoryWorkspace(), env, undefined as unknown as Scripts, undefined as unknown as WrapClient, undefined);

  const adapter = new LlmAdapter(context);
  const { queryBuilder, rag, prompt, cache } = adapter.destructure();

  await pipe(
    "This is a cool tale. A fox chased a cat. The dog ate the chicken. The fox was unhappy",
    (source: string) => cache("rag1", () => 
      rag()
        .addItems(TextChunker.fixedCharacterLength(source, { chunkLength: 20, overlap: 5}))
        .query("dog")
        .recombine(TextRecombiner.surroundingTextWithPreview(5, "...\n", 20, context.chat.tokenizer, 5))
    ),
    log,

    (searchResult: string) => cache("query1", () => 
      queryBuilder()
        .persistent("user", prompt()
          .block(searchResult)
          .text("What does the above text say? Explain in your own words.")
        )
        .build()
        .content()
    ),
    log
  );

  const workspace = new FileSystemWorkspace("../work/rag-db");
  const query = "What is tesla's revenue between 2003 and 2023?";
  await pipe(
    cache("google1", () => 
      searchOnGoogle(
        query,
        env.SERP_API_KEY!
      )
    ),
    (results: { url: string }[]) => Promise.all(results.map(x => processWebpage(x.url))),
    (results: string[]) => results.join("\n\n"),

    async (result: string) => {
      if (!fs.existsSync("../work/db")) {
        const rag = await Rag.standard(context, "rag-over-google", workspace)
          .addItems(TextChunker.fixedCharacterLength(result, { chunkLength: 1000, overlap: 100}))
          .forceAddItemsToCollection();
      
        fs.writeFileSync("../work/db", "initialized");
        return rag;
      } else {
        return Rag.standard(context, "rag-over-google", workspace, TextChunker.fixedCharacterLength(result, { chunkLength: 100, overlap: 50}))
      }
    },

    (rag: StandardRagBuilder<string>) => pipe(
      cache("results", () => pipe(
        imagineAnswerTo(query, adapter),
        log,
  
        (resp: string) => rag
          .query(resp)
          .recombine(TextRecombiner.surroundingTextWithPreview(100, "\n...\n", 5000, context.chat.tokenizer, 50)),
        log,
        (r: any) => { console.log("done"); return r},
      )),
  
      (data: string) => summarizeData(data, query, adapter),
      log,
    ),
  );
};

const imagineAnswerTo = (query: string, adapter: LlmAdapter): Promise<string> => {
  const { queryBuilder, prompt } = adapter.destructure();

  return queryBuilder()
    .persistent("user", prompt(
      `You are an imaginary expert search engine. You can answer any question the user asks you in great detail.`
    ))
    .persistent("user", prompt()
      .block(query)
      .line(x => x
        .text(`
          Consider the above query.
          Do not answer it, but imagine how an answer could look like.
          Write out the imagined answer, and make it seem like a real answer.
          Only respond with the imagined answer and nothing else.`
        )
      )
    )
    .build()
    .content({ model: "gpt-3.5-turbo-16k-0613" });
};

const summarizeData = (data: string, query: string, adapter: LlmAdapter): Promise<string> => {
  const { queryBuilder, prompt } = adapter.destructure();

  return queryBuilder()
    .persistent("user", prompt()
      .text(`
        This system is an expert at summarizing and extracting information. 
        It can distill jumbled text into concise summaries and pull relevant details. 
        It can also collate data from multiple sources and consolidate it.`
      )
    )
    .persistent("user", prompt()
      .text(`Data sources:`)
      .line(x => x.block(data))
      .line(`
        Goal:
        Extract the information corresponding to "What was tesla's revenue in 2008?" from the provided data sources. 
        Ensure to comb through all chunks, as the information might be scattered or fragmented.
        You MUST get all the requested information. Structure the answer in a way that makes it easy to read.`
      )
    )
    .build()
    .content();
};

class LazyFunc<TRes> {
  constructor(protected readonly func: () => TRes | Promise<TRes>) {
  }

  async exec(): Promise<TRes> {
    return await this.func();
  }
}

type SavedResult<TRes> = {
  val: TRes;
  timeElapsedInSec: number;
  tokens: number;
};

class CachedFunc<TRes> extends LazyFunc<TRes> {
  constructor(private readonly id: string, func: () => TRes, private readonly tokenizer: Tokenizer) {
    super(func);
  }

  async exec(): Promise<TRes> {
    const cached = await this.load();
    if (cached) {
      return cached.val;
    }

    const time = performance.now();
    const result = await super.exec();
    const timeElapsedInSec = (performance.now() - time) / 1000;
    await this.save(result, timeElapsedInSec);
    return result;
  }

  private async load(): Promise<SavedResult<TRes> | undefined> {
    const path = `../work/.cache/${this.id}.json`;
    if (!fs.existsSync(path)) {
      return undefined;
    }

    return JSON.parse(fs.readFileSync(path, "utf8")) as SavedResult<TRes>;
  }

  private async save(result: TRes, timeElapsedInSec: number): Promise<void> {
    const path = `../work/.cache/${this.id}.json`;
    
    fs.writeFileSync(path, JSON.stringify({
      val: result,
      timeElapsedInSec,
      tokens: this.tokenizer.encode(JSON.stringify(result)).length,
    }, null, 2));
  }
}

const log = (x: unknown) => { 
  console.log(x);
  return x;
};
type Func<TArg, TResult> = ((arg: TArg) => TResult | Promise<TResult>)
  | Promise<TResult>
  | TResult;

async function pipe(
  ...funcs: Func<unknown, unknown>[]
): Promise<Func<unknown, unknown>> {
  let result = undefined;
  for (const func of funcs) {
    if (func instanceof LazyFunc) {
      result = await func.exec();
    } else if (typeof func === "function") {
      result = await func(result);
      if (result instanceof LazyFunc) {
        result = await result.exec();
      }
    } else {
      result = await func;
    }
  }
  return result;
}
