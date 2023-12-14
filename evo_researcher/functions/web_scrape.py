import json
import logging
import os
import requests
from markdownify import markdownify
from bs4 import BeautifulSoup

def web_scrape(url: str, content_length_threshold: int = 10000):
    headers = {'Cache-Control': 'no-cache', 'Content-Type': 'application/json'}
    data_json = json.dumps({"url": url})
    api_key = os.getenv("BROWSERLESS_API_KEY")

    try:
        response = requests.post(f"https://chrome.browserless.io/content?token={api_key}", headers=headers,
                                 data=data_json)
        response.raise_for_status()

        if 'text/html' in response.headers.get('Content-Type', ''):
            soup = BeautifulSoup(response.content, "html.parser")
            text = soup.get_text()

            if len(text) > content_length_threshold:
                return markdownify(text)  # Ensure summary function is defined/imported
            else:
                return text
        else:
            logging.warning("Non-HTML content received")
            return ""

    except requests.RequestException as e:
        logging.error(f"HTTP request failed: {e}")
        raise