from pydantic import BaseModel

class WebScrapeResult(BaseModel):
    query: str
    url: str
    title: str
    content: str

    def __getitem__(self, item):
        return getattr(self, item)