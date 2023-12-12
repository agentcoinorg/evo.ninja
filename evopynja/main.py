import click
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
brwoserless_api_key = os.getenv("BROWSERLESS_API_KEY")

gpt4config = {
            "config_list": config_list,
            "model": "gpt-4-0613",
            "assistant_id": None,
            "temperature": 0.2,
            "assistant_id":None
        }

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
        name="researcher",
        description="placeholder text",
        llm_config=gpt4config
    )

    researcher = GPTAssistantAgent(
        name="research_manager",
        description="placeholder text",
        llm_config=gpt4config
    )

    tech_researcher = GPTAssistantAgent(
        name="researcher",
        description="placeholder text",
        llm_config=gpt4config
    )

    conflicts_researcher = GPTAssistantAgent(
        name="researcher",
        description="placeholder text",
        llm_config=gpt4config
    )

    economics_researcher = GPTAssistantAgent(
        name="researcher",
        description="placeholder text",
        llm_config=gpt4config
    )

    data_analyst = GPTAssistantAgent(
        name="researcher",
        description="placeholder text",
        llm_config=gpt4config
    )

    historical_analyst = GPTAssistantAgent(
        name="researcher",
        description="placeholder text",
        llm_config=gpt4config
    )

    # Create group chat
    groupchat = autogen.GroupChat(agents=[
        research_planner,
        researcher,
        user_proxy,
        tech_researcher,
        conflicts_researcher,
        economics_researcher,
        data_analyst,
        historical_analyst
    ], messages=[], max_round=15)
    group_chat_manager = autogen.GroupChatManager(groupchat=groupchat, llm_config={"config_list": config_list})

    user_proxy.initiate_chat(group_chat_manager, message=goal)
    click.echo(f"Hello !")

if __name__ == '__main__':
    main()