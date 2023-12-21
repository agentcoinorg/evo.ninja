from typing import List
from langchain.prompts import ChatPromptTemplate
from langchain.chat_models import ChatOpenAI
from langchain.output_parsers import CommaSeparatedListOutputParser

subquestion_generation_template = """
You are an AI assistant that specializes in breaking down complex questions into simpler, manageable sub-questions.
When presented with a complex user question, your role is to generate a list of sub-questions that,
when answered, will comprehensively address the original question.
If a user question is straightforward, your task is to return the original question

Respond strictly in a list of comma separated questions.

User question: {question}
"""

def generate_subquestions(question: str) -> List[str]:
    subquestion_generation_prompt = ChatPromptTemplate.from_template(template=subquestion_generation_template)
    
    subquestion_generation_chain = (
        subquestion_generation_prompt |
        ChatOpenAI(model="gpt-4-1106-preview") |
        CommaSeparatedListOutputParser()
    )
    
    response = subquestion_generation_chain.invoke({
        "question": question
    })
    
    return response
