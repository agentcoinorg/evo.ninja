from pydantic import BaseModel


class WebSearchResult(BaseModel):
    title: str
    url: str
    description: str
    relevancy: float
    query: str
    
    def __getitem__(self, item):
        return getattr(self, item)