import datetime
import logging
import pytest
import pandas as pd    
import os
import dotenv
from openai import OpenAI
from evo_researcher.main import research  # Import the function you're testing

dotenv.load_dotenv()

client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

def score_answer(question: str, ground_truth: str, answer: str) -> int:
    verdict_completion = client.chat.completions.create(
        model="gpt-3.5-turbo",
        messages=[
            {"role": "system", "content": f"You are a judge and have to provide justification for your verdict of the third-party. Here is the question that was given to the third-party: {question}, and the answer the third-party gave us was {answer}, while the correct response should be {ground_truth}."},
            {"role": "user", "content": "Did the answer received match the correct response? Respond only with a number of 1 to 100 where 100 is a perfect score. "}
        ]
    )
    verdict = verdict_completion.choices[0].message.content
    
    return verdict

# def justify_score(question: str, ground_truth: str, answer: str, score: int) -> str:
#     # Ask for justification, including the verdict in the history
#     justification_completion = client.chat.completions.create(
#         model="gpt-3.5-turbo",
#         messages=[
#             {"role": "system", "content": f"You are a judge and have to provide justification for your verdict of the third-party. Here is the question that was given to the third-party: {question}, and the answer the third-party gave us was {answer}, while the correct response should be {ground_truth}."},
#             {"role": "user", "content": "Did the answer received match the correct response? Respond only with a number of 1 to 100 where 100 is a perfect score. "},
#             {"role": "system", "content": f"Your verdict was {score}."},
#             {"role": "user", "content": "Please provide your justification for the verdict."}
#         ]
#     )
#     justification = justification_completion.choices[0].message.content

#     return justification

file_path = "test_data/gaia.jsonl"
dataset = pd.read_json(path_or_buf=file_path, lines=True)

# Filter out entries where 'file_name' is not empty
dataset = dataset[dataset['file_name'] == ""]

SCORE_THRESHOLD = 80

@pytest.mark.parametrize("question, expected", [(row['Question'], row['Final answer']) for _, row in dataset.iterrows()])
def test_research(question, expected):
    answer = research(question)
    veredict = score_answer(question, expected, answer)
    
    assert veredict > SCORE_THRESHOLD