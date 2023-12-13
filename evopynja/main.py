# https://github.com/microsoft/autogen/blob/main/notebook/agentchat_hierarchy_flow_using_select_speaker.ipynb

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
        instructions='''
        You will be presented a question about something that has not happened yet and does not have a definitive answer.
        You will do your best to plan a research to gather useful information to predict its answer.

        1. Research the web to gather information about the question

        2. Break Down the Question: 
          - Divide big questions into smaller, related parts.
          - Example: Instead of "Votes of last US presidential winner?", ask:
            a. "When was the last US presidential election?"
            b. "Who won that election?"
            c. "How many votes did the winner get?"
          - If one search is enough, leave the question as is.
            
        3. Use Current Year:
          - If you need the current year in a search, use 2023
            
        4. Explain Your Steps:
          - Tell us how you came up with your plan.
            
        5. Be Clear and Brief:
          - Aim for accuracy and keep it short.
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

    research_planner.register_function(
        function_map={
            "web_scrape": web_scrape,
            "web_search": web_search
        }
    )
    
    research_evaluator = GPTAssistantAgent(
        name="research_evaluator",
        instructions='''
        You are a research results evaluator. Evaluate the results you're presented with in order to answer the user's question.
        The user's question is a binary (yes or no) question that cannot be definitively answered.
        The objective is to provide the user with a research report for him to make an informed prediction.

        Assess the quality, accuracy, and depth of research conducted by other agents.
        Before approving any findings, ensure that all claims are backed by solid evidence and robust methodologies.
        Respond 'No, you have to keep searching for the information' and point out what's missing or flawed, if you feel the results do not meet the standard.
        ''',
        llm_config={
            "config_list": config_list,
        },
        verbose=True,
    )
    
    researcher = GPTAssistantAgent(
        name="researcher",
        instructions='''
        You will receive a specific step of a research plan and your task is to search the web to fulfill it.
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