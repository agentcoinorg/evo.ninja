from typing import Dict, List
from autogen.agentchat.contrib.gpt_assistant_agent import GPTAssistantAgent

from evopynja.functions import web_scrape
from evopynja.functions.web_research import web_search

def create_researcher(config_list: List[Dict]) -> GPTAssistantAgent:
    researcher = GPTAssistantAgent(
        name="researcher",
        instructions='''
        You will receive a research plan and your task is to search the web to fulfill it.
        After searching the web, scrape pages if you want more information from that source.
        Include your sources in your assessment
        ''',
        llm_config={
            "config_list": config_list,
            "tools": [
                {
                    "type": "function",
                    "function": {
                        "name": "web_search",
                        "description": "Search the web for information",
                        "parameters": {
                            "type": "object",
                            "properties": {
                                "query": {
                                    "type": "string",
                                    "description": "The query to search the internet for"
                                }
                            },
                            "required": [
                                "query"
                            ]
                        }
                    }
                },
                {
                    "type": "function",
                    "function": {
                        "name": "web_scrape",
                        "description": "Scrape a website and summarize the content",
                        "parameters": {
                            "type": "object",
                            "properties": {
                                "url": {
                                    "type": "string",
                                    "description": "The URL of the website to scrape"
                                },
                                "content_length_threshold": {
                                    "type": "integer",
                                    "description": "The minimum length of the content to scrape",
                                    "default": 10000
                                }
                            },
                            "required": [
                                "url"
                            ]
                        }
                    }
                }
            ]
        },
        verbose=True,
    )

    researcher.register_function(
        function_map={
            "web_scrape": web_scrape,
            "web_search": web_search
        }
    )
    
    return researcher