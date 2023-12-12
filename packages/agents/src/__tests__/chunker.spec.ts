import { CsvChunker, LocalCollection, LocalVectorDB, OpenAIEmbeddingAPI, TextChunker } from "@/agent-core";
import { ConsoleLogger, Env, InMemoryWorkspace } from "@evo-ninja/agent-utils";
import dotenv from "dotenv";
import cl100k_base from "gpt-tokenizer/cjs/encoding/cl100k_base";
import path from "path";

dotenv.config({
  path: path.join(__dirname, "../../../../.env")
});

const text = `Joseph Robinette Biden Jr. (/ˈbaɪdən/ ⓘ BY-dən; born November 20, 1942) is an American politician who is the 46th and current president of the United States. Ideologically a moderate member of the Democratic Party, he previously served as the 47th vice president from 2009 to 2017 under President Barack Obama and represented Delaware in the United States Senate from 1973 to 2009.

Born in Scranton, Pennsylvania, Biden moved with his family to Delaware in 1953. He studied at the University of Delaware before earning his law degree from Syracuse University. He was elected to the New Castle County Council in 1970 and to the U.S. Senate in 1972. As a senator, Biden drafted and led the effort to pass the Violent Crime Control and Law Enforcement Act and the Violence Against Women Act. He also oversaw six U.S. Supreme Court confirmation hearings, including the contentious hearings for Robert Bork and Clarence Thomas. Biden ran unsuccessfully for the Democratic presidential nomination in 1988 and 2008. In 2008, Obama chose Biden as his running mate, and Biden was a close counselor to Obama during his two terms as vice president. In the 2020 presidential election, Biden and his running mate, Kamala Harris, defeated incumbents Donald Trump and Mike Pence. Biden is the second Catholic president in U.S. history (after John F. Kennedy), and his politics have been widely described as profoundly influenced by Catholic social teaching.

Taking office at age 78, Biden is the oldest president in U.S. history, the first to have a female vice president, and the first from Delaware. In 2021, he signed a bipartisan infrastructure bill, as well as a $1.9 trillion economic stimulus package in response to the COVID-19 pandemic and subsequent recession. Biden proposed the Build Back Better Act, which failed in Congress, but aspects of which were incorporated into the Inflation Reduction Act that was signed into law in 2022. Biden also signed the bipartisan CHIPS and Science Act, which focused on manufacturing, appointed Ketanji Brown Jackson to the Supreme Court and worked with congressional Republicans to prevent a first ever national default by negotiating a deal to raise the debt ceiling. In foreign policy, Biden restored America's membership in the Paris Agreement. He oversaw the complete withdrawal of U.S. troops from Afghanistan that ended the war in Afghanistan, during which the Afghan government collapsed and the Taliban seized control. Biden has responded to the Russian invasion of Ukraine by imposing sanctions on Russia and authorizing civilian and military aid to Ukraine. During the 2023 Israel–Hamas war, Biden announced American military support for Israel, and condemned the actions of Hamas and other Palestinian militants as terrorism. In April 2023, he announced his candidacy for the Democratic Party nomination in the 2024 presidential election.`

const query = 'relationship with Obama'

describe("Chunker", () => {
  const workspace = new InMemoryWorkspace()
    const env = new Env(process.env);
    const consoleLogger = new ConsoleLogger();
    const embeddingApi = new OpenAIEmbeddingAPI(
      env.OPENAI_API_KEY,
      consoleLogger,
      cl100k_base
    )
    const db = new LocalVectorDB(workspace, "testdb", embeddingApi)

  test("Characters-based", async () => {
    const chunks = TextChunker.fixedCharacterLength(text, {
      chunkLength: 100,
      overlap: 0,
    });
    const collection = await db.addCollection("chars");
    await collection.add(chunks);
    const searchResults = await collection.search(query, 3);

    console.log(
      `CHARS: ${JSON.stringify(
        searchResults.map((s) => s.text()),
        null,
        2
      )}`
    );
  });

  test("Characters-based with overlap", async () => {
    const chunks = TextChunker.fixedCharacterLength(text, {
      chunkLength: 100,
      overlap: 15,
    });
    const collection = await db.addCollection("charsoverlap");
    await collection.add(chunks);
    const searchResults = await collection.search(query, 3);

    console.log(
      `CHARS OVERLAP: ${JSON.stringify(
        searchResults.map((s) => s.text()),
        null,
        2
      )}`
    );
  });

  test("Parent-doc-retrieval - Parent Sentences; Child Characters", async () => {
    const chunks = TextChunker.parentDocRetrieval(text, {
      parentChunker: (text: string) => TextChunker.sentences(text),
      childChunker: (parentText: string) =>
        TextChunker.fixedCharacterLength(parentText, {
          chunkLength: 100,
          overlap: 15,
        }),
    });

    const collection = (await db.addCollection(
      "parentdocs"
    )) as LocalCollection<{ parent: string; index: number }>;
    await collection.add(
      chunks.map((x) => x.doc),
      chunks
        .map((x) => x.metadata)
        .map(({ parent }, index) => ({ parent, index }))
    );

    const searchResults = await collection.search(query, 3);

    const pdrResults = searchResults.map((s) => ({
      text: s.text(),
      parent: s.metadata()?.parent,
    }));

    console.log(`PDR: ${JSON.stringify(pdrResults, null, 2)}`);
  });

  test("Surrounding context", async () => {
    const chunks = TextChunker.fixedCharacterLength(text, { chunkLength: 100, overlap: 15 })

    const collection = (await db.addCollection(
      "surrounding"
    )) as LocalCollection<{ index: number }>;
    await collection.add(chunks, chunks.map((_, idx) => ({ index: idx })))

    const searchResults = await collection.searchWithSurroundingContext(query, {
      surroundingCharacters: 500,
      overlap: 15,
      limit: 3
    })

    console.log(`Surrounding: ${JSON.stringify(searchResults.map(r => ({
      text: r.match.text(),
      surrounding: r.withSurrounding,
    })), null, 2)}`)
  })

  test.only("CSV Chunking", () => {
    const header = "Col1,Col2,Col3";
    const rows = [
      "a1,b1,c1",
      "a2,b2,c2",
      "a3,b3,c3",
      "a4,b4,c4",
      "a5,b5,c5",
      "a6,b6,c6",
      "a7,b7,c7",
      "a8,b8,c8",
      "a9,b9,c9"
    ];
    const csvData = [
      header,
      ...rows
    ].join("\n");

    const chunks = CsvChunker.newlinesWithHeader(
      csvData,
      { chunkLength: 3, overlap: 1 }
    );

    expect(chunks.length).toBe(5);
    expect(chunks[0]).toBe([
      header,
      rows[0],
      rows[1],
      rows[2]
    ].join("\n"));
    expect(chunks[1]).toBe([
      header,
      rows[2],
      rows[3],
      rows[4]
    ].join("\n"));
    expect(chunks[2]).toBe([
      header,
      rows[4],
      rows[5],
      rows[6]
    ].join("\n"));
  });
});
