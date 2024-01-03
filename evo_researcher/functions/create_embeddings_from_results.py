from langchain.embeddings.openai import OpenAIEmbeddings
from langchain.vectorstores.chroma import Chroma

import os

from evo_researcher.models.WebScrapeResult import WebScrapeResult

def create_embeddings_from_results(results: list[WebScrapeResult], text_splitter) -> Chroma:
    collection = Chroma(embedding_function=OpenAIEmbeddings(api_key=os.getenv("OPENAI_API_KEY")))
    texts = []
    metadatas = []

    for scrape_result in results:
        text_splits = text_splitter.split_text(scrape_result.content)
        texts += text_splits
        metadatas += [scrape_result.model_dump() for _ in text_splits]
        
    print(f"Created {len(texts)} embeddings")
    print(f"Created {len(metadatas)} metadatas")      

    collection.add_texts(
        texts=texts,
        metadatas=metadatas
    )
    return collection