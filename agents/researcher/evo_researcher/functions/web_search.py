import os
from dotenv import load_dotenv
from tavily import TavilyClient

from evo_researcher.models.WebSearchResult import WebSearchResult

load_dotenv()
tavily = TavilyClient(api_key=os.getenv("TAVILY_API_KEY"))

def web_search(query: str, max_results=5) -> list[WebSearchResult]:
    print(f"-- Searching the web for {query} --")
    response = tavily.search(
        query=query,
        search_depth="advanced",
        max_results=max_results,
    )

    transformed_results = [
        WebSearchResult(
            title=result['title'],
            url=result['url'],
            description=result['content'],
            relevancy=result['score'],
            query=query
        )
        for result in response['results']
    ]

    return transformed_results