import sys
import os
from dotenv import load_dotenv
from autogen import config_list_from_json
from autogen.agentchat.contrib.gpt_assistant_agent import GPTAssistantAgent
from autogen import UserProxyAgent
import autogen

load_dotenv()


api_keys = [os.getenv("OPENAI_API_KEY")]
api_type = "openai"  # Type of API, e.g., "openai"  "aoai".

config_list = autogen.get_config_list(
    api_keys,
)

gpt4config = {
            "config_list": config_list,
            "model": "gpt-4-1106-preview",
            "assistant_id": None,
            "temperature": 0.2,
            "assistant_id":None
        }

gpt4config={
    "timeout": 600,
    "cache_seed": 44,  # change the seed for different trials
    "config_list": config_list,
    "temperature": 0,
}

def get_goal_argument():
    # Check if the '--goal' argument is provided in the command line
    if '--goal' in sys.argv:
        goal_index = sys.argv.index('--goal') + 1
        if goal_index < len(sys.argv):
            return sys.argv[goal_index]
    return None

def main(goal: str):

    # create a UserProxyAgent instance named "user_proxy"
    user_proxy = autogen.UserProxyAgent(
        name="user_proxy",
        system_message="Respond as concisely as possible. If you can't figure out a solution make your best guess.",
        human_input_mode="NEVER",
        default_auto_reply="Hey, sorry you're confused. Hope you have come up with an answer. If you can't figure out a solution make your best wild guess.",
        is_termination_msg=lambda x: True if "TERMINATE" in x.get("content") else False,
        max_consecutive_auto_reply=1,
        code_execution_config={
            "work_dir": "coding",
            "use_docker": False,
        }
    )


    researcher = GPTAssistantAgent(
        name="research_manager",
        description="you research projects",
        instructions="You need to figure out the answer to the questions we receive!",

        llm_config=gpt4config
    )

    data_analyst = GPTAssistantAgent(
        name="data_analyst",
        description="you analyze data",
        instructions="Analyze data to come to conclusions.",
        llm_config=gpt4config
    )

    developer = GPTAssistantAgent(
        name="developer",
        description="makes python scripts",
        instructions="You are a super solver, able to find the most difficult data challenges with amazing python scripts.",
        llm_config=gpt4config
    )

    # Create group chat
    groupchat = autogen.GroupChat(agents=[
        researcher,
        developer,
        user_proxy,
    ], messages=[], max_round=15)
    group_chat_manager = autogen.GroupChatManager(groupchat=groupchat, llm_config={"config_list": config_list})

    user_proxy.initiate_chat(group_chat_manager, message=goal)

if __name__ == '__main__':
    goal = get_goal_argument()

    main(goal)