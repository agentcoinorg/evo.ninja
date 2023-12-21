import json
import os
from dotenv import load_dotenv
from langchain.vectorstores.chroma import Chroma
from langchain.embeddings.openai import OpenAIEmbeddings
from langchain.text_splitter import RecursiveCharacterTextSplitter
from concurrent.futures import ThreadPoolExecutor, as_completed
from langchain.chat_models import ChatOpenAI
from langchain.output_parsers import CommaSeparatedListOutputParser
from langchain.schema.output_parser import StrOutputParser
from langchain.prompts import ChatPromptTemplate
from pydantic import BaseModel
from evo_researcher.functions.web_scrape import web_scrape
from evo_researcher.functions.web_research import WebSearchResult, web_search

class WebScrapeResult(BaseModel):
    query: str
    url: str
    title: str
    content: str
    
    def __getitem__(self, item):
        return getattr(self, item)

load_dotenv()

subquery_generation_template = """
You are a professional researcher. Your goal is to prepare a research plan for {query}.

The plan will consist of multiple web searches separated by commas.
Return ONLY the web searches, separated by commas and without quotes.

Limit your searches to {search_limit}.
"""

def generate_subqueries(query: str, limit: int) -> list[str]:
    subquery_generation_prompt = ChatPromptTemplate.from_template(template=subquery_generation_template)
    
    subquery_generation_chain = (
        subquery_generation_prompt |
        ChatOpenAI(model="gpt-4-1106-preview") |
        CommaSeparatedListOutputParser()
    )
    
    subqueries = subquery_generation_chain.invoke({
        "query": query,
        "search_limit": limit
    })
    
    return [query] + [subquery.strip('\"') for subquery in subqueries]

rerank_results_template = """
I will present you with a list of text snippets gathered from web searches
to answer the question: {goal}.

Rank the snippets in order of relevance to the question.
Return them as a comma separated list of snippets, without quotes.

Snippets: {results}
"""

def rerank_results(results: list[str], goal: str) -> list[str]:
    rerank_results_prompt = ChatPromptTemplate.from_template(template=rerank_results_template)
    
    rerank_results_chain = (
        rerank_results_prompt |
        ChatOpenAI(model="gpt-4-1106-preview") |
        CommaSeparatedListOutputParser()
    )
    
    response = rerank_results_chain.invoke({
        "goal": goal,
        "results": json.dumps(results)
    })
    
    return response

def scrape_results(results: list[tuple[str, WebSearchResult]]) -> list[WebScrapeResult]:
    scraped: list[WebScrapeResult] = []
    results_by_url = {result.url: result for (_, result) in results}
    
    with ThreadPoolExecutor(max_workers=5) as executor:
        futures = {executor.submit(web_scrape, result.url, query, 5000) for (query, result) in results}
        for future in as_completed(futures):
            (scraped_content, url) = future.result()
            result = results_by_url[url]
            scraped.append(WebScrapeResult(
                query=result.query,
                url=result.url,
                title=result.title,
                content=scraped_content
            ))

    return scraped

def prepare_report(goal: str, scraped: list[WebScrapeResult]):
    evaluation_prompt_template = """
    You are a professional researcher. Your goal is to answer: '{goal}'.
    
    Here are the results of relevant web searches:
    
    {search_results}
    
    Prepare a comprehensive report that answers the question. If that is not possible,
    state why
    """
    evaluation_prompt = ChatPromptTemplate.from_template(template=evaluation_prompt_template)
    
    research_evaluation_chain = (
        evaluation_prompt |
        ChatOpenAI(model="gpt-4-1106-preview") |
        StrOutputParser()
    )
    
    response = research_evaluation_chain.invoke({
        "search_results": scraped,
        "goal": goal
    })
    
    return response

def search(queries: list[str], filter = lambda x: True) -> list[tuple[str, WebSearchResult]]:
    results: list[list[WebSearchResult]] = []
    results_with_queries: list[tuple[str, WebSearchResult]] = []

    # Each result will have a query associated with it
    # We only want to keep the results that are unique
    with ThreadPoolExecutor(max_workers=5) as executor:
        futures = {executor.submit(web_search, query) for query in queries}
        for future in as_completed(futures):
            results.append(future.result())
                
    for i in range(len(results)):
        for result in results[i]:
            if result.url not in [existing_result.url for (_,existing_result) in results_with_queries]:
                if filter(result):
                  results_with_queries.append((queries[i], result))

    return results_with_queries

def create_embeddings_from_results(results: list[WebScrapeResult], text_splitter) -> Chroma:
    collection = Chroma(embedding_function=OpenAIEmbeddings(api_key=os.getenv("OPENAI_API_KEY")))
            
    for scrape_result in results:
        texts = text_splitter.split_text(scrape_result.content)
        metadatas = [scrape_result.model_dump() for _ in texts]
        
        collection.add_texts(
            texts=texts,
            metadatas=metadatas
        )

def research(goal: str):
    queries = generate_subqueries(query=goal, limit=3)

    results = search(queries, lambda result: not result["url"].startswith("https://www.youtube"))

    scrape_args = [(query, result.url) for (query, result) in results]
    scraped = scrape_results(scrape_args)
    
    text_splitter = RecursiveCharacterTextSplitter(separators=["\n\n", "\n"], chunk_size = 4000, chunk_overlap=500)
    collection = create_embeddings_from_results(scraped, text_splitter)
    
    vector_result_texts: list[str] = []
    
    for query in queries:
        top_k_results = collection.similarity_search(query, k=8)
        vector_result_texts += [result.page_content for result in top_k_results]
        
    reranked_results = rerank_results(vector_result_texts, goal)[:10]
    print(reranked_results)
    
    report = prepare_report(goal, scraped) 

    print(report)

research("Will Twitter implement a new misinformation policy before the 2024 elections?")