from langchain.embeddings.openai import OpenAIEmbeddings
from langchain.vectorstores.chroma import Chroma

import os

from evo_researcher.WebScrapeResult import WebScrapeResult

def create_embeddings_from_results(results: list[WebScrapeResult], text_splitter) -> Chroma:
    collection = Chroma(embedding_function=OpenAIEmbeddings(api_key=os.getenv("OPENAI_API_KEY")))
    texts = []
    # metadatas = []

    for scrape_result in results:
        texts += text_splitter.split_text(scrape_result.content)
        # metadatas += [scrape_result.model_dump() for _ in texts]

    collection.add_texts(
        texts=texts,
        # metadatas=metadatas
    )
    return collection