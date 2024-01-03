from langchain.chat_models import ChatOpenAI
from langchain.prompts import ChatPromptTemplate
from langchain.schema.output_parser import StrOutputParser
from langchain.output_parsers import PydanticOutputParser
from langchain_core.pydantic_v1 import BaseModel

class InfoScores(BaseModel):
    credibility: int
    bias: int
    accuracy: int
    currency: int
    relevance: int
    significance: int
    
grading_planning_prompt_template = """
You are a professional information evaluator. Your goal is to 
evaluate research for making an informed prediction to answer the question: {question}.

Limit yourself to the following criteria:

* Credibility: Assess the source's credibility based on the author's credentials, logical arguments, and documentation backed by scholarly literature​​.
* Bias: Examine if the source has a hidden agenda or dismisses other viewpoints​​.
* Accuracy: Check for supporting documentation for presented facts and contradictions with other reliable sources​​.
* Currency: Ensure the information is current and up-to-date, particularly important for rapidly evolving topics​​.
* Relevance: The information should be relevant to the specific topic of interest​​.
* Significance: Evaluate if the information is significant and not trivial or too general​

How would you approach grading the information for each of these criteria?
Let's think about it step by step.
"""


grading_prompt_template = """
You are a professional information evaluator. Your goal is to 
evaluate research for making an informed prediction to answer the question: {question}.

Here is the plan you came up with to evaluate the information:

{plan}

Limit yourself to the criteria in the plan.

Now you will be given a piece of information to evaluate, according to the plan.
Provide a single numeric score for each criteria, from 0 to 100, where 0 is the worst and 100 is the best.
Provide a step by step justification for each score.

Information:

{information}
"""

grading_format_prompt_template = """
You will be given an evaluation of information you graded. It contains scores for different
evaluation criteria. Extract the score for each criteria and return them in the following
format:

{{ "one_of_the_criteria": xx, ... }}

Where xx is a number. Only respond with a single JSON. The keys should be lowercase and snake_case.

{report}
"""

def grade_info(question: str, information: str) -> InfoScores:
    grading_prompt = ChatPromptTemplate.from_template(template=grading_prompt_template)
    planning_prompt = ChatPromptTemplate.from_template(template=grading_planning_prompt_template)
    formatting_prompt = ChatPromptTemplate.from_template(template=grading_format_prompt_template)
    
    llm = ChatOpenAI(model="gpt-4-1106-preview")
    
    planning_chain = (
        planning_prompt |
        llm |
        StrOutputParser()
    )
    
    grading_chain = (
        grading_prompt |
        llm |
        StrOutputParser()
    )
    
    formatting_chain = (
        formatting_prompt |
        llm |
        PydanticOutputParser(pydantic_object=InfoScores)
    )
    
    plan = planning_chain.invoke({
        "question": question
    })
    
    report = grading_chain.invoke({
        "question": question,
        "plan": plan,
        "information": information
    })
    
    grades = formatting_chain.invoke({
        "report": report
    })
    
    return grades