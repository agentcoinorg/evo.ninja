import { LocalDocumentStore } from "../memory/LocalDocumentStore"
import { LocalVectorDB } from "../memory/LocalVectorDB"
import { OpenAIEmbeddingAPI } from "../memory/OpenAIEmbeddingApi"
import { ConsoleLogger, Env, InMemoryWorkspace } from "../sys"
import dotenv from "dotenv";
import path from "path";

dotenv.config({
  path: path.join(__dirname, "../../../../.env")
});

jest.setTimeout(60000)

describe('Local Vector DB', () => {
  it('should be able to save and load vectors', async () => {
    const workspace = new InMemoryWorkspace()
    const env = new Env(process.env);
    const consoleLogger = new ConsoleLogger();
    const embeddingApi = new OpenAIEmbeddingAPI(
      env.OPENAI_API_KEY,
      "text-embedding-ada-002",
      consoleLogger
    )
    const store = new LocalDocumentStore(workspace, "testdb")
    const db = new LocalVectorDB(embeddingApi, store, {
      maxParallelRequests: 2
    })

    await db.bulkAdd([
      { text: "Goodbye world" },
      { text: "Hello world" },
      { text: "Goodbye universe" },
      { text: "Hello universe" },
    ])

    const results = await db.search("Hello", 2)
    const texts = results.map(result => result.text())

    expect(texts[0]).toEqual("Hello world")
    expect(texts[1]).toEqual("Hello universe")
  })
})