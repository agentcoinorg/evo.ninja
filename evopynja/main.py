import json
import logging
import os
from markdownify import markdownify
from bs4 import BeautifulSoup
import click
from autogen.agentchat.contrib.gpt_assistant_agent import GPTAssistantAgent

from langchain.chains.summarize import load_summarize_chain
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain_community.chat_models import ChatOpenAI
from langchain_core.prompts import PromptTemplate

from dotenv import load_dotenv
from autogen import config_list_from_json
from autogen import UserProxyAgent
import autogen
import requests

load_dotenv()
config_list = config_list_from_json("OAI_CONFIG_LIST")

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


def web_search(query, max_results=10):
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
        "api_key": os.getenv("SERP_API_KEY")
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

    # Return the top `max_results` results
    return results

# Create user proxy agent

@click.command()
@click.option('--goal',
              prompt='Research goal',
              required=True,
              help='The question to answer through research')
def main(goal: str):
    user_proxy = UserProxyAgent(name="user_proxy",
                                is_termination_msg=lambda msg: "TERMINATE" in msg["content"],
                                human_input_mode="ALWAYS",
                                max_consecutive_auto_reply=1
                                )

    research_planner = GPTAssistantAgent(
        name="research_planner",
        llm_config={
            "config_list": config_list,
            "assistant_id": "asst_dG7xuXtd3j4O6WpdR7hkT8zK"
        },
        verbose=True,
    )

    research_planner.register_function(
        function_map={
            "web_scrape": web_scrape,
            "web_search": web_search
        }
    )
    
    research_evaluator = GPTAssistantAgent(
        name="research_evaluator",
        llm_config={
            "config_list": config_list,
            "assistant_id": "asst_USStI8GI6FFM0XYU2Eip8xKT"
        },
        verbose=True,
    )
    
    researcher = GPTAssistantAgent(
        name="researcher",
        llm_config={
            "config_list": config_list,
            "assistant_id": "asst_PTd9I7W6yoBMDWp9BhbMy33t"
        },
        verbose=True,
    )
    
    researcher.register_function(
        function_map={
            "web_scrape": web_scrape,
            "web_search": web_search
        }
    )

    # Create group chat
    groupchat = autogen.GroupChat(agents=[
        research_planner,
        research_evaluator,
        researcher,
    ], messages=[], max_round=15)
    group_chat_manager = autogen.GroupChatManager(
        groupchat=groupchat,
        llm_config={"config_list": config_list},
        system_message='''You are a research manager that will be required to elaborate a report
        to answer, or help predict the answer, to a question. You will:
        
        1. Instruct the planner agent to plan the research for you. ONLY CALL THE PLANNER ONCE. DO NOT EVALUATE PLANS
        2. Use the researcher agent for the execution of each step of the plan
        3. Evaluate the research done for each step using the research evaluator.
        
        After the plan has been achieved, provide a comprehensive report to the user.
        '''
    )

    user_proxy.initiate_chat(group_chat_manager, message=goal)
    click.echo(f"Research started ...")

if __name__ == '__main__':
    main()