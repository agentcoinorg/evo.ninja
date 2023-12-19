from langchain.chat_models import ChatOpenAI
from langchain.prompts import ChatPromptTemplate
from langchain.schema.output_parser import StrOutputParser

def grade_info(info: str, question: str):
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
    
    Please grade the information on a scale of 1-100 for each criteria.
    Take it step by step and provide a detailed explanation for each grade.
    
    Respond in a JSON format where each criteria is a key,
    and each key has a subobject with an 'explanation' and a 'grade' key.
    
    Information:
    
    {info}
    """
    grading_prompt = ChatPromptTemplate.from_template(template=grading_prompt_template)
    
    llm = ChatOpenAI(model="gpt-4-1106-preview")
    
    grading_chain = (
        grading_prompt |
        llm |
        StrOutputParser()
    )
    
    response = grading_chain.invoke({
        "info": info,
        "question": question
    })
    
    return response