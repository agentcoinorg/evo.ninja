import logging
import os
import re
import requests
from pydantic import BaseModel
from bs4 import BeautifulSoup
from scrapingbee import ScrapingBeeClient

class WebScrapeResult(BaseModel):
    url: str
    text: str
    
    def __getitem__(self, item):
        return getattr(self, item)

def web_scrape(url: str) -> WebScrapeResult:
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
            
            result = WebScrapeResult(
                url=url,
                text=text
            )
            
            return result
        else:
            logging.warning("Non-HTML content received")
            return ""

    except requests.RequestException as e:
        logging.error(f"HTTP request failed: {e}")
        return ""