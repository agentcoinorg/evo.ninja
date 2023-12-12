import click
import os
from dotenv import load_dotenv
from autogen import config_list_from_json
from autogen.agentchat.contrib.gpt_assistant_agent import GPTAssistantAgent
from autogen import UserProxyAgent
import autogen

load_dotenv()
brwoserless_api_key = os.getenv("BROWSERLESS_API_KEY")
config_list = config_list_from_json("OAI_CONFIG_LIST")

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
        name="researcher",
        llm_config={
            "config_list": config_list,
            "assistant_id": "asst_dG7xuXtd3j4O6WpdR7hkT8zK"
        }
    )

    researcher = GPTAssistantAgent(
        name="research_manager",
        llm_config={
            "config_list": config_list,
            "assistant_id": "asst_USStI8GI6FFM0XYU2Eip8xKT"
        }
    )

    tech_researcher = GPTAssistantAgent(
        name="researcher",
        llm_config={
            "config_list": config_list,
            "assistant_id": "asst_dFAlb63sfXWGqMTADd6ccEux"
        }
    )

    conflicts_researcher = GPTAssistantAgent(
        name="researcher",
        llm_config={
            "config_list": config_list,
            "assistant_id": "asst_AUHkbN3KlTrKrCru2ivCIBCt"
        }
    )

    economics_researcher = GPTAssistantAgent(
        name="researcher",
        llm_config={
            "config_list": config_list,
            "assistant_id": "asst_LX9C3PQVPBIEG262XF0LU7PB"
        }
    )

    data_analyst = GPTAssistantAgent(
        name="researcher",
        llm_config={
            "config_list": config_list,
            "assistant_id": "asst_SLqASyuY9S1dSQ1gKxRaN5eb"
        }
    )

    historical_analyst = GPTAssistantAgent(
        name="researcher",
        llm_config={
            "config_list": config_list,
            "assistant_id": "asst_B2zz2WIE5EwLeTg8lHn67PHt"
        }
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
    click.echo(f"Hello {name}!")

if __name__ == '__main__':
    main()