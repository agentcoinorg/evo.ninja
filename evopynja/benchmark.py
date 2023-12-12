# Load a file in jsonl format
import pandas as pd    
import os
import dotenv
import datetime
import subprocess
from openai import OpenAI

dotenv.load_dotenv()

file_path = "gaia_dataset.jsonl"
jsonObj = pd.read_json(path_or_buf=file_path, lines=True)

# Create a unique filename with the current datetime
datetime_string = datetime.datetime.now().strftime("%Y%m%d_%H%M%S")
log_filename = f"benchmark_logs_{datetime_string}.txt"

# Filter out entries where 'file_name' is not empty
jsonObj = jsonObj[jsonObj['file_name'] == ""]

# Extract relevant columns
Questions = jsonObj.Question
Answers = jsonObj['Final answer']


client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

def ask_gpt(gaia_question, final_answer, ground_truth):
    # Get the verdict
    verdict_completion = client.chat.completions.create(
        model="gpt-3.5-turbo",
        messages=[
            {"role": "system", "content": f"You are a judge and have to provide justification for your verdict of the third-party. Here is the question that was given to the third-party: {gaia_question}, and the answer the third-party gave us was {final_answer}, while the correct response should be {ground_truth}."},
            {"role": "user", "content": "Did the answer received match the correct response? Respond only with a number of 1 to 100 where 100 is a perfect score. "}
        ]
    )
    verdict = verdict_completion.choices[0].message

    print(verdict)
    # Ask for justification, including the verdict in the history
    justification_completion = client.chat.completions.create(
        model="gpt-3.5-turbo",
        messages=[
            {"role": "system", "content": f"You are a judge and have to provide justification for your verdict of the third-party. Here is the question that was given to the third-party: {gaia_question}, and the answer the third-party gave us was {final_answer}, while the correct response should be {ground_truth}."},
            {"role": "user", "content": "Did the answer received match the correct response? Respond only with a number of 1 to 100 where 100 is a perfect score. "},
            {"role": "system", "content": f"Your verdict was {verdict}."},
            {"role": "user", "content": "Please provide your justification for the verdict."}
        ]
    )
    justification = justification_completion.choices[0].message

    return (verdict, justification)


# Define a function to validate the answers of an agent,
# given a question from the Gaia benchmark and an answer
def gaia_validator(gaia_question, final_answer):
    """Takes in a question and a final answer, checks with openAI if the answer is valid, 
    Returns boolean"""

    with open(log_filename, 'w') as log_file:

        for i in range(len(Questions)):
            log_file.write(Questions[i])

            if gaia_question == Questions[i]:
                log_file.write("Answer should be ", Answers[i])
                log_file.write("Your answer: ", final_answer)
                if final_answer == Answers[i]:
                    log_file.write("100")
                    return 100
                else:
                    verdict, justification = ask_gpt(gaia_question, final_answer, Answers[i])
                    # Remove unwanted characters and convert to integer
                    cleaned_verdict = ''.join(filter(lambda x: x.isdigit(), verdict.content))
                    verdict_int = int(cleaned_verdict) if cleaned_verdict else 0  # Converts to int, defaults to 0 if empty

                    log_file.write(verdict_int)
                    log_file.write(justification)


                    return verdict_int, justification


def run_script_and_validate(Questions):
    with open(log_filename, 'w') as log_file:

        for question in Questions[:10]:  # Iterate over the first ten questions
            log_file.write(f"Processing question: {question}")
            try:

                # Run the main.py script with the question and a timeout
                process = subprocess.run(["python3", "main.py", "--goal", question], 
                                        capture_output=True, text=True, timeout=300)

                if process.returncode != 0:
                    log_file.write(f"Error in script execution: {process.stderr}")
                    continue  # Skip to the next question if there's an error

                answer = process.stdout

                # Clean up the answer and save to answer.txt
                cleaned_answer = clean_answer(answer)
                with open("answer.txt", "w") as file:
                    file.write(cleaned_answer)

                # Pass the question and answer to the gaia_validator function
                gaia_validator(question, cleaned_answer)
            
            except subprocess.TimeoutExpired:
                log_file.write(f"Script timed out for question: {question}")
            except Exception as e:
                log_file.write(f"An error occurred: {e}")

def clean_answer(answer):
    # Implement your cleaning logic here
    return answer.strip()

# Run the function with your questions
run_script_and_validate(Questions)
