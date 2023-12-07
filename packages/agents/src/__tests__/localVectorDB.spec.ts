import { LocalVectorDB, OpenAIEmbeddingAPI } from "@/agent-core";
import { InMemoryWorkspace, Env, ConsoleLogger } from "@evo-ninja/agent-utils";
import dotenv from "dotenv";
import cl100k_base from "gpt-tokenizer/cjs/encoding/cl100k_base";
import path from "path";

dotenv.config({
  path: path.join(__dirname, "../../../../.env")
});

jest.setTimeout(120000)

const generateRandomString = (length: number): string => {
  let result = '';
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const charactersLength = characters.length;
  let counter = 0;
  while (counter < length) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
    counter += 1;
  }
  return result;
}

describe('Local Vector DB', () => {
  it("should list created collections", async () => {
    const workspace = new InMemoryWorkspace();
    const env = new Env(process.env);
    const consoleLogger = new ConsoleLogger();
    const embeddingApi = new OpenAIEmbeddingAPI(
      env.OPENAI_API_KEY,
      consoleLogger,
      cl100k_base
    );
    const db = new LocalVectorDB(workspace, "testdb", embeddingApi);
    await db.addCollection("testA");
    await db.addCollection("testB");

    const collections = await db.listCollections();
    const names = collections.map((collection) => collection.name);
    const uris = collections.map((collection) => collection.uri);

    expect(names.length).toEqual(2);
    expect(names).toContain("testA");
    expect(names).toContain("testB");

    expect(uris.length).toEqual(2);
    expect(uris).toContain("testdb/testA");
    expect(uris).toContain("testdb/testB");
  });

  it("should properly separate collection data", async () => {
    const workspace = new InMemoryWorkspace();
    const env = new Env(process.env);
    const consoleLogger = new ConsoleLogger();
    const embeddingApi = new OpenAIEmbeddingAPI(
      env.OPENAI_API_KEY,
      consoleLogger,
      cl100k_base
    );
    const db = new LocalVectorDB(workspace, "testdb", embeddingApi);
    const collectionA = await db.addCollection("testA");
    const collectionB = await db.addCollection("testB");

    await collectionA.add(["Hello world", "Hello universe"]);

    await collectionB.add(["Goodbye world", "Goodbye universe"]);

    const resultsA = await collectionA.search("Hey", 4);
    const textsA = resultsA.map((result) => result.text());

    const resultsB = await collectionB.search("Hey", 4);
    const textsB = resultsB.map((result) => result.text());

    expect(textsA.length).toEqual(2);
    expect(textsB.length).toEqual(2);

    expect(textsA[0]).toContain("Hello");
    expect(textsA[1]).toContain("Hello");

    expect(textsB[0]).toContain("Goodbye");
    expect(textsB[1]).toContain("Goodbye");
  });

  it("should be able to save and load vectors", async () => {
    const workspace = new InMemoryWorkspace();
    const env = new Env(process.env);
    const consoleLogger = new ConsoleLogger();
    const embeddingApi = new OpenAIEmbeddingAPI(
      env.OPENAI_API_KEY,
      consoleLogger,
      cl100k_base
    );
    const db = new LocalVectorDB(workspace, "testdb", embeddingApi);
    const collection = await db.addCollection("test");

    await collection.add([
      "Goodbye world",
      "Hello world",
      "Goodbye universe",
      "Hello universe",
    ]);

    const results = await collection.search("Hey", 2);
    const texts = results.map((result) => result.text());

    expect(texts[0]).toEqual("Hello world");
    expect(texts[1]).toEqual("Hello universe");
  });

  it.skip('should handle large amounts of information', async () => {
    const workspace = new InMemoryWorkspace()
    const env = new Env(process.env);
    const consoleLogger = new ConsoleLogger();
    const embeddingApi = new OpenAIEmbeddingAPI(
      env.OPENAI_API_KEY,
      consoleLogger,
      cl100k_base
    )
    const db = new LocalVectorDB(workspace, "testdb", embeddingApi)
    const collection = await db.addCollection("test");
    const data = Array.from({ length: 10000 }, () => generateRandomString(10))

    await collection.add(data)

    const results = await collection.search("Hello", 5)
    expect(results.length).toEqual(5)
  })
})