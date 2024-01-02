from langchain.text_splitter import RecursiveCharacterTextSplitter
from evo_researcher.functions.create_embeddings_from_results import create_embeddings_from_results
from evo_researcher.functions.generate_subqueries import generate_subqueries
from evo_researcher.functions.prepare_report import prepare_report
from evo_researcher.functions.rerank_results import rerank_results

from evo_researcher.functions.rerank_subqueries import rerank_subqueries
from evo_researcher.functions.scrape_results import scrape_results
from evo_researcher.functions.search import search

def research(goal: str):
    initial_subqueries_limit = 20
    subqueries_limit = 3
    scrape_content_split_chunk_size = 500
    scrape_content_split_chunk_overlap = 150
    top_k = 4

    queries = generate_subqueries(query=goal, limit=initial_subqueries_limit)
    queries = rerank_subqueries(queries=queries, goal=goal)[:subqueries_limit]

    search_results_with_queries = search(queries, lambda result: not result["url"].startswith("https://www.youtube"))

    scrape_args = [result for (_, result) in search_results_with_queries]

    scraped = scrape_results(scrape_args)

    scraped = [result for result in scraped if result.content != ""]

    text_splitter = RecursiveCharacterTextSplitter(
        separators=["\n\n", "\n"],
        chunk_size=scrape_content_split_chunk_size,
        chunk_overlap=scrape_content_split_chunk_overlap
    )
    collection = create_embeddings_from_results(scraped, text_splitter)

    vector_result_texts: list[str] = []

    for query in queries:
        top_k_results = collection.similarity_search(query, k=top_k)
        vector_result_texts += [result.page_content for result in top_k_results]

    reranked_results = rerank_results(vector_result_texts, goal)

    report = prepare_report(goal, reranked_results)

    return report