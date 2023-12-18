import click

from dotenv import load_dotenv
from autogen import config_list_from_json
from autogen import UserProxyAgent
import autogen

from langchain.chat_models import ChatOpenAI
from langchain.output_parsers import CommaSeparatedListOutputParser
from langchain.schema.output_parser import StrOutputParser
from langchain.prompts import ChatPromptTemplate
from evo_researcher.agents.planner import create_planner
from evo_researcher.agents.researcher import create_researcher
from evo_researcher.functions.web_scrape import web_scrape
from evo_researcher.functions.web_research import web_search
from autonolas.research import research as autonolas_research

load_dotenv()
config_list = config_list_from_json("OAI_CONFIG_LIST")

def research_langchain(goal: str):
    planning_prompt_template = """
    You are a professional researcher. Your goal is to prepare a research plan for {goal}.
    
    The plan will consist of multiple web searches separated by commas.
    Return ONLY the web searches, separated by commas.
    
    Keep it to a max of 3 searches.
    """
    planning_prompt = ChatPromptTemplate.from_template(template=planning_prompt_template)
    
    plan_searches_chain = (
        planning_prompt |
        ChatOpenAI(model="gpt-4-1106-preview") |
        CommaSeparatedListOutputParser()
    )
    
    web_searches = plan_searches_chain.invoke({
        "goal": goal
    })
    
    print(web_searches)
    
    scraped = []
    for search in web_searches:
        sanitized_search_query = search.strip('\"')
        search_results = web_search(sanitized_search_query, max_results=3)
        
        for result in search_results:
            scraped_content = web_scrape(result["url"], sanitized_search_query, 5000)
            scraped.append({
                "query": sanitized_search_query,
                "url": result["url"],
                "title": result["title"],
                "content": scraped_content
            })
            
    evaluation_prompt_template = """
    You are a professional researcher. Your goal is to answer: '{goal}'.
    
    Here are the results of relevant web searches:
    
    {search_results}
    
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
        "search_results": scraped,
        "goal": goal
    })
    
    print(response)

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

# @click.command()
# @click.option('--goal',
#               prompt='Research goal',
#               required=True,
#               help='Research goal')
# def run(goal: str):
#     research_langchain(goal)
    
@click.command()
@click.option('--prompt',
              prompt='Prompt',
              required=True,
              help='Prompt')
def run(
    prompt: str
):
    response = autonolas_research(
                                  "prediction-sentence-embedding-conservative",
                                  prompt)
    
    print(response)
    

if __name__ == '__main__':
    run()