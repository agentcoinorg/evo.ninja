from langchain.chat_models import ChatOpenAI
from langchain.output_parsers import CommaSeparatedListOutputParser
from langchain.prompts import ChatPromptTemplate

rerank_results_template = """
I will present you with a list of text snippets gathered from web searches
to answer the question: {goal}.

The snippets are divided by '---snippet---'

Rank the snippets in order of relevance to the question.

Return the snippets ordered by relevance, separated by commas and no quotes.

Snippets: {results}
"""
def rerank_results(results: list[str], goal: str) -> list[str]:
    rerank_results_prompt = ChatPromptTemplate.from_template(template=rerank_results_template)

    rerank_results_chain = (
        rerank_results_prompt |
        ChatOpenAI(model="gpt-4-1106-preview") |
        CommaSeparatedListOutputParser()
    )

    reordered_results: list[str] = rerank_results_chain.invoke({
        "goal": goal,
        "results": "---snippet---".join(results)
    })

    return reordered_results