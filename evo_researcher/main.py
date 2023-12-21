import os
from langchain.vectorstores.chroma import Chroma
from langchain.embeddings.openai import OpenAIEmbeddings
import click
from concurrent.futures import ThreadPoolExecutor, as_completed

from dotenv import load_dotenv
from autogen import config_list_from_json
from autogen import UserProxyAgent
import autogen

from langchain.chat_models import ChatOpenAI
from langchain.schema.output_parser import StrOutputParser
from langchain.output_parsers import CommaSeparatedListOutputParser
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain.prompts import ChatPromptTemplate
from evo_researcher.autonolas.research import research as research_autonolas
from evo_researcher.agents.planner import create_planner
from evo_researcher.agents.researcher import create_researcher
from evo_researcher.functions.rerank import rerank_results
from evo_researcher.functions.web_scrape import web_scrape, WebScrapeResult
from evo_researcher.functions.web_research import web_search, WebSearchResult

load_dotenv()
config_list = config_list_from_json("OAI_CONFIG_LIST")

AVAILABLE_AGENTS = ["autonolas", "evo"]

def research_langchain(goal: str):
    planning_prompt_template = """
    You are a professional researcher. Your goal is to prepare a research plan for {goal}.
    
    The plan will consist of multiple web searches separated by commas.
    Return ONLY the web searches, separated by commas and without quotes.
    
    Limit your searches to {search_limit}.
    """
    planning_prompt = ChatPromptTemplate.from_template(template=planning_prompt_template)
    
    plan_searches_chain = (
        planning_prompt |
        ChatOpenAI(model="gpt-4-1106-preview") |
        CommaSeparatedListOutputParser()
    )
    
    queries = plan_searches_chain.invoke({
        "goal": goal,
        "search_limit": 2
    })
    queries = [goal] + [query.strip('\"') for query in queries]
    
    search_results_by_url: dict[str, WebSearchResult] = {}
    
    with ThreadPoolExecutor(max_workers=5) as executor:
        futures = {executor.submit(web_search, query) for query in queries}
        for future in as_completed(futures):
            results = future.result()
            for result in results:
                search_results_by_url[result.url] = result
                
    scrape_results_by_url: dict[str, WebScrapeResult] = {}
    
    with ThreadPoolExecutor(max_workers=5) as executor:
        futures = {executor.submit(web_scrape, search_result.url) for search_result in list(search_results_by_url.values())}
        for future in as_completed(futures):
            result = future.result()
            scrape_results_by_url[result.url] = result
            
    text_splitter = RecursiveCharacterTextSplitter(separators=["\n\n", "\n"], chunk_size = 4000, chunk_overlap=500)
    collection = Chroma(embedding_function=OpenAIEmbeddings(api_key=os.getenv("OPENAI_API_KEY")))
            
    for scrape_result in list(scrape_results_by_url.values()):
        texts = text_splitter.split_text(scrape_result.text)
        metadatas = [search_results_by_url[scrape_result.url].model_dump() for _ in texts]
        
        collection.add_texts(
            texts=texts,
            metadatas=metadatas
        )
    
    vector_results = []
    
    for query in queries:
        top_k_results = collection.similarity_search(query, k=8)
        vector_results += top_k_results
    
    vector_result_texts: list[str] = [result.page_content for result in vector_results]
    
    # reranked_texts = rerank_results(vector_result_texts, goal)[:10]
            
    evaluation_prompt_template = """
    You are a professional researcher. Your goal is to answer: '{goal}'.
        
    Here are the results of relevant web searches:
    
    {reranked_texts}
    
    Prepare a comprehensive report that answers the question. If that is not possible,
    state why
    """
    evaluation_prompt = ChatPromptTemplate.from_template(template=evaluation_prompt_template)
    
    research_evaluation_chain = (
        evaluation_prompt |
        ChatOpenAI(model="gpt-4-1106-preview") |
        StrOutputParser()
    )
    
    response = research_evaluation_chain.invoke({
        "reranked_texts": vector_result_texts,
        "goal": goal
    })
    
    return response

def research_autogen(goal: str):
    user_proxy = UserProxyAgent(
        name="User_proxy",
        system_message="A human admin.",
        code_execution_config={"last_n_messages": 2, "work_dir": "groupchat"},
        human_input_mode="TERMINATE"
    )
    
    planner = create_planner(config_list)
    researcher = create_researcher(config_list)
    
    groupchat = autogen.GroupChat(
        agents=[
            user_proxy,
            planner,
            researcher
        ],
        messages=[],
        max_round=10
    )
    manager = autogen.GroupChatManager(
        groupchat=groupchat,
        llm_config={"config_list": config_list},
    )

    user_proxy.initiate_chat(manager, message=f"Prepare and then execute a research plan for: {goal}")
    
@click.command()
@click.option('--prompt',
              prompt='Prompt',
              required=True,
              help='Prompt')
@click.option('--agent',
              prompt=f"Agent to use ({AVAILABLE_AGENTS})",
              required=True,
              help='Agent')
def run(
    prompt: str,
    agent: str
):
    if agent == "autonolas":
        research_response = research_autonolas(prompt)
    elif agent == "evo":
        research_response = research_langchain(prompt)
    else:
        raise Exception(f"Invalid agent. Available agents: {AVAILABLE_AGENTS}")
    
    print(research_response)
    

if __name__ == '__main__':
    run()