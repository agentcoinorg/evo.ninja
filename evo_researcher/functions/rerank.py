from langchain.prompts import ChatPromptTemplate
from langchain.chat_models import ChatOpenAI
from langchain.output_parsers import CommaSeparatedListOutputParser

rerank_results_template = """
I will present you with a list of text snippets gathered from web searches
to answer the question: {goal}.

Rank the snippets in order of relevance to the question.
Return them as a comma separated list of snippets, without quotes.

Snippets: {results}
"""

def rerank_results(results: list[str], goal: str) -> list[str]:
    rerank_results_prompt = ChatPromptTemplate.from_template(template=rerank_results_template)
    
    rerank_results_chain = (
        rerank_results_prompt |
        ChatOpenAI(model="gpt-4-1106-preview") |
        CommaSeparatedListOutputParser()
    )
    
    response = rerank_results_chain.invoke({
        "goal": goal,
        "results": "\n-----\n".join(results)
    })
    
    return response