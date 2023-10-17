import { LocalDocumentStore } from "../embeddings/LocalDocumentStore"
import { LocalVectorDB } from "../embeddings/LocalVectorDB"
import { OpenAIEmbeddingAPI } from "../embeddings/OpenAIEmbeddingApi"
import { ConsoleLogger, Env, InMemoryWorkspace } from "../sys"
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
  it('should be able to save and load vectors', async () => {
    const workspace = new InMemoryWorkspace()
    const env = new Env(process.env);
    const consoleLogger = new ConsoleLogger();
    const embeddingApi = new OpenAIEmbeddingAPI(
      env.OPENAI_API_KEY,
      consoleLogger,
      cl100k_base
    )
    const store = new LocalDocumentStore(workspace, "testdb")
    const db = new LocalVectorDB(embeddingApi, store)

    await db.add([
      { text: "Goodbye world" },
      { text: "Hello world" },
      { text: "Goodbye universe" },
      { text: "Hello universe" },
    ])

    const results = await db.search("Hey", 2)
    const texts = results.map(result => result.text())

    expect(texts[0]).toEqual("Hello world")
    expect(texts[1]).toEqual("Hello universe")
  })

  it.skip('should handle large amounts of information', async () => {
    const workspace = new InMemoryWorkspace()
    const env = new Env(process.env);
    const consoleLogger = new ConsoleLogger();
    const embeddingApi = new OpenAIEmbeddingAPI(
      env.OPENAI_API_KEY,
      consoleLogger,
      cl100k_base
    )
    const store = new LocalDocumentStore(workspace, "testdb")
    const db = new LocalVectorDB(embeddingApi, store)
    const data = Array.from({ length: 10000 }, () => generateRandomString(10))

    await db.add(data.map(text => ({ text })))

    const results = await db.search("Hello", 5)
    expect(results.length).toEqual(5)
  })
})