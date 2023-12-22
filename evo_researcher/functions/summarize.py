from langchain.prompts import PromptTemplate
from langchain.chat_models import ChatOpenAI

from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain.chains.llm import LLMChain
from langchain.chains.summarize import ReduceDocumentsChain, StuffDocumentsChain, MapReduceDocumentsChain
from langchain.text_splitter import RecursiveCharacterTextSplitter

def summarize(objective: str, content: str) -> str:
    llm = ChatOpenAI(temperature = 0, model = "gpt-3.5-turbo-16k-0613")
    
    map_template = """
    The following is a set of documents
    {docs}
    Based on this list of docs, please provide a full comprehensive summary relevant to: {objective}
    Helpful Answer:
    """
    
    map_prompt = PromptTemplate(template=map_template, input_variables=["docs", "objective"])
    map_chain = LLMChain(llm=llm, prompt=map_prompt)
    
    reduce_template = """The following is set of summaries:
    {docs}
    Take these and distill it into a final full comprehensive, summary relevant to: {objective}. 
    Helpful Answer:"""
    reduce_prompt = PromptTemplate(template=reduce_template, input_variables=["docs", "objective"])
    
    # Run chain
    reduce_chain = LLMChain(llm=llm, prompt=reduce_prompt)

    # Takes a list of documents, combines them into a single string, and passes this to an LLMChain
    combine_documents_chain = StuffDocumentsChain(
        llm_chain=reduce_chain, document_variable_name="docs"
    )

    # Combines and iteravely reduces the mapped documents
    reduce_documents_chain = ReduceDocumentsChain(
        # This is final chain that is called.
        combine_documents_chain=combine_documents_chain,
        # If documents exceed context for `StuffDocumentsChain`
        collapse_documents_chain=combine_documents_chain,
        # The maximum number of tokens to group documents into.
        token_max=8000,
    )
    
    map_reduce_chain = MapReduceDocumentsChain(
        # Map chain
        llm_chain=map_chain,
        # Reduce chain
        reduce_documents_chain=reduce_documents_chain,
        # The variable name in the llm_chain to put the documents in
        document_variable_name="docs",
        # Return the results of the map steps in the output
        return_intermediate_steps=False,
        input_key="docs",
    )

    text_splitter = RecursiveCharacterTextSplitter(separators=["\n\n", "\n"], chunk_size = 10000, chunk_overlap=500)
    docs = text_splitter.create_documents([content])
    
    response = map_reduce_chain.run(docs=docs, objective=objective)
    
    return response

