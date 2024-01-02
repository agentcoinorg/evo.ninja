from langchain.chat_models import ChatOpenAI
from langchain.prompts import ChatPromptTemplate
from langchain.schema.output_parser import StrOutputParser

def prepare_report(goal: str, scraped: list[str]):
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

    return response