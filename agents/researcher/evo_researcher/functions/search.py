from evo_researcher.functions.web_search import WebSearchResult, web_search
from concurrent.futures import ThreadPoolExecutor, as_completed

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