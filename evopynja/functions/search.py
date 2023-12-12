import requests


def search_web(query, api_key, max_results=10):
    # Base URL for the API
    base_url = "https://serpapi.com/search"

    # Construct the parameters for the request
    params = {
        "engine": "google",
        "q": query,
        "location_requested": "United States",
        "location_used": "United States",
        "google_domain": "google.com",
        "hl": "en",
        "gl": "us",
        "device": "desktop",
        "api_key": api_key
    }

    # Make the request to the API
    response = requests.get(base_url, params=params, headers={"Accept": "application/json"})

    # Ensure the response is successful
    response.raise_for_status()

    # Extract the organic results from the response
    organic_results = response.json().get("organic_results", [])

    # Transform the results
    transformed_results = [
        {
            "title": result.get("title", ""),
            "url": result.get("link", ""),
            "description": result.get("snippet", "")
        }
        for result in organic_results
    ]

    results = transformed_results[:max_results]
    print(results)

    # Return the top `max_results` results
    return results
