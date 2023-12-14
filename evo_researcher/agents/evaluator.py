from typing import Dict, List
from autogen.agentchat.contrib.gpt_assistant_agent import GPTAssistantAgent

def create_evaluator(config_list: List[Dict]) -> GPTAssistantAgent:
    evaluator = GPTAssistantAgent(
        name="evaluator",
        instructions='''
        You are a research results evaluator. Evaluate the results you're presented with in order to achieve the research plan.
        The objective is to provide the user with a thorough research report that includes sources and nuances.

        Assess the quality, accuracy, and depth of research conducted by other agents.
        Make sure that all steps of the research plan have been done.
        
        Respond 'No, you have to keep searching for the information' and point out what's missing or flawed.
        ''',
        llm_config={
            "config_list": config_list,
        },
        verbose=True,
    )
    
    return evaluator