import json
from langchain.chat_models import ChatOpenAI
from langchain.prompts import ChatPromptTemplate
from langchain.schema.output_parser import StrOutputParser
from langchain.output_parsers import PydanticOutputParser
from langchain_core.runnables import RunnableParallel
from langchain_core.pydantic_v1 import BaseModel

class GradeDetails(BaseModel):
    explanation: str
    grade: int

class InfoScores(BaseModel):
    relevance: GradeDetails
    accuracy: GradeDetails
    completeness: GradeDetails
    timeliness: GradeDetails
    objectivity: GradeDetails
    usefulness: GradeDetails
    final_grade: GradeDetails


grading_prompt_template = """
    You are a professional information evaluator. Your goal is to grade the information
    that is given to you.
    
    The information you will be given is research that will be used to make an informed
    prediction on the question: {question}.
    
    Consider the following criteria:
    
    - relevance: How relevant is the information to the question?
    - accuracy: How accurate is the information?
    - completeness: How complete is the information?
    - timeliness: How timely is the information?
    - objectivity: How objective is the information?
    - usefulness: How useful is the information?
    
    Please grade the information on an integer scale of 1-100 for each criteria.
    Take it step by step and provide a detailed explanation for each grade.
    
    Finally provide a final general grade for the information as a whole.
    
    Respond strictly in a single JSON formatted string, with the following form:
    
    {{ "relevance": {{ "explanation": "...", "grade": "..." }}, ..., "final_grade": {{ ... }} }}
    
    Information:
    
    {info}
    """
    
aggregate_grading_prompt_template = """
    I have generated the following results to grade information on the question: {question}.
    
    Select the most consistent result based on majority consensus.
    Respond strictly in a single JSON formatted string, with the following form:
    
    {{ "relevance": {{ "explanation": "...", "grade": "..." }}, ..., "final_grade": {{ ... }} }}
    
    Results:
    
    {results}
    """

def grade_info(info: str, question: str, consistency_iterations: int = 3) -> InfoScores:
    
    grading_prompt = ChatPromptTemplate.from_template(template=grading_prompt_template)
    
    llm = ChatOpenAI(model="gpt-4-1106-preview")
    
    grading_chain = (
        grading_prompt |
        llm |
        StrOutputParser()
    )
    
    parallel_map = {f"grading_{i}": grading_chain for i in range(consistency_iterations)}
    
    parallel_chain = RunnableParallel(parallel_map)
    grading_results = parallel_chain.invoke({
        "info": info,
        "question": question
    })
    
    grading_results = list(grading_results.values())

    aggregate_grading_prompt = ChatPromptTemplate.from_template(template=aggregate_grading_prompt_template)

    aggregate_grading_chain = (
        aggregate_grading_prompt |
        llm |
        PydanticOutputParser(pydantic_object=InfoScores)
    )
    
    response = aggregate_grading_chain.invoke({
        "question": question,
        "results": json.dumps(grading_results)
    })
    
    return response