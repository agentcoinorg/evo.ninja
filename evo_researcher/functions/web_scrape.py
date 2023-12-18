import json
import logging
import os
import requests
from markdownify import markdownify
from bs4 import BeautifulSoup
from scrapingbee import ScrapingBeeClient
from evo_researcher.functions.summarize import summarize

def web_scrape(url: str, objective: str, content_length_threshold: int = 10000):
    print(f"-- Scraping {url} --")
    api_key = os.getenv("SCRAPINGBEE_API_KEY")
    client = ScrapingBeeClient(api_key=api_key)

    try:
        response = client.get(url=url)

        if 'text/html' in response.headers.get('Content-Type', ''):
            soup = BeautifulSoup(response.content, "html.parser")
            text = soup.get_text()
            markdown_text = markdownify(text)

            if len(markdown_text) > content_length_threshold:
                return summarize(objective=objective, content=markdown_text)
            else:
                return markdown_text
        else:
            logging.warning("Non-HTML content received")
            return ""

    except requests.RequestException as e:
        logging.error(f"HTTP request failed: {e}")
        return ""