import logging
import os
import re
import requests
from pydantic import BaseModel
from bs4 import BeautifulSoup
from scrapingbee import ScrapingBeeClient

def web_scrape(url: str) -> tuple[str, str]:
    print(f"-- Scraping {url} --")
    api_key = os.getenv("SCRAPINGBEE_API_KEY")
    client = ScrapingBeeClient(api_key=api_key)

    try:
        response = client.get(url=url)

        if 'text/html' in response.headers.get('Content-Type', ''):
            soup = BeautifulSoup(response.content, "html.parser")
            
            [x.extract() for x in soup.findAll('script')]
            [x.extract() for x in soup.findAll('style')]
            [x.extract() for x in soup.findAll('head')]
            
            text = soup.get_text()
            text = re.sub('(\n\n)\n*|\n', r'\1', text)
            
            return (url, text)
        else:
            logging.warning("Non-HTML content received")
            return ""

    except requests.RequestException as e:
        logging.error(f"HTTP request failed: {e}")
        return ""