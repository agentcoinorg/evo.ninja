from langchain.chat_models import ChatOpenAI
from langchain.prompts import ChatPromptTemplate
from langchain.schema.output_parser import StrOutputParser

rerank_queries_template = """
I will present you with a list of queries to search the web for, for answers to the question: {goal}.

The queries are divided by '---query---'

Evaluate the queries in order that will provide the best data to answer the question. Do not modify the queries.
Return them, in order of relevance, as a comma separated list of strings.

Queries: {queries}
"""
def rerank_subqueries(queries: list[str], goal: str) -> list[str]:
    rerank_results_prompt = ChatPromptTemplate.from_template(template=rerank_queries_template)

    rerank_results_chain = (
        rerank_results_prompt |
        ChatOpenAI(model="gpt-4-1106-preview") |
        StrOutputParser()
    )

    responses = rerank_results_chain.invoke({
        "goal": goal,
        "queries": "\n---query---\n".join(queries)
    })

    return responses.split(",")