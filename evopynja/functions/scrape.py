import requests
import json
from bs4 import BeautifulSoup
import logging

from functions.summarize import summarize


def web_scraping(objective: str, url: str, browserless_api_key: str,
                 content_length_threshold: int = 10000):
    logging.info("Scraping website...")

    headers = {'Cache-Control': 'no-cache', 'Content-Type': 'application/json'}
    data_json = json.dumps({"url": url})

    try:
        response = requests.post(f"https://chrome.browserless.io/content?token={browserless_api_key}", headers=headers,
                                 data=data_json)
        response.raise_for_status()

        if 'text/html' in response.headers.get('Content-Type', ''):
            soup = BeautifulSoup(response.content, "html.parser")
            text = soup.get_text()

            if len(text) > content_length_threshold:
                return summarize(objective, text)  # Ensure summary function is defined/imported
            else:
                return text
        else:
            logging.warning("Non-HTML content received")
            return ""

    except requests.RequestException as e:
        logging.error(f"HTTP request failed: {e}")
        raise
