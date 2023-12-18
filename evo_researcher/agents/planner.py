from typing import Dict, List
from autogen.agentchat.contrib.gpt_assistant_agent import GPTAssistantAgent

from evo_researcher.functions import web_scrape
from evo_researcher.functions.web_research import web_search

def create_planner(config_list: List[Dict]) -> GPTAssistantAgent:
    planner = GPTAssistantAgent(
        name="planner",
        instructions='''
        You will be presented a question about something that may not have happened yet. You will do your best to plan a research to gather useful information to predict its answer.

        1. Break Down the Question: 
            - Divide big questions into smaller, related parts.
            - Example: Instead of "Votes of last US presidential winner?", ask:
            a. "When was the last US presidential election?"
            b. "Who won that election?"
            c. "How many votes did the winner get?"
            - If one search is enough, leave the question as is.
            
        2. Use Current Year:
            - If you need the current year in a search, use 2023
            
        3. Explain Your Steps:
            - Tell us how you came up with your plan.
            
        4. Be Clear and Brief:
            - Aim for accuracy and keep it short.
        ''',
        llm_config={
            "config_list": config_list,
        },
        verbose=True,
    )
    
    planner.register_function(
        function_map={
            "web_scrape": web_scrape,
            "web_search": web_search
        }
    )
    
    return planner
