import click

from dotenv import load_dotenv
from autogen import config_list_from_json
from autogen import UserProxyAgent
import autogen

from evo_researcher.agents.planner import create_planner
from evo_researcher.agents.researcher import create_researcher

load_dotenv()
config_list = config_list_from_json("OAI_CONFIG_LIST")

def research(goal: str):
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
@click.option('--goal',
              prompt='Research goal',
              required=True,
              help='Research goal')
def run(goal: str):
    research(goal)
    

if __name__ == '__main__':
    run()